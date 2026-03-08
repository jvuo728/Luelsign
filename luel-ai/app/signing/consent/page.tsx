"use client";

import Link from "next/link";
import { useSigning } from "@/context/SigningContext";

export default function ConsentPage() {
  const { setConsented } = useSigning();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="mb-6 font-serif text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Electronic Signature Disclosure
          </h1>

          <div className="prose prose-slate dark:prose-invert mb-8 max-w-none text-slate-600 dark:text-slate-400">
            <p className="mb-4 leading-relaxed">
              Before you sign electronically, please read and acknowledge the
              following:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6">
              <li>
                You agree to conduct this transaction by electronic means and
                consent to the use of electronic records and signatures.
              </li>
              <li>
                You have the right to receive a paper copy of any document. To
                request a paper copy, please contact us before completing this
                process.
              </li>
              <li>
                Your electronic signature has the same legal effect as a
                handwritten signature.
              </li>
              <li>
                You confirm that you have the authority to sign on behalf of
                yourself or the entity you represent.
              </li>
              <li>
                You can access and retain this disclosure by printing or saving
                it for your records.
              </li>
            </ul>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              By clicking &quot;Agree and Continue&quot;, you acknowledge that
              you have read, understood, and agree to the terms above.
            </p>
          </div>

          <Link
            href="/signing/sign"
            onClick={setConsented}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-slate-900 px-8 font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          >
            Agree and Continue
          </Link>
        </div>
      </div>
    </div>
  );
}
