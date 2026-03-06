/**
 * PDF Flattening & Final Package – kabilesh16-pdf-flatten
 *
 * Server-side utility to produce the final signed PDF, Certificate of Completion,
 * and email delivery for an e-signature platform.
 */

export { processFinalEnvelope } from './processFinalEnvelope';
export { flattenPdf } from './flattenPdf';
export { createCertificatePdf } from './createCertificate';
export { sendFinalPackage } from './sendEmail';
export type {
  FieldDataItem,
  AuditLogEntry,
  ProcessFinalEnvelopeEmails,
  ProcessFinalEnvelopeInput,
  ProcessFinalEnvelopeResult,
} from './types';
