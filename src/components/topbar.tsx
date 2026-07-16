"use client";

// Boardly — TopBar: board control surface (features on top).
// Shows collaborators, presence, visibility toggle, share mode dropdown, link copy.
import * as React from "react";
import {
  ArrowLeft, Check, Copy, Eye, Globe, Lock, LogOut, Moon, Pencil, Share2, Star, Sun, UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarStack, MiniBadges, VisibilityPill } from "@/components/common";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { useUpdateBoard, useUpdateProfile } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Access, BoardSummary, PresenceUser, User } from "@/lib/types";

export function TopBar({
  board, access, presence, isOwner, onToggleFavorite, onExit,
}: {
  board: BoardSummary; access: Access; presence: PresenceUser[];
  isOwner: boolean; onToggleFavorite: () => void; onExit: () => void;
}) {
  const user = useApp((s) => s.user);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?b=${board.id}` : "";
  const updateBoard = useUpdateBoard(board.id);
  const [shareMode, setShareMode] = React.useState<"VIEW" | "EDIT">(board.accessMode === "EDIT" ? "EDIT" : "VIEW");
  const [copied, setCopied] = React.useState(false);
  const [isPublic, setIsPublic] = React.useState(board.visibility === "PUBLIC");

  React.useEffect(() => {
    setIsPublic(board.visibility === "PUBLIC");
  }, [board.visibility]);

  const togglePublic = async () => {
    const next = !isPublic;
    try {
      await updateBoard.mutateAsync({ visibility: next ? "PUBLIC" : "PRIVATE", accessMode: next ? shareMode : board.accessMode, shareMode: next ? "PUBLIC_LINK" : board.shareMode });
      setIsPublic(next);
      toast.success(next ? "Board is now public" : "Board is now private");
    } catch { toast.error("Could not update visibility"); }
  };

  const applyShareMode = async (mode: "VIEW" | "EDIT") => {
    setShareMode(mode);
    if (!isPublic) return;
    try {
      await updateBoard.mutateAsync({ accessMode: mode, shareMode: "PUBLIC_LINK" });
      toast.success(`Sharing as ${mode === "EDIT" ? "editable" : "read-only"}`);
    } catch { toast.error("Could not update sharing"); }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); toast.success("Link copied"); setTimeout(() => setCopied(false), 1800); }
    catch { toast.error("Could not copy link"); }
  };

  return (
    <>
      <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 glass px-3">
        {/* Board identity + context pills */}
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onExit} aria-label="Back">
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-sm font-semibold sm:text-base">{board.title}</h1>
          <VisibilityPill visibility={board.visibility} className="hidden sm:inline-flex" />
          {isOwner && (
            <Button variant="ghost" size="icon" className="size-7 hidden sm:flex text-muted-foreground hover:text-foreground" onClick={togglePublic} aria-label={isPublic ? "Make private" : "Make public"}>
              {isPublic ? <Lock className="size-3.5" /> : <Globe className="size-3.5" />}
            </Button>
          )}
          <MiniBadges passwordEnabled={board.passwordEnabled} collaborators={board.collaboratorCount} className="hidden md:flex" />
        </div>

        {/* Favorite */}
        <Button variant="ghost" size="icon" className={cn("size-8", board.favorited && "text-amber-500")}
          onClick={onToggleFavorite} aria-label="Favorite">
          <Star className={cn("size-4", board.favorited && "fill-current")} />
        </Button>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Live collaborators — always visible when present */}
          <CollaboratorIndicator presence={presence} collaboratorCount={board.collaboratorCount} />

          {/* Role indicator for non-owners */}
          {!isOwner && (
            <span className={cn("hidden rounded-md px-2 py-0.5 text-[11px] font-medium sm:inline-flex",
              access.canEdit ? "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300" : "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-300")}>
              {access.canEdit ? <><Pencil className="size-3" /> Editor</> : <><Eye className="size-3" /> Viewer</>}
            </span>
          )}

          {/* Public sharing controls — only visible to owner when public */}
          {isOwner && isPublic && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Share2 className="size-3.5" /> <span className="hidden sm:inline">{shareMode === "EDIT" ? "Editable" : "Read-only"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sharing mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => applyShareMode("VIEW")} className={cn("gap-2", shareMode === "VIEW" && "font-medium")}>
                  <Eye className="size-4" /> Read only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyShareMode("EDIT")} className={cn("gap-2", shareMode === "EDIT" && "font-medium")}>
                  <Pencil className="size-4" /> Edit only
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={copyLink} className="gap-2">
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy link"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Private toggle for owner */}
          {isOwner && !isPublic && (
            <Button variant="outline" size="sm" className="h-8" onClick={togglePublic}>
              <Globe className="size-3.5" /> <span className="hidden sm:inline">Make public</span>
            </Button>
          )}

          <ThemeToggle />
          <ProfileMenu user={user} onExit={onExit} />
        </div>
      </header>

      <ShareDialog open={false} onOpenChange={() => {}} url={shareUrl} board={board} />
    </>
  );
}

// Live collaborator indicator — shows presence avatars + names on hover
function CollaboratorIndicator({ presence, collaboratorCount }: {
  presence: PresenceUser[]; collaboratorCount: number;
}) {
  if (presence.length === 0 && collaboratorCount === 0) return null;
  const users = presence.length > 0 ? presence : [];
  return (
    <div className="hidden items-center gap-2 sm:flex">
      {presence.length > 0 && (
        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          {presence.length} live
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full p-0.5 transition-colors hover:bg-accent" aria-label="Collaborators">
            <AvatarStack users={users} max={4} size={26} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Collaborators {presence.length > 0 && `· ${presence.length} live`}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {users.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">No one online right now</div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 px-2 py-1.5">
                <Avatar name={u.name} color={u.avatarColor} size={26} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">● online · {u.role}</p>
                </div>
              </div>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dark = mounted && theme === "dark";
  return (
    <Button variant="ghost" size="icon" className="size-8" aria-label="Toggle theme" onClick={() => setTheme(dark ? "light" : "dark")}>
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function ProfileMenu({ user, onExit }: { user: User | null; onExit: () => void }) {
  const [editOpen, setEditOpen] = React.useState(false);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded-full p-0.5 transition-colors hover:bg-accent">
            {user && <Avatar name={user.name} color={user.avatarColor} size={28} />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
            {user && <Avatar name={user.name} color={user.avatarColor} size={34} />}
            <div className="min-w-0"><p className="truncate text-sm font-medium">{user?.name}</p><p className="truncate text-xs text-muted-foreground">{user?.email}</p></div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}><UserCog className="size-4" /> Edit profile</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onExit}><LogOut className="size-4" /> Back to dashboard</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProfileEditDialog open={editOpen} onOpenChange={setEditOpen} user={user} />
    </>
  );
}

function ProfileEditDialog({ open, onOpenChange, user }: {
  open: boolean; onOpenChange: (v: boolean) => void; user: User | null;
}) {
  const update = useUpdateProfile();
  const setUser = useApp((s) => s.setUser);
  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [color, setColor] = React.useState(user?.avatarColor ?? AVATAR_COLORS[0]);
  React.useEffect(() => { if (user) { setName(user.name); setEmail(user.email); setColor(user.avatarColor); } }, [user]);

  const save = async () => {
    try {
      const r = await update.mutateAsync({ name, email, avatarColor: color });
      setUser(r.user); toast.success("Profile updated"); onOpenChange(false);
    } catch { toast.error("Could not update profile"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Edit profile</DialogTitle><DialogDescription>How you appear on boards.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Avatar color</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn("size-7 rounded-full transition-transform", color === c ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" : "hover:scale-110")}
                  style={{ backgroundColor: c }} aria-label={`Color ${c}`} />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!name.trim() || !email.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShareDialog({ open, onOpenChange, url, board }: {
  open: boolean; onOpenChange: (v: boolean) => void; url: string; board: BoardSummary;
}) {
  const [copied, setCopied] = React.useState(false);
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); toast.success("Link copied"); setTimeout(() => setCopied(false), 1800); } catch {} };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Share board</DialogTitle><DialogDescription>{board.title}</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input readOnly value={url} className="font-mono text-xs" />
            <Button size="icon" variant="outline" onClick={copy} aria-label="Copy">{copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}</Button>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            {board.visibility === "PRIVATE"
              ? "This board is private. Make it public to share a link."
              : `Anyone with the link can ${board.accessMode === "EDIT" ? "edit" : "view"} this board${board.passwordEnabled ? " (password required)." : "."}`}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
