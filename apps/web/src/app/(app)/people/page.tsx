"use client";

import type { TenantRole } from "@platform/shared";
import { ArrowRightLeft, Search, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Guard } from "@/components/shell/guard";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { OFFICES } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";
import type { Person } from "@/lib/demo/types";
import { ROLE_LABEL } from "@/lib/nav";
import { cn, formatNumber } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function PeoplePage() {
  return (
    <Guard permission="profile.read.all">
      <People />
    </Guard>
  );
}

function People() {
  const { state } = useDemo();
  const [q, setQ] = useState("");
  const [team, setTeam] = useState("all");
  const [office, setOffice] = useState("all");
  const [moving, setMoving] = useState<Person | null>(null);
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.people
      .filter((p) => team === "all" || p.teamId === team)
      .filter((p) => office === "all" || p.officeId === office)
      .filter(
        (p) =>
          !term ||
          p.name.toLowerCase().includes(term) ||
          p.jobTitle.toLowerCase().includes(term) ||
          p.skills.some((s) => s.name.toLowerCase().includes(term)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.people, q, team, office]);

  const teamName = (id: string) => state.teams.find((t) => t.id === id)?.name ?? "No team";
  const filtered = q || team !== "all" || office !== "all";

  return (
    <>
      <PageHeader
        title="People"
        description="Everyone at the company. Search by name, role or skill to build the right teams."
        actions={
          <Button onClick={() => setAdding(true)}>
            <UserPlus aria-hidden /> Add employee
          </Button>
        }
      />

      <section aria-label="Teams" className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {state.teams.map((t) => {
          const count = state.people.filter((p) => p.teamId === t.id).length;
          const mgr = state.people.find((p) => p.id === t.managerId);
          const selected = team === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setTeam(selected ? "all" : t.id)}
              className={cn(
                "cursor-pointer rounded-2xl border p-4 text-left transition",
                selected ? "border-brand bg-brand-soft" : "border-line bg-surface hover:border-brand/50",
              )}
            >
              <p className="text-sm font-semibold">{t.name}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{count}</p>
              <p className="mt-1 truncate text-xs text-muted">Lead: {mgr?.name ?? "None"}</p>
            </button>
          );
        })}
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input aria-label="Search people" placeholder="Search name, role or skill (e.g. SQL)" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
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

        <p className="px-5 pt-3 text-sm text-muted" aria-live="polite">
          Showing {rows.length} of {state.people.length} people
          {filtered && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setTeam("all");
                setOffice("all");
              }}
              className="ml-2 cursor-pointer font-semibold text-brand-text hover:underline"
            >
              Clear filters
            </button>
          )}
        </p>

        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No one matches" description="Try a different name or skill, or clear the filters." />
        ) : (
          <table className="mt-2 w-full text-sm">
            <caption className="sr-only">Employees</caption>
            <thead className="hidden border-y border-line bg-surface-2 text-left text-xs font-semibold tracking-wide text-muted uppercase md:table-header-group">
              <tr>
                <th scope="col" className="px-5 py-3">Employee</th>
                <th scope="col" className="px-5 py-3">Team</th>
                <th scope="col" className="px-5 py-3">Office</th>
                <th scope="col" className="px-5 py-3">Top skills</th>
                <th scope="col" className="px-5 py-3 text-right">Points</th>
                <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line p-4 last:border-b-0 md:table-row md:p-0">
                  <td className="w-full md:w-auto md:px-5 md:py-3">
                    <Link href={`/people/${p.id}`} className="flex items-center gap-3 hover:underline">
                      <Avatar name={p.name} size="sm" status={p.status} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 font-semibold">
                          {p.name}
                          {p.role !== "EMPLOYEE" && <Badge tone="brand">{ROLE_LABEL[p.role]}</Badge>}
                        </span>
                        <span className="block text-xs text-muted">{p.jobTitle}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="md:px-5 md:py-3">{teamName(p.teamId)}</td>
                  <td className="text-muted md:px-5 md:py-3">{OFFICES.find((o) => o.id === p.officeId)?.city}</td>
                  <td className="hidden md:table-cell md:px-5 md:py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.skills.slice(0, 2).map((s) => (
                        <Badge key={s.name}>{s.name}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="font-semibold text-points tabular-nums md:px-5 md:py-3 md:text-right">{formatNumber(p.points)}</td>
                  <td className="ml-auto md:px-5 md:py-3 md:text-right">
                    <Button size="sm" variant="secondary" onClick={() => setMoving(p)} aria-label={`Move ${p.name} to another team`}>
                      <ArrowRightLeft aria-hidden /> Move
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {moving && <MoveTeamModal person={moving} onClose={() => setMoving(null)} />}
      <AddEmployeeModal open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function MoveTeamModal({ person, onClose }: { person: Person; onClose: () => void }) {
  const { state, moveToTeam } = useDemo();
  const toast = useToast();
  const [teamId, setTeamId] = useState(person.teamId);
  const current = state.teams.find((t) => t.id === person.teamId);
  const target = state.teams.find((t) => t.id === teamId);
  const targetMembers = state.people.filter((p) => p.teamId === teamId);
  const sharedSkills = targetMembers.flatMap((m) => m.skills.map((s) => s.name)).filter((s) => person.skills.some((ps) => ps.name === s));

  function save() {
    moveToTeam(person.id, teamId);
    toast({ title: `${person.name.split(" ")[0]} moved to ${target?.name}`, description: "Their manager and teammates will see the change." });
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Move ${person.name}`}
      description={`Currently in ${current?.name ?? "no team"}.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={teamId === person.teamId}>
            Move to {target?.name}
          </Button>
        </>
      }
    >
      <Field id="move-team" label="New team">
        <Select id="move-team" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          {state.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
      {teamId !== person.teamId && (
        <div className="mt-5 rounded-xl bg-surface-2 p-4 text-sm">
          <p className="font-semibold">About {target?.name}</p>
          <p className="mt-1 text-muted">
            {targetMembers.length} people · led by {state.people.find((p) => p.id === target?.managerId)?.name ?? "no one"}
          </p>
          <p className="mt-2 text-muted">
            {sharedSkills.length > 0
              ? `Skill overlap: ${[...new Set(sharedSkills)].join(", ")}.`
              : `${person.name.split(" ")[0]} would bring new skills: ${person.skills.map((s) => s.name).join(", ") || "none listed"}.`}
          </p>
        </div>
      )}
    </Modal>
  );
}

function AddEmployeeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, addEmployee } = useDemo();
  const toast = useToast();
  const blank = { name: "", email: "", jobTitle: "", teamId: state.teams[0].id, officeId: OFFICES[0].id, role: "EMPLOYEE" as TenantRole };
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "jobTitle", string>>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = "Enter their full name.";
    if (!EMAIL_RE.test(form.email.trim())) errs.email = "Enter a valid work email.";
    else if (state.people.some((p) => p.email === form.email.trim().toLowerCase())) errs.email = "Someone already uses this email.";
    if (!form.jobTitle.trim()) errs.jobTitle = "Enter their job title.";
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) return document.getElementById(`emp-${first}`)?.focus();
    addEmployee({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase(), jobTitle: form.jobTitle.trim() });
    toast({ title: `Invite sent to ${form.email.trim()}`, description: "They'll appear as offline until they sign in." });
    setForm(blank);
    onClose();
  }

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add employee"
      description="We'll email them an invite to join the workspace."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="add-emp">
            Send invite
          </Button>
        </>
      }
    >
      <form id="add-emp" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field id="emp-name" label="Full name" required error={errors.name} className="sm:col-span-2">
          <Input id="emp-name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "emp-name-error" : undefined} />
        </Field>
        <Field id="emp-email" label="Work email" required error={errors.email} className="sm:col-span-2">
          <Input id="emp-email" type="email" inputMode="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "emp-email-error" : undefined} />
        </Field>
        <Field id="emp-jobTitle" label="Job title" required error={errors.jobTitle} className="sm:col-span-2">
          <Input id="emp-jobTitle" value={form.jobTitle} onChange={set("jobTitle")} aria-invalid={!!errors.jobTitle} aria-describedby={errors.jobTitle ? "emp-jobTitle-error" : undefined} />
        </Field>
        <Field id="emp-team" label="Team">
          <Select id="emp-team" value={form.teamId} onChange={set("teamId")}>
            {state.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="emp-office" label="Office">
          <Select id="emp-office" value={form.officeId} onChange={set("officeId")}>
            {OFFICES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.city}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="emp-role" label="Access level" className="sm:col-span-2" hint="Managers see their team's details. HR sees everyone.">
          <Select id="emp-role" value={form.role} onChange={set("role")} aria-describedby="emp-role-hint">
            {(["EMPLOYEE", "MANAGER", "HR"] as const).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
