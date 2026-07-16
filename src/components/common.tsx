// Boardly — shared presentational primitives
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Globe, Lock, Pencil, Users } from "lucide-react";

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={cn("shrink-0", className)} aria-hidden>
      <rect width="64" height="64" rx="15" fill="url(#bg)" />
      <rect x="13" y="15" width="23" height="17" rx="3.5" fill="white" stroke="#0f766e" strokeWidth="1.5" />
      <rect x="33" y="32" width="20" height="17" rx="3.5" fill="white" stroke="#0f766e" strokeWidth="1.5" />
      <path d="M24.5 32 L24.5 40.5 L33 40.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M33 40.5 L39 40.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="44" cy="22" r="4.2" fill="#fde68a" stroke="white" strokeWidth="1.6" />
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" /><stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export function Avatar({ name, color, size = 28, className, ring }: {
  name: string; color: string; size?: number; className?: string; ring?: boolean;
}) {
  return (
    <span
      title={name}
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none", ring && "ring-2 ring-background", className)}
      style={{ width: size, height: size, backgroundColor: color, fontSize: Math.max(9, size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ users, max = 4, size = 26 }: {
  users: { id: string; name: string; avatarColor: string }[]; max?: number; size?: number;
}) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((u) => <Avatar key={u.id} name={u.name} color={u.avatarColor} size={size} ring />)}
      {extra > 0 && (
        <span className="inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold ring-2 ring-background"
          style={{ width: size, height: size, fontSize: Math.max(8, size * 0.34) }}>+{extra}</span>
      )}
    </div>
  );
}

// Compact badges shown in the board top bar — revealed contextually
export function VisibilityPill({ visibility, className }: { visibility: string; className?: string }) {
  const priv = visibility === "PRIVATE";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
      priv ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400", className)}>
      {priv ? <EyeOff className="size-3" /> : <Globe className="size-3" />}
      {priv ? "Private" : "Public"}
    </span>
  );
}

export function AccessPill({ accessMode, className }: { accessMode: string; className?: string }) {
  const ro = accessMode === "READ_ONLY";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
      ro ? "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400" : "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400", className)}>
      {ro ? <Eye className="size-3" /> : <Pencil className="size-3" />}
      {ro ? "View" : "Edit"}
    </span>
  );
}

export function MiniBadges({ passwordEnabled, collaborators, className }: {
  passwordEnabled: boolean; collaborators: number; className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {passwordEnabled && (
        <span title="Password protected" className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
          <Lock className="size-3" />
        </span>
      )}
      {collaborators > 0 && (
        <span title={`${collaborators} collaborator${collaborators > 1 ? "s" : ""}`} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <Users className="size-3" />{collaborators}
        </span>
      )}
    </div>
  );
}
