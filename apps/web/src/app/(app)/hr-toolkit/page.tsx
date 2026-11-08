"use client";

import { Brain, Copy, Download, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Guard } from "@/components/shell/guard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { HR_QUESTION_BANK } from "@/lib/demo/hr-questions";
import { cn } from "@/lib/utils";

export default function HrToolkitPage() {
  return (
    <Guard permission="assessments.review">
      <Toolkit />
    </Guard>
  );
}

function Toolkit() {
  const toast = useToast();
  const [active, setActive] = useState(HR_QUESTION_BANK[0].title);
  const section = HR_QUESTION_BANK.find((s) => s.title === active)!;
  const total = HR_QUESTION_BANK.reduce((n, s) => n + s.questions.length, 0);

  async function copy() {
    await navigator.clipboard.writeText(`${section.title}\n\n${section.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`);
    toast({ title: "Questions copied", description: `${section.questions.length} questions from ${section.title}.` });
  }

  return (
    <>
      <PageHeader
        title="HR toolkit"
        description={`${total} ready-to-use questions for every stage of the employee journey.`}
        actions={
          <a
            href="/hr-question-bank.pdf"
            download="HR question bank.pdf"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg shadow-card transition hover:opacity-90"
          >
            <Download className="size-4" aria-hidden /> Download PDF
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Question sets">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {HR_QUESTION_BANK.map((s) => (
              <li key={s.title} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(s.title)}
                  aria-current={active === s.title ? "true" : undefined}
                  className={cn(
                    "flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-semibold",
                    active === s.title ? "bg-brand-soft text-brand-text" : "text-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  {s.title}
                  <span className="text-xs tabular-nums opacity-70">{s.questions.length}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <FileText className="size-5 text-brand-text" aria-hidden /> {section.title}
              </h2>
              <p className="mt-1 text-sm text-muted">{section.note}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={copy}>
              <Copy aria-hidden /> Copy
            </Button>
          </div>
          <ol className="mt-5 flex flex-col gap-3">
            {section.questions.map((q, i) => (
              <li key={q} className="flex gap-3 rounded-xl border border-line p-3.5">
                <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-sm font-semibold tabular-nums">{i + 1}</span>
                <span className="pt-0.5">{q}</span>
              </li>
            ))}
          </ol>
          {section.title === "Psychometric follow-up" && (
            <p className="mt-5 flex items-center gap-2 text-sm">
              <Brain className="size-4 text-brand-text" aria-hidden />
              <Link href="/assessments" className="font-semibold text-brand-text hover:underline">
                See company assessment results
              </Link>
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
