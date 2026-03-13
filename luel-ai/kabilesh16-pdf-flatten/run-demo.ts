/**
 * Demo script: takes an input PDF, flattens it, generates Certificate of Completion,
 * and emails both to the configured address.
 *
 * Usage:
 *   npm run pdf-flatten:demo -- path/to/your-document.pdf
 *   npx tsx kabilesh16-pdf-flatten/run-demo.ts path/to/your-document.pdf
 *
 * Loads .env.local from project root so EMAIL_USER / EMAIL_APP_PASSWORD are set.
 */
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { processFinalEnvelope } from './processFinalEnvelope';

async function main() {
  const inputPdfPath = process.argv[2];

  if (!inputPdfPath) {
    console.error('Usage: npm run pdf-flatten:demo -- <path-to-pdf>');
    console.error('Example: npm run pdf-flatten:demo -- ./my-contract.pdf');
    process.exit(1);
  }

  const resolvedPath = resolve(process.cwd(), inputPdfPath);
  if (!existsSync(resolvedPath)) {
    console.error('File not found:', resolvedPath);
    process.exit(1);
  }

  console.log('Reading PDF:', resolvedPath);
  const originalPdfBuffer = readFileSync(resolvedPath);

  const result = await processFinalEnvelope({
    originalPdfBuffer,
    fieldData: [
      { pageIndex: 0, x: 50, y: 650, value: 'Jane Doe', type: 'text' },
      { pageIndex: 0, x: 50, y: 600, value: new Date().toISOString().slice(0, 10), type: 'date' },
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
  mkdirSync(outDir, { recursive: true });

  if (result.flattenedPdfBuffer) {
    const outPath = join(outDir, `flattened-${result.envelopeId}.pdf`);
    writeFileSync(outPath, result.flattenedPdfBuffer);
    console.log('Wrote flattened PDF:', outPath);
  }
  if (result.certificatePdfBuffer) {
    const outPath = join(outDir, `certificate-${result.envelopeId}.pdf`);
    writeFileSync(outPath, result.certificatePdfBuffer);
    console.log('Wrote certificate PDF:', outPath);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
