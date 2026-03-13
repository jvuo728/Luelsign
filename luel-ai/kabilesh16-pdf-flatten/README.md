# kabilesh16-pdf-flatten

Server-side **PDF Flattening & Final Package** module for a custom e-signature platform. Flattens signed PDFs (burns signatures and text into the content stream), generates a Certificate of Completion (audit trail), and emails both to participants.

## POST API (recommended)

From the project root, start the app then POST a PDF:

```bash
cd luel-ai && npm run dev
```

In another terminal (or from the frontend):

```bash
curl -X POST http://localhost:3000/api/flatten-pdf \
  -F "pdf=@/path/to/your-document.pdf"
```

Optional form fields (or include in `options` JSON):

| Field            | Description                    |
|------------------|--------------------------------|
| `senderName`     | Sender's display name          |
| `senderEmail`    | Sender's email address         |
| `recipientName`  | Recipient's (signer) name      |
| `recipientEmail` | Recipient's (signer) email     |

Example with all parameters:

```bash
curl -X POST http://localhost:3000/api/flatten-pdf \
  -F "pdf=@/path/to/your-document.pdf" \
  -F "senderName=Alice" \
  -F "senderEmail=alice@example.com" \
  -F "recipientName=Bob" \
  -F "recipientEmail=bob@example.com"
```

Or via JSON `options`:

```bash
curl -X POST http://localhost:3000/api/flatten-pdf \
  -F "pdf=@/path/to/your-document.pdf" \
  -F 'options={"senderName":"Alice","senderEmail":"alice@example.com","recipientName":"Bob","recipientEmail":"bob@example.com"}'
```

Response: `{ "success": true, "envelopeId": "uuid", "error": null }` or `{ "success": false, "envelopeId": "uuid", "error": "..." }`. The flattened PDF and certificate are emailed; they are not returned in the response.

## Demo script (input PDF → flatten + certificate + email)

Pass a path to your PDF; the script flattens it, generates the certificate, and emails both to the configured address:

```bash
cd luel-ai
npm run pdf-flatten:demo -- path/to/your-document.pdf
```

Example with a file in the repo:

```bash
npm run pdf-flatten:demo -- kabilesh16-pdf-flatten/demo-output/flattened-4c1ad4c7-27c2-410e-aaa5-a0bbc9fc9ac4.pdf
```

Outputs are written to `kabilesh16-pdf-flatten/demo-output/`. Edit `run-demo.ts` to change `fieldData`, `auditLog`, or `emails`.

## Programmatic usage

```ts
import { processFinalEnvelope } from '@/kabilesh16-pdf-flatten';

const result = await processFinalEnvelope({
  originalPdfBuffer: pdfBuffer,
  fieldData: [
    { pageIndex: 0, x: 100, y: 700, value: 'John Doe', type: 'text' },
    { pageIndex: 0, x: 100, y: 650, value: '<base64-signature-image>', type: 'signature' },
    { pageIndex: 0, x: 100, y: 600, value: '2025-03-05', type: 'date' },
  ],
  auditLog: [
    { timestamp: '2025-03-05T10:00:00Z', action: 'Document sent', ip: '1.2.3.4', userAgent: '...' },
    { timestamp: '2025-03-05T10:05:00Z', action: 'Signed', ip: '1.2.3.4', userAgent: '...' },
  ],
  emails: { senderEmail: 'sender@example.com', signerEmail: 'signer@example.com' },
});

if (result.success) {
  console.log('Envelope ID:', result.envelopeId);
  // result.flattenedPdfBuffer, result.certificatePdfBuffer available
} else {
  console.error(result.error);
}
```

## Coordinate system

- **pdf-lib** uses **origin (0,0) at the BOTTOM-LEFT** of each page. `x` increases right, `y` increases up.
- Pass coordinates in this space. If your UI uses top-left origin, convert with `yPdf = pageHeight - yTop`.

## Environment variables (Gmail)

Set these for email delivery:

- `EMAIL_USER` – Gmail address (e.g. `you@gmail.com`)
- `EMAIL_APP_PASSWORD` – [App Password](https://support.google.com/accounts/answer/185833) for that account (not the normal password)

## Exports

- `processFinalEnvelope(input)` – main entry; returns `{ success, envelopeId, flattenedPdfBuffer?, certificatePdfBuffer?, error? }`
- `flattenPdf(buffer, fieldData)` – flatten only
- `createCertificatePdf(envelopeId, auditLog)` – certificate only
- `sendFinalPackage(options)` – email only
- Types: `FieldDataItem`, `AuditLogEntry`, `ProcessFinalEnvelopeEmails`, `ProcessFinalEnvelopeInput`, `ProcessFinalEnvelopeResult`
