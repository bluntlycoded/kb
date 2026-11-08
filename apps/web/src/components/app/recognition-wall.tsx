"use client";

import { Coins, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GivePraiseModal, PraiseCard } from "@/components/app/praise";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { useDemo } from "@/lib/demo/store";
import { cn, formatNumber } from "@/lib/utils";

type Filter = "all" | "praise" | "achievements" | "mine";

/** The praise and achievements wall, with leaderboard and values. */
export function RecognitionWall() {
  const { state, me } = useDemo();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);

  const feed = useMemo(
    () =>
      state.praises.filter((p) =>
        filter === "praise"
          ? p.kind === "PRAISE"
          : filter === "achievements"
            ? p.kind === "ACHIEVEMENT"
            : filter === "mine"
              ? p.recipientId === me?.id || p.authorId === me?.id
              : true,
      ),
    [state.praises, filter, me],
  );
  const leaders = useMemo(() => [...state.people].sort((a, b) => b.points - a.points).slice(0, 5), [state.people]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">
          Praise earns {state.company.pointsRules.peer} points for a colleague, {state.company.pointsRules.manager} for a manager and{" "}
          {state.company.pointsRules.md} for the MD.
        </p>
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden /> Give praise
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Recognition feed" className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface px-4 text-left shadow-card transition hover:border-brand"
          >
            {me && <Avatar name={me.name} size="sm" />}
            <span className="flex-1 text-muted">Who did something great today?</span>
            <Sparkles className="size-5 text-brand-text" aria-hidden />
          </button>

          <Tabs
            label="Filter the feed"
            value={filter}
            onChange={setFilter}
            className="self-start"
            tabs={[
              { id: "all", label: "All" },
              { id: "praise", label: "Praise" },
              { id: "achievements", label: "Achievements" },
              { id: "mine", label: "Involving me" },
            ]}
          />

          {feed.length === 0 ? (
            <Card>
              <EmptyState
                icon={Sparkles}
                title="Nothing here yet"
                description="When you give or receive praise, it shows up here."
                action={<Button onClick={() => setOpen(true)}>Give praise</Button>}
              />
            </Card>
          ) : (
            feed.map((p) => <PraiseCard key={p.id} praise={p} />)
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Leaderboard" description="Most points this quarter" />
            <ol className="mt-3 px-2 pb-3">
              {leaders.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={`/people/${p.id}`}
                    className={cn("flex min-h-12 items-center gap-3 rounded-xl px-3 py-1.5 hover:bg-surface-2", p.id === me?.id && "bg-brand-soft")}
                  >
                    <span
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                        i === 0 ? "bg-points-soft text-points" : "bg-surface-2 text-muted",
                      )}
                    >
                      {i + 1}
                    </span>
                    <Avatar name={p.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-points tabular-nums">
                      <Coins className="size-3.5" aria-hidden />
                      {formatNumber(p.points)}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold">Our values</h2>
            <p className="mt-0.5 text-sm text-muted">Tag your praise with the value it shows.</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {state.company.values.map((v) => {
                const count = state.praises.filter((p) => p.value === v).length;
                return (
                  <li key={v} className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-3 py-1.5 text-sm font-semibold">
                    {v}
                    <span className="text-xs text-muted tabular-nums">{count}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </aside>
      </div>

      <GivePraiseModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
