"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  LayoutGrid,
  Star,
  Archive,
  Globe,
  EyeOff,
  Users,
  SlidersHorizontal,
  LogOut,
  UserCog,
  Check,
  Loader2,
  PenTool,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LogoWordmark } from "@/components/boardly/logo";
import { Avatar } from "@/components/boardly/avatar";
import { ThemeToggle } from "@/components/boardly/theme-toggle";
import { BoardCard } from "@/components/dashboard/board-card";
import { CreateBoardDialog } from "@/components/dashboard/create-board-dialog";
import { ControlCenter } from "@/components/dashboard/control-center";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import { BOARD_CATEGORIES, AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Filter = "all" | "favorites" | "archived" | "public" | "private";
type Sort = "updated" | "created" | "title";

export function Dashboard({ onOpenBoard }: { onOpenBoard: (id: string) => void }) {
  const qc = useQueryClient();
  const user = useApp((s) => s.user);
  const setUser = useApp((s) => s.setUser);
  const boardsNonce = useApp((s) => s.boardsNonce);

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [category, setCategory] = React.useState<string>("all");
  const [sort, setSort] = React.useState<Sort>("updated");

  const [createOpen, setCreateOpen] = React.useState(false);
  const [controlBoardId, setControlBoardId] = React.useState<string | null>(null);
  const [renameBoard, setRenameBoard] = React.useState<{ id: string; title: string } | null>(null);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const boardsQuery = useQuery({
    queryKey: ["boards", boardsNonce],
    queryFn: api.listBoards,
  });

  // Safety net: ensure demo boards exist for returning owners (idempotent)
  React.useEffect(() => {
    api
      .seedBoards()
      .then((r) => {
        if (r.seeded) qc.invalidateQueries({ queryKey: ["boards"] });
      })
      .catch(() => {});
  }, []);

  const boards = boardsQuery.data?.boards ?? [];

  const filtered = React.useMemo(() => {
    let list = [...boards];
    if (filter === "favorites") list = list.filter((b) => b.favorited);
    else if (filter === "archived") list = list.filter((b) => b.archived);
    else if (filter === "public") list = list.filter((b) => b.visibility === "PUBLIC");
    else if (filter === "private") list = list.filter((b) => b.visibility === "PRIVATE");
    else list = list.filter((b) => !b.archived);

    if (category !== "all") list = list.filter((b) => b.category === category);

    const q = search.trim().toLowerCase();
    if (q)
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.description ?? "").toLowerCase().includes(q)
      );

    list.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "created")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return list;
  }, [boards, filter, category, search, sort]);

  const stats = React.useMemo(() => {
    const active = boards.filter((b) => !b.archived);
    return {
      total: active.length,
      public: active.filter((b) => b.visibility === "PUBLIC").length,
      private: active.filter((b) => b.visibility === "PRIVATE").length,
      favorites: active.filter((b) => b.favorited).length,
      collaborators: active.reduce((s, b) => s + b.collaboratorCount, 0),
    };
  }, [boards]);

  const patchMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.updateBoard(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => api.duplicateBoard(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Board duplicated", { description: data.board.title });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteBoard(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Board deleted");
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.updateBoard(id, { title }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boards"] });
      setRenameBoard(null);
      toast.success("Board renamed");
    },
  });

  const activeCategories = Array.from(
    new Set(boards.filter((b) => !b.archived && b.category).map((b) => b.category!))
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <LogoWordmark />
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            <Button variant="ghost" size="sm" className="font-medium text-foreground">
              <LayoutGrid className="size-4" /> Boards
            </Button>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="size-4" /> New board
            </Button>
            <ThemeToggle />
            <ProfileMenu
              open={profileOpen}
              onOpenChange={setProfileOpen}
              user={user}
              onSignOut={async () => {
                await fetch("/api/auth/signout", { method: "POST" });
                setUser(null);
                qc.clear();
                window.location.reload();
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-8 sm:px-6">
        {/* Hero */}
        <div className="mb-8 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, {user?.name?.split(" ")[0] || "there"}
            </h1>
            <span className="hidden text-2xl sm:inline">✦</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your collaborative whiteboards. Every board is an independent, secure workspace you own.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <StatCard icon={<LayoutGrid className="size-4" />} label="Total boards" value={stats.total} tone="primary" />
          <StatCard icon={<Globe className="size-4" />} label="Public" value={stats.public} tone="emerald" />
          <StatCard icon={<EyeOff className="size-4" />} label="Private" value={stats.private} tone="zinc" />
          <StatCard icon={<Star className="size-4" />} label="Favorites" value={stats.favorites} tone="amber" />
          <StatCard icon={<Users className="size-4" />} label="Collaborators" value={stats.collaborators} tone="violet" />
        </div>

        {/* Toolbar */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search boards…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
              <SelectTrigger className="w-[140px]">
                <SlidersHorizontal className="size-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All boards</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {activeCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Recently updated</SelectItem>
                <SelectItem value="created">Recently created</SelectItem>
                <SelectItem value="title">Title (A–Z)</SelectItem>
              </SelectContent>
            </Select>

            <Button className="sm:hidden" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New
            </Button>
          </div>
        </div>

        {/* Board grid */}
        {boardsQuery.isLoading ? (
          <BoardGridSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            hasBoards={boards.length > 0}
            filter={filter}
            onCreate={() => setCreateOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((b, i) => (
              <BoardCard
                key={b.id}
                board={b}
                index={i}
                onOpen={() => onOpenBoard(b.id)}
                onControlCenter={() => setControlBoardId(b.id)}
                onToggleFavorite={() =>
                  patchMutation.mutate({ id: b.id, body: { favorited: !b.favorited } })
                }
                onRename={() => setRenameBoard({ id: b.id, title: b.title })}
                onDuplicate={() => duplicateMutation.mutate(b.id)}
                onArchive={() =>
                  patchMutation.mutate({ id: b.id, body: { archived: !b.archived } })
                }
                onDelete={() => deleteMutation.mutate(b.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/80 bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <PenTool className="size-3.5" />
            <span>Boardly — collaborative whiteboards, perfectly controlled.</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Permission-first · Real-time · Secure</span>
          </div>
        </div>
      </footer>

      {/* Dialogs */}
      <CreateBoardDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          setCreateOpen(false);
          onOpenBoard(id);
        }}
      />

      <ControlCenter
        boardId={controlBoardId}
        open={!!controlBoardId}
        onOpenChange={(v) => !v && setControlBoardId(null)}
      />

      <RenameDialog
        board={renameBoard}
        onClose={() => setRenameBoard(null)}
        onConfirm={(title) =>
          renameBoard && renameMutation.mutate({ id: renameBoard.id, title })
        }
        pending={renameMutation.isPending}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "primary" | "emerald" | "zinc" | "amber" | "violet";
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    zinc: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    violet: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-premium">
      <div className={cn("flex size-9 items-center justify-center rounded-lg", tones[tone])}>
        {icon}
      </div>
      <div>
        <p className="text-xl font-semibold leading-none">{value}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function BoardGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="aspect-[16/10] w-full animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasBoards,
  filter,
  onCreate,
}: {
  hasBoards: boolean;
  filter: Filter;
  onCreate: () => void;
}) {
  if (!hasBoards) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-7" />
        </div>
        <h3 className="text-lg font-semibold">Create your first board</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Spin up a collaborative Excalidraw canvas. Choose private or public, then
          configure permissions exactly how you want.
        </p>
        <Button className="mt-5" onClick={onCreate}>
          <Plus className="size-4" /> New board
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Search className="size-6" />
      </div>
      <h3 className="text-base font-semibold">No boards match your filters</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {filter === "archived"
          ? "Archived boards will appear here."
          : "Try a different search or filter."}
      </p>
    </div>
  );
}

function RenameDialog({
  board,
  onClose,
  onConfirm,
  pending,
}: {
  board: { id: string; title: string } | null;
  onClose: () => void;
  onConfirm: (title: string) => void;
  pending: boolean;
}) {
  const [title, setTitle] = React.useState("");
  React.useEffect(() => {
    if (board) setTitle(board.title);
  }, [board]);
  return (
    <Dialog open={!!board} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Rename board</DialogTitle>
          <DialogDescription>Give this board a clearer name.</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) onConfirm(title.trim());
          }}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!title.trim() || pending} onClick={() => onConfirm(title.trim())}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProfileMenu({
  open,
  onOpenChange,
  user,
  onSignOut,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: { name: string; email: string; avatarColor: string } | null;
  onSignOut: () => void;
}) {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = React.useState(false);
  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [color, setColor] = React.useState(user?.avatarColor ?? AVATAR_COLORS[0]);

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setColor(user.avatarColor);
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: () => api.updateProfile({ name, email, avatarColor: color }),
    onSuccess: (data) => {
      useApp.getState().setUser(data.user);
      qc.invalidateQueries({ queryKey: ["session"] });
      toast.success("Profile updated");
      setEditOpen(false);
    },
    onError: (e: Error) => toast.error("Could not update profile", { description: e.message }),
  });

  return (
    <>
      <DropdownMenu open={open} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full border border-border bg-card p-1 pr-2.5 transition-colors hover:bg-accent">
            {user && <Avatar name={user.name} color={user.avatarColor} size={28} />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
            {user && <Avatar name={user.name} color={user.avatarColor} size={36} />}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <UserCog className="size-4" /> Edit profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onSignOut}>
            <LogOut className="size-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update how you appear on boards.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Avatar color</Label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "size-7 rounded-full transition-transform",
                      color === c ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  >
                    {color === c && <Check className="mx-auto size-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!name.trim() || !email.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
