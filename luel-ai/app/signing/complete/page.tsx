"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSigning } from "@/context/SigningContext";
import { PDFDocument } from "pdf-lib";

export default function CompletePage() {
  const { pdfArrayBuffer, signingData, resetSigningFlow } = useSigning();
  const [signedPdfBlob, setSignedPdfBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  const embedFieldsAndCreatePdf = useCallback(async () => {
    if (!pdfArrayBuffer || !signingData.signatureDataUrl) {
      setError("Missing PDF or signature data. Please complete the signing flow first.");
      setIsProcessing(false);
      return;
    }

    try {
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      if (!firstPage) {
        setError("PDF has no pages");
        setIsProcessing(false);
        return;
      }

      const { width, height } = firstPage.getSize();
      const margin = 50;
      const lineHeight = 18;
      let y = margin + 40;

      // Add name
      firstPage.drawText(`Name: ${signingData.name}`, {
        x: margin,
        y: height - y,
        size: 12,
      });
      y += lineHeight;

      // Add date
      firstPage.drawText(`Date: ${signingData.date}`, {
        x: margin,
        y: height - y,
        size: 12,
      });
      y += lineHeight + 10;

      // Embed signature image
      if (signingData.signatureDataUrl) {
        const base64Data = signingData.signatureDataUrl.split(",")[1];
        if (base64Data) {
          const imageBytes = Uint8Array.from(atob(base64Data), (c) =>
            c.charCodeAt(0)
          );
          const pngImage = await pdfDoc.embedPng(imageBytes);
          const sigWidth = Math.min(200, pngImage.width);
          const sigHeight = (pngImage.height / pngImage.width) * sigWidth;

          firstPage.drawImage(pngImage, {
            x: margin,
            y: height - y - sigHeight,
            width: sigWidth,
            height: sigHeight,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      setSignedPdfBlob(
        new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process PDF");
    } finally {
      setIsProcessing(false);
    }
  }, [pdfArrayBuffer, signingData]);

  useEffect(() => {
    embedFieldsAndCreatePdf();
  }, [embedFieldsAndCreatePdf]);

  const handleDownload = useCallback(() => {
    if (!signedPdfBlob) return;
    const url = URL.createObjectURL(signedPdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signed-document-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [signedPdfBlob]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900 dark:bg-slate-900">
          <p className="mb-4 text-red-600 dark:text-red-400">{error}</p>
          <Link
            href="/signing/consent"
            onClick={resetSigningFlow}
            className="text-slate-900 underline dark:text-slate-100"
          >
            Start signing flow
          </Link>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 mx-auto dark:border-slate-600 dark:border-t-slate-100" />
          <p className="text-slate-600 dark:text-slate-400">
            Preparing your signed document…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <svg
              className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-2 font-serif text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Signing Complete
          </h1>
          <p className="mb-8 text-slate-600 dark:text-slate-400">
            Your document has been signed. Download your copy below.
          </p>

          <div className="space-y-4">
            <button
              onClick={handleDownload}
              className="w-full rounded-lg bg-slate-900 py-3 font-medium text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Download Signed Document
            </button>
            <Link
              href="/signing/consent"
              onClick={resetSigningFlow}
              className="block w-full rounded-lg border border-slate-300 py-3 text-center font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sign Another Document
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
