"use client";

import { Building, IndianRupee, Plus, Search, Timer, Users } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState, PageHeader, StatCard } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { useDemo } from "@/lib/demo/store";
import type { Tenant } from "@/lib/demo/types";
import { formatDate, formatINR, formatNumber } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATUS_TONE = { ACTIVE: "success", TRIAL: "warning", SUSPENDED: "danger" } as const;
const STATUS_LABEL = { ACTIVE: "Active", TRIAL: "Trial", SUSPENDED: "Suspended" } as const;

export default function CustomersPage() {
  const { state } = useDemo();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | Tenant["status"]>("all");
  const [open, setOpen] = useState<Tenant | null>(null);
  const [adding, setAdding] = useState(false);

  const price = (code: string) => state.plans.find((p) => p.code === code)?.pricePerSeat ?? 0;
  const mrr = (t: Tenant) => (t.status === "ACTIVE" ? t.seats * price(t.planCode) : 0);

  const totals = useMemo(() => {
    const active = state.tenants.filter((t) => t.status === "ACTIVE");
    return {
      customers: active.length,
      seats: active.reduce((n, t) => n + t.seats, 0),
      mrr: active.reduce((n, t) => n + t.seats * (state.plans.find((p) => p.code === t.planCode)?.pricePerSeat ?? 0), 0),
      trials: state.tenants.filter((t) => t.status === "TRIAL").length,
    };
  }, [state.tenants, state.plans]);

  const rows = state.tenants
    .filter((t) => status === "all" || t.status === status)
    .filter((t) => !q.trim() || `${t.name} ${t.sector} ${t.slug}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <PageHeader
        title="Customers"
        description="Every company using the platform, their plan and usage."
        actions={
          <Button onClick={() => setAdding(true)}>
            <Plus aria-hidden /> New customer
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Paying customers" value={totals.customers} icon={Building} />
        <StatCard label="Paid seats" value={formatNumber(totals.seats)} icon={Users} tone="success" />
        <StatCard label="Monthly revenue" value={formatINR(totals.mrr)} icon={IndianRupee} tone="points" hint="Active customers only" />
        <StatCard label="In trial" value={totals.trials} icon={Timer} tone="warning" hint="Follow up before day 14" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
          <Tabs
            label="Filter by status"
            value={status}
            onChange={setStatus}
            tabs={[
              { id: "all", label: "All", count: state.tenants.length },
              { id: "ACTIVE", label: "Active" },
              { id: "TRIAL", label: "Trial" },
              { id: "SUSPENDED", label: "Suspended" },
            ]}
          />
          <div className="relative md:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input aria-label="Search customers" placeholder="Search by name or industry" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Building} title="No customers match" description="Try another search or status." />
        ) : (
          <table className="w-full text-sm">
            <caption className="sr-only">Customers</caption>
            <thead className="hidden bg-surface-2 text-left text-xs font-semibold tracking-wide text-muted uppercase md:table-header-group">
              <tr>
                <th scope="col" className="px-5 py-3">Company</th>
                <th scope="col" className="px-5 py-3">Plan</th>
                <th scope="col" className="px-5 py-3">Seats used</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="px-5 py-3 text-right">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const plan = state.plans.find((p) => p.code === t.planCode);
                const pct = t.seats ? Math.round((t.activeUsers / t.seats) * 100) : 0;
                return (
                  <tr
                    key={t.id}
                    className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 border-b border-line p-4 last:border-b-0 hover:bg-surface-2 md:table-row md:p-0"
                    onClick={() => setOpen(t)}
                  >
                    <td className="w-full md:w-auto md:px-5 md:py-3">
                      <button type="button" className="cursor-pointer text-left" onClick={() => setOpen(t)} aria-label={`Open ${t.name}`}>
                        <span className="block font-semibold">{t.name}</span>
                        <span className="block text-xs text-muted">
                          {t.sector} · {t.slug}.engage.app
                        </span>
                      </button>
                    </td>
                    <td className="md:px-5 md:py-3">
                      <Badge tone="brand">{plan?.name}</Badge>
                    </td>
                    <td className="md:px-5 md:py-3">
                      <span className="tabular-nums">
                        {formatNumber(t.activeUsers)} / {formatNumber(t.seats)}
                      </span>
                      <span className="mt-1 block h-1.5 w-28 rounded-full bg-surface-2" aria-hidden>
                        <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </span>
                    </td>
                    <td className="md:px-5 md:py-3">
                      <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                    </td>
                    <td className="ml-auto font-semibold tabular-nums md:px-5 md:py-3 md:text-right">{mrr(t) ? formatINR(mrr(t)) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {open && <CustomerModal tenant={open} onClose={() => setOpen(null)} />}
      <NewCustomerModal open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function CustomerModal({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const { state, updateTenant, signOut } = useDemo();
  const toast = useToast();
  const live = state.tenants.find((t) => t.id === tenant.id) ?? tenant;
  const [planCode, setPlanCode] = useState(live.planCode);
  const [seats, setSeats] = useState(String(live.seats));
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [error, setError] = useState<string>();
  const price = state.plans.find((p) => p.code === planCode)?.pricePerSeat ?? 0;

  function save() {
    const n = Number(seats);
    if (!Number.isInteger(n) || n < live.activeUsers) {
      return setError(`Seats must be a whole number of at least ${live.activeUsers} (current active users).`);
    }
    updateTenant(live.id, { planCode, seats: n });
    toast({ title: `${live.name} updated` });
    onClose();
  }

  function setStatus(status: Tenant["status"]) {
    updateTenant(live.id, { status });
    toast({ title: `${live.name} is now ${STATUS_LABEL[status].toLowerCase()}`, tone: "info" });
    setConfirmSuspend(false);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={live.name}
      description={`${live.sector} · customer since ${formatDate(live.createdAt)}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={save}>Save changes</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <dl className="grid grid-cols-2 gap-4 rounded-xl bg-surface-2 p-4 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="mt-1">
              <Badge tone={STATUS_TONE[live.status]}>{STATUS_LABEL[live.status]}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Active users</dt>
            <dd className="mt-1 font-semibold tabular-nums">{formatNumber(live.activeUsers)}</dd>
          </div>
          <div>
            <dt className="text-muted">Admin</dt>
            <dd className="mt-1 truncate font-semibold">{live.adminEmail}</dd>
          </div>
          <div>
            <dt className="text-muted">Workspace</dt>
            <dd className="mt-1 truncate font-semibold">{live.slug}.engage.app</dd>
          </div>
        </dl>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="plan" label="Plan">
            <Select id="plan" value={planCode} onChange={(e) => setPlanCode(e.target.value)}>
              {state.plans.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({formatINR(p.pricePerSeat)} per seat)
                </option>
              ))}
            </Select>
          </Field>
          <Field id="seats" label="Seats" error={error} hint={`Monthly: ${formatINR((Number(seats) || 0) * price)}`}>
            <Input
              id="seats"
              type="number"
              inputMode="numeric"
              min={live.activeUsers}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "seats-error" : "seats-hint"}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
          {live.slug === "northwind" && (
            <Button variant="secondary" onClick={signOut}>
              Sign out and open demo workspace
            </Button>
          )}
          {live.status !== "ACTIVE" && <Button variant="secondary" onClick={() => setStatus("ACTIVE")}>Activate</Button>}
          {live.status !== "SUSPENDED" &&
            (confirmSuspend ? (
              <span className="flex flex-wrap items-center gap-2 rounded-xl bg-danger-soft p-2 pl-3 text-sm">
                Employees will lose access immediately.
                <Button size="sm" variant="danger" onClick={() => setStatus("SUSPENDED")}>
                  Suspend
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmSuspend(false)}>
                  Cancel
                </Button>
              </span>
            ) : (
              <Button variant="ghost" className="text-danger" onClick={() => setConfirmSuspend(true)}>
                Suspend customer
              </Button>
            ))}
        </div>
      </div>
    </Modal>
  );
}

function NewCustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, addTenant } = useDemo();
  const toast = useToast();
  const blank = { name: "", slug: "", sector: "", planCode: "pro", seats: "200", adminEmail: "" };
  const [f, setF] = useState(blank);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof blank, string>>>({});

  function setName(name: string) {
    setF((x) => ({ ...x, name, slug: slugTouched ? x.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!f.name.trim()) errs.name = "Enter the company name.";
    if (!/^[a-z0-9-]{3,}$/.test(f.slug)) errs.slug = "Use at least 3 lowercase letters, numbers or dashes.";
    else if (state.tenants.some((t) => t.slug === f.slug)) errs.slug = "This address is already taken.";
    if (!f.sector.trim()) errs.sector = "Enter their industry.";
    if (!(Number(f.seats) > 0)) errs.seats = "Enter how many seats they're buying.";
    if (!EMAIL_RE.test(f.adminEmail.trim())) errs.adminEmail = "Enter the admin's work email.";
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) return document.getElementById(`nc-${first}`)?.focus();
    addTenant({ name: f.name.trim(), slug: f.slug, sector: f.sector.trim(), planCode: f.planCode, seats: Number(f.seats), adminEmail: f.adminEmail.trim(), status: "TRIAL" });
    toast({ title: `${f.name.trim()} created`, description: `A 14-day trial started. We emailed ${f.adminEmail.trim()} to set up their workspace.` });
    setF(blank);
    setSlugTouched(false);
    onClose();
  }

  const err = (k: keyof typeof blank) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `nc-${k}-error` : undefined });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New customer"
      description="Creates their workspace and emails their admin. They start on a 14-day trial."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-customer">
            Create customer
          </Button>
        </>
      }
    >
      <form id="new-customer" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field id="nc-name" label="Company name" required error={errors.name} className="sm:col-span-2">
          <Input id="nc-name" value={f.name} onChange={(e) => setName(e.target.value)} {...err("name")} />
        </Field>
        <Field id="nc-slug" label="Workspace address" required error={errors.slug} hint={`${f.slug || "company"}.engage.app`}>
          <Input
            id="nc-slug"
            value={f.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setF((x) => ({ ...x, slug: e.target.value.toLowerCase() }));
            }}
            {...err("slug")}
          />
        </Field>
        <Field id="nc-sector" label="Industry" required error={errors.sector}>
          <Input id="nc-sector" value={f.sector} onChange={(e) => setF((x) => ({ ...x, sector: e.target.value }))} {...err("sector")} />
        </Field>
        <Field id="nc-planCode" label="Plan">
          <Select id="nc-planCode" value={f.planCode} onChange={(e) => setF((x) => ({ ...x, planCode: e.target.value }))}>
            {state.plans.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name} ({formatINR(p.pricePerSeat)} per seat)
              </option>
            ))}
          </Select>
        </Field>
        <Field id="nc-seats" label="Seats" required error={errors.seats}>
          <Input id="nc-seats" type="number" inputMode="numeric" min={1} value={f.seats} onChange={(e) => setF((x) => ({ ...x, seats: e.target.value }))} {...err("seats")} />
        </Field>
        <Field id="nc-adminEmail" label="Admin email" required error={errors.adminEmail} className="sm:col-span-2">
          <Input id="nc-adminEmail" type="email" inputMode="email" value={f.adminEmail} onChange={(e) => setF((x) => ({ ...x, adminEmail: e.target.value }))} {...err("adminEmail")} />
        </Field>
      </form>
    </Modal>
  );
}
