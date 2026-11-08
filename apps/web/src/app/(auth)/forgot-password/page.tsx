"use client";

import { ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter the email you use to sign in, like name@company.com.");
      ref.current?.focus();
      return;
    }
    setError(undefined);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 700);
  }

  if (sent) {
    return (
      <div className="animate-enter text-center">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-muted">
          If an account exists for <span className="font-semibold text-fg">{email}</span>, we&apos;ve sent a link to reset your
          password. The link expires in 30 minutes.
        </p>
        {/* Reset on the way out: Next.js keeps this page alive, so it would reopen on this screen. */}
        <ButtonLink
          href="/login"
          variant="secondary"
          className="mt-8 w-full"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
        >
          Back to sign in
        </ButtonLink>
        <button type="button" onClick={() => setSent(false)} className="mt-4 cursor-pointer text-sm font-semibold text-brand-text hover:underline">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="animate-enter">
      <Link href="/login" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Back to sign in
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Reset your password</h1>
      <p className="mt-2 text-muted">Enter your work email and we&apos;ll send you a reset link.</p>
      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-5">
        <Field id="email" label="Work email" error={error}>
          <Input
            ref={ref}
            id="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? "email-error" : undefined}
          />
        </Field>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Send reset link
        </Button>
      </form>
    </div>
  );
}
