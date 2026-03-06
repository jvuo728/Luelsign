import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { AuditLogEntry } from './types';

const TITLE = 'Certificate of Completion';
const MARGIN = 50;
const LINE_HEIGHT = 18;
const FONT_SIZE_TITLE = 20;
const FONT_SIZE_HEADING = 12;
const FONT_SIZE_BODY = 10;

/**
 * Creates a single-page "Certificate of Completion" PDF with envelope ID and audit log.
 */
export async function createCertificatePdf(
  envelopeId: string,
  auditLog: AuditLogEntry[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(TITLE);

  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const width = page.getWidth();
  let y = page.getHeight() - MARGIN;

  // Title
  page.drawText(TITLE, {
    x: MARGIN,
    y,
    size: FONT_SIZE_TITLE,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= LINE_HEIGHT * 1.5;

  // Envelope ID
  page.drawText('Envelope ID:', {
    x: MARGIN,
    y,
    size: FONT_SIZE_HEADING,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= LINE_HEIGHT;

  page.drawText(envelopeId, {
    x: MARGIN,
    y,
    size: FONT_SIZE_BODY,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
  y -= LINE_HEIGHT * 1.5;

  // Audit log section
  page.drawText('Audit trail', {
    x: MARGIN,
    y,
    size: FONT_SIZE_HEADING,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  y -= LINE_HEIGHT;

  for (const entry of auditLog) {
    if (y < MARGIN + LINE_HEIGHT) break;

    const timestamp = entry.timestamp;
    const action = entry.action;
    const details: string[] = [];
    if (entry.ip) details.push(`IP: ${entry.ip}`);
    if (entry.userAgent) details.push(entry.userAgent.slice(0, 60) + (entry.userAgent.length > 60 ? '…' : ''));

    const line1 = `${timestamp} — ${action}`;
    page.drawText(line1, {
      x: MARGIN,
      y,
      size: FONT_SIZE_BODY,
      font,
      color: rgb(0, 0, 0),
    });
    y -= LINE_HEIGHT;

    if (details.length > 0) {
      const line2 = details.join(' | ');
      page.drawText(line2, {
        x: MARGIN + 15,
        y,
        size: FONT_SIZE_BODY - 1,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= LINE_HEIGHT;
    }
  }

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
