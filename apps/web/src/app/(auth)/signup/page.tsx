"use client";

import { ArrowLeft, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/auth/password-input";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useDemo } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDUSTRIES = [
  "Logistics & Supply Chain",
  "Pharmaceuticals",
  "Healthcare",
  "Financial Services",
  "Retail",
  "Hospitality",
  "Manufacturing",
  "Information Technology",
  "Other",
];
const SIZES = ["50 to 200", "201 to 500", "501 to 1,000", "1,001 to 5,000", "More than 5,000"];
const SEATS: Record<string, number> = { "50 to 200": 150, "201 to 500": 400, "501 to 1,000": 800, "1,001 to 5,000": 2500, "More than 5,000": 6000 };

type Errors = Partial<Record<"name" | "email" | "password" | "company" | "industry" | "size", string>>;

export default function SignupPage() {
  const { addTenant } = useDemo();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "", industry: "", size: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function focusFirst(errs: Errors) {
    const first = Object.keys(errs)[0];
    if (first) document.getElementById(first)?.focus();
  }

  function nextStep(e: FormEvent) {
    e.preventDefault();
    const errs: Errors = {};
    if (!form.name.trim()) errs.name = "Enter your full name.";
    if (!EMAIL_RE.test(form.email.trim())) errs.email = "Enter your work email, like name@company.com.";
    if (form.password.length < 8) errs.password = "Use at least 8 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirst(errs);
    setStep(2);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: Errors = {};
    if (!form.company.trim()) errs.company = "Enter your company's name.";
    if (!form.industry) errs.industry = "Choose your industry. We use it for the industry news feed.";
    if (!form.size) errs.size = "Choose your company size.";
    setErrors(errs);
    if (Object.keys(errs).length) return focusFirst(errs);
    setLoading(true);
    setTimeout(() => {
      const slug = form.company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      addTenant({
        name: form.company.trim(),
        slug,
        sector: form.industry,
        planCode: "pro",
        seats: SEATS[form.size] ?? 150,
        adminEmail: form.email.trim(),
        status: "TRIAL",
      });
      setLoading(false);
      setStep(3);
    }, 800);
  }

  if (step === 3) {
    return (
      <div className="animate-enter text-center">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
          <PartyPopper className="size-7" aria-hidden />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Your workspace is on its way</h1>
        <p className="mt-2 text-muted">
          We&apos;ve started a 14-day trial for <span className="font-semibold text-fg">{form.company}</span> and sent a confirmation
          to <span className="font-semibold text-fg">{form.email}</span>. Your account manager will be in touch to connect sign-in and
          import your employees.
        </p>
        {/* Reset on the way out: Next.js keeps this page alive, so it would reopen on this screen. */}
        <ButtonLink
          href="/login"
          size="lg"
          className="mt-8 w-full"
          onClick={() => {
            setStep(1);
            setForm({ name: "", email: "", password: "", company: "", industry: "", size: "" });
          }}
        >
          Explore the demo workspace
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="animate-enter">
      {step === 2 ? (
        <button
          type="button"
          onClick={() => setStep(1)}
          className="-ml-2 inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-muted hover:text-fg"
        >
          <ArrowLeft className="size-4" aria-hidden /> Back
        </button>
      ) : (
        <Link href="/login" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-muted hover:text-fg">
          <ArrowLeft className="size-4" aria-hidden /> Back to sign in
        </Link>
      )}

      <ol className="mt-4 flex items-center gap-3" aria-label="Sign-up progress">
        {["About you", "Your company"].map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const current = step === n;
          return (
            <li key={label} className="flex flex-1 flex-col gap-2" aria-current={current ? "step" : undefined}>
              <span className={cn("h-1.5 rounded-full", done || current ? "bg-brand" : "bg-line")} />
              <span className={cn("text-xs font-semibold", current ? "text-fg" : "text-muted")}>
                Step {n}: {label}
              </span>
            </li>
          );
        })}
      </ol>

      <h1 className="mt-6 text-3xl font-bold tracking-tight">{step === 1 ? "Set up your company" : "Tell us about your company"}</h1>
      <p className="mt-2 text-muted">
        {step === 1 ? "Start a free 14-day trial. No card needed." : "This sets up your workspace and news feeds."}
      </p>

      {step === 1 ? (
        <form onSubmit={nextStep} noValidate className="mt-8 flex flex-col gap-5">
          <Field id="name" label="Full name" required error={errors.name}>
            <Input id="name" autoComplete="name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-error" : undefined} />
          </Field>
          <Field id="email" label="Work email" required error={errors.email} hint="You'll be the company admin.">
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={set("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : "email-hint"}
            />
          </Field>
          <Field id="password" label="Password" required error={errors.password} hint="At least 8 characters.">
            <PasswordInput
              id="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : "password-hint"}
            />
          </Field>
          <Button type="submit" size="lg" className="mt-1 w-full">
            Continue
          </Button>
        </form>
      ) : (
        <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
          <Field id="company" label="Company name" required error={errors.company}>
            <Input id="company" autoComplete="organization" value={form.company} onChange={set("company")} aria-invalid={!!errors.company} aria-describedby={errors.company ? "company-error" : undefined} />
          </Field>
          <Field id="industry" label="Industry" required error={errors.industry}>
            <Select id="industry" value={form.industry} onChange={set("industry")} aria-invalid={!!errors.industry} aria-describedby={errors.industry ? "industry-error" : undefined}>
              <option value="">Choose an industry</option>
              {INDUSTRIES.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </Select>
          </Field>
          <Field id="size" label="Number of employees" required error={errors.size}>
            <Select id="size" value={form.size} onChange={set("size")} aria-invalid={!!errors.size} aria-describedby={errors.size ? "size-error" : undefined}>
              <option value="">Choose a size</option>
              {SIZES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
          <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
            Create workspace
          </Button>
          <p className="text-center text-xs text-muted">By creating a workspace you agree to the Terms of Service and Privacy Policy.</p>
        </form>
      )}
    </div>
  );
}
