"use client";

import { Clock, Info, MapPin, Newspaper, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Guard } from "@/components/shell/guard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { NEWS, OFFICES } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";
import type { NewsItem } from "@/lib/demo/types";
import { cn, timeAgo } from "@/lib/utils";

export default function NewsPage() {
  return (
    <Guard feature="news">
      <News />
    </Guard>
  );
}

/** Deterministic soft gradient per topic, used as the story's visual. */
const TOPIC_TINT: Record<string, string> = {
  Transport: "from-sky-500/25 to-indigo-500/25",
  Weather: "from-cyan-400/25 to-blue-500/25",
  Community: "from-emerald-400/25 to-teal-500/25",
  Events: "from-fuchsia-400/25 to-violet-500/25",
  "Air quality": "from-slate-400/25 to-sky-400/25",
  Policy: "from-amber-400/25 to-orange-500/25",
  Technology: "from-indigo-500/25 to-violet-500/25",
  Market: "from-emerald-500/25 to-lime-400/25",
  "Cold chain": "from-cyan-500/25 to-sky-400/25",
  Sustainability: "from-green-500/25 to-emerald-400/25",
};

function News() {
  const { me, state } = useDemo();
  const [tab, setTab] = useState<"LOCAL" | "SECTOR">("LOCAL");
  const [topic, setTopic] = useState<string>("All");
  const office = OFFICES.find((o) => o.id === me?.officeId);

  const followed = state.company.industries;
  const items = useMemo(
    () =>
      NEWS.filter((n) => n.category === tab && (tab === "SECTOR" ? followed.includes(n.industry ?? "") : n.region === office?.region)).sort((a, b) =>
        b.publishedAt.localeCompare(a.publishedAt),
      ),
    [tab, office, followed],
  );
  // Local news filters by topic; industry news filters by industry.
  const topics = useMemo(
    () => ["All", ...(tab === "SECTOR" ? followed.filter((i) => items.some((n) => n.industry === i)) : [...new Set(items.map((n) => n.topic))])],
    [items, tab, followed],
  );
  const shown = topic === "All" ? items : items.filter((n) => (tab === "SECTOR" ? n.industry === topic : n.topic === topic));
  const [featured, ...rest] = shown;

  return (
    <>
      <PageHeader
        title="Current Affairs"
        description={
          tab === "LOCAL" ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden /> What&apos;s happening around the {office?.city} office ({office?.region})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <TrendingUp className="size-4" aria-hidden /> The latest across {followed.length} industries your company follows
            </span>
          )
        }
      />

      <div className="mb-6 flex flex-col items-start gap-4">
        <Tabs
          label="News category"
          value={tab}
          onChange={(t) => {
            setTab(t);
            setTopic("All");
          }}
          tabs={[
            { id: "LOCAL", label: `Local · ${office?.region ?? ""}` },
            { id: "SECTOR", label: `Industries · ${followed.length}` },
          ]}
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label={tab === "SECTOR" ? "Filter by industry" : "Filter by topic"}>
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={topic === t}
              onClick={() => setTopic(t)}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center rounded-full border px-3.5 text-sm font-semibold transition",
                topic === t ? "border-brand bg-brand text-brand-fg" : "border-line bg-surface text-muted hover:text-fg",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {!featured ? (
        <Card>
          <EmptyState icon={Newspaper} title="No stories right now" description="Check back later. New stories arrive every hour." />
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Story item={featured} featured />
          <div className="grid gap-4 md:grid-cols-2">
            {rest.map((n) => (
              <Story key={n.id} item={n} />
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 flex items-start gap-2 text-sm text-muted">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        Sample headlines for the demo. In production these come from a live news provider, filtered by each office&apos;s region and your
        company&apos;s industry.
      </p>
    </>
  );
}

function Story({ item, featured }: { item: NewsItem; featured?: boolean }) {
  return (
    <Card className={cn("group overflow-hidden transition hover:shadow-pop", featured && "md:grid md:grid-cols-[1.1fr_1fr]")}>
      <div
        className={cn(
          "flex items-end bg-gradient-to-br p-5",
          TOPIC_TINT[item.topic] ?? "from-indigo-500/20 to-violet-500/20",
          featured ? "aspect-[16/9] md:aspect-auto md:min-h-64" : "aspect-[16/6]",
        )}
        aria-hidden
      >
        <Newspaper className={cn("text-fg/30", featured ? "size-12" : "size-8")} />
      </div>
      <div className="flex flex-col p-5">
        <div className="flex flex-wrap items-center gap-2">
          {item.industry && <Badge>{item.industry}</Badge>}
          <Badge tone="brand">{item.topic}</Badge>
          {featured && <Badge tone="points">Top story</Badge>}
        </div>
        <h2 className={cn("mt-3 font-bold tracking-tight", featured ? "text-xl sm:text-2xl" : "text-base")}>{item.title}</h2>
        <p className="mt-2 leading-relaxed text-muted">{item.summary}</p>
        <p className="mt-auto flex items-center gap-3 pt-4 text-sm text-muted">
          <span className="font-semibold text-fg">{item.source}</span>
          <span>{timeAgo(item.publishedAt)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden /> {item.readMinutes} min read
          </span>
        </p>
      </div>
    </Card>
  );
}
