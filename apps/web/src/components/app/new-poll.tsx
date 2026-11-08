"use client";

import { BarChart3, Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useDemo } from "@/lib/demo/store";
import type { Space } from "@/lib/demo/types";

const MAX_OPTIONS = 6;

/** Create a poll in the Lounge or any cohort you belong to. */
export function NewPollModal({ open, onClose, defaultSpace = "lounge" }: { open: boolean; onClose: () => void; defaultSpace?: Space }) {
  const { state, me, addPoll, enabledModules } = useDemo();
  const toast = useToast();
  const [space, setSpace] = useState<Space>(defaultSpace);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [errors, setErrors] = useState<{ question?: string; options?: string }>({});

  const myCohorts = state.cohorts.filter((c) => me && c.memberIds.includes(me.id));
  const loungeOn = enabledModules.includes("lounge");

  function submit(e: FormEvent) {
    e.preventDefault();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    const errs: typeof errors = {};
    if (!question.trim()) errs.question = "Ask a question.";
    if (opts.length < 2) errs.options = "Add at least two options.";
    else if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) errs.options = "Each option needs to be different.";
    setErrors(errs);
    if (errs.question) return document.getElementById("poll-question")?.focus();
    if (errs.options) return;
    addPoll(space, question.trim(), opts);
    const where = space === "lounge" ? "the Lounge" : myCohorts.find((c) => `cohort:${c.id}` === space)?.name;
    toast({ title: "Poll is live", description: `Posted in ${where}. Everyone can vote now.` });
    setQuestion("");
    setOptions(["", ""]);
    setErrors({});
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New poll"
      description="Ask a question and let everyone vote. People can change their vote any time."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-poll">
            <BarChart3 aria-hidden /> Start poll
          </Button>
        </>
      }
    >
      <form id="new-poll" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Field id="poll-space" label="Post in">
          <Select id="poll-space" value={space} onChange={(e) => setSpace(e.target.value as Space)}>
            {loungeOn && <option value="lounge">Lounge (everyone)</option>}
            {myCohorts.length > 0 && (
              <optgroup label="Your cohorts">
                {myCohorts.map((c) => (
                  <option key={c.id} value={`cohort:${c.id}`}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </optgroup>
            )}
          </Select>
        </Field>
        <Field id="poll-question" label="Question" required error={errors.question}>
          <Input
            id="poll-question"
            maxLength={140}
            placeholder="e.g. Which day works best for the team outing?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            aria-invalid={!!errors.question}
            aria-describedby={errors.question ? "poll-question-error" : undefined}
          />
        </Field>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">
            Options <span className="text-muted">(2 to {MAX_OPTIONS})</span>
          </legend>
          <div className="flex flex-col gap-2">
            {options.map((o, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  aria-label={`Option ${i + 1}`}
                  placeholder={`Option ${i + 1}`}
                  maxLength={60}
                  value={o}
                  onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))}
                />
                {options.length > 2 && (
                  <Button size="icon" variant="ghost" aria-label={`Remove option ${i + 1}`} onClick={() => setOptions(options.filter((_, j) => j !== i))}>
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {options.length < MAX_OPTIONS && (
            <Button size="sm" variant="ghost" className="mt-2" onClick={() => setOptions([...options, ""])}>
              <Plus aria-hidden /> Add option
            </Button>
          )}
          {errors.options && (
            <p role="alert" className="mt-1.5 text-sm text-danger">
              {errors.options}
            </p>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}

/** A "New poll" button that opens the dialog. */
export function NewPollButton({ defaultSpace, size, variant = "secondary", label = "New poll" }: { defaultSpace?: Space; size?: "sm"; variant?: "primary" | "secondary" | "ghost"; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        <BarChart3 aria-hidden /> {label}
      </Button>
      {open && <NewPollModal open onClose={() => setOpen(false)} defaultSpace={defaultSpace} />}
    </>
  );
}
