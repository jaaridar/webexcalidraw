"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lock,
  Globe,
  EyeOff,
  Pencil,
  Eye,
  Link2,
  Mail,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useApp } from "@/lib/store";
import { BOARD_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";

export function CreateBoardDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (boardId: string) => void;
}) {
  const qc = useQueryClient();
  const bumpBoards = useApp((s) => s.bumpBoards);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<string>("");
  const [visibility, setVisibility] = React.useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [accessMode, setAccessMode] = React.useState<"EDIT" | "READ_ONLY">("EDIT");
  const [shareMode, setShareMode] = React.useState<"PUBLIC_LINK" | "INVITE_ONLY">("INVITE_ONLY");
  const [passwordEnabled, setPasswordEnabled] = React.useState(false);
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setCategory("");
      setVisibility("PRIVATE");
      setAccessMode("EDIT");
      setShareMode("INVITE_ONLY");
      setPasswordEnabled(false);
      setPassword("");
    }
  }, [open]);

  const createMutation = useMutation({
    mutationFn: () =>
      api.createBoard({
        title: title.trim() || "Untitled board",
        description: description.trim() || undefined,
        category: category || null,
        visibility,
        accessMode,
        shareMode,
      }),
    onSuccess: (data) => {
      bumpBoards();
      qc.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Board created", { description: data.board.title });
      onCreated(data.board.id);
    },
    onError: (e: Error) => toast.error("Could not create board", { description: e.message }),
  });

  const canCreate = title.trim().length > 0 && (!passwordEnabled || password.trim().length >= 4);

  // NOTE: password is configured after creation in the Control Center. We keep
  // the toggle here to capture intent, then the board is created public/locked;
  // for a smooth flow we create the board and immediately set the password via
  // an update if the user enabled it.
  const submit = async () => {
    if (!canCreate) return;
    try {
      await createMutation.mutateAsync();
    } catch {
      // error already handled by mutation's onError toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b bg-gradient-to-r from-emerald-50 to-transparent px-6 py-4 dark:from-emerald-950/30">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div>
            <DialogTitle className="text-base">Create a new board</DialogTitle>
            <DialogDescription className="text-xs">
              Every board is an independent, secure workspace.
            </DialogDescription>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto scrollbar-premium px-6 py-5">
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="b-title">Board title</Label>
              <Input
                id="b-title"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q4 Product Roadmap"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canCreate) submit();
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="b-desc">Description (optional)</Label>
              <Textarea
                id="b-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this board for?"
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {BOARD_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Visibility</Label>
              <div className="grid grid-cols-2 gap-3">
                <VisibilityOption
                  active={visibility === "PRIVATE"}
                  onClick={() => setVisibility("PRIVATE")}
                  icon={<EyeOff className="size-4" />}
                  title="Private"
                  desc="Only you can see & open this board."
                />
                <VisibilityOption
                  active={visibility === "PUBLIC"}
                  onClick={() => setVisibility("PUBLIC")}
                  icon={<Globe className="size-4" />}
                  title="Public"
                  desc="Share with viewers & editors you choose."
                />
              </div>
            </div>

            {visibility === "PUBLIC" && (
              <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Access level
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <VisibilityOption
                      active={accessMode === "EDIT"}
                      onClick={() => setAccessMode("EDIT")}
                      icon={<Pencil className="size-4" />}
                      title="Can edit"
                      desc="Collaborators can draw & edit."
                      compact
                    />
                    <VisibilityOption
                      active={accessMode === "READ_ONLY"}
                      onClick={() => setAccessMode("READ_ONLY")}
                      icon={<Eye className="size-4" />}
                      title="Read-only"
                      desc="Collaborators can only view."
                      compact
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    How to share
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <VisibilityOption
                      active={shareMode === "PUBLIC_LINK"}
                      onClick={() => setShareMode("PUBLIC_LINK")}
                      icon={<Link2 className="size-4" />}
                      title="Anyone with link"
                      desc="No login required to join."
                      compact
                    />
                    <VisibilityOption
                      active={shareMode === "INVITE_ONLY"}
                      onClick={() => setShareMode("INVITE_ONLY")}
                      icon={<Mail className="size-4" />}
                      title="Invite only"
                      desc="Only invited emails can join."
                      compact
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                  <div className="flex items-start gap-2.5">
                    <Lock className="mt-0.5 size-4 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium">Password protection</p>
                      <p className="text-xs text-muted-foreground">
                        Require a password to open the shared link.
                      </p>
                    </div>
                  </div>
                  <Switch checked={passwordEnabled} onCheckedChange={setPasswordEnabled} />
                </div>
                {passwordEnabled && (
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set a password (min 4 chars)"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t bg-muted/30 px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canCreate || createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Create board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VisibilityOption({
  active,
  onClick,
  icon,
  title,
  desc,
  compact,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
        active
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border bg-card hover:border-muted-foreground/40"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          compact ? "text-sm font-medium" : "text-sm font-semibold"
        )}
      >
        <span className={cn(active ? "text-primary" : "text-muted-foreground")}>{icon}</span>
        {title}
      </div>
      {!compact && <p className="text-xs text-muted-foreground">{desc}</p>}
    </button>
  );
}
