"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSigning } from "@/context/SigningContext";

const PDFViewer = dynamic(() => import("@/components/PDFViewer"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
      Loading viewer…
    </div>
  ),
});

const SignaturePadClient = dynamic(() => import("@/components/SignaturePad"), {
  ssr: false,
});

export default function SignPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    hasConsented,
    pdfFile,
    setPdfFile,
    setPdfArrayBuffer,
    signingData,
    setSigningData,
  } = useSigning();

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || file.type !== "application/pdf") {
        return;
      }
      setPdfFile(file);
      const arrayBuffer = await file.arrayBuffer();
      setPdfArrayBuffer(arrayBuffer);
    },
    [setPdfFile, setPdfArrayBuffer]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!signingData.name || !signingData.date || !signingData.signatureDataUrl) {
        return;
      }
      router.push("/signing/complete");
    },
    [signingData, router]
  );

  if (!hasConsented) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <p className="mb-4 text-slate-600 dark:text-slate-400">
            Please agree to the disclosure first.
          </p>
          <Link
            href="/signing/consent"
            className="text-slate-900 underline dark:text-slate-100"
          >
            Go to Consent
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit =
    signingData.name.trim() !== "" &&
    signingData.date !== "" &&
    signingData.signatureDataUrl;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/signing/consent"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            ← Back to consent
          </Link>
          <h1 className="font-serif text-xl font-semibold text-slate-900 dark:text-slate-50">
            Sign Document
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 font-medium text-slate-900 dark:text-slate-50">
                Upload PDF
              </h2>
              {!pdfFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500 dark:hover:bg-slate-700/50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <svg
                    className="mb-3 h-12 w-12 text-slate-400 dark:text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Click to upload PDF
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                    PDF files only
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                    {pdfFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      setPdfArrayBuffer(null);
                      fileInputRef.current!.value = "";
                    }}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="mb-4 font-medium text-slate-900 dark:text-slate-50">
                Signing Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={signingData.name}
                    onChange={(e) =>
                      setSigningData({ name: e.target.value })
                    }
                    required
                    placeholder="Enter your full name"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="date"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={signingData.date}
                    onChange={(e) =>
                      setSigningData({ date: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Signature
                  </label>
                  <SignaturePadClient
                    onSave={(dataUrl) =>
                      setSigningData({
                        signatureDataUrl: dataUrl || null,
                      })
                    }
                    value={signingData.signatureDataUrl}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!pdfFile || !canSubmit}
                className="mt-6 w-full rounded-lg bg-slate-900 py-3 font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Complete Signing
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 font-medium text-slate-900 dark:text-slate-50">
              Document Preview
            </h2>
            {pdfFile ? (
              <PDFViewer file={pdfFile} />
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                <p className="text-sm">Upload a PDF to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
