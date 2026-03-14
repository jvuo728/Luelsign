import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Field } from "./types";

/**
 * Burns field values into a PDF permanently (flattening).
 *
 * Coordinate conversion:
 *   Field coords use top-left origin, Y increases downward, values are 0–1 relative.
 *   pdf-lib uses bottom-left origin, Y increases upward, values are PDF points.
 *
 *   pdfX = field.x * pageWidth
 *   pdfY = pageHeight - (field.y * pageHeight) - (field.height * pageHeight)
 *          ↑ flip Y axis                          ↑ adjust for text baseline at bottom of field
 */
export async function flattenFields(
  pdfBytes: Uint8Array,
  fields: Field[],
  fieldValues: Record<string, string>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const field of fields) {
    const pdfPage = pdfDoc.getPage(field.page - 1); // pdf-lib is 0-indexed
    const { width: pageWidth, height: pageHeight } = pdfPage.getSize();

    // Convert relative coords → PDF point coords
    const pdfX = field.x * pageWidth;
    const pdfY =
      pageHeight -
      field.y * pageHeight -
      field.height * pageHeight;

    const fieldHeightPts = field.height * pageHeight;
    const value = fieldValues[field.id] ?? "";

    if (field.type === "signature" || field.type === "text") {
      const fontSize = Math.min(fieldHeightPts * 0.7, 16);
      pdfPage.drawText(value, {
        x: pdfX + 4,
        y: pdfY + fieldHeightPts * 0.25,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    } else if (field.type === "date") {
      const fontSize = Math.min(fieldHeightPts * 0.7, 12);
      pdfPage.drawText(value || new Date().toLocaleDateString(), {
        x: pdfX + 4,
        y: pdfY + fieldHeightPts * 0.25,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  return pdfDoc.save();
}
