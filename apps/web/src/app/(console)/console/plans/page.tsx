"use client";

import { FEATURES } from "@platform/shared";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { useDemo } from "@/lib/demo/store";
import { FEATURE_LABEL } from "@/lib/nav";
import { cn, formatINR, formatNumber } from "@/lib/utils";

export default function PlansPage() {
  const { state, setPlanFeatures } = useDemo();
  const toast = useToast();

  return (
    <>
      <PageHeader title="Plans" description="What each plan includes. Changes apply to every customer on that plan." />
      <div className="grid gap-6 lg:grid-cols-3">
        {state.plans.map((plan) => {
          const customers = state.tenants.filter((t) => t.planCode === plan.code && t.status !== "SUSPENDED");
          const seats = customers.reduce((n, t) => n + t.seats, 0);
          const featured = plan.code === "pro";
          return (
            <Card key={plan.code} className={cn("flex flex-col p-6", featured && "border-brand ring-1 ring-brand")}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{plan.name}</h2>
                {featured && <Badge tone="brand">Most popular</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">{plan.description}</p>
              <p className="mt-5">
                <span className="text-3xl font-bold tabular-nums">{formatINR(plan.pricePerSeat)}</span>
                <span className="text-sm text-muted"> per seat / month</span>
              </p>
              <p className="mt-2 text-sm text-muted">
                {customers.length} customers · {formatNumber(seats)} seats
              </p>

              <h3 className="mt-6 text-sm font-semibold">Modules</h3>
              <ul className="mt-1">
                {FEATURES.map((f) => {
                  const on = plan.features.includes(f);
                  return (
                    <li key={f} className="flex items-center justify-between border-b border-line last:border-b-0">
                      <span className={cn("text-sm", !on && "text-muted")}>{FEATURE_LABEL[f]}</span>
                      <Switch
                        checked={on}
                        disabled={f === "profile"}
                        label={`${FEATURE_LABEL[f]} in ${plan.name}`}
                        onChange={(v) => {
                          setPlanFeatures(plan.code, v ? [...plan.features, f] : plan.features.filter((x) => x !== f));
                          toast({ title: `${FEATURE_LABEL[f]} ${v ? "added to" : "removed from"} ${plan.name}`, tone: "info" });
                        }}
                      />
                    </li>
                  );
                })}
              </ul>

              <h3 className="mt-6 text-sm font-semibold">Also included</h3>
              <ul className="mt-2 flex flex-col gap-2 text-sm">
                {plan.extras.map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {x}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-sm text-muted">Prices are placeholders until pricing is agreed.</p>
    </>
  );
}
