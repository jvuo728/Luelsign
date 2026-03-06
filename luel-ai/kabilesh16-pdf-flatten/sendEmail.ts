import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { ProcessFinalEnvelopeEmails } from './types';

export interface SendFinalPackageOptions {
  emails: ProcessFinalEnvelopeEmails;
  flattenedPdfBuffer: Buffer;
  certificatePdfBuffer: Buffer;
  envelopeId: string;
}

/**
 * Creates a Gmail transporter from env vars.
 * Expect: EMAIL_USER (Gmail address), EMAIL_APP_PASSWORD (App Password).
 */
function createGmailTransporter(): Transporter {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      'Missing email config: set EMAIL_USER and EMAIL_APP_PASSWORD for Gmail'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

/**
 * Sends the flattened PDF and Certificate of Completion to sender and signer.
 */
export async function sendFinalPackage(
  options: SendFinalPackageOptions
): Promise<void> {
  const {
    emails,
    flattenedPdfBuffer,
    certificatePdfBuffer,
    envelopeId,
  } = options;

  const transporter = createGmailTransporter();
  const recipients = [emails.senderEmail, emails.signerEmail].filter(
    (e, i, a) => a.indexOf(e) === i
  );

  await transporter.sendMail({
    from: process.env.EMAIL_USER ?? emails.senderEmail,
    to: recipients.join(', '),
    subject: `Signed documents – Envelope ${envelopeId}`,
    text: `Please find attached the signed document and the Certificate of Completion for envelope ${envelopeId}.`,
    attachments: [
      {
        filename: `signed-document-${envelopeId}.pdf`,
        content: flattenedPdfBuffer,
      },
      {
        filename: `certificate-of-completion-${envelopeId}.pdf`,
        content: certificatePdfBuffer,
      },
    ],
  });
}
