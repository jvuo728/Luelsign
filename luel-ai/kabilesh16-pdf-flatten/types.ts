/**
 * Field data for burning into the PDF.
 * Coordinates (x, y) are in pdf-lib space: origin (0,0) at BOTTOM-LEFT of page.
 */
export interface FieldDataItem {
  pageIndex: number;
  x: number;
  y: number;
  value: string;
  type: 'text' | 'signature' | 'date';
}

/**
 * Audit log entry for the Certificate of Completion.
 */
export interface AuditLogEntry {
  timestamp: string; // ISO 8601
  action: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Email addresses for delivery.
 */
export interface ProcessFinalEnvelopeEmails {
  senderEmail: string;
  signerEmail: string;
}

/**
 * Input for processFinalEnvelope.
 */
export interface ProcessFinalEnvelopeInput {
  originalPdfBuffer: Buffer;
  fieldData: FieldDataItem[];
  auditLog: AuditLogEntry[];
  emails: ProcessFinalEnvelopeEmails;
}

/**
 * Result of processFinalEnvelope.
 */
export interface ProcessFinalEnvelopeResult {
  success: boolean;
  envelopeId: string;
  flattenedPdfBuffer?: Buffer;
  certificatePdfBuffer?: Buffer;
  error?: string;
  /** Optional URLs if files were persisted (e.g. S3); not set when only buffers returned */
  flattenedPdfUrl?: string;
  certificatePdfUrl?: string;
}
