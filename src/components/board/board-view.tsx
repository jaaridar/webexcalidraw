"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Lock,
  Loader2,
  Users,
  Eye,
  Pencil,
  Globe,
  EyeOff,
  Link2,
  Sparkles,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarStack } from "@/components/boardly/avatar";
import { Logo } from "@/components/boardly/logo";
import { ControlCenter } from "@/components/dashboard/control-center";
import { VisibilityBadge } from "@/components/boardly/badges";
import { api as boardApi } from "@/lib/api";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PresenceUser = { id: string; name: string; avatarColor: string; role: string };

const ExcalidrawCanvas = dynamic(
  () => import("@/components/board/excalidraw-canvas").then((m) => m.ExcalidrawCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

type Stage = "loading" | "denied" | "password" | "guest-name" | "ready";

export function BoardView({
  boardId,
  currentUser,
  onExit,
}: {
  boardId: string;
  currentUser: { id: string; name: string; avatarColor: string } | null;
  onExit: () => void;
}) {
  const qc = useQueryClient();
  const user = useApp((s) => s.user);
  const guest = useApp((s) => s.guest);
  const ensureGuest = useApp((s) => s.ensureGuest);
  const setGuestName = useApp((s) => s.setGuestName);
  const [stage, setStage] = React.useState<Stage>("loading");
  const [presence, setPresence] = React.useState<PresenceUser[]>([]);
  const [controlOpen, setControlOpen] = React.useState(false);
  const [guestInput, setGuestInput] = React.useState("");

  const accessQuery = useQuery({
    queryKey: ["access", boardId, currentUser?.id ?? "anon"],
    queryFn: () => boardApi.getAccess(boardId),
  });

  // When the session user arrives (e.g. owner opens a board URL without a
  // prior cookie), re-evaluate access so we don't wrongly show "denied".
  React.useEffect(() => {
    if (currentUser) {
      qc.invalidateQueries({ queryKey: ["access", boardId] });
    }
  }, [currentUser?.id, boardId, qc]);

  const sceneQuery = useQuery({
    queryKey: ["scene", boardId],
    queryFn: () => boardApi.getScene(boardId),
    enabled: stage === "ready",
  });

  // Determine stage from access result
  React.useEffect(() => {
    if (!accessQuery.data) return;
    const { access, currentUser: accessUser } = accessQuery.data;
    if (access.denied) {
      // If access is denied but we might still be provisioning a session
      // (no user yet), stay in loading instead of wrongly showing denied.
      if (!accessUser && !currentUser) {
        // Wait a bit for the session to arrive before giving up.
        const timer = setTimeout(() => setStage("denied"), 2500);
        return () => clearTimeout(timer);
      }
      setStage("denied");
      return;
    }
    if (access.requiresPassword && !access.passwordVerified) {
      setStage("password");
      return;
    }
    // Has view access
    if (currentUser) {
      setStage("ready");
    } else {
      // guest on public link — needs a display name
      const g = ensureGuest();
      if (g.name && !g.name.startsWith("Guest ")) {
        setStage("ready");
      } else {
        setGuestInput(g.name);
        setStage("guest-name");
      }
    }
  }, [accessQuery.data, ensureGuest, currentUser]);

  const verifyMutation = useMutation({
    mutationFn: (password: string) => boardApi.verifyPassword(boardId, password),
    onSuccess: () => {
      toast.success("Access granted");
      qc.invalidateQueries({ queryKey: ["access", boardId] });
    },
    onError: (e: Error) =>
      toast.error("Incorrect password", { description: e.message }),
  });

  const info = accessQuery.data;
  const board = info?.board;
  const access = info?.access;
  const isOwner = !!access?.isOwner;

  const identity =
    stage === "ready"
      ? user
        ? { id: user.id, name: user.name, avatarColor: user.avatarColor }
        : ensureGuest()
      : ensureGuest();

  const roleForPresence = access?.role ?? "VIEWER";

  const joinAsGuest = () => {
    const name = guestInput.trim() || "Guest";
    setGuestName(name);
    setStage("ready");
  };

  // ---- Render gates ----
  if (stage === "loading" || !board || !access) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Opening board…</p>
      </div>
    );
  }

  if (stage === "denied") {
    return (
      <GateShell boardTitle={board.title} onExit={onExit}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
            <Lock className="size-7" />
          </div>
          <h1 className="text-xl font-semibold">This board is invite-only</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            You need an invitation from the board owner to view
            “{board.title}”. Ask them to add your email as a collaborator.
          </p>
          {board.owner && (
            <div className="mt-5 flex items-center justify-center gap-2.5 text-sm">
              <Avatar name={board.owner.name} color={board.owner.avatarColor} size={28} />
              <span className="text-muted-foreground">
                Owned by <span className="font-medium text-foreground">{board.owner.name}</span>
              </span>
            </div>
          )}
          <Button variant="outline" className="mt-6" onClick={onExit}>
            <ArrowLeft className="size-4" /> Back to dashboard
          </Button>
        </div>
      </GateShell>
    );
  }

  if (stage === "password") {
    return (
      <GateShell boardTitle={board.title} onExit={onExit}>
        <form
          className="w-full max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            verifyMutation.mutate(String(fd.get("pw") || ""));
          }}
        >
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
              <KeyRound className="size-7" />
            </div>
            <h1 className="text-xl font-semibold">Password required</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              “{board.title}” is protected. Enter the password the owner shared with you.
            </p>
          </div>
          <div className="mt-6 space-y-1.5">
            <Label htmlFor="pw">Password</Label>
            <Input
              id="pw"
              name="pw"
              type="password"
              autoFocus
              placeholder="Enter password"
            />
          </div>
          <Button
            type="submit"
            className="mt-4 w-full"
            disabled={verifyMutation.isPending}
          >
            {verifyMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Lock className="size-4" />
            )}
            Unlock board
          </Button>
        </form>
      </GateShell>
    );
  }

  if (stage === "guest-name") {
    return (
      <GateShell boardTitle={board.title} onExit={onExit}>
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-7" />
          </div>
          <h1 className="text-xl font-semibold">Join the board</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            You&apos;re joining <span className="font-medium text-foreground">“{board.title}”</span> as a{" "}
            <Badge
              variant="outline"
              className={cn(
                "mx-0.5",
                access.canEdit
                  ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
                  : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
              )}
            >
              {access.canEdit ? "Editor" : "Viewer"}
            </Badge>
          </p>
          <div className="mt-6 space-y-1.5 text-left">
            <Label htmlFor="gn">Your name</Label>
            <Input
              id="gn"
              value={guestInput}
              onChange={(e) => setGuestInput(e.target.value)}
              placeholder="e.g. Jordan Lee"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") joinAsGuest();
              }}
            />
          </div>
          <Button className="mt-4 w-full" onClick={joinAsGuest} disabled={!guestInput.trim()}>
            Enter board <ArrowRight className="size-4" />
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Changes you make sync live to everyone on this board.
          </p>
        </div>
      </GateShell>
    );
  }

  // ---- ready: render editor ----
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border/80 glass px-3 sm:px-4">
        <Button variant="ghost" size="icon" className="size-9 shrink-0" onClick={onExit} aria-label="Back to dashboard">
          <ArrowLeft className="size-4" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold sm:text-base">{board.title}</h1>
            <VisibilityBadge visibility={board.visibility} />
          </div>
          {board.description && (
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {board.description}
            </p>
          )}
        </div>

        {/* presence */}
        <div className="hidden items-center gap-2 sm:flex">
          {presence.length > 0 && (
            <>
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                {presence.length} live
              </span>
              <AvatarStack users={presence} max={4} size={26} />
            </>
          )}
        </div>

        {/* role indicator for non-owners */}
        {!isOwner && (
          <Badge
            variant="outline"
            className={cn(
              "hidden sm:inline-flex",
              access.canEdit
                ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
                : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
            )}
          >
            {access.canEdit ? <Pencil className="size-3" /> : <Eye className="size-3" />}
            {access.canEdit ? "Editor" : "Viewer"}
          </Badge>
        )}

        {isOwner && (
          <Button variant="outline" size="sm" onClick={() => setControlOpen(true)}>
            <Shield className="size-4" /> Control center
          </Button>
        )}
      </header>

      {/* Canvas */}
      <div className="relative flex-1">
        {sceneQuery.isLoading || !sceneQuery.data ? (
          <div className="flex h-full w-full items-center justify-center bg-muted/20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : sceneQuery.isError ? (
          <div className="flex h-full w-full items-center justify-center bg-muted/20 text-sm text-muted-foreground">
            Could not load the board scene.
          </div>
        ) : (
          <ExcalidrawCanvas
            boardId={boardId}
            initialElements={sceneQuery.data.elements}
            initialAppState={sceneQuery.data.appState}
            canEdit={sceneQuery.data.canEdit}
            allowExport={sceneQuery.data.allowExport}
            identity={identity!}
            role={roleForPresence}
            onPresence={setPresence}
            onSaved={() => {
              qc.invalidateQueries({ queryKey: ["boards"] });
            }}
          />
        )}
      </div>

      {isOwner && (
        <ControlCenter
          boardId={boardId}
          open={controlOpen}
          onOpenChange={setControlOpen}
        />
      )}
    </div>
  );
}

function GateShell({
  boardTitle,
  onExit,
  children,
}: {
  boardTitle: string;
  onExit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-grid">
      <header className="flex h-14 items-center gap-3 border-b border-border/80 glass px-4">
        <Button variant="ghost" size="icon" className="size-9" onClick={onExit} aria-label="Back">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="text-sm font-medium">Boardly</span>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card p-8 shadow-premium-lg"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
