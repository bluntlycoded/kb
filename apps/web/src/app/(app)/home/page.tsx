"use client";

import { ArrowRight, Brain, Coins, Gamepad2, Heart, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PollView } from "@/components/app/feed";
import { HrNoteCard } from "@/components/app/hr-note";
import { NewPollButton } from "@/components/app/new-poll";
import { InviteModal } from "@/components/app/invite-modal";
import { GivePraiseModal, PraiseCard } from "@/components/app/praise";
import { Avatar, PresenceBadge } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/misc";
import { NEWS, OFFICES, QUIZZES } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";
import { formatNumber, timeAgo } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function HomePage() {
  const { me, state, enabledModules } = useDemo();
  const [praiseOpen, setPraiseOpen] = useState(false);
  const [inviteFor, setInviteFor] = useState<string | null>(null);

  const stats = useMemo(() => {
    if (!me) return null;
    const ranked = [...state.people].sort((a, b) => b.points - a.points);
    const received = state.praises.filter((p) => p.recipientId === me.id);
    return {
      rank: ranked.findIndex((p) => p.id === me.id) + 1,
      received: received.length,
      cheers: received.reduce((n, p) => n + p.likes.length, 0),
    };
  }, [me, state.people, state.praises]);

  if (!me || !stats) return null;
  const region = OFFICES.find((o) => o.id === me.officeId)?.region;
  const online = state.people.filter((p) => p.id !== me.id && p.status === "ACTIVE").slice(0, 6);
  const headlines = [...NEWS.filter((n) => n.category === "LOCAL" && n.region === region).slice(0, 2), ...NEWS.filter((n) => n.category === "SECTOR").slice(0, 2)];
  const has = (f: string) => enabledModules.includes(f as never);
  const pendingRequest =
    has("assessments") &&
    state.company.assessmentSharing === "HR_CAN_REQUEST" &&
    state.assessmentRequests.some((r) => r.userId === me.id && r.status === "PENDING") &&
    !state.assessments.find((a) => a.userId === me.id)?.sharedWithHr;
  const poll = state.posts.filter((p) => p.kind === "POLL" && p.space === "lounge").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden rounded-3xl bg-brand p-6 text-brand-fg sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 90% 10%, rgb(255 255 255 / 0.35), transparent 40%)" }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold opacity-85">{state.company.name}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting()}, {me.name.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-lg opacity-85">
              {online.length} colleagues are online right now. Recognise someone&apos;s great work or start a quick game.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {has("cohort") && (
              <button
                type="button"
                onClick={() => setPraiseOpen(true)}
                className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900 shadow-card transition hover:bg-white/90"
              >
                <Sparkles className="size-4" aria-hidden /> Give praise
              </button>
            )}
            {has("games") && (
              <Link
                href="/games"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-semibold transition hover:bg-white/25"
              >
                <Gamepad2 className="size-4" aria-hidden /> Play a game
              </Link>
            )}
          </div>
        </div>
      </section>

      <HrNoteCard />

      {pendingRequest && (
        <Link
          href="/assessments"
          className="flex items-center gap-3 rounded-2xl border border-brand/40 bg-brand-soft px-5 py-4 text-sm transition hover:border-brand"
        >
          <Brain className="size-5 shrink-0 text-brand-text" aria-hidden />
          <span className="flex-1">
            <span className="font-semibold">HR asked to see your work-style results.</span> It&apos;s your choice whether to share.
          </span>
          <ArrowRight className="size-4 text-brand-text" aria-hidden />
        </Link>
      )}

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Your stats">
        <StatCard label="Your points" value={formatNumber(me.points)} icon={Coins} tone="points" hint="Earned from praise, quizzes and games" />
        <StatCard label="Company rank" value={`#${stats.rank}`} icon={Trophy} tone="brand" hint={`of ${state.people.length} people`} />
        <StatCard label="Praise received" value={stats.received} icon={Heart} tone="success" hint={`${stats.cheers} cheers from colleagues`} />
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="recent-heading" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 id="recent-heading" className="text-lg font-semibold">
              Recent recognition
            </h2>
            {has("cohort") && (
              <Link href="/cohort?tab=recognition" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-brand-text hover:underline">
                See all <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
          {state.praises.slice(0, 3).map((p) => (
            <PraiseCard key={p.id} praise={p} />
          ))}
        </section>

        <aside className="flex flex-col gap-6">
          {has("lounge") && (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide text-muted uppercase">{poll ? "Poll of the day" : "Polls"}</p>
                <Link href="/lounge?filter=polls" className="text-sm font-semibold text-brand-text hover:underline">
                  All polls
                </Link>
              </div>
              {poll ? <PollView post={poll} compact /> : <p className="mt-2 text-sm text-muted">No polls yet. Ask the company something.</p>}
              <div className="mt-4 border-t border-line pt-4">
                <NewPollButton size="sm" label="Create a poll" />
              </div>
            </Card>
          )}
          {has("games") && (
            <Card>
              <CardHeader title="Online now" description="Invite someone to a quick game" />
              <ul className="mt-3 px-2 pb-3">
                {online.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2">
                    <Avatar name={p.name} size="sm" status={p.status} />
                    <Link href={`/people/${p.id}`} className="min-w-0 flex-1 hover:underline">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <PresenceBadge status={p.status} />
                    </Link>
                    <Button size="sm" variant="secondary" onClick={() => setInviteFor(p.id)} aria-label={`Invite ${p.name} to play`}>
                      Invite
                    </Button>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {has("games") && (
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
                  <Brain className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold">{QUIZZES[0].title}</p>
                  <p className="text-sm text-muted">{QUIZZES[0].questions.length} questions · up to 50 points</p>
                </div>
              </div>
              <ButtonLink href={`/games/quiz/${QUIZZES[0].id}`} className="mt-4 w-full">
                Play now
              </ButtonLink>
            </Card>
          )}

          {has("news") && (
            <Card>
              <CardHeader
                title="Headlines"
                action={
                  <Link href="/news" className="text-sm font-semibold text-brand-text hover:underline">
                    All news
                  </Link>
                }
              />
              <ul className="mt-2 px-5 pb-4">
                {headlines.map((n) => (
                  <li key={n.id} className="border-b border-line py-3 last:border-b-0">
                    <Badge tone={n.category === "LOCAL" ? "brand" : "neutral"}>{n.category === "LOCAL" ? region : "Industry"}</Badge>
                    <Link href="/news" className="mt-1.5 block text-sm leading-snug font-semibold hover:underline">
                      {n.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted">
                      {n.source} · {timeAgo(n.publishedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>

      <GivePraiseModal open={praiseOpen} onClose={() => setPraiseOpen(false)} />
      <InviteModal open={!!inviteFor} onClose={() => setInviteFor(null)} presetUserId={inviteFor ?? undefined} key={inviteFor ?? "none"} />
    </div>
  );
}
