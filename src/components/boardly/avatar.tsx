import { cn } from "@/lib/utils";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  color,
  size = 32,
  className,
  ring,
}: {
  name: string;
  color: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none",
        ring && "ring-2 ring-background",
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        fontSize: Math.max(10, size * 0.38),
      }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  users,
  max = 4,
  size = 28,
}: {
  users: { id: string; name: string; avatarColor: string }[];
  max?: number;
  size?: number;
}) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((u) => (
        <Avatar key={u.id} name={u.name} color={u.avatarColor} size={size} ring />
      ))}
      {extra > 0 && (
        <span
          className="inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold ring-2 ring-background"
          style={{ width: size, height: size, fontSize: Math.max(9, size * 0.36) }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
