"use client";

import { Activity, Coins, Gamepad2, Sparkles, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Guard } from "@/components/shell/guard";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { BarList, ColumnChart } from "@/components/ui/chart";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { INSIGHTS } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";
import { formatNumber } from "@/lib/utils";

export default function InsightsPage() {
  return (
    <Guard permission="analytics.read">
      <Insights />
    </Guard>
  );
}

function Insights() {
  const { state } = useDemo();
  const last = INSIGHTS.praise.length - 1;
  const praiseChange = Math.round(((INSIGHTS.praise[last] - INSIGHTS.praise[last - 1]) / INSIGHTS.praise[last - 1]) * 100);
  const totalPoints = state.people.reduce((n, p) => n + p.points, 0);

  const topSkills = useMemo(() => {
    const counts = new Map<string, number>();
    state.people.forEach((p) => p.skills.forEach((s) => counts.set(s.name, (counts.get(s.name) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [state.people]);

  const valuesUsed = state.company.values.map((v) => ({ label: v, value: state.praises.filter((p) => p.value === v).length }));

  return (
    <>
      <PageHeader
        title="Insights"
        description="How engaged is the company? Updated every morning."
        eyebrow={<Badge tone="brand">Last 8 weeks</Badge>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Weekly active"
          value={`${INSIGHTS.activeRate[last]}%`}
          icon={Activity}
          tone="success"
          hint={`Up from ${INSIGHTS.activeRate[0]}% eight weeks ago`}
        />
        <StatCard
          label="Praise this week"
          value={INSIGHTS.praise[last]}
          icon={Sparkles}
          hint={
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="size-3.5 text-success" aria-hidden />
              {praiseChange >= 0 ? "+" : ""}
              {praiseChange}% vs last week
            </span>
          }
        />
        <StatCard label="Points held" value={formatNumber(totalPoints)} icon={Coins} tone="points" hint="Across all employees" />
        <StatCard label="Games played" value="128" icon={Gamepad2} tone="warning" hint="This month" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Praise given per week" description="Number of praise and achievement posts" />
          <div className="px-5 pt-5 pb-3">
            <ColumnChart
              data={INSIGHTS.weeks.map((w, i) => ({ label: w, value: INSIGHTS.praise[i] }))}
              valueLabel="posts"
              summary={`Weekly praise rose from ${INSIGHTS.praise[0]} to ${INSIGHTS.praise[last]} posts over eight weeks.`}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Engagement by team" description="Score out of 100, combining activity, praise and games" />
          <div className="px-5 pt-5 pb-3">
            <BarList
              data={INSIGHTS.byTeam.map((t) => ({ label: t.team, value: t.score }))}
              valueLabel="score"
              summary="Engagement scores by team. People and Culture is highest at 92; Operations is lowest at 68."
            />
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Most common skills" description="Useful when building project teams" />
          <ul className="flex flex-wrap gap-2 px-5 pt-4 pb-5">
            {topSkills.map(([name, count]) => (
              <li key={name} className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                <span className="font-semibold">{name}</span>
                <span className="text-muted tabular-nums">
                  {count} {count === 1 ? "person" : "people"}
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Values in action" description="How often each company value is tagged in praise" />
          <div className="px-5 pt-5 pb-3">
            <BarList
              data={valuesUsed}
              max={Math.max(...valuesUsed.map((v) => v.value), 1)}
              valueLabel="praise posts"
              summary="Number of praise posts tagged with each company value."
            />
          </div>
        </Card>
      </div>

      <Card className="mt-6 flex flex-col gap-2 border-warning/40 bg-warning-soft p-5 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm">
          <span className="font-semibold">Operations is trailing.</span> Their engagement score is 68, 12 points below the company
          average of 80. Consider a team quiz or a recognition push for the warehouse and fleet teams.
        </p>
      </Card>
    </>
  );
}
