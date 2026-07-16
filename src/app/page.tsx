"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

// Client-only render to eliminate hydration mismatches from browser extensions.
const AppShell = dynamic(
  () => import("@/components/app-shell").then((m) => m.AppShell),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  }
);

export default function Home() {
  return (
    <Suspense>
      <AppShell />
    </Suspense>
  );
}
