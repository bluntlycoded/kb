"use client";

import { Activity, Coins, MessagesSquare, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { GivePraiseModal } from "@/components/app/praise";
import { Guard } from "@/components/shell/guard";
import { Avatar, PresenceBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { OFFICES } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";
import { formatNumber, timeAgo } from "@/lib/utils";

export default function TeamPage() {
  return (
    <Guard permission="profile.read.team">
      <Team />
    </Guard>
  );
}

function Team() {
  const { state, me, createConversation, enabledModules } = useDemo();
  const router = useRouter();
  const myTeams = useMemo(() => state.teams.filter((t) => t.managerId === me?.id), [state.teams, me]);
  const [teamId, setTeamId] = useState(myTeams[0]?.id ?? "");
  const [praiseFor, setPraiseFor] = useState<string | null>(null);

  const members = useMemo(() => state.people.filter((p) => p.teamId === teamId && p.id !== me?.id), [state.people, teamId, me]);
  const lastPraise = (id: string) => state.praises.find((p) => p.recipientId === id);
  const [weekAgo] = useState(() => Date.now() - 7 * 24 * 3600 * 1000);
  const praiseThisWeek = state.praises.filter((p) => members.some((m) => m.id === p.recipientId) && new Date(p.createdAt).getTime() > weekAgo).length;
  const notRecognised = members.filter((m) => !lastPraise(m.id));

  if (myTeams.length === 0) {
    return <EmptyState icon={Users} title="You don't manage a team yet" description="When HR assigns you as a team's manager, its members appear here." />;
  }

  return (
    <>
      <PageHeader
        title="My team"
        description="See how your team is doing and recognise their work."
        actions={
          myTeams.length > 1 ? (
            <Tabs label="Choose team" value={teamId} onChange={setTeamId} tabs={myTeams.map((t) => ({ id: t.id, label: t.name }))} />
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team members" value={members.length} icon={Users} />
        <StatCard label="Active now" value={members.filter((m) => m.status === "ACTIVE").length} icon={Activity} tone="success" />
        <StatCard label="Team points" value={formatNumber(members.reduce((n, m) => n + m.points, 0))} icon={Coins} tone="points" />
        <StatCard label="Praise this week" value={praiseThisWeek} icon={Sparkles} tone="warning" />
      </div>

      {notRecognised.length > 0 && enabledModules.includes("cohort") && (
        <Card className="mt-6 flex flex-col gap-3 border-warning/40 bg-warning-soft p-5 sm:flex-row sm:items-center">
          <Sparkles className="size-5 shrink-0 text-warning" aria-hidden />
          <p className="flex-1 text-sm">
            <span className="font-semibold">{notRecognised.map((m) => m.name.split(" ")[0]).join(", ")}</span>{" "}
            {notRecognised.length === 1 ? "hasn't" : "haven't"} been recognised recently. A quick thank-you goes a long way.
          </p>
          <Button size="sm" onClick={() => setPraiseFor(notRecognised[0].id)}>
            Recognise {notRecognised[0].name.split(" ")[0]}
          </Button>
        </Card>
      )}

      <Card className="mt-6 overflow-hidden">
        <table className="w-full text-sm">
          <caption className="sr-only">Team members</caption>
          <thead className="hidden border-b border-line bg-surface-2 text-left text-xs font-semibold tracking-wide text-muted uppercase md:table-header-group">
            <tr>
              <th scope="col" className="px-5 py-3">Name</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3">Skills</th>
              <th scope="col" className="px-5 py-3 text-right">Points</th>
              <th scope="col" className="px-5 py-3">Last recognised</th>
              <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const lp = lastPraise(m.id);
              return (
                <tr key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line p-4 last:border-b-0 md:table-row md:p-0">
                  <td className="w-full md:w-auto md:px-5 md:py-3">
                    <Link href={`/people/${m.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar name={m.name} size="sm" status={m.status} />
                      <span>
                        <span className="block font-semibold">{m.name}</span>
                        <span className="block text-xs text-muted">
                          {m.jobTitle} · {OFFICES.find((o) => o.id === m.officeId)?.city}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="md:px-5 md:py-3">
                    <PresenceBadge status={m.status} />
                  </td>
                  <td className="hidden md:table-cell md:px-5 md:py-3">
                    <span className="text-muted">{m.skills.slice(0, 2).map((s) => s.name).join(", ") || "None"}</span>
                  </td>
                  <td className="font-semibold text-points tabular-nums md:px-5 md:py-3 md:text-right">{formatNumber(m.points)} pts</td>
                  <td className="text-muted md:px-5 md:py-3">{lp ? timeAgo(lp.createdAt) : "Not yet"}</td>
                  <td className="ml-auto md:px-5 md:py-3">
                    <div className="flex justify-end gap-1">
                      {enabledModules.includes("chat") && (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Message ${m.name}`}
                          onClick={() => router.push(`/chat?c=${createConversation("DIRECT", [m.id])}`)}
                        >
                          <MessagesSquare className="size-[18px]" />
                        </Button>
                      )}
                      {enabledModules.includes("cohort") && (
                        <Button size="icon" variant="ghost" aria-label={`Praise ${m.name}`} onClick={() => setPraiseFor(m.id)}>
                          <Sparkles className="size-[18px]" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <GivePraiseModal key={praiseFor ?? "none"} open={!!praiseFor} onClose={() => setPraiseFor(null)} recipientId={praiseFor ?? undefined} />
    </>
  );
}
