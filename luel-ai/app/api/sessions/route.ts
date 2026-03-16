import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { createSession } from "@/lib/sessions";
import { sendSigningLinkEmail } from "@/kabilesh16-pdf-flatten/sendEmail";
import type { Field } from "@/lib/types";

// POST /api/sessions — create a signing session and email the signer
export async function POST(req: NextRequest) {
  const { documentId, senderName, senderEmail, signerName, signerEmail, fields } = (await req.json()) as {
    documentId: string;
    senderName: string;
    senderEmail: string;
    signerName: string;
    signerEmail: string;
    fields: Field[];
  };

  if (!documentId || !senderName || !senderEmail || !signerName || !signerEmail || !fields?.length) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const session = createSession(documentId, senderName, senderEmail, signerName, signerEmail, fields);
  const signingUrl = `${req.nextUrl.origin}/sign/${session.token}`;

  const pdfPath = path.join(process.cwd(), "uploads", documentId);
  const pdfBuffer = await readFile(pdfPath);
  const pdfFilename = documentId.replace(/^[0-9a-f-]{36}-/i, "");

  await sendSigningLinkEmail({ senderName, senderEmail, signerName, signerEmail, signingUrl, pdfBuffer, pdfFilename });

  return NextResponse.json({
    token: session.token,
    signingUrl: `/sign/${session.token}`,
  });
}
