"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/files")
      .then((r) => r.json())
      .then((data: string[]) => { setFiles(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function displayName(filename: string) {
    return filename.replace(/^[0-9a-f-]{36}-/i, "");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">LuelSign</h1>
        <a
          href="/upload"
          className="px-4 py-2 btn-brand text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Upload Document
        </a>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Documents
        </h2>

        {loading && (
          <p className="text-sm text-gray-400">Loading...</p>
        )}

        {!loading && files.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-400 mb-4">No documents yet.</p>
            <a
              href="/upload"
              className="px-4 py-2 btn-brand text-white text-sm font-medium rounded-lg transition-colors"
            >
              Upload your first PDF
            </a>
          </div>
        )}

        {!loading && files.length > 0 && (
          <ul className="flex flex-col gap-3">
            {files.map((file) => (
              <li
                key={file}
                className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
              >
                {/* File icon + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{displayName(file)}</p>
                    <p className="text-xs text-gray-400 truncate">{file}</p>
                  </div>
                </div>

                {/* Actions */}
                <a
                  href={`/field-placement?file=${encodeURIComponent(file)}`}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex-shrink-0 btn-brand"
                >
                  Place Fields
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
