"use client";

import { CheckCircle2, CircleDashed, ClipboardList, Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { useDemo } from "@/lib/demo/store";
import type { Person, Task } from "@/lib/demo/types";

/**
 * Work the person has taken on. The person edits their own tasks. If the company allows it,
 * their manager can assign tasks too; the person can mark those done but not delete them.
 */
export function TasksCard({ person }: { person: Person }) {
  const { me, state, setTasksFor, personById } = useDemo();
  const toast = useToast();
  const [editing, setEditing] = useState<Task | "new" | null>(null);
  if (!me) return null;

  const isSelf = me.id === person.id;
  const isManager =
    !isSelf && state.company.taskEditing === "SELF_AND_MANAGER" && state.teams.some((t) => t.id === person.teamId && t.managerId === me.id);
  const canAdd = isSelf || isManager;
  const fromManager = (t: Task) => !!t.addedById && t.addedById !== person.id;
  // Full edit: your own tasks, or (as manager) tasks you assigned.
  const canEdit = (t: Task) => (isSelf ? !fromManager(t) : isManager && t.addedById === me.id);
  const tasks = [...person.tasks].sort((a, b) => Number(a.status === "DONE") - Number(b.status === "DONE"));

  function toggle(t: Task) {
    setTasksFor(person.id, person.tasks.map((x) => (x.id === t.id ? { ...x, status: x.status === "DONE" ? "IN_PROGRESS" : "DONE" } : x)));
  }

  return (
    <Card>
      <CardHeader
        title="Tasks undertaken"
        description={isManager ? `You can assign tasks to ${person.name.split(" ")[0]}` : "Projects and responsibilities"}
        action={
          canAdd ? (
            <Button size="sm" variant="secondary" onClick={() => setEditing("new")}>
              <Plus aria-hidden /> {isManager ? "Assign task" : "Add"}
            </Button>
          ) : undefined
        }
      />
      {tasks.length === 0 ? (
        <p className="flex items-center gap-2 px-5 pt-3 pb-5 text-sm text-muted">
          <ClipboardList className="size-4" aria-hidden /> {isSelf ? "Add the projects you're working on." : "No tasks added yet."}
        </p>
      ) : (
        <ul className="mt-2 px-5 pb-4">
          {tasks.map((t) => {
            const by = fromManager(t) ? personById(t.addedById!) : undefined;
            const done = t.status === "DONE";
            return (
              <li key={t.id} className="flex gap-3 border-b border-line py-3 last:border-b-0">
                {canAdd ? (
                  <button
                    type="button"
                    onClick={() => toggle(t)}
                    aria-label={done ? `Reopen ${t.title}` : `Mark ${t.title} as done`}
                    className="-m-1 inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-surface-2"
                  >
                    {done ? <CheckCircle2 className="size-5 text-success" aria-hidden /> : <CircleDashed className="size-5 text-warning" aria-hidden />}
                  </button>
                ) : done ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                ) : (
                  <CircleDashed className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {t.title}
                    <Badge tone={done ? "success" : "warning"}>{done ? "Done" : "In progress"}</Badge>
                  </p>
                  {t.detail && <p className="mt-0.5 text-sm text-muted">{t.detail}</p>}
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    {t.period && <span>{t.period}</span>}
                    {by && (
                      <span className="inline-flex items-center gap-1">
                        <UserCheck className="size-3.5" aria-hidden /> Assigned by {by.name}
                      </span>
                    )}
                  </p>
                </div>
                {canEdit(t) && (
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon" variant="ghost" aria-label={`Edit ${t.title}`} onClick={() => setEditing(t)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${t.title}`}
                      onClick={() => {
                        setTasksFor(person.id, person.tasks.filter((x) => x.id !== t.id));
                        toast({ title: "Task removed", tone: "info" });
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {editing && (
        <TaskModal
          key={editing === "new" ? "new" : editing.id}
          task={editing === "new" ? undefined : editing}
          person={person}
          assigning={isManager}
          onClose={() => setEditing(null)}
        />
      )}
    </Card>
  );
}

function TaskModal({ task, person, assigning, onClose }: { task?: Task; person: Person; assigning: boolean; onClose: () => void }) {
  const { setTasksFor, me } = useDemo();
  const toast = useToast();
  const [form, setForm] = useState({ title: task?.title ?? "", detail: task?.detail ?? "", period: task?.period ?? "", status: task?.status ?? "IN_PROGRESS" });
  const [error, setError] = useState<string>();

  function save(e: FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Give the task a title.");
      return document.getElementById("task-title")?.focus();
    }
    const next: Task = {
      id: task?.id ?? `tk-${Date.now().toString(36)}`,
      title: form.title.trim(),
      detail: form.detail.trim(),
      period: form.period.trim(),
      status: form.status as Task["status"],
      addedById: task ? task.addedById : assigning ? me?.id : undefined,
    };
    setTasksFor(person.id, task ? person.tasks.map((t) => (t.id === task.id ? next : t)) : [next, ...person.tasks]);
    if (assigning && !task) toast({ title: `Task assigned to ${person.name.split(" ")[0]}`, description: "It now shows on their profile." });
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={task ? "Edit task" : assigning ? `Assign a task to ${person.name.split(" ")[0]}` : "Add a task"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="task-form">
            Save
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field id="task-title" label="Title" required error={error} className="sm:col-span-2">
          <Input id="task-title" maxLength={80} placeholder="e.g. Warehouse dashboard" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-invalid={!!error} aria-describedby={error ? "task-title-error" : undefined} />
        </Field>
        <Field id="task-detail" label="What it involves" className="sm:col-span-2">
          <Textarea id="task-detail" maxLength={200} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} />
        </Field>
        <Field id="task-period" label="When">
          <Input id="task-period" maxLength={30} placeholder="e.g. Oct 2026" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
        </Field>
        <Field id="task-status" label="Status">
          <Select id="task-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Task["status"] })}>
            <option value="IN_PROGRESS">In progress</option>
            <option value="DONE">Done</option>
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
