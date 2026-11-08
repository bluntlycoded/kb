"use client";

import { Plus, Users } from "lucide-react";
import { useState } from "react";
import { CreateCohortModal } from "@/components/app/create-cohort-modal";
import { SpaceBadge } from "@/components/app/feed";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { useDemo } from "@/lib/demo/store";
import { formatDate } from "@/lib/utils";

export default function ConsoleCohortsPage() {
  const { state } = useDemo();
  const [open, setOpen] = useState(false);
  const cohorts = [...state.cohorts].sort((a, b) => Number(b.scope === "PLATFORM") - Number(a.scope === "PLATFORM") || b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <PageHeader
        title="Cohorts"
        description="Platform cohorts appear in every customer company. Use them for festivals and themes everyone shares."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus aria-hidden /> New platform cohort
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <caption className="sr-only">Cohorts</caption>
          <thead className="hidden bg-surface-2 text-left text-xs font-semibold tracking-wide text-muted uppercase md:table-header-group">
            <tr>
              <th scope="col" className="px-5 py-3">Cohort</th>
              <th scope="col" className="px-5 py-3">Reach</th>
              <th scope="col" className="px-5 py-3">Created by</th>
              <th scope="col" className="px-5 py-3 text-right">Posts</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line p-4 last:border-b-0 md:table-row md:p-0">
                <td className="w-full md:w-auto md:px-5 md:py-3">
                  <span className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden>
                      {c.emoji}
                    </span>
                    <span>
                      <span className="block font-semibold">{c.name}</span>
                      <span className="block text-xs text-muted">{c.description}</span>
                    </span>
                  </span>
                </td>
                <td className="md:px-5 md:py-3">
                  <SpaceBadge scope={c.scope} />
                  <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted">
                    <Users className="size-3.5" aria-hidden /> {c.scope === "PLATFORM" ? "All companies" : "Northwind Logistics"}
                  </span>
                </td>
                <td className="text-muted md:px-5 md:py-3">
                  {c.createdByName} · {formatDate(c.createdAt)}
                </td>
                <td className="ml-auto tabular-nums md:px-5 md:py-3 md:text-right">{state.posts.filter((p) => p.space === `cohort:${c.id}`).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <CreateCohortModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
