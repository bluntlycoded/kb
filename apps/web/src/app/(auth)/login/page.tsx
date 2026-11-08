"use client";

import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { GoogleIcon, MicrosoftIcon } from "@/components/auth/brand-icons";
import { PasswordInput } from "@/components/auth/password-input";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { DEMO_ACCOUNTS } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const { signIn, hydrated, state } = useDemo();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [ssoNote, setSsoNote] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Already signed in? Skip the form.
  useEffect(() => {
    if (hydrated && state.session) router.replace(state.session.kind === "platform" ? "/console" : "/home");
  }, [hydrated, state.session, router]);

  function go(target: string) {
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next && next.startsWith("/") && target === "/home" ? next : target);
  }

  function complete(address: string) {
    setLoading(true);
    // Short delay so the loading state is visible, like a real network call.
    setTimeout(() => {
      const result = signIn(address);
      if (result.ok) {
        go(result.home);
        return;
      }
      setLoading(false);
      setErrors({ form: result.error });
    }, 500);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) next.email = "Enter your work email, like name@company.com.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (next.email) return emailRef.current?.focus();
    if (next.password) return passwordRef.current?.focus();
    complete(email);
  }

  return (
    <div className="animate-enter">
      <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-muted">Sign in to your company workspace.</p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={() => setSsoNote(true)}>
          <MicrosoftIcon /> Microsoft
        </Button>
        <Button variant="secondary" onClick={() => setSsoNote(true)}>
          <GoogleIcon /> Google
        </Button>
      </div>
      {ssoNote && (
        <p role="status" className="mt-3 flex gap-2 rounded-xl bg-brand-soft p-3 text-sm text-fg">
          <Info className="mt-0.5 size-4 shrink-0 text-brand-text" aria-hidden />
          Single sign-on is connected for each company during onboarding. For this demo, use a demo account below.
        </p>
      )}

      <div className="my-7 flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-line" />
        or sign in with email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {errors.form && (
          <p role="alert" className="rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">
            {errors.form}
          </p>
        )}
        <Field id="email" label="Work email" error={errors.email}>
          <Input
            ref={emailRef}
            id="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => email && !EMAIL_RE.test(email.trim()) && setErrors((x) => ({ ...x, email: "Enter a valid email address." }))}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </Field>
        <Field
          id="password"
          label="Password"
          error={errors.password}
          action={
            <Link href="/forgot-password" className="text-sm font-semibold text-brand-text hover:underline">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            ref={passwordRef}
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
        </Field>
        <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
          Sign in
        </Button>
      </form>

      <section aria-labelledby="demo-heading" className="mt-8 rounded-2xl border border-line bg-surface p-4">
        <h2 id="demo-heading" className="text-sm font-semibold">
          Demo accounts
        </h2>
        <p className="mt-0.5 text-sm text-muted">Sign in instantly as each role to see what they see.</p>
        <ul className="mt-3 flex flex-col gap-1">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button
                type="button"
                disabled={loading}
                onClick={() => complete(a.email)}
                className="group flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-surface-2 disabled:cursor-wait"
              >
                <Avatar name={a.who.split(",")[0]} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{a.label}</span>
                  <span className="block truncate text-xs text-muted">{a.who}</span>
                </span>
                <ArrowRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-fg" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-center text-sm text-muted">
        New to Engage?{" "}
        <Link href="/signup" className="font-semibold text-brand-text hover:underline">
          Set up your company
        </Link>
      </p>
    </div>
  );
}
