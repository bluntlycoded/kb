"use client";

import type { PresenceStatus } from "@platform/shared";
import { Brain, Clock, Crown, Grid3x3, Hash, Play, Send, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { InviteModal } from "@/components/app/invite-modal";
import { Guard } from "@/components/shell/guard";
import { Avatar, PresenceBadge } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader, SectionTitle } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { GAMES, QUIZZES } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";
import { timeAgo } from "@/lib/utils";

const ORDER: Record<PresenceStatus, number> = { ACTIVE: 0, AWAY: 1, BUSY: 2, OFFLINE: 3 };
const GAME_ICON = { quiz: Brain, "tic-tac-toe": Grid3x3, chess: Crown, sudoku: Hash } as const;

export default function GamesPage() {
  return (
    <Guard feature="games">
      <Games />
    </Guard>
  );
}

function Games() {
  const { state, me, personById } = useDemo();
  const [who, setWho] = useState<"available" | "everyone">("available");
  const [invite, setInvite] = useState<{ userId?: string; choice?: string } | null>(null);

  const colleagues = useMemo(
    () =>
      state.people
        .filter((p) => p.id !== me?.id && (who === "everyone" || p.status === "ACTIVE" || p.status === "AWAY"))
        .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.name.localeCompare(b.name)),
    [state.people, me, who],
  );
  const counts = useMemo(() => {
    const c = { ACTIVE: 0, AWAY: 0, BUSY: 0, OFFLINE: 0 };
    state.people.forEach((p) => p.id !== me?.id && c[p.status]++);
    return c;
  }, [state.people, me]);
  const games = GAMES.filter((g) => state.company.games.includes(g.key));
  const myInvites = state.invites.filter((i) => i.fromId === me?.id).slice(0, 4);

  return (
    <>
      <PageHeader
        title="Games & Quizzes"
        description="Take a five-minute break with your colleagues. Wins and correct answers earn points."
        actions={
          <Button onClick={() => setInvite({})}>
            <Send aria-hidden /> Invite to play
          </Button>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="games-heading">
            <SectionTitle>
              <span id="games-heading">Games</span>
            </SectionTitle>
            {games.length === 0 && <p className="text-sm text-muted">Your company admin hasn&apos;t switched any games on yet.</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {games.map((g) => {
                const Icon = GAME_ICON[g.key];
                const twoPlayer = g.key === "chess" || g.key === "tic-tac-toe";
                return (
                  <Card key={g.key} className="flex flex-col p-5">
                    <div className="flex items-start justify-between">
                      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <Badge tone="points">{g.points}</Badge>
                    </div>
                    <h3 className="mt-4 font-semibold">{g.name}</h3>
                    <p className="mt-1 flex-1 text-sm text-muted">{g.description}</p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                      <Users className="size-3.5" aria-hidden /> {g.players}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <ButtonLink href={g.href} size="sm" variant={twoPlayer ? "secondary" : "primary"} className="flex-1">
                        {g.key === "quiz" ? "Choose quiz" : twoPlayer ? "Play computer" : "Play"}
                      </ButtonLink>
                      {twoPlayer && (
                        <Button size="sm" className="flex-1" onClick={() => setInvite({ choice: g.key })}>
                          Invite
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {state.company.games.includes("quiz") && (
          <section id="quizzes" aria-labelledby="quizzes-heading" className="scroll-mt-24">
            <SectionTitle>
              <span id="quizzes-heading">Quizzes</span>
            </SectionTitle>
            <div className="flex flex-col gap-3">
              {QUIZZES.map((q) => {
                const author = personById(q.createdById);
                return (
                  <Card key={q.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-points-soft text-points">
                      <Brain className="size-6" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{q.title}</h3>
                      <p className="mt-0.5 text-sm text-muted">{q.description}</p>
                      <p className="mt-1.5 text-xs text-muted">
                        {q.questions.length} questions · {q.pointsPerCorrect} points per correct answer · by {author?.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={() => setInvite({ choice: `quiz:${q.id}` })}>
                        Invite
                      </Button>
                      <ButtonLink href={`/games/quiz/${q.id}`}>
                        <Play aria-hidden /> Play
                      </ButtonLink>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
          )}
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Who's around" description={`${counts.ACTIVE} active · ${counts.AWAY} away · ${counts.BUSY} busy`} />
            <div className="px-5 pt-4">
              <Tabs
                label="Show colleagues"
                value={who}
                onChange={setWho}
                className="w-full [&>button]:flex-1 [&>button]:justify-center"
                tabs={[
                  { id: "available", label: "Available" },
                  { id: "everyone", label: "Everyone" },
                ]}
              />
            </div>
            <ul className="mt-2 max-h-[420px] overflow-y-auto px-2 pb-3">
              {colleagues.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2">
                  <Avatar name={p.name} size="sm" status={p.status} />
                  <Link href={`/people/${p.id}`} className="min-w-0 flex-1 hover:underline">
                    <span className="block truncate text-sm font-semibold">{p.name}</span>
                    <PresenceBadge status={p.status} />
                  </Link>
                  <Button
                    size="sm"
                    variant={p.status === "ACTIVE" ? "primary" : "secondary"}
                    onClick={() => setInvite({ userId: p.id })}
                    aria-label={`Invite ${p.name} to play`}
                  >
                    Invite
                  </Button>
                </li>
              ))}
            </ul>
          </Card>

          {myInvites.length > 0 && (
            <Card>
              <CardHeader title="Your invites" />
              <ul className="mt-2 px-5 pb-4">
                {myInvites.map((i) => {
                  const name = i.gameKey === "quiz" ? QUIZZES.find((q) => q.id === i.quizId)?.title : GAMES.find((g) => g.key === i.gameKey)?.name;
                  const accepted = i.accepted.length > 0;
                  return (
                    <li key={i.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{name}</p>
                        <p className="truncate text-xs text-muted">
                          {i.toIds.map((id) => personById(id)?.name.split(" ")[0]).join(", ")} · {timeAgo(i.createdAt)}
                        </p>
                      </div>
                      {accepted ? (
                        <ButtonLink size="sm" href={i.gameKey === "quiz" ? `/games/quiz/${i.quizId}` : `/games/${i.gameKey}`}>
                          Start
                        </ButtonLink>
                      ) : (
                        <Badge tone="warning">
                          <Clock aria-hidden /> Waiting
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </aside>
      </div>

      <InviteModal
        key={invite ? `${invite.userId}-${invite.choice}` : "closed"}
        open={!!invite}
        onClose={() => setInvite(null)}
        presetUserId={invite?.userId}
        presetChoice={invite?.choice}
      />
    </>
  );
}
