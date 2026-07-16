"use client";

import dynamic from "next/dynamic";

// Render the entire app client-only. The server sends a minimal placeholder
// which is REPLACED (not hydrated) on the client — this eliminates all
// hydration mismatches, including those caused by browser extensions that
// inject attributes into the SSR'd DOM.
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
  return <AppShell />;
}
