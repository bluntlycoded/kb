"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useDemo } from "@/lib/demo/store";
import { cn } from "@/lib/utils";

const EMOJIS = ["🪔", "📈", "💡", "🤝", "🏏", "🎄", "🏃", "🎨", "🎵", "📚", "🌱", "🍲", "🎮", "🏆", "✈️", "❤️"];

export function CreateCohortModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  const { createCohort, platformUser } = useDemo();
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (name.trim().length < 3) errs.name = "Give the cohort a name of at least 3 characters.";
    if (!description.trim()) errs.description = "Say in a line what this cohort is for.";
    setErrors(errs);
    if (errs.name) return document.getElementById("cohort-name")?.focus();
    if (errs.description) return document.getElementById("cohort-description")?.focus();
    const id = createCohort({ name: name.trim(), description: description.trim(), emoji });
    toast({
      title: `${emoji} ${name.trim()} is live`,
      description: platformUser ? "Every customer company can now see it." : "Everyone in the company has been added.",
    });
    setName("");
    setDescription("");
    onClose();
    onCreated?.(id);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a cohort"
      description={
        platformUser
          ? "Platform cohorts appear in every customer company. Use them for festivals and shared themes."
          : "A space for a topic everyone is talking about, like a festival, an event or a company milestone."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-cohort">
            Create cohort
          </Button>
        </>
      }
    >
      <form id="create-cohort" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Icon</legend>
          <div className="flex flex-wrap gap-1.5">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                aria-pressed={emoji === e}
                aria-label={`Use ${e}`}
                className={cn("inline-flex size-11 cursor-pointer items-center justify-center rounded-xl border text-xl", emoji === e ? "border-brand bg-brand-soft" : "border-line hover:bg-surface-2")}
              >
                {e}
              </button>
            ))}
          </div>
        </fieldset>
        <Field id="cohort-name" label="Name" required error={errors.name}>
          <Input
            id="cohort-name"
            maxLength={40}
            placeholder="e.g. Diwali 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "cohort-name-error" : undefined}
          />
        </Field>
        <Field id="cohort-description" label="What it's for" required error={errors.description}>
          <Textarea
            id="cohort-description"
            maxLength={160}
            placeholder="e.g. Plans, photos and wishes for the festival"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={!!errors.description}
            aria-describedby={errors.description ? "cohort-description-error" : undefined}
          />
        </Field>
      </form>
    </Modal>
  );
}
