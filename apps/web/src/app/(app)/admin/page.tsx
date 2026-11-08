"use client";

import { FEATURES } from "@platform/shared";
import { Check, Globe, KeyRound, Lock, Mail, ScrollText, Search, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { MicrosoftIcon, GoogleIcon } from "@/components/auth/brand-icons";
import { Guard } from "@/components/shell/guard";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { PageHeader, StatCard } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { GAMES, INDUSTRIES } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";
import type { AssessmentSharing, GameKey, PointsRules, TaskEditing } from "@/lib/demo/types";
import { FEATURE_LABEL, ROLE_LABEL } from "@/lib/nav";
import { cn, formatDate, formatINR, readableOn, timeAgo } from "@/lib/utils";

type Tab = "overview" | "branding" | "modules" | "engagement" | "permissions" | "security" | "audit";

const PRESETS = ["#4f46e5", "#0f766e", "#be123c", "#1d4ed8", "#7c3aed", "#c2410c", "#0f172a"];

const MODULE_HINT: Record<string, string> = {
  cohort: "Praise wall, achievements and points",
  news: "Local and industry news feeds",
  games: "Quizzes and games with live status",
  chat: "Direct messages and group chats",
  profile: "Employee profiles and skills",
};

export default function AdminPage() {
  return (
    <Guard permission="tenant.settings">
      <Admin />
    </Guard>
  );
}

function Admin() {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <>
      <PageHeader title="Company admin" description="Settings, branding and activity for your whole workspace." />
      <Tabs
        label="Admin sections"
        value={tab}
        onChange={setTab}
        className="mb-6 max-w-full overflow-x-auto"
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "branding", label: "Branding" },
          { id: "modules", label: "Modules" },
          { id: "engagement", label: "Games, points & news" },
          { id: "permissions", label: "Permissions" },
          { id: "security", label: "Sign-in & security" },
          { id: "audit", label: "Audit log" },
        ]}
      />
      <div role="tabpanel" aria-label={tab} className="animate-enter" key={tab}>
        {tab === "overview" && <Overview onGo={setTab} />}
        {tab === "branding" && <Branding />}
        {tab === "modules" && <Modules />}
        {tab === "engagement" && <Engagement />}
        {tab === "permissions" && <Permissions />}
        {tab === "security" && <Security />}
        {tab === "audit" && <Audit />}
      </div>
    </>
  );
}

