"use client";

import { can } from "@platform/shared";
import { Brain, Check, ClipboardCheck, Lock, Mail, RotateCcw, Send, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Guard } from "@/components/shell/guard";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { BarList } from "@/components/ui/chart";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { band, MIN_GROUP, SCALE, score, STATEMENTS, TRAITS } from "@/lib/demo/assessment";
import { useDemo } from "@/lib/demo/store";
import type { AssessmentResult, Person, Trait } from "@/lib/demo/types";
import { cn, formatDate, timeAgo } from "@/lib/utils";

type View = "me" | "team" | "company";

export default function AssessmentsPage() {
  return (
    <Guard feature="assessments">
      <Assessments />
    </Guard>
  );
}

function Assessments() {
  const { me, state } = useDemo();
  const [view, setView] = useState<View>("me");
  if (!me) return null;
  const isManager = state.teams.some((t) => t.managerId === me.id);
  const isHr = can(me.role, "assessments.review");

  const tabs: { id: View; label: string }[] = [{ id: "me", label: "My results" }];
  if (isManager) tabs.push({ id: "team", label: "My team" });
  if (isHr) tabs.push({ id: "company", label: "Company" });

  return (
    <>
      <PageHeader
        title="Psychometric assessment"
        description="A 5-minute work-style check-in. Understand how you like to work, and how your team works together."
      />
      {tabs.length > 1 && <Tabs label="Assessment views" value={view} onChange={setView} className="mb-6" tabs={tabs} />}
      {view === "me" && <Mine me={me} />}
      {view === "team" && isManager && <TeamView me={me} />}
      {view === "company" && isHr && <CompanyView />}
      <p className="mt-8 flex items-start gap-2 text-sm text-muted">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
        This is a self-reflection tool, not a clinical or hiring test. Managers and HR only see your results if you choose to share them
        {state.company.assessmentSharing === "HR_CAN_REQUEST" ? ", and HR can ask you to" : ""}. You can stop sharing at any time. Group averages are shown
        only for groups of {MIN_GROUP} or more.
      </p>
    </>
  );
}

