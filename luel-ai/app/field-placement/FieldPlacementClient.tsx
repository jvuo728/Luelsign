"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { Field, FieldType } from "@/lib/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const FIELD_DEFAULTS: Record<FieldType, { width: number; height: number }> = {
  signature: { width: 0.20, height: 0.05  },
  date:      { width: 0.15, height: 0.035 },
  text:      { width: 0.20, height: 0.035 },
};

const FIELD_LABELS: Record<FieldType, string> = {
  signature: "Sign Here",
  date:      "Date Signed",
  text:      "Text Field",
};

const FIELD_STYLES: Record<FieldType, string> = {
  signature: "bg-blue-400/40 border-2 border-blue-600 text-blue-800",
  date:      "bg-amber-400/40 border-2 border-amber-600 text-amber-800",
  text:      "bg-emerald-400/40 border-2 border-emerald-600 text-emerald-800",
};

const TOOL_COLORS: Record<FieldType, string> = {
  signature: "bg-blue-600 text-white",
  date:      "bg-amber-500 text-white",
  text:      "bg-emerald-600 text-white",
};

const TOOL_INACTIVE = "bg-gray-100 text-gray-700 hover:bg-gray-200";

// ─── Inner Component (uses useSearchParams) ───────────────────────────────────

function FilePicker() {
  const router = useRouter();
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((data: string[]) => { setFiles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Strip the UUID prefix to show a friendlier filename
  function displayName(filename: string) {
    return filename.replace(/^[0-9a-f-]{36}-/i, "");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Field Placement</h1>
        <p className="text-sm text-gray-500 mb-6">Select an uploaded document to place fields on.</p>

        {loading && <p className="text-sm text-gray-400">Loading files...</p>}

        {!loading && files.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-sm text-gray-400 mb-3">No files uploaded yet.</p>
            <a href="/upload" className="text-blue-600 text-sm underline">Upload a PDF</a>
          </div>
        )}

        {!loading && files.length > 0 && (
          <ul className="flex flex-col gap-2">
            {files.map((file) => (
              <li key={file}>
                <button
                  onClick={() => router.push(`/field-placement?file=${encodeURIComponent(file)}`)}
                  className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700 truncate block">
                    {displayName(file)}
                  </span>
                  <span className="text-xs text-gray-400 truncate block">{file}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <a href="/upload" className="mt-6 block text-center text-sm text-blue-600 underline">
          Upload a new document
        </a>
      </div>
    </main>
  );
}

function FieldPlacementInner() {
  const searchParams = useSearchParams();
  const filename = searchParams.get("file") ?? "";
  const documentId = filename; // filename is the document identifier

  const [fields, setFields] = useState<Field[]>([]);
  const [activeType, setActiveType] = useState<FieldType | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [pageDims, setPageDims] = useState({ width: 1, height: 1 });
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(!!filename);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);

  // Refs so event handlers always see current dims without stale closures
  const pageDimsRef = useRef({ width: 1, height: 1 });

  // Drag state
  const dragging = useRef<{
    fieldId: string;
    startMouseX: number;
    startMouseY: number;
    startFieldX: number;
    startFieldY: number;
  } | null>(null);

  // Resize state
  const resizing = useRef<{
    fieldId: string;
    startMouseX: number;
    startMouseY: number;
    startFieldWidth: number;
    startFieldHeight: number;
  } | null>(null);

  // ─── Load Worker + PDF ──────────────────────────────────────────────────

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    if (!filename) return;

    pdfjsLib
      .getDocument(`/api/files/${encodeURIComponent(filename)}`)
      .promise.then((doc) => {
        setPdfDoc(doc);
        setPageCount(doc.numPages);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load PDF. The file may have been deleted.");
        setLoading(false);
      });
  }, [filename]);

  // ─── Load existing fields from API ─────────────────────────────────────

  useEffect(() => {
    if (!documentId) return;
    fetch(`/api/documents/${encodeURIComponent(documentId)}/fields`)
      .then((r) => r.json())
      .then((data: Field[]) => setFields(data))
      .catch(() => {});
  }, [documentId]);

  // ─── Render current page ────────────────────────────────────────────────

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !overlayRef.current) return;

    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    const SCALE = 1.5;

    pdfDoc.getPage(currentPage).then((page) => {
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: SCALE * dpr });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      overlay.style.width = `${viewport.width / dpr}px`;
      overlay.style.height = `${viewport.height / dpr}px`;

      const dims = { width: viewport.width / dpr, height: viewport.height / dpr };
      pageDimsRef.current = dims;
      setPageDims(dims);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const task = page.render({ canvasContext: ctx, viewport, canvas });
      renderTaskRef.current = task;
      task.promise.catch(() => {});
    });
  }, [pdfDoc, currentPage]);

  // ─── Global drag / resize handlers ─────────────────────────────────────

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const { width: pw, height: ph } = pageDimsRef.current;

      if (dragging.current) {
        const { fieldId, startMouseX, startMouseY, startFieldX, startFieldY } =
          dragging.current;
        const dx = (e.clientX - startMouseX) / pw;
        const dy = (e.clientY - startMouseY) / ph;

        setFields((prev) =>
          prev.map((f) => {
            if (f.id !== fieldId) return f;
            return {
              ...f,
              x: Math.max(0, Math.min(1 - f.width, startFieldX + dx)),
              y: Math.max(0, Math.min(1 - f.height, startFieldY + dy)),
            };
          })
        );
        setSaved(false);
      }

      if (resizing.current) {
        const {
          fieldId,
          startMouseX,
          startMouseY,
          startFieldWidth,
          startFieldHeight,
        } = resizing.current;
        const dw = (e.clientX - startMouseX) / pw;
        const dh = (e.clientY - startMouseY) / ph;

        setFields((prev) =>
          prev.map((f) => {
            if (f.id !== fieldId) return f;
            return {
              ...f,
              width: Math.max(0.05, Math.min(1 - f.x, startFieldWidth + dw)),
              height: Math.max(0.02, Math.min(1 - f.y, startFieldHeight + dh)),
            };
          })
        );
        setSaved(false);
      }
    }

    function onMouseUp() {
      dragging.current = null;
      resizing.current = null;
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // ─── Place field on click ───────────────────────────────────────────────

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!activeType) return;
    if (dragging.current || resizing.current) return;

    const rect = overlayRef.current!.getBoundingClientRect();
    const { width: pw, height: ph } = pageDimsRef.current;

    const relX = (e.clientX - rect.left) / pw;
    const relY = (e.clientY - rect.top) / ph;

    const { width, height } = FIELD_DEFAULTS[activeType];

    const newField: Field = {
      id: crypto.randomUUID(),
      documentId,
      type: activeType,
      page: currentPage,
      x: Math.max(0, Math.min(1 - width, relX - width / 2)),
      y: Math.max(0, Math.min(1 - height, relY - height / 2)),
      width,
      height,
      label: FIELD_LABELS[activeType],
    };

    setFields((prev) => [...prev, newField]);
    setSaved(false);
  }

  function handleFieldMouseDown(e: React.MouseEvent, field: Field) {
    e.stopPropagation();
    dragging.current = {
      fieldId: field.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startFieldX: field.x,
      startFieldY: field.y,
    };
  }

  function handleResizeMouseDown(e: React.MouseEvent, field: Field) {
    e.stopPropagation();
    resizing.current = {
      fieldId: field.id,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startFieldWidth: field.width,
      startFieldHeight: field.height,
    };
  }

  function deleteField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    setSaved(false);
  }

  function toggleType(type: FieldType) {
    setActiveType((prev) => (prev === type ? null : type));
  }

  async function handleSave() {
    if (!documentId) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/documents/${encodeURIComponent(documentId)}/fields`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields }),
        }
      );
      if (res.ok) setSaved(true);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  const pageFields = fields.filter((f) => f.page === currentPage);
  const { width: pw, height: ph } = pageDims;

  // ─── Loading / Error States ─────────────────────────────────────────────

  if (!filename) return <FilePicker />;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading PDF...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <a href="/field-placement" className="text-blue-600 underline text-sm">
            Choose a different document
          </a>
        </div>
      </main>
    );
  }

  // ─── Main Layout ────────────────────────────────────────────────────────

  return (
    <main className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col p-4 gap-6 overflow-y-auto">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Field Placement</h1>
          <p className="text-xs text-gray-400 mt-0.5 break-all">{filename}</p>
        </div>

        {/* Field type selector */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Field Type
          </p>
          <div className="flex flex-col gap-2">
            {(["signature", "date", "text"] as FieldType[]).map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                  activeType === type ? TOOL_COLORS[type] : TOOL_INACTIVE
                }`}
              >
                {FIELD_LABELS[type]}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {activeType
              ? `Click the PDF to place a ${FIELD_LABELS[activeType]} field`
              : "Select a field type above"}
          </p>
        </div>

        {/* Page navigation */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Pages
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <span className="text-sm text-gray-700 flex-1 text-center">
              {currentPage} / {pageCount}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
              className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>

        {/* Placed fields list */}
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Placed Fields ({fields.length})
          </p>
          {fields.length === 0 ? (
            <p className="text-xs text-gray-400">No fields placed yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {fields.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2 py-1.5"
                >
                  <span className="text-gray-700 flex items-center gap-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                        f.type === "signature"
                          ? "bg-blue-500"
                          : f.type === "date"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    {f.label} — p{f.page}
                  </span>
                  <button
                    onClick={() => deleteField(f.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-2 leading-none"
                    title="Remove field"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Save button */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSave}
            disabled={fields.length === 0 || saving}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {saving ? "Saving..." : "Save Fields"}
          </button>
          {saved && (
            <p className="text-xs text-green-600 text-center">Fields saved.</p>
          )}
        </div>
      </aside>

      {/* Canvas area */}
      <section className="flex-1 overflow-auto bg-gray-200 flex justify-center p-6">
        <div className="relative" style={{ display: "inline-block" }}>
          <canvas ref={canvasRef} className="block shadow-lg" />

          {/* Overlay — captures clicks and renders field boxes */}
          <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="absolute top-0 left-0"
            style={{ cursor: activeType ? "crosshair" : "default" }}
          >
            {pageFields.map((f) => (
              <div
                key={f.id}
                onMouseDown={(e) => handleFieldMouseDown(e, f)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  left: f.x * pw,
                  top: f.y * ph,
                  width: f.width * pw,
                  height: f.height * ph,
                  cursor: "move",
                  userSelect: "none",
                }}
                className={`group flex items-center justify-between px-1 rounded ${FIELD_STYLES[f.type]}`}
              >
                <span className="text-xs font-semibold truncate leading-tight pointer-events-none">
                  {f.label}
                </span>

                {/* Delete button — visible on hover */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); deleteField(f.id); }}
                  className="text-xs leading-none ml-1 opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-opacity flex-shrink-0"
                  title="Remove"
                >
                  ×
                </button>

                {/* Resize handle — bottom-right corner */}
                <div
                  onMouseDown={(e) => handleResizeMouseDown(e, f)}
                  style={{
                    position: "absolute",
                    right: 0,
                    bottom: 0,
                    width: 10,
                    height: 10,
                    cursor: "se-resize",
                  }}
                  className="bg-current opacity-40 rounded-tl"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

// ─── Export (wraps in Suspense for useSearchParams) ───────────────────────────

export default function FieldPlacementClient() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500 text-sm">Loading...</p>
        </main>
      }
    >
      <FieldPlacementInner />
    </Suspense>
  );
}
