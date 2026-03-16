import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/sessions";

type Params = { params: Promise<{ token: string }> };

// GET /api/sessions/[token] — fetch session metadata
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const session = getSession(token);

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  // Return everything except internal state the signer doesn't need
  return NextResponse.json({
    token: session.token,
    documentId: session.documentId,
    signerName: session.signerName,
    signerEmail: session.signerEmail,
    fields: session.fields,
    status: session.status,
  });
}
