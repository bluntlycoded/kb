"use client";

import { can } from "@platform/shared";
import { Megaphone, Pencil, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useDemo } from "@/lib/demo/store";
import { timeAgo } from "@/lib/utils";

/** HR's note pinned to the top of everyone's home page. */
export function HrNoteCard() {
  const { state, me, personById } = useDemo();
  const [editing, setEditing] = useState(false);
  const note = state.company.hrNote;
  const canEdit = !!me && can(me.role, "announcements.post");
  if (!note && !canEdit) return null;

  const author = note ? personById(note.authorId) : undefined;

  return (
    <>
      {note ? (
        <Card className="relative overflow-hidden border-points/30 p-5 sm:p-6">
          <span className="absolute inset-y-0 left-0 w-1 bg-points" aria-hidden />
          <div className="flex items-start gap-4">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-points-soft text-points">
              <Megaphone className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold tracking-wide text-points uppercase">HR&apos;s note</p>
              <h2 className="mt-1 text-lg font-bold tracking-tight">{note.title}</h2>
              <p className="mt-2 leading-relaxed whitespace-pre-wrap">{note.body}</p>
              {author && (
                <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <Avatar name={author.name} size="xs" />
                  {author.name}, {author.jobTitle} · {timeAgo(note.updatedAt)}
                </p>
              )}
            </div>
            {canEdit && (
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label="Edit HR's note">
                <Pencil aria-hidden /> <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-line px-5 text-left text-muted hover:border-points hover:text-fg"
        >
          <Plus className="size-5" aria-hidden /> Post an HR&apos;s note for everyone&apos;s home page
        </button>
      )}
      {canEdit && <HrNoteModal open={editing} onClose={() => setEditing(false)} />}
    </>
  );
}

function HrNoteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setHrNote } = useDemo();
  const toast = useToast();
  const [title, setTitle] = useState(state.company.hrNote?.title ?? "");
  const [body, setBody] = useState(state.company.hrNote?.body ?? "");
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});

  function save(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!title.trim()) errs.title = "Add a short title.";
    if (!body.trim()) errs.body = "Write the note.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setHrNote({ title: title.trim(), body: body.trim() });
    toast({ title: "HR's note published", description: "It's now at the top of everyone's home page." });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="HR's note"
      description="Shown at the top of every employee's home page."
      footer={
        <>
          {state.company.hrNote && (
            <Button
              variant="ghost"
              className="mr-auto text-danger"
              onClick={() => {
                setHrNote(null);
                toast({ title: "HR's note removed", tone: "info" });
                onClose();
              }}
            >
              Remove note
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="hr-note">
            Publish
          </Button>
        </>
      }
    >
      <form id="hr-note" onSubmit={save} noValidate className="flex flex-col gap-5">
        <Field id="note-title" label="Title" required error={errors.title}>
          <Input id="note-title" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={!!errors.title} aria-describedby={errors.title ? "note-title-error" : undefined} />
        </Field>
        <Field id="note-body" label="Note" required error={errors.body} hint={`${body.length}/600`}>
          <Textarea
            id="note-body"
            className="min-h-36"
            maxLength={600}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-invalid={!!errors.body}
            aria-describedby={errors.body ? "note-body-error" : "note-body-hint"}
          />
        </Field>
      </form>
    </Modal>
  );
}
