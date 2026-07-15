"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Check,
  Link2,
  Mail,
  Lock,
  Unlock,
  Users,
  Shield,
  Trash2,
  UserPlus,
  Loader2,
  Globe,
  EyeOff,
  Pencil,
  Eye,
  Share2,
  Save,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/boardly/avatar";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { api, type BoardDetail, type Collaborator } from "@/lib/api";
import { useApp } from "@/lib/store";
import { ROLE } from "@/lib/constants";
import { toast } from "sonner";
import { MoreVertical } from "lucide-react";

export function ControlCenter({
  boardId,
  open,
  onOpenChange,
}: {
  boardId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const bumpBoards = useApp((s) => s.bumpBoards);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<string>(ROLE.VIEWER);
  const [newPassword, setNewPassword] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const boardQuery = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => api.getBoard(boardId!),
    enabled: !!boardId && open,
  });

  const board = boardQuery.data?.board;

  React.useEffect(() => {
    if (board) {
      setTitle(board.title);
      setDescription(board.description ?? "");
    }
  }, [board?.id]);

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.updateBoard(boardId!, body),
    onSuccess: (data) => {
      qc.setQueryData(["board", boardId], { board: data.board });
      bumpBoards();
      qc.invalidateQueries({ queryKey: ["boards"] });
    },
    onError: (e: Error) => toast.error("Update failed", { description: e.message }),
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      api.inviteCollaborator(boardId!, { email: inviteEmail.trim(), role: inviteRole }),
    onSuccess: () => {
      toast.success("Collaborator added", { description: inviteEmail.trim() });
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["board", boardId] });
      bumpBoards();
    },
    onError: (e: Error) => toast.error("Could not invite", { description: e.message }),
  });

  const updateCollabMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.updateCollaborator(boardId!, userId, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success("Role updated");
    },
  });

  const removeCollabMutation = useMutation({
    mutationFn: (userId: string) => api.removeCollaborator(boardId!, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", boardId] });
      bumpBoards();
      toast.success("Access revoked");
    },
  });

  const saveDetails = () => {
    updateMutation.mutate({ title: title.trim() || "Untitled board", description });
    toast.success("Board details saved");
  };

  const shareUrl =
    typeof window !== "undefined" && board
      ? `${window.location.origin}/?b=${board.id}`
      : "";

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const setVisibility = (v: "PRIVATE" | "PUBLIC") => {
    updateMutation.mutate({ visibility: v });
    toast.success(v === "PRIVATE" ? "Board set to private" : "Board set to public");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden p-0 sm:max-w-xl md:max-w-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b bg-gradient-to-r from-emerald-50 to-transparent px-6 py-4 dark:from-emerald-950/30">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-base">Board Control Center</SheetTitle>
            <p className="text-xs text-muted-foreground">
              Manage access, roles, security & sharing in one place.
            </p>
          </div>
        </div>

        {!board ? (
          <div className="flex flex-1 items-center justify-center p-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto scrollbar-premium">
            {/* Details */}
            <Section title="Board details" icon={<Pencil className="size-4" />}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <Button
                  size="sm"
                  onClick={saveDetails}
                  disabled={updateMutation.isPending}
                  className="w-fit"
                >
                  <Save className="size-3.5" /> Save details
                </Button>
              </div>
            </Section>

            {/* Share link */}
            {board.visibility === "PUBLIC" && (
              <Section title="Share link" icon={<Link2 className="size-4" />}>
                <div className="flex items-center gap-2">
                  <Input readOnly value={shareUrl} className="font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={copyLink} aria-label="Copy link">
                    {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {board.shareMode === "PUBLIC_LINK"
                    ? "Anyone with this link can access the board."
                    : "Only invited collaborators can access this board."}
                  {board.passwordEnabled && " A password is required."}
                </p>
              </Section>
            )}

            {/* Visibility */}
            <Section title="Visibility" icon={<Globe className="size-4" />}>
              <div className="grid grid-cols-2 gap-3">
                <ChoiceCard
                  active={board.visibility === "PRIVATE"}
                  onClick={() => setVisibility("PRIVATE")}
                  icon={<EyeOff className="size-4" />}
                  title="Private"
                  desc="Visible only to you. Not shareable."
                />
                <ChoiceCard
                  active={board.visibility === "PUBLIC"}
                  onClick={() => setVisibility("PUBLIC")}
                  icon={<Globe className="size-4" />}
                  title="Public"
                  desc="Share with viewers & editors."
                />
              </div>
            </Section>

            {board.visibility === "PUBLIC" && (
              <>
                {/* Access level */}
                <Section title="Access level" icon={<Pencil className="size-4" />}>
                  <div className="grid grid-cols-2 gap-3">
                    <ChoiceCard
                      active={board.accessMode === "EDIT"}
                      onClick={() => updateMutation.mutate({ accessMode: "EDIT" })}
                      icon={<Pencil className="size-4" />}
                      title="Can edit"
                      desc="Collaborators can draw & edit."
                    />
                    <ChoiceCard
                      active={board.accessMode === "READ_ONLY"}
                      onClick={() => updateMutation.mutate({ accessMode: "READ_ONLY" })}
                      icon={<Eye className="size-4" />}
                      title="Read-only"
                      desc="Viewing only."
                    />
                  </div>
                </Section>

                {/* Share mode */}
                <Section title="Sharing method" icon={<Share2 className="size-4" />}>
                  <div className="grid grid-cols-2 gap-3">
                    <ChoiceCard
                      active={board.shareMode === "PUBLIC_LINK"}
                      onClick={() => updateMutation.mutate({ shareMode: "PUBLIC_LINK" })}
                      icon={<Link2 className="size-4" />}
                      title="Anyone with link"
                      desc="No login required."
                    />
                    <ChoiceCard
                      active={board.shareMode === "INVITE_ONLY"}
                      onClick={() => updateMutation.mutate({ shareMode: "INVITE_ONLY" })}
                      icon={<Mail className="size-4" />}
                      title="Invite only"
                      desc="Invited emails only."
                    />
                  </div>
                </Section>

                {/* Password */}
                <Section title="Password protection" icon={<Lock className="size-4" />}>
                  <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                    <div className="flex items-start gap-2.5">
                      {board.passwordEnabled ? (
                        <Lock className="mt-0.5 size-4 text-amber-600" />
                      ) : (
                        <Unlock className="mt-0.5 size-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {board.passwordEnabled ? "Protected" : "Not protected"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Require a password to open the shared link.
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={board.passwordEnabled}
                      onCheckedChange={(v) => {
                        updateMutation.mutate({ passwordEnabled: v });
                        if (!v) setNewPassword("");
                      }}
                    />
                  </div>
                  {board.passwordEnabled && (
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Set a new password"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!newPassword || updateMutation.isPending}
                        onClick={() => {
                          updateMutation.mutate({ password: newPassword });
                          setNewPassword("");
                          toast.success("Password updated");
                        }}
                      >
                        Update
                      </Button>
                    </div>
                  )}
                </Section>
              </>
            )}

            {/* Collaborators */}
            <Section
              title={`Collaborators (${board.collaborators.length})`}
              icon={<Users className="size-4" />}
            >
              <div className="space-y-2">
                {/* Owner row */}
                {board.owner && (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                    <Avatar
                      name={board.owner.name}
                      color={board.owner.avatarColor}
                      size={32}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {board.owner.name}{" "}
                        <span className="text-muted-foreground">(you)</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {board.owner.email}
                      </p>
                    </div>
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
                      Owner
                    </Badge>
                  </div>
                )}

                {board.collaborators.map((c) => (
                  <CollaboratorRow
                    key={c.userId}
                    collaborator={c}
                    onRoleChange={(role) => updateCollabMutation.mutate({ userId: c.userId, role })}
                    onRemove={() => removeCollabMutation.mutate(c.userId)}
                    pending={updateCollabMutation.isPending || removeCollabMutation.isPending}
                  />
                ))}

                {/* Invite */}
                <div className="rounded-lg border border-dashed p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Invite by email
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && inviteEmail.trim() && !inviteMutation.isPending)
                          inviteMutation.mutate();
                      }}
                    />
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ROLE.VIEWER}>Viewer</SelectItem>
                        <SelectItem value={ROLE.EDITOR}>Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => inviteMutation.mutate()}
                      disabled={!inviteEmail.trim() || inviteMutation.isPending}
                      className="shrink-0"
                    >
                      {inviteMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <UserPlus className="size-4" />
                      )}
                      Invite
                    </Button>
                  </div>
                </div>
              </div>
            </Section>

            {/* Restrictions */}
            <Section title="Restrictions" icon={<Shield className="size-4" />}>
              <div className="space-y-2">
                <RestrictionRow
                  label="Allow resharing"
                  desc="Let collaborators share the board with others."
                  checked={board.allowReshare}
                  onChange={(v) => updateMutation.mutate({ allowReshare: v })}
                />
                <RestrictionRow
                  label="Allow export"
                  desc="Allow exporting the board as PNG/SVG/JSON."
                  checked={board.allowExport}
                  onChange={(v) => updateMutation.mutate({ allowExport: v })}
                />
                <RestrictionRow
                  label="Allow duplication"
                  desc="Let others duplicate this board into their workspace."
                  checked={board.allowDuplicate}
                  onChange={(v) => updateMutation.mutate({ allowDuplicate: v })}
                />
              </div>
            </Section>

            <div className="h-6" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b px-6 py-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ChoiceCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
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
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className={cn(active ? "text-primary" : "text-muted-foreground")}>{icon}</span>
        {title}
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </button>
  );
}

function RestrictionRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function CollaboratorRow({
  collaborator,
  onRoleChange,
  onRemove,
  pending,
}: {
  collaborator: Collaborator;
  onRoleChange: (role: string) => void;
  onRemove: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Avatar
        name={collaborator.user.name}
        color={collaborator.user.avatarColor}
        size={32}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{collaborator.user.name}</p>
        <p className="truncate text-xs text-muted-foreground">{collaborator.user.email}</p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          collaborator.role === ROLE.EDITOR
            ? "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
            : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
        )}
      >
        {collaborator.role === ROLE.EDITOR ? "Editor" : "Viewer"}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" disabled={pending} aria-label="Collaborator actions">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => onRoleChange(ROLE.VIEWER)}>
            <Eye className="size-4" /> Make viewer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRoleChange(ROLE.EDITOR)}>
            <Pencil className="size-4" /> Make editor
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onRemove}>
            <Trash2 className="size-4" /> Revoke access
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
