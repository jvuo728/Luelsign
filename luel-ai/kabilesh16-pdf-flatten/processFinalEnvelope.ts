import { v4 as uuidv4 } from 'uuid';
import type {
  ProcessFinalEnvelopeInput,
  ProcessFinalEnvelopeResult,
} from './types';
import { flattenPdf } from './flattenPdf';
import { createCertificatePdf } from './createCertificate';
import { sendFinalPackage } from './sendEmail';

const MODULE_TAG = '[kabilesh16-pdf-flatten]';

function log(message: string, meta?: Record<string, unknown>): void {
  const payload = meta ? `${message} ${JSON.stringify(meta)}` : message;
  console.error(`${MODULE_TAG} ${payload}`);
}

/**
 * Processes the final envelope: flattens the PDF, generates the Certificate of
 * Completion, and emails both to sender and signer. Idempotent at the "same
 * inputs produce same logical outcome" level; does not mutate external state
 * except sending email once.
 *
 * Returns success flag, envelope ID, and buffers. Does not throw; errors are
 * logged and returned in result.error.
 */
export async function processFinalEnvelope(
  input: ProcessFinalEnvelopeInput
): Promise<ProcessFinalEnvelopeResult> {
  const envelopeId = uuidv4();

  try {
    const flattenedPdfBuffer = await flattenPdf(
      input.originalPdfBuffer,
      input.fieldData
    );
    const certificatePdfBuffer = await createCertificatePdf(
      envelopeId,
      input.auditLog
    );

    try {
      await sendFinalPackage({
        emails: input.emails,
        flattenedPdfBuffer,
        certificatePdfBuffer,
        envelopeId,
      });
    } catch (emailErr) {
      const err = emailErr instanceof Error ? emailErr : new Error(String(emailErr));
      log('Email delivery failed', { envelopeId, error: err.message });
      return {
        success: false,
        envelopeId,
        flattenedPdfBuffer,
        certificatePdfBuffer,
        error: `Email delivery failed: ${err.message}`,
      };
    }

    return {
      success: true,
      envelopeId,
      flattenedPdfBuffer,
      certificatePdfBuffer,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('processFinalEnvelope failed', { envelopeId, error: message });
    return {
      success: false,
      envelopeId,
      error: message,
    };
  }
}
