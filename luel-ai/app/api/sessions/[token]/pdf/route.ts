import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/sessions";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

type Params = { params: Promise<{ token: string }> };

// GET /api/sessions/[token]/pdf — serve the original PDF for the signing page
export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const session = getSession(token);

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const filePath = path.join(process.cwd(), "uploads", session.documentId);

  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "PDF file not found." }, { status: 404 });
  }

  const bytes = await readFile(filePath);

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${session.documentId}"`,
    },
  });
}
