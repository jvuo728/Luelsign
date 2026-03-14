"use client";

import dynamic from "next/dynamic";

const FieldPlacementClient = dynamic(
  () => import("./FieldPlacementClient"),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading...</p>
      </main>
    ),
  }
);

export default function FieldPlacementPage() {
  return <FieldPlacementClient />;
}
