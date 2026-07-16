"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import { Dashboard } from "@/components/dashboard/dashboard";

// Code-split the board view (+ Excalidraw) so the dashboard route stays light.
const BoardView = dynamic(
  () => import("@/components/board/board-view").then((m) => m.BoardView),
  { ssr: false }
);

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function AppShell() {
  const router = useRouter();
  const params = useSearchParams();
  const boardId = params.get("b");
  const setUser = useApp((s) => s.setUser);
  const user = useApp((s) => s.user);

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: api.getSession,
  });

  // For the dashboard: provision an owner session if there isn't one.
  // For shared board views: don't provision — let the BoardView handle
  // access (owner with cookie, or guest without).
  React.useEffect(() => {
    if (sessionQuery.data?.user) {
      setUser(sessionQuery.data.user);
    } else if (sessionQuery.data && !sessionQuery.data.user && !boardId) {
      api
        .provisionSession()
        .then((r) => setUser(r.user))
        .catch(() => {});
    }
  }, [sessionQuery.data, setUser, boardId]);

  const goDashboard = React.useCallback(() => {
    router.push("/");
  }, [router]);

  const openBoard = React.useCallback(
    (id: string) => {
      router.push(`/?b=${id}`);
    },
    [router]
  );

  // Shared board view — works for owners, collaborators, and guests alike.
  if (boardId) {
    return <BoardView key={boardId} boardId={boardId} currentUser={user} onExit={goDashboard} />;
  }

  if (sessionQuery.isLoading || !user) {
    return <FullScreenLoader label="Preparing your workspace…" />;
  }

  return <Dashboard onOpenBoard={openBoard} />;
}
