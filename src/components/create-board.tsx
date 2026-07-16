"use client";

// Boardly — Create board dialog (title + visibility + workspace)
import * as React from "react";
import { Globe, Lock, Sparkles, FolderOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateBoard } from "@/hooks/use-data";
import { useBoards } from "@/hooks/use-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { BoardSummary } from "@/lib/types";

export function CreateBoardDialog({ open, onOpenChange, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; onCreated: (id: string) => void;
}) {
  const create = useCreateBoard();
  const { data } = useBoards();
  const allBoards = (data?.boards ?? []).filter((b) => !b.archived);
  const [title, setTitle] = React.useState("");
  const [visibility, setVisibility] = React.useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [workspace, setWorkspace] = React.useState<string>("");

  const workspaces = React.useMemo(() => {
    const ws = new Set<string>();
    for (const b of allBoards) {
      if (b.workspace) ws.add(b.workspace);
    }
    return Array.from(ws).sort((a, b) => a.localeCompare(b));
  }, [allBoards]);

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setVisibility("PRIVATE");
      setWorkspace("");
    }
  }, [open]);

  const submit = async () => {
    if (!title.trim()) return;
    try {
      const r = await create.mutateAsync({ title: title.trim(), visibility, workspace: workspace || null });
      toast.success("Board created");
      onCreated(r.board.id);
    } catch { toast.error("Could not create board"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-2.5 border-b border-border/60 px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Sparkles className="size-4" /></div>
          <div>
            <DialogTitle className="text-base">New board</DialogTitle>
            <DialogDescription className="text-xs">A fresh collaborative canvas.</DialogDescription>
          </div>
        </div>
        <div className="space-y-4 px-5 py-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Title</label>
            <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Q4 Roadmap"
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              {([["PRIVATE", Lock, "Private", "Only you"], ["PUBLIC", Globe, "Public", "Shareable"]] as const).map(([v, Icon, t, d]) => (
                <button key={v} type="button" onClick={() => setVisibility(v)}
                  className={cn("flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all",
                    visibility === v ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border bg-card hover:border-muted-foreground/40")}>
                  <div className="flex items-center gap-2 text-sm font-semibold"><Icon className={cn("size-4", visibility === v ? "text-primary" : "text-muted-foreground")} />{t}</div>
                  <p className="text-xs text-muted-foreground">{d}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Workspace</label>
            <select
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              className="h-8 w-full rounded-md border border-border bg-background px-2.5 text-xs"
            >
              <option value="">— No workspace —</option>
              {workspaces.map((ws) => (
                <option key={ws} value={ws}>{ws}</option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground">Boards are grouped by workspace in the sidebar.</p>
          </div>
        </div>
        <DialogFooter className="border-t border-border/60 bg-muted/30 px-5 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!title.trim() || create.isPending}>{create.isPending ? "Creating…" : "Create board"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
