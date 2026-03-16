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

  const senderLabel = emails.senderName ? `${emails.senderName} <${process.env.EMAIL_USER ?? emails.senderEmail}>` : (process.env.EMAIL_USER ?? emails.senderEmail);
  const greeting = emails.signerName ? `Hi ${emails.signerName},` : 'Hi,';
  const closing = emails.senderName ? `\n\n— ${emails.senderName}` : '';

  await transporter.sendMail({
    from: senderLabel,
    to: recipients.join(', '),
    subject: `Signed documents – Envelope ${envelopeId}`,
    text: `${greeting}\n\nPlease sign the attached document.${closing}`,
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
