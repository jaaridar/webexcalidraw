"use client";

// Boardly — access gates for shared boards (denied / password / guest-name)
import * as React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, KeyRound, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, Logo } from "@/components/common";
import { useVerifyPassword } from "@/hooks/use-data";
import { useApp } from "@/lib/store";
import { toast } from "sonner";

export function GateShell({ onExit, children }: { onExit: () => void; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center gap-3 border-b border-border/60 px-4">
        <Button variant="ghost" size="icon" className="size-9" onClick={onExit} aria-label="Back">
          <ArrowLeft className="size-4" />
        </Button>
        <Logo size={22} />
        <span className="text-sm font-medium">Boardly</span>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card p-8 shadow-pop"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export function DeniedGate({ title, owner, onExit }: {
  title: string; owner: { name: string; avatarColor: string } | null; onExit: () => void;
}) {
  return (
    <GateShell onExit={onExit}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
        <Lock className="size-7" />
      </div>
      <h1 className="text-xl font-semibold">This board is invite-only</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        You need an invitation from the owner to view “{title}”.
      </p>
      {owner && (
        <div className="mt-5 flex items-center gap-2.5 text-sm">
          <Avatar name={owner.name} color={owner.avatarColor} size={28} />
          <span className="text-muted-foreground">Owned by <span className="font-medium text-foreground">{owner.name}</span></span>
        </div>
      )}
      <Button variant="outline" className="mt-6" onClick={onExit}>
        <ArrowLeft className="size-4" /> Back to dashboard
      </Button>
    </GateShell>
  );
}

export function PasswordGate({ boardId, onExit }: { boardId: string; onExit: () => void }) {
  const verify = useVerifyPassword(boardId);
  return (
    <GateShell onExit={onExit}>
      <form
        className="w-full max-w-sm"
        onSubmit={(e) => { e.preventDefault(); const pw = String(new FormData(e.currentTarget).get("pw") || ""); verify.mutate(pw); }}
      >
        <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
          <KeyRound className="size-7" />
        </div>
        <h1 className="text-center text-xl font-semibold">Password required</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Enter the password the owner shared with you.</p>
        <div className="mt-6 space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" name="pw" type="password" autoFocus placeholder="Enter password" />
        </div>
        <Button type="submit" className="mt-4 w-full" disabled={verify.isPending}>
          <Lock className="size-4" /> Unlock board
        </Button>
        {verify.isError && <p className="mt-2 text-center text-xs text-destructive">Incorrect password</p>}
      </form>
    </GateShell>
  );
}

export function GuestNameGate({ title, canEdit, onJoin, onExit }: {
  title: string; canEdit: boolean; onJoin: (name: string) => void; onExit: () => void;
}) {
  const guest = useApp((s) => s.guest);
  const setGuestName = useApp((s) => s.setGuestName);
  const [name, setName] = React.useState(guest.name);
  const join = () => { setGuestName(name.trim() || "Guest"); onJoin(name.trim() || "Guest"); };
  return (
    <GateShell onExit={onExit}>
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Sparkles className="size-7" />
      </div>
      <h1 className="text-xl font-semibold">Join the board</h1>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        You&apos;re joining “{title}” as {canEdit ? "an editor" : "a viewer"}.
      </p>
      <div className="mt-6 w-full space-y-1.5 text-left">
        <Label htmlFor="gn">Your name</Label>
        <Input id="gn" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Lee" autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") join(); }} />
      </div>
      <Button className="mt-4 w-full" onClick={join} disabled={!name.trim()}>
        Enter board <ArrowRight className="size-4" />
      </Button>
    </GateShell>
  );
}
