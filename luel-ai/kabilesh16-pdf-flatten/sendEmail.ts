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

export interface SendSigningLinkOptions {
  senderName: string;
  senderEmail: string;
  signerName: string;
  signerEmail: string;
  signingUrl: string;
  pdfBuffer: Buffer;
  pdfFilename: string;
}

/**
 * Sends a signing request email with the original PDF attached and the signing link.
 */
export async function sendSigningLinkEmail(options: SendSigningLinkOptions): Promise<void> {
  const { senderName, signerName, signerEmail, signingUrl, pdfBuffer, pdfFilename } = options;

  const transporter = createGmailTransporter();
  const senderLabel = `${senderName} <${process.env.EMAIL_USER}>`;
  const greeting = `Hi ${signerName},`;
  const closing = `\n\n— ${senderName}`;

  await transporter.sendMail({
    from: senderLabel,
    to: signerEmail,
    subject: `${senderName} has requested your signature`,
    text: `${greeting}\n\nPlease review the attached document and sign it using the link below:\n\n${signingUrl}${closing}`,
    attachments: [
      {
        filename: pdfFilename,
        content: pdfBuffer,
      },
    ],
  });
}

export interface SendSignedDocumentOptions {
  senderName: string;
  senderEmail: string;
  signerName: string;
  signedPdfBuffer: Buffer;
  signedPdfFilename: string;
  certificateBuffer: Buffer;
  certificateFilename: string;
}

/**
 * Sends the signed PDF and certificate of completion back to the sender.
 */
export async function sendSignedDocumentEmail(options: SendSignedDocumentOptions): Promise<void> {
  const { senderName, senderEmail, signerName, signedPdfBuffer, signedPdfFilename, certificateBuffer, certificateFilename } = options;

  const transporter = createGmailTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: senderEmail,
    subject: `${signerName} has signed your document`,
    text: `Hi ${senderName},\n\n${signerName} has completed signing the document. Please find the signed copy and certificate of completion attached.`,
    attachments: [
      {
        filename: signedPdfFilename,
        content: signedPdfBuffer,
      },
      {
        filename: certificateFilename,
        content: certificateBuffer,
      },
    ],
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