function Overview({ onGo }: { onGo: (t: Tab) => void }) {
  const { state, enabledModules } = useDemo();
  const plan = state.plans.find((p) => p.code === state.company.planCode)!;
  const tenant = state.tenants.find((t) => t.slug === "northwind");
  const seats = tenant?.seats ?? 0;
  const used = tenant?.activeUsers ?? state.people.length;
  const admins = state.people.filter((p) => p.role === "COMPANY_ADMIN" || p.role === "HR");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Seats in use" value={`${used} / ${seats}`} icon={Users} hint={`${Math.round((used / seats) * 100)}% of your licence`} />
        <StatCard label="Modules on" value={`${enabledModules.length} of ${FEATURES.length}`} icon={Sparkles} tone="success" />
        <StatCard label="Monthly bill" value={formatINR(seats * plan.pricePerSeat)} icon={ScrollText} tone="points" hint={`${formatINR(plan.pricePerSeat)} per seat`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Current plan</p>
              <p className="mt-1 text-xl font-bold">{plan.name}</p>
              <p className="mt-1 text-sm text-muted">{plan.description}</p>
            </div>
            <Badge tone="success">Active</Badge>
          </div>
          <div className="mt-4 h-2 rounded-full bg-surface-2" role="progressbar" aria-label="Seats used" aria-valuemin={0} aria-valuemax={seats} aria-valuenow={used}>
            <div className="h-full rounded-full bg-brand" style={{ width: `${(used / seats) * 100}%` }} />
          </div>
          <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
            {[...plan.features.map((f) => FEATURE_LABEL[f]), ...plan.extras].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Check className="size-4 text-success" aria-hidden /> {f}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted">To change plan or add seats, contact your account manager.</p>
        </Card>

        <Card>
          <CardHeader
            title="Administrators"
            description="People with HR or admin access"
            action={
              <Button size="sm" variant="secondary" onClick={() => onGo("audit")}>
                View activity
              </Button>
            }
          />
          <ul className="mt-3 px-5 pb-4">
            {admins.map((p) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                <Avatar name={p.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted">{p.email}</p>
                </div>
                <Badge tone="brand">{ROLE_LABEL[p.role]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Branding() {
  const { state, updateCompany } = useDemo();
  const toast = useToast();
  const [name, setName] = useState(state.company.name);
  const [color, setColor] = useState(state.company.brandColor);
  const [error, setError] = useState<string>();
  const dirty = name !== state.company.name || color !== state.company.brandColor;

  function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Enter your company name.");
    setError(undefined);
    if (name.trim() !== state.company.name) updateCompany({ name: name.trim() });
    if (color !== state.company.brandColor) updateCompany({ brandColor: color });
    toast({ title: "Branding updated", description: "Everyone in the company sees the new look straight away." });
  }

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="flex flex-col gap-6 p-5">
        <Field id="company-name" label="Company name" error={error}>
          <Input id="company-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!error} aria-describedby={error ? "company-name-error" : undefined} />
        </Field>
        <fieldset>
          <legend className="text-sm font-medium">Brand colour</legend>
          <p className="mt-0.5 text-sm text-muted">Used for buttons, highlights and the sidebar. Text colour adjusts automatically for readability.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Use colour ${c}`}
                aria-pressed={color === c}
                className={cn("inline-flex size-11 cursor-pointer items-center justify-center rounded-xl border border-line ring-offset-2 ring-offset-surface transition", color === c && "ring-2 ring-fg")}
                style={{ background: c, color: readableOn(c) }}
              >
                {color === c && <Check className="size-5" aria-hidden />}
              </button>
            ))}
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-line px-3 text-sm font-semibold">
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" />
              Custom
            </label>
          </div>
        </fieldset>
        <div className="flex gap-2">
          <Button type="submit" disabled={!dirty}>
            Save branding
          </Button>
          {dirty && (
            <Button
              variant="ghost"
              onClick={() => {
                setName(state.company.name);
                setColor(state.company.brandColor);
              }}
            >
              Discard
            </Button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <p className="border-b border-line px-5 py-3 text-sm font-semibold text-muted">Preview</p>
        <div className="flex">
          <div className="hidden w-40 shrink-0 border-r border-line p-3 sm:block">
            <span className="flex items-center gap-2 text-sm font-bold">
              <span className="inline-flex size-7 items-center justify-center rounded-lg text-xs" style={{ background: color, color: readableOn(color) }}>
                {name.trim()[0]?.toUpperCase() ?? "E"}
              </span>
              <span className="truncate">{name || "Company"}</span>
            </span>
            <span className="mt-4 block rounded-lg px-2 py-1.5 text-xs font-semibold" style={{ background: `color-mix(in oklab, ${color} 14%, transparent)` }}>
              Home
            </span>
            <span className="block px-2 py-1.5 text-xs text-muted">Cohort</span>
            <span className="block px-2 py-1.5 text-xs text-muted">Games</span>
          </div>
          <div className="flex-1 p-4">
            <div className="rounded-xl p-4" style={{ background: color, color: readableOn(color) }}>
              <p className="text-xs opacity-80">{name || "Company"}</p>
              <p className="font-bold">Good morning, Ananya</p>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="inline-flex h-9 items-center rounded-lg px-3 text-xs font-semibold" style={{ background: color, color: readableOn(color) }}>
                Give praise
              </span>
              <span className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-xs font-semibold">Play a game</span>
            </div>
          </div>
        </div>
      </Card>
    </form>
  );
}

function Modules() {
  const { state, toggleModule } = useDemo();
  const toast = useToast();
  const plan = state.plans.find((p) => p.code === state.company.planCode)!;

  return (
    <Card>
      <CardHeader title="Modules" description="Turn features on or off for everyone. Changes apply immediately." />
      <ul className="mt-3 px-5 pb-2">
        {FEATURES.map((f) => {
          const inPlan = plan.features.includes(f);
          const on = inPlan && state.company.enabledModules.includes(f);
          return (
            <li key={f} className="flex items-center gap-4 border-b border-line py-3 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">
                  {FEATURE_LABEL[f]}
                  {!inPlan && (
                    <Badge tone="warning">
                      <Lock aria-hidden /> Not in {plan.name}
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted">{MODULE_HINT[f]}</p>
              </div>
              <Switch
                checked={on}
                disabled={!inPlan || f === "profile"}
                label={`${FEATURE_LABEL[f]} module`}
                onChange={(v) => {
                  toggleModule(f, v);
                  toast({ title: `${FEATURE_LABEL[f]} turned ${v ? "on" : "off"}`, tone: "info" });
                }}
              />
            </li>
          );
        })}
      </ul>
      <p className="px-5 pb-5 text-sm text-muted">Profiles are always on, because other modules depend on them.</p>
    </Card>
  );
}

function Engagement() {
  const { state, setGames, setPointsRules, setIndustries } = useDemo();
  const toast = useToast();
  const [rules, setRules] = useState<PointsRules>(state.company.pointsRules);
  const [rulesError, setRulesError] = useState<string>();
  const games = state.company.games;
  const industries = state.company.industries;
  const rulesDirty = JSON.stringify(rules) !== JSON.stringify(state.company.pointsRules);

  function saveRules(e: FormEvent) {
    e.preventDefault();
    const vals = [rules.peer, rules.manager, rules.md];
    if (vals.some((v) => !Number.isInteger(v) || v < 1 || v > 100)) return setRulesError("Use whole numbers from 1 to 100.");
    setRulesError(undefined);
    setPointsRules(rules);
    toast({ title: "Praise points updated", description: "New praise uses these values. Past praise keeps its points." });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Games" description="Choose which games your employees see." />
        <ul className="mt-3 px-5 pb-4">
          {GAMES.map((g) => {
            const on = games.includes(g.key);
            return (
              <li key={g.key} className="flex items-center gap-4 border-b border-line py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{g.name}</p>
                  <p className="text-sm text-muted">{g.description}</p>
                </div>
                <Switch
                  checked={on}
                  label={`${g.name} game`}
                  onChange={(v) => {
                    setGames(v ? [...games, g.key as GameKey] : games.filter((x) => x !== g.key));
                    toast({ title: `${g.name} turned ${v ? "on" : "off"}`, tone: "info" });
                  }}
                />
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Praise points" description="Points earned depend on who receives the praise." />
        <form onSubmit={saveRules} noValidate className="flex flex-col gap-4 px-5 pt-4 pb-5">
          {(
            [
              ["peer", "To a colleague", "Employee to employee"],
              ["manager", "To a manager", "Anyone who manages a team"],
              ["md", "To the Managing Director", "People marked as MD"],
            ] as const
          ).map(([k, label, hint]) => (
            <div key={k} className="flex items-center gap-4">
              <label htmlFor={`pts-${k}`} className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </label>
              <div className="w-24 shrink-0">
                <Input
                  id={`pts-${k}`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  className="text-right tabular-nums"
                  value={rules[k]}
                  onChange={(e) => setRules({ ...rules, [k]: Number(e.target.value) })}
                />
              </div>
            </div>
          ))}
          {rulesError && (
            <p role="alert" className="text-sm text-danger">
              {rulesError}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={!rulesDirty}>
              Save points
            </Button>
          </div>
        </form>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Current Affairs industries" description={`Employees see news from these industries. ${industries.length} of ${INDUSTRIES.length} selected.`} />
        <div className="grid gap-2 px-5 pt-4 pb-5 sm:grid-cols-2 lg:grid-cols-5">
          {INDUSTRIES.map((ind) => {
            const on = industries.includes(ind);
            return (
              <label
                key={ind}
                className={cn("flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-sm font-medium transition", on ? "border-brand bg-brand-soft" : "border-line hover:bg-surface-2")}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => {
                    if (on && industries.length === 1) return toast({ title: "Keep at least one industry", tone: "info" });
                    setIndustries(on ? industries.filter((x) => x !== ind) : [...industries, ind]);
                  }}
                  className="size-4 accent-[var(--brand)]"
                />
                {ind}
              </label>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Choice<T extends string>({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint: string; recommended?: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((o) => (
        <label
          key={o.value}
          className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition", value === o.value ? "border-brand bg-brand-soft" : "border-line hover:bg-surface-2")}
        >
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="mt-1 size-4 accent-[var(--brand)]" />
          <span>
            <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              {o.label}
              {o.recommended && <Badge tone="success">Recommended</Badge>}
            </span>
            <span className="mt-0.5 block text-sm text-muted">{o.hint}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

function Permissions() {
  const { state, setPeopleSettings } = useDemo();
  const toast = useToast();
  const saved = () => toast({ title: "Permissions updated", description: "The change applies to everyone straight away.", tone: "info" });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Psychometric results" description="Employees always decide whether to share their own results." />
        <fieldset className="px-5 pt-4 pb-5">
          <legend className="sr-only">Psychometric results</legend>
          <Choice<AssessmentSharing>
            name="assessment-sharing"
            value={state.company.assessmentSharing}
            onChange={(v) => {
              setPeopleSettings({ assessmentSharing: v });
              saved();
            }}
            options={[
              {
                value: "HR_CAN_REQUEST",
                label: "HR can request results",
                hint: "HR can ask someone to share. The employee gets a prompt and can accept or keep their results private.",
                recommended: true,
              },
              {
                value: "EMPLOYEE_CHOICE",
                label: "Employees share only on their own initiative",
                hint: "HR can't ask. HR and managers see anonymous averages and any results people choose to share.",
              },
            ]}
          />
        </fieldset>
      </Card>

      <Card>
        <CardHeader title="Tasks on profiles" description="Who can add and edit the tasks shown on an employee's profile." />
        <fieldset className="px-5 pt-4 pb-5">
          <legend className="sr-only">Tasks on profiles</legend>
          <Choice<TaskEditing>
            name="task-editing"
            value={state.company.taskEditing}
            onChange={(v) => {
              setPeopleSettings({ taskEditing: v });
              saved();
            }}
            options={[
              {
                value: "SELF_AND_MANAGER",
                label: "Employees and their managers",
                hint: "Managers can assign tasks to their team. Employees can mark them done but not delete them. HR can view only.",
                recommended: true,
              },
              {
                value: "SELF_ONLY",
                label: "Employees only",
                hint: "Each person manages their own task list. Tasks managers assigned earlier stay, and the employee can mark them done.",
              },
            ]}
          />
        </fieldset>
      </Card>
    </div>
  );
}

function Security() {
  const rows = [
    { icon: <MicrosoftIcon />, name: "Microsoft Entra ID", text: "Employees sign in with their Microsoft 365 account.", status: "Ready to connect", tone: "warning" as const },
    { icon: <GoogleIcon />, name: "Google Workspace", text: "Employees sign in with their Google account.", status: "Ready to connect", tone: "warning" as const },
    { icon: <Mail className="size-5" aria-hidden />, name: "Email and password", text: "Fallback for staff without a company account.", status: "On", tone: "success" as const },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader title="Sign-in methods" description="Your account manager connects single sign-on during onboarding." />
        <ul className="mt-3 px-5 pb-4">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center gap-4 border-b border-line py-4 last:border-b-0">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2">{r.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.name}</p>
                <p className="text-sm text-muted">{r.text}</p>
              </div>
              <Badge tone={r.tone}>{r.status}</Badge>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-5">
        <h2 className="font-semibold">Data and privacy</h2>
        <dl className="mt-4 flex flex-col gap-4 text-sm">
          {[
            [Globe, "Data region", "Chosen per customer at onboarding (e.g. India, Mumbai)"],
            [ShieldCheck, "Encryption", "In transit (TLS) and at rest"],
            [KeyRound, "Session length", "12 hours, then sign in again (adjustable)"],
            [Lock, "Private chats", "Proposed default: admins can't read private chats. To be confirmed."],
          ].map(([Icon, label, value]) => {
            const I = Icon as typeof Globe;
            return (
              <div key={label as string} className="flex gap-3">
                <I className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                <div>
                  <dt className="font-medium">{label as string}</dt>
                  <dd className="text-muted">{value as string}</dd>
                </div>
              </div>
            );
          })}
        </dl>
      </Card>
    </div>
  );
}

function Audit() {
  const { state, personById } = useDemo();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.audit.filter((a) => {
      const actor = personById(a.actorId)?.name ?? "";
      return !term || `${a.action} ${a.target} ${actor}`.toLowerCase().includes(term);
    });
  }, [state.audit, q, personById]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Audit log</h2>
          <p className="text-sm text-muted">Every change made by HR and admins.</p>
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <Input aria-label="Search the audit log" placeholder="Search actions or people" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Audit log</caption>
        <thead className="hidden bg-surface-2 text-left text-xs font-semibold tracking-wide text-muted uppercase sm:table-header-group">
          <tr>
            <th scope="col" className="px-5 py-3">Who</th>
            <th scope="col" className="px-5 py-3">Action</th>
            <th scope="col" className="px-5 py-3">Details</th>
            <th scope="col" className="px-5 py-3">When</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-muted">
                No activity matches &ldquo;{q}&rdquo;.
              </td>
            </tr>
          )}
          {rows.map((a) => {
            const actor = personById(a.actorId);
            return (
              <tr key={a.id} className="flex flex-wrap gap-x-3 gap-y-1 border-b border-line p-4 last:border-b-0 sm:table-row sm:p-0">
                <td className="w-full sm:w-auto sm:px-5 sm:py-3">
                  <span className="flex items-center gap-2 font-semibold">
                    {actor && <Avatar name={actor.name} size="xs" />}
                    {actor?.name ?? "System"}
                  </span>
                </td>
                <td className="sm:px-5 sm:py-3">{a.action}</td>
                <td className="text-muted sm:px-5 sm:py-3">{a.target}</td>
                <td className="text-muted sm:px-5 sm:py-3" title={formatDate(a.createdAt)}>
                  {timeAgo(a.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
