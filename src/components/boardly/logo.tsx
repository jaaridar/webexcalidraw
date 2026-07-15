import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <rect width="64" height="64" rx="16" fill="url(#bg)" />
      <rect x="13" y="15" width="23" height="17" rx="3.5" fill="white" stroke="#0f766e" strokeWidth="1.5" />
      <rect x="33" y="32" width="20" height="17" rx="3.5" fill="white" stroke="#0f766e" strokeWidth="1.5" />
      <path d="M24.5 32 L24.5 40.5 L33 40.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M33 40.5 L39 40.5" stroke="white" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="44" cy="22" r="4.2" fill="#fde68a" stroke="white" strokeWidth="1.6" />
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo size={32} />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Boardly
      </span>
    </div>
  );
}
