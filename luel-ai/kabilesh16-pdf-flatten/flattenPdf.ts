import {
  PDFDocument,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import type { FieldDataItem } from './types';

const DEFAULT_FONT_SIZE = 11;
const SIGNATURE_MAX_WIDTH = 120;
const SIGNATURE_MAX_HEIGHT = 50;

/**
 * Strips data URL prefix to get raw base64 if present.
 */
function toRawBase64(value: string): string {
  const match = value.match(/^data:[^;]+;base64,(.+)$/);
  return match ? match[1] : value;
}

/**
 * Tries to embed signature as PNG then JPEG. Returns image and dimensions for drawing.
 */
async function embedSignatureImage(
  pdfDoc: PDFDocument,
  value: string
): Promise<{ image: Awaited<ReturnType<PDFDocument['embedPng']>>; width: number; height: number } | null> {
  const raw = toRawBase64(value);
  const bytes = Uint8Array.from(Buffer.from(raw, 'base64'));

  try {
    const image = await pdfDoc.embedPng(bytes);
    const dims = image.scale(1);
    let w = dims.width;
    let h = dims.height;
    if (w > SIGNATURE_MAX_WIDTH || h > SIGNATURE_MAX_HEIGHT) {
      const scale = Math.min(SIGNATURE_MAX_WIDTH / w, SIGNATURE_MAX_HEIGHT / h);
      w *= scale;
      h *= scale;
    }
    return { image, width: w, height: h };
  } catch {
    // Not PNG, try JPEG
  }
  try {
    const image = await pdfDoc.embedJpg(bytes);
    const dims = image.scale(1);
    let w = dims.width;
    let h = dims.height;
    if (w > SIGNATURE_MAX_WIDTH || h > SIGNATURE_MAX_HEIGHT) {
      const scale = Math.min(SIGNATURE_MAX_WIDTH / w, SIGNATURE_MAX_HEIGHT / h);
      w *= scale;
      h *= scale;
    }
    return { image, width: w, height: h };
  } catch {
    return null;
  }
}

/**
 * Flattens the PDF: draws each field at (x, y) then flattens the form.
 * Coordinates are in pdf-lib space (origin bottom-left).
 */
export async function flattenPdf(
  originalPdfBuffer: Buffer,
  fieldData: FieldDataItem[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(originalPdfBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (const field of fieldData) {
    const { pageIndex, x, y, value, type } = field;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];

    if (type === 'signature' && value) {
      const embedded = await embedSignatureImage(pdfDoc, value);
      if (embedded) {
        page.drawImage(embedded.image, {
          x,
          y,
          width: embedded.width,
          height: embedded.height,
        });
      } else {
        // Fallback: draw as text if image fails
        page.drawText(value.slice(0, 50), {
          x,
          y,
          size: DEFAULT_FONT_SIZE,
          font,
          color: rgb(0, 0, 0),
        });
      }
    } else {
      // text | date
      const text = String(value ?? '');
      if (!text) continue;
      page.drawText(text, {
        x,
        y,
        size: DEFAULT_FONT_SIZE,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  try {
    const form = pdfDoc.getForm();
    form.flatten({ updateFieldAppearances: true });
  } catch {
    // No form or flatten not applicable; content is already drawn
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
