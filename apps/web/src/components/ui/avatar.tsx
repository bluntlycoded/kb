"use client";

import type { PresenceStatus } from "@platform/shared";
import { useDemo } from "@/lib/demo/store";
import type { AvatarChoice } from "@/lib/demo/types";
import { cn, initials } from "@/lib/utils";

export const tints = [
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
  "bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200",
];

function tintFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tints[h % tints.length];
}

const sizes = {
  xs: "size-7 text-[11px]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
};

export const presenceDot: Record<PresenceStatus, string> = {
  ACTIVE: "bg-emerald-500",
  AWAY: "bg-amber-400",
  BUSY: "bg-rose-500",
  OFFLINE: "bg-slate-400",
};

export const presenceLabel: Record<PresenceStatus, string> = {
  ACTIVE: "Active",
  AWAY: "Away",
  BUSY: "Busy",
  OFFLINE: "Offline",
};

const emojiSizes = { xs: "text-sm", sm: "text-base", md: "text-xl", lg: "text-3xl", xl: "text-5xl" };

/** The face itself: a photo, a chosen avatar, or initials. */
export function AvatarFace({ name, avatar, size = "md" }: { name: string; avatar?: AvatarChoice; size?: keyof typeof sizes }) {
  if (avatar?.kind === "photo") {
    // eslint-disable-next-line @next/next/no-img-element -- data URL from the user's upload
    return <img src={avatar.src} alt="" className={cn("rounded-full object-cover", sizes[size])} />;
  }
  if (avatar?.kind === "emoji") {
    return (
      <span className={cn("inline-flex items-center justify-center rounded-full", sizes[size], emojiSizes[size], tints[avatar.tint % tints.length])} aria-hidden>
        {avatar.emoji}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center justify-center rounded-full font-semibold", sizes[size], tintFor(name))} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function Avatar({
  name,
  size = "md",
  status,
  className,
}: {
  name: string;
  size?: keyof typeof sizes;
  status?: PresenceStatus;
  className?: string;
}) {
  // Look the person up so their photo or avatar shows everywhere they appear.
  const { state } = useDemo();
  const avatar = state.people.find((p) => p.name === name)?.avatar;
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <AvatarFace name={name} avatar={avatar} size={size} />
      {status && (
        <span
          className={cn(
            "absolute right-0 bottom-0 rounded-full ring-2 ring-surface",
            size === "lg" || size === "xl" ? "size-4" : "size-3",
            presenceDot[status],
          )}
          title={presenceLabel[status]}
        />
      )}
    </span>
  );
}

/** Dot plus text, so status never relies on colour alone. */
export function PresenceBadge({ status, className }: { status: PresenceStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-muted", className)}>
      <span className={cn("size-2 rounded-full", presenceDot[status])} aria-hidden />
      {presenceLabel[status]}
    </span>
  );
}
