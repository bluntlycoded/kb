"use client";

import { can } from "@platform/shared";
import { ArrowRight, Plus, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateCohortModal } from "@/components/app/create-cohort-modal";
import { SpaceBadge } from "@/components/app/feed";
import { RecognitionWall } from "@/components/app/recognition-wall";
import { Guard } from "@/components/shell/guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { useDemo } from "@/lib/demo/store";
import { cn, timeAgo } from "@/lib/utils";

export default function CohortPage() {
  return (
    <Guard feature="cohort">
      <Cohorts />
    </Guard>
  );
}

function Cohorts() {
  const { state, me, toggleCohortMembership } = useDemo();
  const router = useRouter();
  const [tab, setTab] = useState<"cohorts" | "recognition">(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "recognition" ? "recognition" : "cohorts",
  );
  const [creating, setCreating] = useState(false);
  if (!me) return null;
  const canCreate = can(me.role, "cohorts.manage");

  const cohorts = [...state.cohorts].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt.localeCompare(a.createdAt));

  function switchTab(t: typeof tab) {
    setTab(t);
    window.history.replaceState(null, "", t === "recognition" ? "/cohort?tab=recognition" : "/cohort");
  }

  return (
    <>
      <PageHeader
        title="Cohorts"
        description="Spaces for what everyone is talking about, and the recognition wall."
        actions={
          tab === "cohorts" && canCreate ? (
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden /> Create cohort
            </Button>
          ) : undefined
        }
      />
      <Tabs
        label="Cohorts sections"
        value={tab}
        onChange={switchTab}
        className="mb-6"
        tabs={[
          { id: "cohorts", label: "Cohorts", count: state.cohorts.length },
          { id: "recognition", label: "Recognition" },
        ]}
      />

      {tab === "recognition" ? (
        <RecognitionWall />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cohorts.map((c) => {
            const joined = c.memberIds.includes(me.id);
            const posts = state.posts.filter((p) => p.space === `cohort:${c.id}`);
            const last = posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
            return (
              <Card key={c.id} className="group flex flex-col p-5 transition hover:shadow-pop">
                <div className="flex items-start gap-4">
                  <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-3xl" aria-hidden>
                    {c.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold tracking-tight">
                        <Link href={`/cohort/${c.id}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </h2>
                      {c.pinned && <span className="text-xs font-semibold text-points">Trending</span>}
                    </div>
                    <p className="mt-1 text-sm text-muted">{c.description}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <SpaceBadge scope={c.scope} />
                  <span>By {c.createdByName}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" aria-hidden /> {c.memberIds.length} members
                  </span>
                  <span>{posts.length} posts</span>
                  {last && <span>Active {timeAgo(last.createdAt)}</span>}
                </div>
                <div className="mt-5 flex gap-2">
                  <Button
                    size="sm"
                    variant={joined ? "secondary" : "primary"}
                    onClick={() => toggleCohortMembership(c.id)}
                    aria-label={`${joined ? "Leave" : "Join"} ${c.name}`}
                  >
                    {joined ? "Joined" : "Join"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => router.push(`/cohort/${c.id}`)} className={cn("ml-auto")}>
                    Open <ArrowRight aria-hidden />
                  </Button>
                </div>
              </Card>
            );
          })}
          {canCreate && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-muted transition hover:border-brand hover:text-fg"
            >
              <Sparkles className="size-6" aria-hidden />
              <span className="font-semibold">Start a new cohort</span>
              <span className="text-sm">A festival, an event, a company milestone</span>
            </button>
          )}
        </div>
      )}

      <CreateCohortModal open={creating} onClose={() => setCreating(false)} onCreated={(id) => router.push(`/cohort/${id}`)} />
    </>
  );
}
