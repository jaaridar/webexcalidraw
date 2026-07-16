"use client";

// Boardly — BoardSwitcherBar: Obsidian-style tab bar above the canvas.
// Shows recently opened boards as closeable tabs + a dropdown for all boards in workspace.
import * as React from "react";
import { useRouter } from "next/navigation";
import { X, FolderOpen, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Thumb } from "@/components/common";
import { useBoards } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { BoardSummary } from "@/lib/types";

const RECENT_LIMIT = 12;

export function BoardSwitcherBar({ currentBoardId }: {
  currentBoardId: string;
}) {
  const router = useRouter();
  const { data } = useBoards();
  const allBoards = (data?.boards ?? []).filter((b) => !b.archived);
  const selectedWorkspace = useApp((s) => s.selectedWorkspace);
  const [recentIds, setRecentIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (currentBoardId && !recentIds.includes(currentBoardId)) {
      setRecentIds((prev) => [currentBoardId, ...prev]);
    }
  }, [currentBoardId]); // eslint-disable-line react-hooks/exhaustive-deps

  const workspaceBoards = React.useMemo(() => {
    if (!selectedWorkspace) return allBoards;
    return allBoards.filter((b) => b.workspace === selectedWorkspace);
  }, [allBoards, selectedWorkspace]);

  const recentBoards = React.useMemo(() => {
    const map = new Map(allBoards.map((b) => [b.id, b]));
    return recentIds
      .map((id) => map.get(id))
      .filter((b): b is BoardSummary => !!b)
      .slice(0, RECENT_LIMIT);
  }, [recentIds, allBoards]);

  const categories = React.useMemo(() => {
    const map = new Map<string, BoardSummary[]>();
    for (const b of workspaceBoards) {
      const key = b.category || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [workspaceBoards]);

  const switchBoard = (id: string) => {
    setRecentIds((prev) => {
      const next = [id, ...prev.filter((x) => x !== id)];
      return next.slice(0, RECENT_LIMIT);
    });
    router.push(`/?b=${id}`);
  };

  const closeBoard = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRecentIds((prev) => prev.filter((x) => x !== id));
    if (currentBoardId === id) {
      const remaining = recentIds.filter((x) => x !== id);
      if (remaining.length > 0) {
        router.push(`/?b=${remaining[0]}`);
      } else {
        router.push("/");
      }
    }
  };

  return (
    <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border/40 bg-background/80 px-2 backdrop-blur-sm">
      {/* Recent boards as closeable tabs */}
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin">
        {recentBoards.map((b) => (
          <button
            key={b.id}
            onClick={() => switchBoard(b.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              b.id === currentBoardId
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
            title={b.title}
          >
            <Thumb board={b} active={b.id === currentBoardId} size={16} />
            <span className="max-w-[120px] truncate">{b.title}</span>
            {b.id === currentBoardId && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
            <span
              role="button"
              onClick={(e) => closeBoard(e, b.id)}
              className="ml-0.5 flex size-3.5 items-center justify-center rounded-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Close ${b.title}`}
            >
              <X className="size-2.5" />
            </span>
          </button>
        ))}
      </div>

      {/* All boards dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-auto size-7 shrink-0 text-muted-foreground" aria-label="All boards">
            <LayoutGrid className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="max-h-[70vh] w-64 overflow-y-auto">
          <DropdownMenuLabel className="flex items-center gap-2">
            <FolderOpen className="size-3.5" /> {selectedWorkspace ? selectedWorkspace : "All boards"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {categories.map(([cat, items]) => (
            <div key={cat}>
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {cat}
              </DropdownMenuLabel>
              {items.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  onClick={() => switchBoard(b.id)}
                  className={cn("flex items-center gap-2", b.id === currentBoardId && "bg-accent")}
                >
                  <Thumb board={b} active={b.id === currentBoardId} size={20} />
                  <span className="truncate text-xs">{b.title}</span>
                  {b.id === currentBoardId && <span className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" />}
                </DropdownMenuItem>
              ))}
            </div>
          ))}
          {workspaceBoards.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">
              {selectedWorkspace ? `No boards in this workspace` : "No boards yet"}
            </p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
