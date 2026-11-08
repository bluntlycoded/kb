import { cn } from "@/lib/utils";

export function Logo({ className, name = "Engage" }: { className?: string; name?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-bold tracking-tight", className)}>
      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-brand text-brand-fg shadow-card">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d="M5 12a7 7 0 0 1 12-4.9M19 12a7 7 0 0 1-12 4.9" />
          <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}
