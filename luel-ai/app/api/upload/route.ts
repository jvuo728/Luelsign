import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
    }

    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }

    const uniqueName = `${crypto.randomUUID()}-${file.name}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return NextResponse.json({ success: true, filename: uniqueName });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
