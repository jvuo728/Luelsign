import { NextRequest, NextResponse } from "next/server";
import { getSession, completeSession } from "@/lib/sessions";
import { flattenFields } from "@/lib/flatten";
import { sendSignedDocumentEmail } from "@/kabilesh16-pdf-flatten/sendEmail";
import { createCertificatePdf } from "@/kabilesh16-pdf-flatten/createCertificate";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

type Params = { params: Promise<{ token: string }> };

// POST /api/sessions/[token]/complete — submit field values and return signed PDF
export async function POST(req: NextRequest, { params }: Params) {
  const { token } = await params;
  const session = getSession(token);

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  if (session.status === "completed") {
    return NextResponse.json({ error: "Session already completed." }, { status: 400 });
  }

  const { fieldValues } = (await req.json()) as {
    fieldValues: Record<string, string>;
  };

  const filePath = path.join(process.cwd(), "uploads", session.documentId);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "PDF file not found." }, { status: 404 });
  }

  const pdfBytes = await readFile(filePath);
  const signedBytes = await flattenFields(
    new Uint8Array(pdfBytes),
    session.fields,
    fieldValues
  );

  completeSession(token, fieldValues);

  // Derive a clean download filename
  const originalName = session.documentId.replace(/^[0-9a-f-]{36}-/i, "");
  const downloadName = `signed-${originalName}`;

  // Generate certificate of completion
  const now = new Date().toISOString();
  const certificateBuffer = await createCertificatePdf(token, [
    { timestamp: session.createdAt ? new Date(session.createdAt).toISOString() : now, action: 'Document sent', ip: 'N/A', userAgent: 'N/A' },
    { timestamp: now, action: `Signed by ${session.signerName} (${session.signerEmail})`, ip: 'N/A', userAgent: 'N/A' },
  ]);

  // Email the signed PDF and certificate back to the sender
  await sendSignedDocumentEmail({
    senderName: session.senderName,
    senderEmail: session.senderEmail,
    signerName: session.signerName,
    signedPdfBuffer: Buffer.from(signedBytes),
    signedPdfFilename: downloadName,
    certificateBuffer,
    certificateFilename: `certificate-${token}.pdf`,
  });

  return new Response(Buffer.from(signedBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${downloadName}"`,
    },
  });
}
