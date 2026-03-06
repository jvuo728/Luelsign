/**
 * Demo script: creates a minimal PDF, runs processFinalEnvelope, and writes outputs.
 * Run: npm run pdf-flatten:demo  (or npx tsx kabilesh16-pdf-flatten/run-demo.ts)
 * Loads .env.local from project root so EMAIL_USER / EMAIL_APP_PASSWORD are set.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { writeFileSync } from 'fs';
import { join } from 'path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { processFinalEnvelope } from './processFinalEnvelope';

async function main() {
  console.log('Creating minimal PDF...');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('Demo document for e-signature', { x: 50, y: 800, size: 14, font });
  page.drawText('Sign below:', { x: 50, y: 700, size: 11, font });
  const originalPdfBuffer = Buffer.from(await pdfDoc.save());

  const result = await processFinalEnvelope({
    originalPdfBuffer,
    fieldData: [
      { pageIndex: 0, x: 50, y: 650, value: 'Jane Doe', type: 'text' },
      { pageIndex: 0, x: 50, y: 600, value: '2025-03-05', type: 'date' },
    ],
    auditLog: [
      { timestamp: new Date().toISOString(), action: 'Document sent', ip: '127.0.0.1', userAgent: 'Demo' },
      { timestamp: new Date().toISOString(), action: 'Signed', ip: '127.0.0.1', userAgent: 'Demo' },
    ],
    emails: { senderEmail: 'kabileshyuvaraj@gmail.com', signerEmail: 'kabileshyuvaraj@gmail.com' },
  });

  console.log('Envelope ID:', result.envelopeId);
  console.log('Success:', result.success);
  if (result.error) console.log('Error:', result.error);

  const outDir = join(process.cwd(), 'kabilesh16-pdf-flatten', 'demo-output');
  try {
    const { mkdirSync } = await import('fs');
    mkdirSync(outDir, { recursive: true });
  } catch {}

  if (result.flattenedPdfBuffer) {
    const path = join(outDir, `flattened-${result.envelopeId}.pdf`);
    writeFileSync(path, result.flattenedPdfBuffer);
    console.log('Wrote flattened PDF:', path);
  }
  if (result.certificatePdfBuffer) {
    const path = join(outDir, `certificate-${result.envelopeId}.pdf`);
    writeFileSync(path, result.certificatePdfBuffer);
    console.log('Wrote certificate PDF:', path);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
