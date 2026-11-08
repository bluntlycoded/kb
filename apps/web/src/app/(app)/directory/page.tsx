"use client";

import { Search, Users } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Guard } from "@/components/shell/guard";
import { Avatar, PresenceBadge } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { OFFICES } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";

export default function DirectoryPage() {
  // Remount when the top-bar search changes the query.
  const initial = useSearchParams().get("q") ?? "";
  return (
    <Guard feature="profile">
      <Directory key={initial} initial={initial} />
    </Guard>
  );
}

function Directory({ initial }: { initial: string }) {
  const { state } = useDemo();
  const [q, setQ] = useState(initial);
  const [team, setTeam] = useState("all");
  const [office, setOffice] = useState("all");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.people
      .filter((p) => team === "all" || p.teamId === team)
      .filter((p) => office === "all" || p.officeId === office)
      .filter(
        (p) =>
          !term ||
          [p.name, p.jobTitle, ...p.skills.map((s) => s.name), state.teams.find((t) => t.id === p.teamId)?.name ?? ""].some((x) => x.toLowerCase().includes(term)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.people, state.teams, q, team, office]);

  return (
    <>
      <PageHeader title="Directory" description="Find anyone in the company by name, role, team or skill." />
      <div className="mb-5 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input aria-label="Search people" placeholder="Search name, role, team or skill" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" autoFocus />
        </div>
        <Select aria-label="Filter by team" value={team} onChange={(e) => setTeam(e.target.value)} className="md:w-48">
          <option value="all">All teams</option>
          {state.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Select aria-label="Filter by office" value={office} onChange={(e) => setOffice(e.target.value)} className="md:w-44">
          <option value="all">All offices</option>
          {OFFICES.map((o) => (
            <option key={o.id} value={o.id}>
              {o.city}
            </option>
          ))}
        </Select>
      </div>
      <p className="mb-3 text-sm text-muted" aria-live="polite">
        {rows.length} {rows.length === 1 ? "person" : "people"}
      </p>
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No one matches" description="Try a different name, role or skill." />
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <li key={p.id}>
              <Link href={`/people/${p.id}`} className="block h-full">
                <Card className="flex h-full items-start gap-3 p-4 transition hover:border-brand/50 hover:shadow-pop">
                  <Avatar name={p.name} size="lg" status={p.status} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="truncate text-sm text-muted">{p.jobTitle}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {state.teams.find((t) => t.id === p.teamId)?.name} · {OFFICES.find((o) => o.id === p.officeId)?.city}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <PresenceBadge status={p.status} className="mr-1" />
                      {p.skills.slice(0, 2).map((s) => (
                        <Badge key={s.name}>{s.name}</Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
