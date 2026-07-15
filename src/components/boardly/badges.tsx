import { cn } from "@/lib/utils";
import {
  ACCESS_MODE,
  SHARE_MODE,
  VISIBILITY,
} from "@/lib/constants";
import {
  Eye,
  EyeOff,
  Lock,
  Pencil,
  Globe,
  Link2,
  Users,
} from "lucide-react";

export function VisibilityBadge({
  visibility,
  className,
}: {
  visibility: string;
  className?: string;
}) {
  const isPrivate = visibility === VISIBILITY.PRIVATE;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        isPrivate
          ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
        className
      )}
    >
      {isPrivate ? <EyeOff className="size-3" /> : <Globe className="size-3" />}
      {isPrivate ? "Private" : "Public"}
    </span>
  );
}

export function SecurityBadges({
  passwordEnabled,
  accessMode,
  shareMode,
  collaboratorCount,
  className,
}: {
  passwordEnabled: boolean;
  accessMode: string;
  shareMode: string;
  collaboratorCount: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {passwordEnabled && (
        <span
          title="Password protected"
          className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
        >
          <Lock className="size-3" /> Password
        </span>
      )}
      {accessMode === ACCESS_MODE.READ_ONLY ? (
        <span
          title="Read-only"
          className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
        >
          <Eye className="size-3" /> Read-only
        </span>
      ) : (
        <span
          title="Can edit"
          className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
        >
          <Pencil className="size-3" /> Editable
        </span>
      )}
      {shareMode === SHARE_MODE.PUBLIC_LINK && (
        <span
          title="Anyone with the link"
          className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <Link2 className="size-3" /> Link
        </span>
      )}
      {collaboratorCount > 0 && (
        <span
          title={`${collaboratorCount} collaborator${collaboratorCount > 1 ? "s" : ""}`}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <Users className="size-3" /> {collaboratorCount}
        </span>
      )}
    </div>
  );
}
