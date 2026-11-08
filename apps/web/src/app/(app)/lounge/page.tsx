"use client";

import { Coffee, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Composer, Feed, PollView } from "@/components/app/feed";
import { NewPollButton } from "@/components/app/new-poll";
import { Guard } from "@/components/shell/guard";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { useDemo } from "@/lib/demo/store";

export default function LoungePage() {
  return (
    <Guard feature="lounge">
      <Lounge />
    </Guard>
  );
}

function Lounge() {
  const { state, me } = useDemo();
  // /lounge?filter=polls opens straight on the polls.
  const [filter, setFilter] = useState<"all" | "posts" | "polls">(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("filter") === "polls" ? "polls" : "all",
  );
  const openPolls = useMemo(
    () => state.posts.filter((p) => p.space === "lounge" && p.kind === "POLL" && me && !p.poll!.options.some((o) => o.votes.includes(me.id))),
    [state.posts, me],
  );
  const online = state.people.filter((p) => p.status === "ACTIVE" && p.id !== me?.id);

  return (
    <>
      <PageHeader
        title="Lounge"
        description={
          <span className="inline-flex items-center gap-1.5">
            <Coffee className="size-4" aria-hidden /> The company&apos;s open space. Post anything: news, questions, lost bottles, polls.
          </span>
        }
        actions={<NewPollButton variant="primary" />}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Lounge feed" className="flex flex-col gap-4">
          <Composer space="lounge" />
          <Tabs
            label="Filter the Lounge"
            value={filter}
            onChange={setFilter}
            className="self-start"
            tabs={[
              { id: "all", label: "Everything" },
              { id: "posts", label: "Posts" },
              { id: "polls", label: "Polls" },
            ]}
          />
          <Feed space="lounge" filter={filter} />
        </section>

        <aside className="flex flex-col gap-6">
          {openPolls[0] && (
            <Card className="p-5">
              <p className="text-xs font-semibold tracking-wide text-muted uppercase">Waiting for your vote</p>
              <PollView post={openPolls[0]} compact />
            </Card>
          )}
          <Card>
            <CardHeader title="In the Lounge now" description={`${online.length} people online`} />
            <ul className="flex flex-wrap gap-2 px-5 pt-3 pb-5">
              {online.map((p) => (
                <li key={p.id}>
                  <Link href={`/people/${p.id}`} title={p.name} aria-label={p.name}>
                    <Avatar name={p.name} size="sm" status={p.status} />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="flex items-start gap-3 p-5 text-sm">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-points" aria-hidden />
            <p className="text-muted">
              Every time someone is praised, the Lounge shows it automatically. Give praise from{" "}
              <Link href="/cohort?tab=recognition" className="font-semibold text-brand-text hover:underline">
                Recognition
              </Link>
              .
            </p>
          </Card>
        </aside>
      </div>
    </>
  );
}
