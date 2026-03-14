import { NextRequest, NextResponse } from "next/server";
import { Field } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

// In-memory store: documentId → fields
const store = new Map<string, Field[]>();

type Params = { params: Promise<{ id: string }> };

// GET /api/documents/[id]/fields
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  return NextResponse.json(store.get(id) ?? []);
}

// POST /api/documents/[id]/fields — add a single field
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const { type, page, x, y, width, height, label } = body;

  const field: Field = {
    id: uuidv4(),
    documentId: id,
    type,
    page,
    x,
    y,
    width,
    height,
    label,
  };

  const existing = store.get(id) ?? [];
  store.set(id, [...existing, field]);

  return NextResponse.json(field, { status: 201 });
}

// PUT /api/documents/[id]/fields — bulk replace all fields
export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const { fields }: { fields: Field[] } = await req.json();
  store.set(id, fields);
  return NextResponse.json({ ok: true });
}

// DELETE /api/documents/[id]/fields?fieldId=xxx — remove one field
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const fieldId = req.nextUrl.searchParams.get("fieldId");
  if (!fieldId) {
    return NextResponse.json({ error: "fieldId required" }, { status: 400 });
  }

  const existing = store.get(id) ?? [];
  store.set(id, existing.filter((f) => f.id !== fieldId));

  return NextResponse.json({ ok: true });
}
