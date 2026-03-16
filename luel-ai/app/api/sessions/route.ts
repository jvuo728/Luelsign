import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/sessions";
import type { Field } from "@/lib/types";

// POST /api/sessions — create a signing session
export async function POST(req: NextRequest) {
  const { documentId, signerName, signerEmail, fields } = (await req.json()) as {
    documentId: string;
    signerName: string;
    signerEmail: string;
    fields: Field[];
  };

  if (!documentId || !signerName || !signerEmail || !fields?.length) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const session = createSession(documentId, signerName, signerEmail, fields);

  return NextResponse.json({
    token: session.token,
    signingUrl: `/sign/${session.token}`,
  });
}
