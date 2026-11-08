"use client";

import { Award, Coins, Heart, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useDemo } from "@/lib/demo/store";
import { praisePoints, TIER_LABEL, tierOf } from "@/lib/demo/points";
import type { Praise } from "@/lib/demo/types";
import { cn, timeAgo } from "@/lib/utils";
import { PeoplePicker } from "./people-picker";

export function PraiseCard({ praise }: { praise: Praise }) {
  const { personById, me, toggleLike } = useDemo();
  const author = personById(praise.authorId);
  const recipient = personById(praise.recipientId);
  if (!author || !recipient) return null;
  const liked = !!me && praise.likes.includes(me.id);
  const isAchievement = praise.kind === "ACHIEVEMENT";

  return (
    <Card className="animate-enter p-5">
      <div className="flex items-start gap-3">
        <Avatar name={recipient.name} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug">
            <Link href={`/people/${recipient.id}`} className="font-semibold hover:underline">
              {recipient.name}
            </Link>{" "}
            <span className="text-muted">{isAchievement ? "achieved something big" : "was praised by"}</span>{" "}
            {!isAchievement && (
              <Link href={`/people/${author.id}`} className="font-semibold hover:underline">
                {author.name}
              </Link>
            )}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {recipient.jobTitle} · {timeAgo(praise.createdAt)}
          </p>
        </div>
        <Badge tone="points">
          <Coins aria-hidden />+{praise.points}
        </Badge>
      </div>

      <p className="mt-4 leading-relaxed text-fg">{praise.message}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={isAchievement ? "success" : "brand"}>
            {isAchievement ? <Award aria-hidden /> : <Sparkles aria-hidden />}
            {isAchievement ? "Achievement" : "Praise"}
          </Badge>
          {praise.value && <Badge>{praise.value}</Badge>}
          {isAchievement && <span className="text-xs text-muted">Shared by {author.name}</span>}
        </div>
        <button
          type="button"
          onClick={() => toggleLike(praise.id)}
          aria-pressed={liked}
          aria-label={`${liked ? "Remove your cheer" : "Cheer"} (${praise.likes.length} cheers)`}
          className={cn(
            "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition duration-150 active:scale-95",
            liked ? "bg-danger-soft text-danger" : "text-muted hover:bg-surface-2 hover:text-fg",
          )}
        >
          <Heart className={cn("size-4", liked && "fill-current")} aria-hidden />
          <span className="tabular-nums">{praise.likes.length}</span>
        </button>
      </div>
    </Card>
  );
}

export function GivePraiseModal({
  open,
  onClose,
  recipientId,
}: {
  open: boolean;
  onClose: () => void;
  recipientId?: string;
}) {
  const { givePraise, state, personById } = useDemo();
  const rules = state.company.pointsRules;
  const toast = useToast();
  const [to, setTo] = useState<string[]>(recipientId ? [recipientId] : []);
  const [kind, setKind] = useState<"PRAISE" | "ACHIEVEMENT">("PRAISE");
  const [value, setValue] = useState(state.company.values[0]);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ to?: string; message?: string }>({});
  const [loading, setLoading] = useState(false);

  function reset() {
    setTo(recipientId ? [recipientId] : []);
    setKind("PRAISE");
    setMessage("");
    setErrors({});
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!to[0]) errs.to = "Choose who you're recognising.";
    if (message.trim().length < 10) errs.message = "Add a few words (at least 10 characters) about what they did.";
    setErrors(errs);
    if (errs.message) document.getElementById("praise-message")?.focus();
    if (Object.keys(errs).length) return;
    setLoading(true);
    setTimeout(() => {
      givePraise({ recipientId: to[0], kind, message: message.trim(), value });
      setLoading(false);
      const r = personById(to[0])!;
      toast({
        title: `${r.name.split(" ")[0]} earned ${praisePoints(r, state.teams, rules)} points`,
        description: "Your praise is on the recognition wall and in the Lounge.",
      });
      reset();
      onClose();
    }, 400);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Recognise a colleague"
      description={`Praise earns ${rules.peer} points for a colleague, ${rules.manager} for a manager and ${rules.md} for the MD. It also appears in the Lounge.`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="praise-form" loading={loading}>
            Post praise
          </Button>
        </>
      }
    >
      <form id="praise-form" onSubmit={submit} noValidate className="flex flex-col gap-5">
        {!recipientId && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">
              Who are you recognising? <span className="text-danger" aria-hidden>*</span>
            </legend>
            <PeoplePicker selected={to} onChange={setTo} label="Choose a colleague" />
            {errors.to && (
              <p role="alert" className="mt-1.5 text-sm text-danger">
                {errors.to}
              </p>
            )}
          </fieldset>
        )}

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Type</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["PRAISE", "Praise", "Thank them for something they did", Sparkles],
                ["ACHIEVEMENT", "Achievement", "Celebrate a milestone or win", Award],
              ] as const
            ).map(([k, label, hint, Icon]) => (
              <label
                key={k}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
                  kind === k ? "border-brand bg-brand-soft" : "border-line hover:bg-surface-2",
                )}
              >
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} className="sr-only" />
                <Icon className="mt-0.5 size-5 text-brand-text" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold">{label}</span>
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Company value</legend>
          <div className="flex flex-wrap gap-2">
            {state.company.values.map((v) => (
              <label
                key={v}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm font-semibold transition",
                  value === v ? "border-brand bg-brand text-brand-fg" : "border-line text-muted hover:text-fg",
                )}
              >
                <input type="radio" name="value" value={v} checked={value === v} onChange={() => setValue(v)} className="sr-only" />
                {v}
              </label>
            ))}
          </div>
        </fieldset>

        {to[0] && personById(to[0]) && (
          <p role="status" className="-mt-1 flex items-center gap-2 rounded-xl bg-points-soft px-3 py-2.5 text-sm font-semibold text-points">
            <Coins className="size-4" aria-hidden />
            {personById(to[0])!.name.split(" ")[0]} earns {praisePoints(personById(to[0])!, state.teams, rules)} points (
            {TIER_LABEL[tierOf(personById(to[0])!, state.teams)].toLowerCase()})
          </p>
        )}

        <Field id="praise-message" label="Message" required error={errors.message} hint={`${message.length}/500`}>
          <Textarea
            id="praise-message"
            maxLength={500}
            placeholder="What did they do, and what difference did it make?"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "praise-message-error" : "praise-message-hint"}
          />
        </Field>
      </form>
    </Modal>
  );
}
