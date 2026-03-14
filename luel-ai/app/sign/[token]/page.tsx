"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const SigningClient = dynamic(() => import("./SigningClient"), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">Loading document...</p>
    </main>
  ),
});

export default function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  return <SigningClient token={token} />;
}
