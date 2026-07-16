"use client";

// Boardly — BoardView: composes access gate → topbar + canvas.
import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { TopBar } from "@/components/topbar";
import { ControlCenter } from "@/components/control-center";
import { DeniedGate, GuestNameGate, PasswordGate } from "@/components/access-gates";
import { useAccess, useScene, useUpdateBoard } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { toast } from "sonner";
import type { PresenceUser } from "@/lib/types";

const BoardCanvas = dynamic(() => import("@/components/board-canvas").then((m) => m.BoardCanvas), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-muted/20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>,
});

type Stage = "loading" | "denied" | "password" | "guest-name" | "ready";

export function BoardView({ boardId, currentUser, onExit }: {
  boardId: string; currentUser: { id: string; name: string; avatarColor: string } | null; onExit: () => void;
}) {
  const accessQ = useAccess(boardId);
  const [stage, setStage] = React.useState<Stage>("loading");
  const [presence, setPresence] = React.useState<PresenceUser[]>([]);
  const [controlOpen, setControlOpen] = React.useState(false);
  const guest = useApp((s) => s.guest);
  const setGuestName = useApp((s) => s.setGuestName);
  const updateBoard = useUpdateBoard(boardId);

  const info = accessQ.data;
  const board = info?.board;
  const access = info?.access;
  const isOwner = !!access?.isOwner;

  const sceneQ = useScene(boardId, stage === "ready");

  // determine stage from access result
  React.useEffect(() => {
    if (!info) return;
    const { access: a, currentUser: u } = info;
    if (a.denied) {
      if (!u && !currentUser) { const t = setTimeout(() => setStage("denied"), 1500); return () => clearTimeout(t); }
      setStage("denied"); return;
    }
    if (a.requiresPassword && !a.passwordVerified) { setStage("password"); return; }
    if (u || currentUser) { setStage("ready"); return; }
    if (guest.name && !guest.name.startsWith("Guest ")) { setStage("ready"); return; }
    setStage("guest-name");
  }, [info, currentUser, guest.name]);

  if (stage === "loading" || !board || !access)
    return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  if (stage === "denied")
    return <DeniedGate title={board.title} owner={board.owner} onExit={onExit} />;

  if (stage === "password")
    return <PasswordGate boardId={boardId} onExit={onExit} />;

  if (stage === "guest-name")
    return <GuestNameGate title={board.title} canEdit={access.canEdit} onExit={onExit} onJoin={() => setStage("ready")} />;

  const identity = currentUser ?? guest;

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar
        board={board}
        access={access}
        presence={presence}
        isOwner={isOwner}
        onToggleFavorite={() => { updateBoard.mutate({ favorited: !board.favorited }); toast.success(board.favorited ? "Removed from favorites" : "Added to favorites"); }}
        onOpenControl={() => setControlOpen(true)}
        onExit={onExit}
      />
      <div className="relative flex-1">
        {sceneQ.isLoading || !sceneQ.data ? (
          <div className="flex h-full w-full items-center justify-center bg-muted/20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : sceneQ.isError ? (
          <div className="flex h-full w-full items-center justify-center bg-muted/20 text-sm text-muted-foreground">Could not load the board.</div>
        ) : (
          <BoardCanvas
            boardId={boardId}
            initialElements={sceneQ.data.elements}
            initialAppState={sceneQ.data.appState}
            canEdit={sceneQ.data.canEdit}
            allowExport={sceneQ.data.allowExport}
            identity={identity}
            role={access.role}
            onPresence={setPresence}
          />
        )}
      </div>
      {isOwner && <ControlCenter boardId={boardId} open={controlOpen} onOpenChange={setControlOpen} />}
    </div>
  );
}
