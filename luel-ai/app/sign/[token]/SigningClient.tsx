"use client";

import { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import type { Field } from "@/lib/types";

interface SessionData {
  token: string;
  documentId: string;
  signerName: string;
  fields: Field[];
  status: "pending" | "completed";
}

const FIELD_STYLES: Record<string, string> = {
  signature: "border-blue-400 bg-blue-50/80 placeholder-blue-300 text-blue-900 font-medium italic",
  date:      "border-amber-400 bg-amber-50/80 placeholder-amber-300 text-amber-900",
  text:      "border-emerald-400 bg-emerald-50/80 placeholder-emerald-300 text-emerald-900",
};

const FIELD_PLACEHOLDERS: Record<string, string> = {
  signature: "Type your full name",
  date:      "",
  text:      "Enter text",
};

export default function SigningClient({ token }: { token: string }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [pageDims, setPageDims] = useState({ width: 1, height: 1 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [validationError, setValidationError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const pageDimsRef = useRef({ width: 1, height: 1 });

  // ─── Load session ──────────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/sessions/${token}`)
      .then((r) => r.json())
      .then((data: SessionData & { error?: string }) => {
        if (data.error) { setLoadError(data.error); return; }
        setSession(data);

        // Pre-fill date fields with today's date
        const initial: Record<string, string> = {};
        for (const f of data.fields) {
          if (f.type === "date") {
            initial[f.id] = new Date().toLocaleDateString();
          }
        }
        setFieldValues(initial);
      })
      .catch(() => setLoadError("Failed to load signing session."));
  }, [token]);

  // ─── Load PDF ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session) return;
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    pdfjsLib
      .getDocument(`/api/sessions/${token}/pdf`)
      .promise.then((doc) => {
        setPdfDoc(doc);
        setPageCount(doc.numPages);
      })
      .catch(() => setLoadError("Failed to load PDF."));
  }, [session, token]);

  // ─── Render current page ───────────────────────────────────────────────

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

  // ─── Submit ────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!session) return;

    // Validate all fields have values
    const empty = session.fields.filter((f) => !fieldValues[f.id]?.trim());
    if (empty.length > 0) {
      setValidationError(
        `Please fill in all fields: ${empty.map((f) => f.label).join(", ")}`
      );
      return;
    }

    setValidationError(null);
    setSubmitStatus("submitting");

    try {
      const res = await fetch(`/api/sessions/${token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldValues }),
      });

      if (!res.ok) {
        setSubmitStatus("error");
        return;
      }

      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed-document.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setSubmitStatus("done");
    } catch {
      setSubmitStatus("error");
    }
  }

  const pageFields = session?.fields.filter((f) => f.page === currentPage) ?? [];
  const { width: pw, height: ph } = pageDims;

  // ─── Error / Done States ───────────────────────────────────────────────

  if (loadError) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">{loadError}</p>
          <p className="text-sm text-gray-500">This link may be invalid or expired.</p>
        </div>
      </main>
    );
  }

  if (session?.status === "completed" && submitStatus !== "done") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Already signed</p>
          <p className="text-sm text-gray-500">This document has already been completed.</p>
        </div>
      </main>
    );
  }

  if (submitStatus === "done") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-1">Document signed!</p>
          <p className="text-sm text-gray-500">Your signed copy has been downloaded.</p>
        </div>
      </main>
    );
  }

  // ─── Main Layout ───────────────────────────────────────────────────────

  return (
    <main className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col p-4 gap-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Sign Document</h1>
          {session && (
            <p className="text-xs text-gray-400 mt-0.5">Signing as {session.signerName}</p>
          )}
        </div>

        {/* Page navigation */}
        {pageCount > 1 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Pages</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm text-gray-700 flex-1 text-center">
                {currentPage} / {pageCount}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Fields summary */}
        {session && (
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Fields ({session.fields.length})
            </p>
            <ul className="flex flex-col gap-1">
              {session.fields.map((f) => {
                const filled = !!fieldValues[f.id]?.trim();
                return (
                  <li key={f.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        filled ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    {f.label} — p{f.page}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{validationError}</p>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitStatus === "submitting" || !session}
          className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {submitStatus === "submitting" ? "Signing..." : "Submit Signature"}
        </button>

        {submitStatus === "error" && (
          <p className="text-xs text-red-600 text-center">Something went wrong. Please try again.</p>
        )}
      </aside>

      {/* PDF canvas area */}
      <section className="flex-1 overflow-auto bg-gray-200 flex justify-center p-6">
        {!pdfDoc && (
          <p className="text-sm text-gray-400 self-center">Loading PDF...</p>
        )}
        <div className="relative" style={{ display: pdfDoc ? "inline-block" : "none" }}>
          <canvas ref={canvasRef} className="block shadow-lg" />

          {/* Field input overlay */}
          <div ref={overlayRef} className="absolute top-0 left-0 pointer-events-none">
            {pageFields.map((f) => (
              <div
                key={f.id}
                style={{
                  position: "absolute",
                  left: f.x * pw,
                  top: f.y * ph,
                  width: f.width * pw,
                  height: f.height * ph,
                  pointerEvents: "auto",
                }}
              >
                <input
                  type={f.type === "date" ? "text" : "text"}
                  value={fieldValues[f.id] ?? ""}
                  onChange={(e) => {
                    setFieldValues((prev) => ({ ...prev, [f.id]: e.target.value }));
                    setValidationError(null);
                  }}
                  placeholder={FIELD_PLACEHOLDERS[f.type]}
                  className={`w-full h-full px-1 text-sm border-2 rounded outline-none focus:ring-2 focus:ring-offset-0 bg-opacity-90 ${FIELD_STYLES[f.type]}`}
                  style={{ fontSize: Math.max(10, f.height * ph * 0.5) }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
