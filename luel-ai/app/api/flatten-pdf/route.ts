import { NextRequest, NextResponse } from 'next/server';
import { processFinalEnvelope } from '@/kabilesh16-pdf-flatten';
import type { FieldDataItem, AuditLogEntry, ProcessFinalEnvelopeEmails } from '@/kabilesh16-pdf-flatten';

const DEFAULT_EMAIL = 'kabileshyuvaraj@gmail.com';

const defaultFieldData: FieldDataItem[] = [
  { pageIndex: 0, x: 50, y: 650, value: 'Jane Doe', type: 'text' },
  { pageIndex: 0, x: 50, y: 600, value: new Date().toISOString().slice(0, 10), type: 'date' },
];

const defaultAuditLog: AuditLogEntry[] = [
  { timestamp: new Date().toISOString(), action: 'Document sent', ip: '127.0.0.1', userAgent: 'API' },
  { timestamp: new Date().toISOString(), action: 'Signed', ip: '127.0.0.1', userAgent: 'API' },
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') ?? formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'Missing PDF file. Send as form field "pdf" or "file".' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let fieldData = defaultFieldData;
    let auditLog = defaultAuditLog;
    let emails: ProcessFinalEnvelopeEmails = {
      senderEmail: DEFAULT_EMAIL,
      signerEmail: DEFAULT_EMAIL,
    };

    // Optional form fields: senderName, senderEmail, recipientName, recipientEmail
    const senderName = formData.get('senderName');
    const senderEmail = formData.get('senderEmail');
    const recipientName = formData.get('recipientName');
    const recipientEmail = formData.get('recipientEmail');
    if (typeof senderName === 'string' && senderName.trim()) emails.senderName = senderName.trim();
    if (typeof senderEmail === 'string' && senderEmail.trim()) emails.senderEmail = senderEmail.trim();
    if (typeof recipientName === 'string' && recipientName.trim()) emails.signerName = recipientName.trim();
    if (typeof recipientEmail === 'string' && recipientEmail.trim()) emails.signerEmail = recipientEmail.trim();

    const optionsRaw = formData.get('options');
    if (optionsRaw && typeof optionsRaw === 'string') {
      try {
        const options = JSON.parse(optionsRaw) as {
          fieldData?: FieldDataItem[];
          auditLog?: AuditLogEntry[];
          senderEmail?: string;
          signerEmail?: string;
          senderName?: string;
          signerName?: string;
          recipientName?: string;
          recipientEmail?: string;
        };
        if (options.fieldData) fieldData = options.fieldData;
        if (options.auditLog) auditLog = options.auditLog;
        if (options.senderEmail) emails.senderEmail = options.senderEmail;
        if (options.signerEmail) emails.signerEmail = options.signerEmail;
        if (options.senderName) emails.senderName = options.senderName;
        if (options.signerName) emails.signerName = options.signerName;
        if (options.recipientName) emails.signerName = options.recipientName;
        if (options.recipientEmail) emails.signerEmail = options.recipientEmail;
      } catch {
        // ignore invalid JSON
      }
    }

    const result = await processFinalEnvelope({
      originalPdfBuffer: buffer,
      fieldData,
      auditLog,
      emails,
    });

    return NextResponse.json({
      success: result.success,
      envelopeId: result.envelopeId,
      error: result.error ?? undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
