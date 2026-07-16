"use client";

// Boardly — Sidebar: organized board switcher for unlimited boards.
// Sections: Favorites · Recent · by Category. Search + collapsible rail.
import * as React from "react";
import {
  FolderClosed, FolderOpen, PanelLeftClose, PanelLeftOpen, Plus, Search, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/common";
import { useBoards } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { BoardSummary } from "@/lib/types";

const RECENT_LIMIT = 5;

export function Sidebar({ onNewBoard, onOpenBoard }: {
  onNewBoard: () => void; onOpenBoard: (id: string) => void;
}) {
  const { data } = useBoards();
  const allBoards = (data?.boards ?? []).filter((b) => !b.archived);
  const currentBoardId = useApp((s) => s.currentBoardId);
  const collapsed = useApp((s) => s.sidebarCollapsed);
  const toggle = useApp((s) => s.toggleSidebar);
  const [q, setQ] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);

  const filtered = q.trim()
    ? allBoards.filter((b) => b.title.toLowerCase().includes(q.toLowerCase()))
    : allBoards;

  const favorites = filtered.filter((b) => b.favorited);
  const recent = q.trim() ? [] : filtered.slice(0, RECENT_LIMIT);
  const recentIds = new Set(recent.map((b) => b.id));
  const favoriteIds = new Set(favorites.map((b) => b.id));
  const rest = filtered.filter((b) => !recentIds.has(b.id) && !favoriteIds.has(b.id));

  // Group "rest" by category for organization
  const byCategory = rest.reduce<Record<string, BoardSummary[]>>((acc, b) => {
    const key = b.category || "Other";
    (acc[key] ??= []).push(b);
    return acc;
  }, {});

  return (
    <aside className={cn(
      "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
      collapsed ? "w-14" : "w-64"
    )}>
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-3">
        <Logo size={26} />
        {!collapsed && <span className="text-[15px] font-semibold tracking-tight">Boardly</span>}
        <Button variant="ghost" size="icon" className="ml-auto size-8 text-muted-foreground" onClick={toggle} aria-label="Toggle sidebar">
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {/* Search + New */}
      <div className="space-y-2 px-2.5 pb-2">
        {!collapsed && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search boards" className="h-8 pl-8 text-xs" />
          </div>
        )}
        <Button className={cn("h-8 w-full", collapsed && "px-0")} size="sm" onClick={onNewBoard}>
          <Plus className="size-4" />{!collapsed && "New board"}
        </Button>
      </div>

      {/* Board list */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
        {collapsed ? (
          // Collapsed: just thumbnails
          filtered.slice(0, 30).map((b) => (
            <BoardIcon key={b.id} board={b} active={b.id === currentBoardId} onClick={() => onOpenBoard(b.id)} />
          ))
        ) : (
          <>
            {favorites.length > 0 && <Label><Star className="size-3" /> Favorites</Label>}
            {favorites.map((b) => <BoardRow key={b.id} board={b} active={b.id === currentBoardId} onClick={() => onOpenBoard(b.id)} />)}

            {recent.length > 0 && <Label>Recent</Label>}
            {recent.map((b) => <BoardRow key={b.id} board={b} active={b.id === currentBoardId} onClick={() => onOpenBoard(b.id)} />)}

            {Object.keys(byCategory).length > 0 && !q.trim() && (
              <Label><FolderOpen className="size-3" /> All boards ({rest.length})</Label>
            )}
            {showAll || q.trim()
              ? Object.entries(byCategory).map(([cat, boards]) => (
                  <div key={cat} className="mb-1">
                    {!q.trim() && <SubLabel>{cat}</SubLabel>}
                    {boards.map((b) => <BoardRow key={b.id} board={b} active={b.id === currentBoardId} onClick={() => onOpenBoard(b.id)} />)}
                  </div>
                ))
              : Object.values(byCategory).flat().slice(0, RECENT_LIMIT).map((b) => (
                  <BoardRow key={b.id} board={b} active={b.id === currentBoardId} onClick={() => onOpenBoard(b.id)} />
                ))
            }
            {!q.trim() && rest.length > RECENT_LIMIT && (
              <button onClick={() => setShowAll((v) => !v)} className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-xs font-medium text-primary hover:bg-accent">
                {showAll ? "Show less" : `Show all ${rest.length} boards`}
              </button>
            )}

            {filtered.length === 0 && (
              <p className="px-2 py-8 text-center text-xs text-muted-foreground">No boards found</p>
            )}
          </>
        )}
      </nav>

      {/* Footer count */}
      {!collapsed && allBoards.length > 0 && (
        <div className="border-t border-sidebar-border px-3 py-2 text-[10px] text-muted-foreground">
          {allBoards.length} board{allBoards.length !== 1 ? "s" : ""}
        </div>
      )}
    </aside>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="flex items-center gap-1 px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}
function SubLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-2 pb-0.5 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{children}</p>;
}

function BoardRow({ board, active, onClick }: {
  board: BoardSummary; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} title={board.title}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
      )}>
      <Thumb board={board} active={active} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{board.title}</span>
      </span>
      {board.favorited && <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />}
      <span className={cn("size-1.5 shrink-0 rounded-full", board.visibility === "PUBLIC" ? "bg-emerald-500" : "bg-zinc-400")} title={board.visibility === "PUBLIC" ? "Public" : "Private"} />
    </button>
  );
}

function BoardIcon({ board, active, onClick }: {
  board: BoardSummary; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} title={board.title}
      className={cn("mx-auto mb-1 flex size-9 items-center justify-center rounded-lg border transition-colors",
        active ? "border-primary bg-sidebar-accent" : "border-transparent hover:bg-sidebar-accent/50")}>
      <Thumb board={board} active={active} size={28} />
    </button>
  );
}

function Thumb({ board, active, size = 24 }: { board: BoardSummary; active: boolean; size?: number }) {
  return (
    <span className={cn("relative shrink-0 overflow-hidden rounded-md border", active ? "border-primary/40" : "border-border")} style={{ width: size, height: size }}>
      {board.thumbnail ? (
        <img src={board.thumbnail} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-muted text-[9px] font-semibold text-muted-foreground">
          {board.title.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}