function ScoreBars({ scores }: { scores: Record<Trait, number> }) {
  return (
    <ul className="flex flex-col gap-5">
      {TRAITS.map((t) => {
        const v = scores[t.key];
        return (
          <li key={t.key}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">{t.name}</span>
              <span className="text-sm">
                <span className="font-semibold tabular-nums">{v}</span>
                <span className="text-muted"> / 100 · {band(v)}</span>
              </span>
            </div>
            <div className="mt-1.5 h-2.5 rounded-full bg-surface-2" role="img" aria-label={`${t.name}: ${v} out of 100`}>
              <div className="h-full rounded-full bg-chart-mark" style={{ width: `${Math.max(v, 2)}%` }} />
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {band(v) === "High" ? t.high : band(v) === "Low" ? t.low : "Balanced: you lean either way depending on the situation."}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function RequestBanner({ me }: { me: Person }) {
  const { state, personById, answerRequest } = useDemo();
  const toast = useToast();
  const pending = state.assessmentRequests.filter((r) => r.userId === me.id && r.status === "PENDING");
  const result = state.assessments.find((a) => a.userId === me.id);
  if (!result || result.sharedWithHr || state.company.assessmentSharing !== "HR_CAN_REQUEST") return null;
  return (
    <>
      {pending.map((r) => {
        const who = personById(r.requestedById);
        return (
          <Card key={r.id} role="status" className="mb-6 flex flex-col gap-4 border-brand/40 bg-brand-soft p-5 sm:flex-row sm:items-center">
            <Mail className="size-5 shrink-0 text-brand-text" aria-hidden />
            <p className="flex-1 text-sm">
              <span className="font-semibold">{who?.name ?? "HR"}</span>
              {who && <span className="text-muted"> ({who.jobTitle})</span>} asked to see your work-style results, {timeAgo(r.createdAt)}. Sharing
              lets your manager and HR see your scores. It&apos;s your choice, and you can stop sharing later.
            </p>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  answerRequest(r.id, false);
                  toast({ title: "Request declined", description: "Your results stay private.", tone: "info" });
                }}
              >
                Keep private
              </Button>
              <Button
                onClick={() => {
                  answerRequest(r.id, true);
                  toast({ title: "Results shared", description: "Your manager and HR can now see them." });
                }}
              >
                Share results
              </Button>
            </div>
          </Card>
        );
      })}
    </>
  );
}

function Mine({ me }: { me: Person }) {
  const { state, setResultsShared } = useDemo();
  const toast = useToast();
  const result = state.assessments.find((a) => a.userId === me.id);
  const [taking, setTaking] = useState(false);

  if (taking || !result) {
    return taking ? (
      <Questionnaire onDone={() => setTaking(false)} />
    ) : (
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand-text">
            <Brain className="size-8" aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="text-xl font-bold tracking-tight">Discover your work style</h2>
            <p className="mt-1 text-muted">
              20 statements, about 5 minutes. You&apos;ll see how you score on curiosity, organisation, drive, collaboration and composure, with
              tips for working well with others.
            </p>
          </div>
          <Button size="lg" onClick={() => setTaking(true)}>
            Start
          </Button>
        </div>
      </Card>
    );
  }

  const top = [...TRAITS].sort((a, b) => result.scores[b.key] - result.scores[a.key]);
  return (
    <>
    <RequestBanner me={me} />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Your work style</h2>
            <p className="text-sm text-muted">Completed {formatDate(result.completedAt)}</p>
          </div>
          <Badge tone={result.sharedWithHr ? "success" : "neutral"}>{result.sharedWithHr ? "Shared with your manager and HR" : "Private to you"}</Badge>
        </div>
        <ScoreBars scores={result.scores} />
      </Card>
      <aside className="flex flex-col gap-4">
        <Card className="p-5">
          <h2 className="font-semibold">Your strongest traits</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {top.slice(0, 2).map((t) => (
              <li key={t.key} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>
                  <span className="font-semibold">{t.name}:</span> {t.high}
                </span>
              </li>
            ))}
          </ul>
          <h2 className="mt-5 font-semibold">A tip for you</h2>
          <p className="mt-2 text-sm text-muted">{top.at(-1)!.tip}</p>
        </Card>
        <Card className="p-5">
          <h2 className="font-semibold">Who can see your results</h2>
          <p className="mt-1 text-sm text-muted">
            {result.sharedWithHr ? "Your manager and HR can see your scores." : "Only you. Managers and HR see anonymous group averages."}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-3"
            onClick={() => {
              setResultsShared(!result.sharedWithHr);
              toast({ title: result.sharedWithHr ? "You stopped sharing" : "Results shared", tone: "info" });
            }}
          >
            {result.sharedWithHr ? "Stop sharing" : "Share with my manager and HR"}
          </Button>
        </Card>
        <Button variant="secondary" onClick={() => setTaking(true)}>
          <RotateCcw aria-hidden /> Retake the assessment
        </Button>
      </aside>
    </div>
    </>
  );
}

function Questionnaire({ onDone }: { onDone: () => void }) {
  const { saveAssessment } = useDemo();
  const toast = useToast();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [share, setShare] = useState(false);
  const [error, setError] = useState(false);
  const answered = Object.keys(answers).length;

  function submit(e: FormEvent) {
    e.preventDefault();
    const missing = STATEMENTS.find((s) => !answers[s.id]);
    if (missing) {
      setError(true);
      document.getElementById(`q-${missing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    saveAssessment(score(answers), share);
    toast({ title: "Assessment complete", description: share ? "Your manager and HR can now see your results." : "Your results are private to you." });
    onDone();
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="sticky top-16 z-20 -mx-4 mb-4 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">
            {answered} of {STATEMENTS.length} answered
          </span>
          <button type="button" onClick={onDone} className="cursor-pointer font-semibold text-muted hover:text-fg">
            Cancel
          </button>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={STATEMENTS.length} aria-valuenow={answered} aria-label="Progress">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(answered / STATEMENTS.length) * 100}%` }} />
        </div>
      </div>
      <p className="mb-4 text-muted">How much do you agree with each statement? There are no right or wrong answers. Go with your first instinct.</p>
      <ol className="flex flex-col gap-3">
        {STATEMENTS.map((s, i) => {
          const missing = error && !answers[s.id];
          return (
            <li key={s.id} id={`q-${s.id}`}>
              <Card className={cn("p-4 sm:p-5", missing && "border-danger")}>
                <fieldset>
                  <legend className="font-medium">
                    <span className="mr-2 text-muted tabular-nums">{i + 1}.</span>
                    {s.text}
                  </legend>
                  <div className="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2">
                    {SCALE.map((label, v) => {
                      const on = answers[s.id] === v + 1;
                      return (
                        <label
                          key={label}
                          className={cn(
                            "flex min-h-14 cursor-pointer flex-col items-center justify-center rounded-xl border px-1 py-2 text-center text-[11px] leading-tight font-medium transition sm:text-xs",
                            on ? "border-brand bg-brand text-brand-fg" : "border-line hover:border-brand/60",
                          )}
                        >
                          <input type="radio" name={s.id} value={v + 1} checked={on} onChange={() => setAnswers({ ...answers, [s.id]: v + 1 })} className="sr-only" />
                          {label}
                        </label>
                      );
                    })}
                  </div>
                  {missing && <p className="mt-2 text-sm text-danger">Choose an answer for this statement.</p>}
                </fieldset>
              </Card>
            </li>
          );
        })}
      </ol>
      <Card className="mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <label className="flex flex-1 cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-0.5 size-4 accent-[var(--brand)]" />
          <span>
            <span className="font-semibold">Share my results with my manager and HR.</span>
            <span className="block text-muted">If you don&apos;t, they only see anonymous group averages.</span>
          </span>
        </label>
        <Button type="submit" size="lg">
          See my results
        </Button>
      </Card>
    </form>
  );
}

function averages(results: AssessmentResult[]) {
  return TRAITS.map((t) => ({ label: t.name, value: Math.round(results.reduce((n, r) => n + r.scores[t.key], 0) / results.length) }));
}

function SharedTable({ results }: { results: AssessmentResult[] }) {
  const { personById } = useDemo();
  const shared = results.filter((r) => r.sharedWithHr);
  if (shared.length === 0) return <p className="px-5 pt-3 pb-5 text-sm text-muted">No one has shared their individual results yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="mt-2 w-full text-sm">
        <caption className="sr-only">Shared results</caption>
        <thead className="border-y border-line bg-surface-2 text-left text-xs font-semibold tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-5 py-3">Person</th>
            {TRAITS.map((t) => (
              <th key={t.key} scope="col" className="px-3 py-3 text-right">
                {t.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shared.map((r) => {
            const p = personById(r.userId);
            if (!p) return null;
            return (
              <tr key={r.userId} className="border-b border-line last:border-b-0">
                <td className="px-5 py-3">
                  <Link href={`/people/${p.id}`} className="flex items-center gap-2 font-semibold hover:underline">
                    <Avatar name={p.name} size="xs" /> {p.name}
                  </Link>
                </td>
                {TRAITS.map((t) => (
                  <td key={t.key} className="px-3 py-3 text-right tabular-nums">
                    {r.scores[t.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TeamView({ me }: { me: Person }) {
  const { state } = useDemo();
  const teamIds = state.teams.filter((t) => t.managerId === me.id).map((t) => t.id);
  const members = state.people.filter((p) => teamIds.includes(p.teamId) && p.id !== me.id);
  const results = state.assessments.filter((a) => members.some((m) => m.id === a.userId));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Team members" value={members.length} icon={Users} />
        <StatCard label="Completed" value={`${results.length} of ${members.length}`} icon={ClipboardCheck} tone="success" />
        <StatCard label="Shared with you" value={results.filter((r) => r.sharedWithHr).length} icon={Check} tone="brand" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Team work style" description="Average score out of 100" />
          <div className="px-5 pt-5 pb-3">
            {results.length >= MIN_GROUP ? (
              <BarList data={averages(results)} valueLabel="average score" summary="Your team's average score on each trait." />
            ) : (
              <EmptyState
                icon={Lock}
                title="Not enough results yet"
                description={`Averages appear once ${MIN_GROUP} team members have completed the assessment. ${results.length} so far.`}
              />
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Who has taken it" />
          <ul className="mt-2 px-5 pb-4">
            {members.map((m) => {
              const done = results.find((r) => r.userId === m.id);
              return (
                <li key={m.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
                  <Avatar name={m.name} size="sm" />
                  <span className="flex-1 text-sm font-semibold">{m.name}</span>
                  <Badge tone={done ? "success" : "neutral"}>{done ? (done.sharedWithHr ? "Shared" : "Completed, private") : "Not yet"}</Badge>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
      <Card>
        <CardHeader title="Shared individual results" description="Only people who chose to share appear here." />
        <SharedTable results={results} />
      </Card>
    </div>
  );
}

/** People who completed the assessment but kept it private. HR may ask; the employee decides. */
function RequestList({ results }: { results: AssessmentResult[] }) {
  const { state, personById, requestResults } = useDemo();
  const toast = useToast();
  const privateOnes = results.filter((r) => !r.sharedWithHr);
  return (
    <Card>
      <CardHeader title="Completed, kept private" description="You can ask to see someone's results. They choose whether to share." />
      {privateOnes.length === 0 ? (
        <p className="px-5 pt-3 pb-5 text-sm text-muted">Everyone who completed it has shared their results.</p>
      ) : (
        <ul className="mt-2 px-5 pb-4">
          {privateOnes.map((r) => {
            const p = personById(r.userId);
            if (!p) return null;
            const last = state.assessmentRequests.find((q) => q.userId === r.userId);
            return (
              <li key={r.userId} className="flex flex-wrap items-center gap-3 border-b border-line py-3 last:border-b-0">
                <Avatar name={p.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted">Completed {formatDate(r.completedAt)}</p>
                </div>
                {last?.status === "PENDING" ? (
                  <Badge tone="warning">Requested {timeAgo(last.createdAt)}, waiting</Badge>
                ) : last?.status === "DECLINED" ? (
                  <Badge>Chose to keep private</Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      requestResults(p.id);
                      toast({ title: `Request sent to ${p.name.split(" ")[0]}`, description: "They'll decide whether to share.", tone: "info" });
                    }}
                  >
                    <Send aria-hidden /> Request results
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function CompanyView() {
  const { state } = useDemo();
  const results = state.assessments;
  const byTeam = useMemo(
    () =>
      state.teams.map((t) => {
        const ids = state.people.filter((p) => p.teamId === t.id).map((p) => p.id);
        return { team: t.name, size: ids.length, done: results.filter((r) => ids.includes(r.userId)).length };
      }),
    [state.teams, state.people, results],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Participation"
          value={`${Math.round((results.length / state.people.length) * 100)}%`}
          icon={ClipboardCheck}
          tone="success"
          hint={`${results.length} of ${state.people.length} people`}
        />
        <StatCard label="Shared with HR" value={results.filter((r) => r.sharedWithHr).length} icon={Check} tone="brand" />
        <StatCard label="Private" value={results.filter((r) => !r.sharedWithHr).length} icon={Lock} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Company work style" description="Average score out of 100, everyone who completed it" />
          <div className="px-5 pt-5 pb-3">
            <BarList data={averages(results)} valueLabel="average score" summary="Company average score on each trait." />
          </div>
        </Card>
        <Card>
          <CardHeader title="Participation by team" />
          <ul className="mt-2 px-5 pb-4">
            {byTeam.map((t) => (
              <li key={t.team} className="flex items-center justify-between border-b border-line py-3 text-sm last:border-b-0">
                <span className="font-semibold">{t.team}</span>
                <span className="text-muted tabular-nums">
                  {t.done} of {t.size} completed
                </span>
              </li>
            ))}
          </ul>
          <p className="px-5 pb-5 text-sm">
            <Link href="/hr-toolkit" className="font-semibold text-brand-text hover:underline">
              Open the HR toolkit
            </Link>{" "}
            for question banks to use in follow-up conversations.
          </p>
        </Card>
      </div>
      {state.company.assessmentSharing === "HR_CAN_REQUEST" && <RequestList results={results} />}
      <Card>
        <CardHeader title="Shared individual results" description="Only people who chose to share appear here." />
        <SharedTable results={results} />
      </Card>
    </div>
  );
}
