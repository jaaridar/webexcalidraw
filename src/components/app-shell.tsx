"use client";

// Boardly — AppShell: board-first routing.
// Opens directly into the most recent board. Sidebar switches boards.
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Sparkles, Plus } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { BoardView } from "@/components/board-view";
import { CreateBoardDialog } from "@/components/create-board";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useBoards, useSession } from "@/hooks/use-data";
import { useApp } from "@/lib/store";

export function AppShell() {
  const router = useRouter();
  const params = useSearchParams();
  const urlBoardId = params.get("b");
  const setUser = useApp((s) => s.setUser);
  const user = useApp((s) => s.user);
  const currentBoardId = useApp((s) => s.currentBoardId);
  const setCurrentBoard = useApp((s) => s.setCurrentBoard);

  const sessionQ = useSession();
  const boardsQ = useBoards(!!user);
  const [createOpen, setCreateOpen] = React.useState(false);

  // bootstrap session
  React.useEffect(() => {
    if (sessionQ.data?.user) setUser(sessionQ.data.user);
    else if (sessionQ.data && !sessionQ.data.user) api.provisionSession().then((r) => setUser(r.user)).catch(() => {});
  }, [sessionQ.data, setUser]);

  // board-first: pick the most recent board if none selected
  React.useEffect(() => {
    if (urlBoardId) { setCurrentBoard(urlBoardId); return; }
    if (currentBoardId) return;
    const first = boardsQ.data?.boards?.find((b) => !b.archived);
    if (first) { router.replace(`/?b=${first.id}`); setCurrentBoard(first.id); }
  }, [urlBoardId, currentBoardId, boardsQ.data, setCurrentBoard, router]);

  const openBoard = React.useCallback((id: string) => { router.push(`/?b=${id}`); setCurrentBoard(id); }, [router, setCurrentBoard]);
  const goDashboard = React.useCallback(() => { router.push("/"); }, [router]);

  if (sessionQ.isLoading || !user) return <FullScreen label="Preparing your workspace…" />;

  const boards = (boardsQ.data?.boards ?? []).filter((b) => !b.archived);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar onNewBoard={() => setCreateOpen(true)} onOpenBoard={openBoard} />
      <main className="flex min-w-0 flex-1 flex-col">
        {boards.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        ) : currentBoardId ? (
          <BoardView key={currentBoardId} boardId={currentBoardId} currentUser={user} onExit={goDashboard} />
        ) : (
          <FullScreen label="Opening board…" />
        )}
      </main>
      <CreateBoardDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => { setCreateOpen(false); openBoard(id); }} />
    </div>
  );
}

function FullScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-7" /></div>
      <h2 className="text-lg font-semibold">Create your first board</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">A fresh collaborative canvas. Private by default — share when you&apos;re ready.</p>
      <Button className="mt-5" onClick={onCreate}><Plus className="size-4" /> New board</Button>
    </div>
  );
}
