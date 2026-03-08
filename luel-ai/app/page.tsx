import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
      <main className="mx-auto max-w-xl text-center">
        <h1 className="mb-4 font-serif text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Document Signing
        </h1>
        <p className="mb-10 text-slate-600 dark:text-slate-400">
          Review and sign documents electronically. Open the link below to
          begin the consent and signing flow.
        </p>
        <Link
          href="/signing/consent"
          className="inline-flex h-14 items-center justify-center rounded-xl bg-slate-900 px-10 font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Start Signing Flow
        </Link>
      </main>
    </div>
  );
}
