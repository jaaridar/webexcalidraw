"use client";

// Boardly — Sidebar: workspace switcher.
// Shows workspaces + all boards when no workspace is selected.
import * as React from "react";
import {
  Eye, FolderOpen, Globe, Lock, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Search, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Logo, Thumb } from "@/components/common";
import { useBoards, useDeleteBoard } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BoardSummary } from "@/lib/types";

export function Sidebar({ onNewBoard, onOpenBoard }: {
  onNewBoard: () => void; onOpenBoard: (id: string) => void;
}) {
  const { data } = useBoards();
  const allBoards = (data?.boards ?? []).filter((b) => !b.archived);
  const currentBoardId = useApp((s) => s.currentBoardId);
  const collapsed = useApp((s) => s.sidebarCollapsed);
  const toggle = useApp((s) => s.toggleSidebar);
  const selectedWorkspace = useApp((s) => s.selectedWorkspace);
  const setSelectedWorkspace = useApp((s) => s.setSelectedWorkspace);
  const [q, setQ] = React.useState("");
  const [showNewWorkspace, setShowNewWorkspace] = React.useState(false);
  const [visibilityFilter, setVisibilityFilter] = React.useState<"all" | "public" | "private">("all");
  const [deleteBoardId, setDeleteBoardId] = React.useState<string | null>(null);
  const deleteBoard = useDeleteBoard();

  const workspaces = React.useMemo(() => {
    const ws = new Set<string>();
    for (const b of allBoards) {
      if (b.workspace && (visibilityFilter === "all" || (visibilityFilter === "public" ? b.visibility === "PUBLIC" : b.visibility === "PRIVATE"))) {
        ws.add(b.workspace);
      }
    }
    return Array.from(ws).sort((a, b) => a.localeCompare(b));
  }, [allBoards, visibilityFilter]);

  const workspaceBoards = React.useMemo(() => {
    if (!selectedWorkspace) return allBoards;
    return allBoards.filter((b) => b.workspace === selectedWorkspace);
  }, [allBoards, selectedWorkspace]);

  const filtered = React.useMemo(() => {
    let list = q.trim()
      ? workspaceBoards.filter((b) => b.title.toLowerCase().includes(q.toLowerCase()))
      : [...workspaceBoards];
    if (visibilityFilter !== "all") {
      list = list.filter((b) => visibilityFilter === "public" ? b.visibility === "PUBLIC" : b.visibility === "PRIVATE");
    }
    list.sort((a, b) => {
      const toTime = (d: Date | string) => (d instanceof Date ? d.getTime() : new Date(d).getTime());
      return toTime(b.updatedAt) - toTime(a.updatedAt);
    });
    return list;
  }, [workspaceBoards, q, visibilityFilter]);

  if (collapsed) {
    return (
      <aside className="flex h-full w-14 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200">
        <div className="flex h-14 items-center justify-center">
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={toggle} aria-label="Toggle sidebar">
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-2 scrollbar-thin">
          {workspaces.map((ws) => (
            <button key={ws} onClick={() => setSelectedWorkspace(ws)} title={ws}
              className={cn("mx-auto flex size-9 items-center justify-center rounded-lg border transition-colors",
                selectedWorkspace === ws ? "border-primary bg-sidebar-accent" : "border-transparent hover:bg-sidebar-accent/50")}>
              <span className="text-xs font-semibold text-muted-foreground">{ws.slice(0, 2).toUpperCase()}</span>
            </button>
          ))}
          <button onClick={onNewBoard} title="New board"
            className="mx-auto mt-1 flex size-9 items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary">
            <Plus className="size-4" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 px-3">
        <Logo size={26} />
        <span className="text-[15px] font-semibold tracking-tight">Boardly</span>
        <Button variant="ghost" size="icon" className="ml-auto size-8 text-muted-foreground" onClick={toggle} aria-label="Toggle sidebar">
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      {/* Search + New board */}
      <div className="space-y-1.5 px-2.5 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search boards…" className="h-8 pl-8 text-xs" />
        </div>
        <Button className="h-8 w-full" size="sm" onClick={onNewBoard}>
          <Plus className="size-4" /> New board
        </Button>
      </div>

      {/* Workspaces */}
      <div className="px-2.5 pb-2">
        <div className="flex items-center justify-between px-1.5 py-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Workspaces</span>
          <Button variant="ghost" size="icon" className="size-6 text-muted-foreground" onClick={() => setShowNewWorkspace(true)} aria-label="New workspace">
            <Plus className="size-3" />
          </Button>
        </div>
        <div className="space-y-0.5">
          <button onClick={() => setSelectedWorkspace(null)}
            className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
              !selectedWorkspace ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50")}>
            <FolderOpen className="size-3.5 shrink-0" />
            <span className="flex-1 truncate font-medium">All boards</span>
            <span className="text-[10px] text-muted-foreground">{allBoards.length}</span>
          </button>
          {workspaces.map((ws) => {
            const count = allBoards.filter((b) => b.workspace === ws).length;
            return (
              <div key={ws} className="flex items-center gap-0.5 group/ws">
                <button onClick={() => setSelectedWorkspace(ws)}
                  className={cn("flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                    selectedWorkspace === ws ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50")}>
                  <FolderOpen className="size-3.5 shrink-0" />
                  <span className="flex-1 truncate font-medium">{ws}</span>
                  <span className="text-[10px] text-muted-foreground">{count}</span>
                </button>
                <Button variant="ghost" size="icon" className="size-6 opacity-0 group-hover/ws:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); }} aria-label="Delete workspace">
                  <Trash2 className="size-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visibility filter */}
      <div className="flex items-center gap-1 px-2.5 pb-2">
        <button onClick={() => setVisibilityFilter("all")}
          className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
            visibilityFilter === "all" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground")}>
          All
        </button>
        <button onClick={() => setVisibilityFilter("public")}
          className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
            visibilityFilter === "public" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground")}>
          <Globe className="size-3" /> Public
        </button>
        <button onClick={() => setVisibilityFilter("private")}
          className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
            visibilityFilter === "private" ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground")}>
          <Lock className="size-3" /> Private
        </button>
      </div>

      {/* Board list for selected workspace */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
        {filtered.length === 0 && (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">
            {selectedWorkspace ? `No boards in "${selectedWorkspace}"` : "No boards found"}
          </p>
        )}
        {filtered.map((b) => (
          <div key={b.id} className="group relative flex items-center">
            <button onClick={() => onOpenBoard(b.id)} title={b.title}
              className={cn("flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors",
                b.id === currentBoardId ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50")}>
              <Thumb board={b} active={b.id === currentBoardId} size={24} />
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-[13px] font-medium", b.id === currentBoardId ? "text-sidebar-accent-foreground" : "text-sidebar-foreground")}>{b.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {b.visibility === "PUBLIC" ? <><Globe className="size-2.5 inline mr-0.5" /> Public</> : <><Lock className="size-2.5 inline mr-0.5" /> Private</>}
                  {" · "}
                  {b.accessMode === "EDIT" ? <><Pencil className="size-2.5 inline mr-0.5" /> Edit</> : <><Eye className="size-2.5 inline mr-0.5" /> View</>}
                </p>
              </div>
            </button>
            <Button variant="ghost" size="icon" className="size-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); setDeleteBoardId(b.id); }} aria-label="Delete board">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {allBoards.length > 0 && (
        <div className="border-t border-sidebar-border px-3 py-1.5 text-[10px] text-muted-foreground">
          {allBoards.length} board{allBoards.length !== 1 ? "s" : ""}
          {selectedWorkspace && ` · ${filtered.length} in workspace`}
        </div>
      )}

      {/* New workspace dialog */}
      <Dialog open={showNewWorkspace} onOpenChange={setShowNewWorkspace}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New workspace</DialogTitle>
            <DialogDescription>Create a workspace to organize your boards.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Workspace name</label>
              <Input id="ws-name" placeholder="e.g. Design, Engineering…" className="h-8 text-xs" autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowNewWorkspace(false)}>Cancel</Button>
            <Button onClick={async () => {
              const input = document.getElementById("ws-name") as HTMLInputElement | null;
              const name = input?.value?.trim();
              if (!name) { toast.error("Workspace name is required"); return; }
              try {
                await api.createWorkspace(name);
                toast.success(`Workspace "${name}" created`);
                setShowNewWorkspace(false);
              } catch { toast.error("Could not create workspace"); }
            }}>Create workspace</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete board confirmation dialog */}
      <Dialog open={!!deleteBoardId} onOpenChange={(open) => !open && setDeleteBoardId(null)}>
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete board</DialogTitle>
            <DialogDescription>This action cannot be undone. Are you sure you want to delete this board?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteBoardId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={async () => {
              if (!deleteBoardId) return;
              try {
                await deleteBoard.mutateAsync(deleteBoardId);
                toast.success("Board deleted");
              } catch { toast.error("Could not delete board"); }
              setDeleteBoardId(null);
            }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
