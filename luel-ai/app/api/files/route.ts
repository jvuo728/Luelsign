import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function GET() {
  if (!existsSync(UPLOADS_DIR)) {
    return NextResponse.json([]);
  }

  const files = await readdir(UPLOADS_DIR);
  const pdfs = files.filter((f) => f.endsWith(".pdf"));

  return NextResponse.json(pdfs);
}
