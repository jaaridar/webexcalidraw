"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MoreHorizontal,
  Star,
  Settings2,
  Copy,
  Archive,
  Trash2,
  Pencil,
  ExternalLink,
  FolderOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VisibilityBadge, SecurityBadges } from "@/components/boardly/badges";
import { cn } from "@/lib/utils";
import type { BoardCard as BoardCardType } from "@/lib/api";

function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d2 = Math.floor(h / 24);
  if (d2 < 30) return `${d2}d ago`;
  return new Date(d).toLocaleDateString();
}

export function BoardCard({
  board,
  onOpen,
  onControlCenter,
  onToggleFavorite,
  onRename,
  onDuplicate,
  onArchive,
  onDelete,
  index = 0,
}: {
  board: BoardCardType;
  onOpen: () => void;
  onControlCenter: () => void;
  onToggleFavorite: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  index?: number;
}) {
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
        className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-premium transition-all hover:-translate-y-1 hover:shadow-premium-lg"
      >
        {/* Thumbnail */}
        <div
          role="button"
          tabIndex={0}
          onClick={onOpen}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen();
            }
          }}
          className="relative block aspect-[16/10] w-full cursor-pointer overflow-hidden border-b border-border bg-muted/40"
          aria-label={`Open ${board.title}`}
        >
          {board.thumbnail ? (
            <img
              src={board.thumbnail}
              alt={board.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-grid">
              <FolderOpen className="size-8 text-muted-foreground/40" />
            </div>
          )}

          {/* top overlay badges */}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
            <VisibilityBadge visibility={board.visibility} />
            {board.archived && (
              <Badge variant="secondary" className="text-[11px]">Archived</Badge>
            )}
          </div>

          {/* favorite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={cn(
              "absolute right-2.5 top-2.5 inline-flex size-7 items-center justify-center rounded-full backdrop-blur transition-all",
              board.favorited
                ? "bg-amber-400/90 text-white"
                : "bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-black/50"
            )}
            aria-label={board.favorited ? "Unfavorite" : "Favorite"}
          >
            <Star className={cn("size-3.5", board.favorited && "fill-current")} />
          </button>

          {/* hover quick-open */}
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/45 via-black/0 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg">
              <ExternalLink className="size-3.5" /> Open board
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <button
              onClick={onOpen}
              className="min-w-0 flex-1 text-left"
            >
              <h3 className="truncate text-[15px] font-semibold text-foreground">
                {board.title}
              </h3>
              {board.description ? (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {board.description}
                </p>
              ) : null}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 -mt-1 -mr-1 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Board actions"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onOpen}>
                  <ExternalLink className="size-4" /> Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onControlCenter}>
                  <Settings2 className="size-4" /> Control center
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onRename}>
                  <Pencil className="size-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDuplicate}>
                  <Copy className="size-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="size-4" />
                  {board.archived ? "Unarchive" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <SecurityBadges
            passwordEnabled={board.passwordEnabled}
            accessMode={board.accessMode}
            shareMode={board.shareMode}
            collaboratorCount={board.collaboratorCount}
          />

          <div className="mt-auto flex items-center justify-between pt-1">
            {board.category ? (
              <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                {board.category}
              </Badge>
            ) : (
              <span />
            )}
            <span className="text-[11px] text-muted-foreground">
              {timeAgo(board.updatedAt)}
            </span>
          </div>
        </div>
      </motion.div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this board?</AlertDialogTitle>
            <AlertDialogDescription>
              “{board.title}” and all of its content will be permanently removed.
              Collaborators will lose access immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => onDelete()}
            >
              Delete board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
