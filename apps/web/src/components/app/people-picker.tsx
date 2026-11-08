"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar, PresenceBadge } from "@/components/ui/avatar";
import { Input } from "@/components/ui/field";
import { useDemo } from "@/lib/demo/store";
import type { Person } from "@/lib/demo/types";
import { cn } from "@/lib/utils";

/** Searchable list of colleagues; single or multi select. */
export function PeoplePicker({
  selected,
  onChange,
  multiple,
  label = "Search colleagues",
  filter,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  label?: string;
  filter?: (p: Person) => boolean;
}) {
  const { state, me } = useDemo();
  const [q, setQ] = useState("");
  const people = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.people
      .filter((p) => p.id !== me?.id && (!filter || filter(p)))
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.jobTitle.toLowerCase().includes(term))
      .sort((a, b) => Number(b.status === "ACTIVE") - Number(a.status === "ACTIVE") || a.name.localeCompare(b.name));
  }, [state.people, me, q, filter]);

  function toggle(id: string) {
    if (!multiple) return onChange([id]);
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input aria-label={label} placeholder="Search by name or role" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
      </div>
      <ul className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-line" role="listbox" aria-multiselectable={multiple} aria-label={label}>
        {people.length === 0 && <li className="p-4 text-center text-sm text-muted">No colleagues match &ldquo;{q}&rdquo;.</li>}
        {people.map((p) => {
          const isSel = selected.includes(p.id);
          return (
            <li key={p.id} role="option" aria-selected={isSel}>
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className={cn(
                  "flex min-h-14 w-full cursor-pointer items-center gap-3 border-b border-line px-3 py-2 text-left last:border-b-0",
                  isSel ? "bg-brand-soft" : "hover:bg-surface-2",
                )}
              >
                <Avatar name={p.name} size="sm" status={p.status} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="block truncate text-xs text-muted">{p.jobTitle}</span>
                </span>
                <PresenceBadge status={p.status} className="hidden sm:inline-flex" />
                <span
                  className={cn(
                    "inline-flex size-5 items-center justify-center rounded-md border",
                    isSel ? "border-brand bg-brand text-brand-fg" : "border-line",
                  )}
                  aria-hidden
                >
                  {isSel && <Check className="size-3.5" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
