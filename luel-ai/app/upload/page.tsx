"use client";

import { useState, useRef } from "react";

export default function UploadPage() {
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setStatus("error");
      setMessage("Please select a PDF file.");
      return;
    }
    if (file.type !== "application/pdf") {
      setStatus("error");
      setMessage("Only PDF files are accepted.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setStatus("uploading");
    setMessage("");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage(`Uploaded: ${json.filename}`);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setStatus("error");
        setMessage(json.error ?? "Upload failed.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Upload Document
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Select a PDF file to upload. Only PDF files are accepted.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="block w-full text-sm text-gray-600 dark:text-gray-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900 dark:file:text-blue-300
                cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={status === "uploading"}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              text-white font-medium rounded-xl transition-colors"
          >
            {status === "uploading" ? "Uploading..." : "Upload"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-sm rounded-lg px-4 py-3 ${
              status === "success"
                ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
