"use client";

import { useRef, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  value?: string | null;
  width?: number;
  height?: number;
}

export default function SignaturePad({
  onSave,
  value,
  width = 400,
  height = 150,
}: SignaturePadProps) {
  const sigPadRef = useRef<SignatureCanvas>(null);

  const handleClear = useCallback(() => {
    sigPadRef.current?.clear();
    onSave("");
  }, [onSave]);

  const handleSave = useCallback(() => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      const dataUrl = sigPadRef.current.toDataURL("image/png");
      onSave(dataUrl);
    } else {
      onSave("");
    }
  }, [onSave]);

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800">
        <SignatureCanvas
          ref={sigPadRef}
          canvasProps={{
            width,
            height,
            className:
              "w-full rounded-lg touch-none cursor-crosshair bg-white dark:bg-slate-800",
          }}
          backgroundColor="transparent"
          penColor="black"
          onEnd={handleSave}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Clear
        </button>
        {value && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400">
            Signature captured
          </span>
        )}
      </div>
    </div>
  );
}
