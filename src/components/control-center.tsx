"use client";

// Boardly — Control Center: simplified permissions panel.
// Private/Public + Edit/Read-only. Collaborators listed by name.
// Changes broadcast instantly to everyone on the board.
import * as React from "react";
import {
  Check, Copy, Eye, Globe, KeyRound, Link2, Lock, Mail, MoreVertical, Pencil,
  Save, Shield, Trash2, Unlock, UserPlus, Users,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/common";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useBoard, useInviteCollaborator, useRemoveCollaborator, useUpdateBoard, useUpdateCollaborator,
} from "@/hooks/use-data";
import { ROLE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ControlCenter({ boardId, open, onOpenChange }: {
  boardId: string | null; open: boolean; onOpenChange: (v: boolean) => void;
}) {
  const { data } = useBoard(boardId);
  const board = data?.board;
  const update = useUpdateBoard(boardId ?? "");
  const invite = useInviteCollaborator(boardId ?? "");
  const updateCollab = useUpdateCollaborator(boardId ?? "");
  const removeCollab = useRemoveCollaborator(boardId ?? "");

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState(ROLE.VIEWER);
  const [newPw, setNewPw] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (board) { setTitle(board.title); setDescription(board.description ?? ""); }
  }, [board?.id]);

  if (!board) return null;

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?b=${board.id}` : "";
  const copy = async () => {
    if (!shareUrl) return;
    try { await navigator.clipboard.writeText(shareUrl); setCopied(true); toast.success("Link copied"); setTimeout(() => setCopied(false), 1800); }
    catch { toast.error("Could not copy"); }
  };

  // Apply a change AND broadcast it instantly to everyone on the board
  const apply = (body: Record<string, unknown>, msg: string) => {
    update.mutate(body);
    toast.success(msg);
    // Broadcast access/visibility changes for instant collaborator sync
    if ("accessMode" in body || "visibility" in body) {
      (window as any).__boardlyBroadcastAccess?.(
        body.accessMode ?? board.accessMode,
        body.visibility ?? board.visibility
      );
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Shield className="size-4" /></div>
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-base">Control Center</SheetTitle>
            <p className="text-xs text-muted-foreground">Access & collaborators</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Board details */}
          <Section icon={<Pencil className="size-4" />} title="Board details">
            <Field label="Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="Description"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></Field>
            <Button size="sm" className="w-fit" disabled={update.isPending}
              onClick={() => apply({ title: title.trim() || "Untitled", description }, "Details saved")}>
              <Save className="size-3.5" /> Save
            </Button>
          </Section>

          {/* Visibility — simplified: Private or Public */}
          <Section icon={<Globe className="size-4" />} title="Visibility">
            <div className="grid grid-cols-2 gap-2">
              <Choice active={board.visibility === "PRIVATE"} onClick={() => apply({ visibility: "PRIVATE" }, "Set to private")}
                icon={<Lock className="size-4" />} title="Private" desc="Only you & collaborators" />
              <Choice active={board.visibility === "PUBLIC"} onClick={() => apply({ visibility: "PUBLIC" }, "Set to public")}
                icon={<Globe className="size-4" />} title="Public" desc="Anyone with the link" />
            </div>
          </Section>

          {/* Access level — Edit / Read-only (broadcasts instantly) */}
          <Section icon={<Pencil className="size-4" />} title="Access level" hint="Changes apply instantly to everyone">
            <div className="grid grid-cols-2 gap-2">
              <Choice active={board.accessMode === "EDIT"} onClick={() => apply({ accessMode: "EDIT" }, "Set to editable — collaborators can edit now")}
                icon={<Pencil className="size-4" />} title="Can edit" desc="Collaborators can draw" />
              <Choice active={board.accessMode === "READ_ONLY"} onClick={() => apply({ accessMode: "READ_ONLY" }, "Set to read-only — collaborators can only view now")}
                icon={<Eye className="size-4" />} title="Read-only" desc="Collaborators view only" />
            </div>
          </Section>

          {/* Share link (only for public boards) */}
          {board.visibility === "PUBLIC" && (
            <Section icon={<Link2 className="size-4" />} title="Share link">
              <div className="flex items-center gap-2">
                <Input readOnly value={shareUrl} className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={copy} aria-label="Copy link">
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can {board.accessMode === "EDIT" ? "edit" : "view"} this board.
                {board.passwordEnabled && " A password is required."}
              </p>
            </Section>
          )}

          {/* Password protection */}
          <Section icon={<KeyRound className="size-4" />} title="Password protection">
            <Toggle
              checked={board.passwordEnabled}
              onChange={(v) => apply({ passwordEnabled: v }, v ? "Password enabled" : "Password disabled")}
              icon={board.passwordEnabled ? <Lock className="size-4 text-amber-600" /> : <Unlock className="size-4 text-muted-foreground" />}
              title={board.passwordEnabled ? "Protected" : "Not protected"} desc="Require a password to open the link"
            />
            {board.passwordEnabled && (
              <div className="flex items-center gap-2">
                <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password" />
                <Button size="sm" variant="outline" disabled={!newPw || update.isPending}
                  onClick={() => { apply({ password: newPw }, "Password updated"); setNewPw(""); }}>Update</Button>
              </div>
            )}
          </Section>

          {/* Collaborators — shows names + roles */}
          <Section icon={<Users className="size-4" />} title={`Collaborators (${board.collaborators.length})`}>
            {board.owner && (
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-2.5">
                <Avatar name={board.owner.name} color={board.owner.avatarColor} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{board.owner.name} <span className="text-muted-foreground">(you)</span></p>
                  <p className="truncate text-xs text-muted-foreground">{board.owner.email}</p>
                </div>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/15">Owner</Badge>
              </div>
            )}
            {board.collaborators.length === 0 && !board.owner ? null : board.collaborators.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                No collaborators yet. Invite someone below.
              </p>
            ) : (
              board.collaborators.map((c) => (
                <CollabRow key={c.userId} c={c}
                  onRole={(r) => { updateCollab.mutate({ userId: c.userId, role: r }); toast.success("Role updated"); }}
                  onRemove={() => { removeCollab.mutate(c.userId); toast.success("Access revoked"); }}
                  pending={updateCollab.isPending || removeCollab.isPending} />
              ))
            )}
            <div className="rounded-lg border border-dashed border-border p-2.5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Invite by email</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com"
                  onKeyDown={(e) => { if (e.key === "Enter" && email.trim()) { invite.mutate({ email: email.trim(), role: inviteRole }); setEmail(""); } }} />
                <RoleSelect value={inviteRole} onChange={setInviteRole} />
                <Button className="shrink-0" disabled={!email.trim() || invite.isPending}
                  onClick={() => { invite.mutate({ email: email.trim(), role: inviteRole }); setEmail(""); }}>
                  <UserPlus className="size-4" /> Invite
                </Button>
              </div>
            </div>
          </Section>
          <div className="h-6" />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// --- building blocks ---
function Section({ icon, title, hint, children }: {
  icon: React.ReactNode; title: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border/60 px-5 py-4">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <span className="ml-auto text-[10px] font-medium text-emerald-600 dark:text-emerald-400">⚡ {hint}</span>}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
function Choice({ active, onClick, icon, title, desc }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={cn("flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-all",
        active ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border bg-card hover:border-muted-foreground/40")}>
      <div className="flex items-center gap-2 text-sm font-semibold"><span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>{title}</div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}
function Toggle({ checked, onChange, icon, title, desc }: {
  checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode; title: string; desc: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-2.5">
      <div className="flex items-start gap-2.5">
        {icon}
        <div><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
function RoleSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs">
      <option value={ROLE.VIEWER}>Viewer</option>
      <option value={ROLE.EDITOR}>Editor</option>
    </select>
  );
}
function CollabRow({ c, onRole, onRemove, pending }: {
  c: { userId: string; role: string; user: { name: string; email: string; avatarColor: string } };
  onRole: (r: string) => void; onRemove: () => void; pending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-2.5">
      <Avatar name={c.user.name} color={c.user.avatarColor} size={32} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{c.user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{c.user.email}</p>
      </div>
      <Badge variant="outline" className={cn(c.role === ROLE.EDITOR
        ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
        : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300")}>
        {c.role === ROLE.EDITOR ? "Editor" : "Viewer"}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" disabled={pending} aria-label="Actions"><MoreVertical className="size-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => onRole(ROLE.VIEWER)}><Eye className="size-4" /> Make viewer</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRole(ROLE.EDITOR)}><Pencil className="size-4" /> Make editor</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onRemove}><Trash2 className="size-4" /> Revoke access</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
