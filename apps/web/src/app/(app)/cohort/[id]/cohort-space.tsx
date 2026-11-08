"use client";

import { ArrowLeft, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Composer, Feed, SpaceBadge } from "@/components/app/feed";
import { NewPollButton } from "@/components/app/new-poll";
import { Guard } from "@/components/shell/guard";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { useDemo } from "@/lib/demo/store";
import { formatDate } from "@/lib/utils";

export function CohortSpace({ id }: { id: string }) {
  return (
    <Guard feature="cohort">
      <Space id={id} />
    </Guard>
  );
}

function Space({ id }: { id: string }) {
  const { state, me, personById, toggleCohortMembership } = useDemo();
  const cohort = state.cohorts.find((c) => c.id === id);
  if (!me) return null;
  if (!cohort) {
    return <EmptyState icon={Sparkles} title="Cohort not found" description="It may have been removed." action={<ButtonLink href="/cohort">All cohorts</ButtonLink>} />;
  }
  const joined = cohort.memberIds.includes(me.id);
  const members = cohort.memberIds.map((m) => personById(m)).filter(Boolean);

  return (
    <>
      <Link href="/cohort" className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> All cohorts
      </Link>

      <Card className="mb-6 flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <span className="inline-flex size-20 shrink-0 items-center justify-center rounded-3xl bg-surface-2 text-5xl" aria-hidden>
          {cohort.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{cohort.name}</h1>
            <SpaceBadge scope={cohort.scope} />
          </div>
          <p className="mt-1 text-muted">{cohort.description}</p>
          <p className="mt-2 text-sm text-muted">
            Created by {cohort.createdByName} on {formatDate(cohort.createdAt)} · {cohort.memberIds.length} members
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {joined && <NewPollButton variant="primary" defaultSpace={`cohort:${cohort.id}`} />}
          <Button variant={joined ? "secondary" : "primary"} onClick={() => toggleCohortMembership(cohort.id)}>
            {joined ? "Leave cohort" : "Join cohort"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label={`${cohort.name} posts`} className="flex flex-col gap-4">
          {joined ? (
            <Composer space={`cohort:${cohort.id}`} placeholder={`Share something in ${cohort.name}…`} />
          ) : (
            <Card className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm text-muted">Join this cohort to post, start polls and comment.</p>
              <Button size="sm" onClick={() => toggleCohortMembership(cohort.id)}>
                Join cohort
              </Button>
            </Card>
          )}
          <Feed space={`cohort:${cohort.id}`} />
        </section>
        <aside>
          <Card>
            <CardHeader title="Members" description={`${members.length} people`} />
            <ul className="flex flex-wrap gap-2 px-5 pt-3 pb-5">
              {members.slice(0, 24).map((p) => (
                <li key={p!.id}>
                  <Link href={`/people/${p!.id}`} title={p!.name} aria-label={p!.name}>
                    <Avatar name={p!.name} size="sm" status={p!.status} />
                  </Link>
                </li>
              ))}
              {members.length === 0 && (
                <li className="flex items-center gap-2 text-sm text-muted">
                  <Users className="size-4" aria-hidden /> No members yet
                </li>
              )}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
