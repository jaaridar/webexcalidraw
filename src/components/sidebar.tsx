"use client";

// Boardly — Sidebar: minimal board switcher (thumbnail + title only).
// All board metadata lives in the TopBar + Control Center, not here.
import * as React from "react";
import {
  PanelLeftClose, PanelLeftOpen, Plus, Search, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, Logo } from "@/components/common";
import { useBoards } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { BoardSummary } from "@/lib/types";

export function Sidebar({ onNewBoard, onOpenBoard }: {
  onNewBoard: () => void; onOpenBoard: (id: string) => void;
}) {
  const { data } = useBoards();
  const boards = (data?.boards ?? []).filter((b) => !b.archived);
  const currentBoardId = useApp((s) => s.currentBoardId);
  const collapsed = useApp((s) => s.sidebarCollapsed);
  const toggle = useApp((s) => s.toggleSidebar);
  const [q, setQ] = React.useState("");

  const filtered = q.trim()
    ? boards.filter((b) => b.title.toLowerCase().includes(q.toLowerCase()))
    : boards;

  const favorites = filtered.filter((b) => b.favorited);
  const rest = filtered.filter((b) => !b.favorited);

  return (
    <aside className={cn(
      "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200",
      collapsed ? "w-14" : "w-60"
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
        {!collapsed && favorites.length > 0 && (
          <ListLabel><Star className="size-3" /> Favorites</ListLabel>
        )}
        {favorites.map((b) => (
          <BoardItem key={b.id} board={b} collapsed={collapsed} active={b.id === currentBoardId} onClick={() => onOpenBoard(b.id)} />
        ))}
        {!collapsed && rest.length > 0 && favorites.length > 0 && <ListLabel>All boards</ListLabel>}
        {rest.map((b) => (
          <BoardItem key={b.id} board={b} collapsed={collapsed} active={b.id === currentBoardId} onClick={() => onOpenBoard(b.id)} />
        ))}
        {filtered.length === 0 && !collapsed && (
          <p className="px-2 py-8 text-center text-xs text-muted-foreground">No boards found</p>
        )}
      </nav>
    </aside>
  );
}

function ListLabel({ children }: { children: React.ReactNode }) {
  return <p className="flex items-center gap-1 px-2 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

function BoardItem({ board, collapsed, active, onClick }: {
  board: BoardSummary; collapsed: boolean; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick} title={board.title}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50",
        collapsed && "justify-center px-0"
      )}>
      <span className={cn("relative size-7 shrink-0 overflow-hidden rounded-md border", active ? "border-primary/40" : "border-border")}>
        {board.thumbnail ? (
          <img src={board.thumbnail} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-muted text-[9px] font-semibold text-muted-foreground">
            {board.title.slice(0, 1).toUpperCase()}
          </span>
        )}
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{board.title}</span>
        </span>
      )}
      {!collapsed && board.favorited && <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />}
    </button>
  );
}
