"use client";

import { can } from "@platform/shared";
import {
  Briefcase,
  CalendarDays,
  Coins,
  Gamepad2,
  Hash,
  Heart,
  Lock,
  Mail,
  MapPin,
  MessagesSquare,
  Pencil,
  Phone,
  Plus,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Avatar, PresenceBadge } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState, StatCard } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { OFFICES } from "@/lib/demo/seed";
import { useDemo } from "@/lib/demo/store";
import type { Person, Skill } from "@/lib/demo/types";
import { ROLE_LABEL } from "@/lib/nav";
import { cn, formatDate, formatNumber, timeAgo } from "@/lib/utils";
import { AvatarPicker, ChangePhotoButton } from "./avatar-picker";
import { InviteModal } from "./invite-modal";
import { TasksCard } from "./tasks-card";
import { GivePraiseModal, PraiseCard } from "./praise";

const LEVELS = ["", "Beginner", "Familiar", "Proficient", "Advanced", "Expert"];

function tenure(joined: string) {
  const months = Math.max(0, Math.round((Date.now() - new Date(joined).getTime()) / (30.44 * 24 * 3600 * 1000)));
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y} yr`, m && `${m} mo`].filter(Boolean).join(" ") || "New joiner";
}

export function ProfileView({ personId }: { personId: string }) {
  const { state, me, enabledModules, createConversation } = useDemo();
  const router = useRouter();
  const [praiseOpen, setPraiseOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  const person = state.people.find((p) => p.id === personId);
  const team = state.teams.find((t) => t.id === person?.teamId);
  const manager = state.people.find((p) => p.id === team?.managerId);
  const office = OFFICES.find((o) => o.id === person?.officeId);
  const received = useMemo(() => state.praises.filter((p) => p.recipientId === personId), [state.praises, personId]);
  const rank = useMemo(() => [...state.people].sort((a, b) => b.points - a.points).findIndex((p) => p.id === personId) + 1, [state.people, personId]);

  if (!person || !me) {
    return <EmptyState icon={UserRound} title="Profile not found" description="This person may have left the company or the link is wrong." />;
  }

  const isSelf = person.id === me.id;
  const managesThem = team?.managerId === me.id && can(me.role, "profile.read.team");
  const canSeeDetails = isSelf || can(me.role, "profile.read.all") || managesThem;
  const canSeeLedger = isSelf || can(me.role, "points.adjust");
  const ledger = state.pointsLog.filter((e) => e.userId === person.id);
  const has = (f: string) => enabledModules.includes(f as never);

  function message() {
    const id = createConversation("DIRECT", [person!.id]);
    router.push(`/chat?c=${id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden">
        <div className="h-28 bg-brand opacity-90 sm:h-32" aria-hidden />
        <div className="flex flex-col gap-5 px-5 pb-6 sm:flex-row sm:items-end sm:px-8">
          <div className="relative -mt-12 self-start">
            <Avatar name={person.name} size="xl" status={person.status} className="rounded-full ring-4 ring-surface" />
            {isSelf && <ChangePhotoButton onClick={() => setPhotoOpen(true)} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{person.name}</h1>
              {person.role !== "EMPLOYEE" && <Badge tone="brand">{ROLE_LABEL[person.role]}</Badge>}
            </div>
            <p className="mt-0.5 text-muted">{person.jobTitle}</p>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <PresenceBadge status={person.status} />
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="size-4" aria-hidden /> {team?.name}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden /> {office?.city}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSelf ? (
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil aria-hidden /> Edit profile
              </Button>
            ) : (
              <>
                {has("chat") && (
                  <Button variant="secondary" onClick={message}>
                    <MessagesSquare aria-hidden /> Message
                  </Button>
                )}
                {has("games") && (
                  <Button variant="secondary" onClick={() => setInviteOpen(true)}>
                    <Gamepad2 aria-hidden /> Invite to play
                  </Button>
                )}
                {has("cohort") && (
                  <Button onClick={() => setPraiseOpen(true)}>
                    <Sparkles aria-hidden /> Give praise
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Points" value={formatNumber(person.points)} icon={Coins} tone="points" />
        <StatCard label="Company rank" value={`#${rank}`} icon={Trophy} />
        <StatCard label="Praise received" value={received.length} icon={Heart} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="font-semibold">About</h2>
            <p className="mt-2 leading-relaxed text-muted">{person.bio || "No bio yet."}</p>
            <h3 className="mt-6 text-sm font-semibold">Skills</h3>
            {person.skills.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No skills added yet.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {person.skills.map((s) => (
                  <li key={s.name} className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2">
                    <span className="text-sm font-semibold">{s.name}</span>
                    <span className="flex gap-0.5" aria-label={`${LEVELS[s.level]}, level ${s.level} of 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={cn("h-3 w-1.5 rounded-full", n <= s.level ? "bg-brand" : "bg-line")} />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <TasksCard person={person} />

          <section aria-labelledby="received-heading" className="flex flex-col gap-4">
            <h2 id="received-heading" className="text-lg font-semibold">
              Recognition received
            </h2>
            {received.length === 0 ? (
              <Card>
                <EmptyState
                  icon={Sparkles}
                  title="No praise yet"
                  description={isSelf ? "Keep doing great work. Recognition shows up here." : `Be the first to recognise ${person.name.split(" ")[0]}.`}
                />
              </Card>
            ) : (
              received.slice(0, 4).map((p) => <PraiseCard key={p.id} praise={p} />)
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Employment details" description={canSeeDetails ? (isSelf ? "Only you, your manager and HR can see these." : undefined) : undefined} />
            {canSeeDetails ? (
              <dl className="mt-3 px-5 pb-5 text-sm">
                {[
                  [Hash, "Employee ID", person.employeeCode],
                  [Mail, "Email", person.email],
                  [Phone, "Phone", person.phone || "Not added"],
                  [CalendarDays, "Joined", `${formatDate(person.joinedAt)} · ${tenure(person.joinedAt)}`],
                  [Briefcase, "Team", team?.name],
                  [UserRound, "Manager", manager && manager.id !== person.id ? manager.name : "None"],
                  [MapPin, "Office", `${office?.city}, ${office?.region}`],
                ].map(([Icon, label, value]) => {
                  const I = Icon as typeof Hash;
                  return (
                    <div key={label as string} className="flex gap-3 border-b border-line py-3 last:border-b-0">
                      <I className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
                      <dt className="w-24 shrink-0 text-muted">{label as string}</dt>
                      <dd className="min-w-0 font-medium break-words">{value as string}</dd>
                    </div>
                  );
                })}
              </dl>
            ) : (
              <div className="flex gap-3 px-5 pt-3 pb-5 text-sm text-muted">
                <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
                Employment details are only visible to {person.name.split(" ")[0]}, their manager and HR.
              </div>
            )}
          </Card>

          {canSeeLedger && (
            <Card>
              <CardHeader title="Points history" />
              {ledger.length === 0 ? (
                <p className="px-5 pt-3 pb-5 text-sm text-muted">No points activity yet.</p>
              ) : (
                <ul className="mt-2 px-5 pb-4">
                  {ledger.slice(0, 8).map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{e.note}</p>
                        <p className="text-xs text-muted">{timeAgo(e.createdAt)}</p>
                      </div>
                      <span className={cn("text-sm font-bold tabular-nums", e.delta >= 0 ? "text-success" : "text-danger")}>
                        {e.delta >= 0 ? "+" : ""}
                        {e.delta}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </aside>
      </div>

      {!isSelf && (
        <>
          <GivePraiseModal open={praiseOpen} onClose={() => setPraiseOpen(false)} recipientId={person.id} />
          <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} presetUserId={person.id} />
        </>
      )}
      {isSelf && <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} person={person} />}
      {isSelf && photoOpen && <AvatarPicker open onClose={() => setPhotoOpen(false)} person={person} />}
    </div>
  );
}

function EditProfileModal({ open, onClose, person }: { open: boolean; onClose: () => void; person: Person }) {
  const { updateProfile } = useDemo();
  const toast = useToast();
  const [bio, setBio] = useState(person.bio);
  const [skills, setSkills] = useState<Skill[]>(person.skills);
  const [newSkill, setNewSkill] = useState("");
  const [error, setError] = useState<string>();

  function addSkill() {
    const name = newSkill.trim();
    if (!name) return;
    if (skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return setError(`${name} is already on your list.`);
    setError(undefined);
    setSkills([...skills, { name, level: 3 }]);
    setNewSkill("");
  }

  function save(e: FormEvent) {
    e.preventDefault();
    updateProfile({ bio: bio.trim(), skills });
    toast({ title: "Profile updated" });
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit profile"
      description="Your bio and skills are visible to everyone in the company."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="edit-profile">
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-profile" onSubmit={save} className="flex flex-col gap-6">
        <Field id="bio" label="Bio" hint={`${bio.length}/280`}>
          <Textarea id="bio" maxLength={280} value={bio} onChange={(e) => setBio(e.target.value)} aria-describedby="bio-hint" />
        </Field>

        <fieldset>
          <legend className="text-sm font-medium">Skills</legend>
          <ul className="mt-3 flex flex-col gap-2">
            {skills.map((s, i) => (
              <li key={s.name} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
                <span className="flex-1 text-sm font-semibold">{s.name}</span>
                <label className="sr-only" htmlFor={`lvl-${i}`}>
                  {s.name} level
                </label>
                <select
                  id={`lvl-${i}`}
                  value={s.level}
                  onChange={(e) => setSkills(skills.map((x, j) => (j === i ? { ...x, level: Number(e.target.value) } : x)))}
                  className="h-9 cursor-pointer rounded-lg border border-line bg-surface px-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {LEVELS[n]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                  aria-label={`Remove ${s.name}`}
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <Input
              aria-label="New skill"
              placeholder="Add a skill, e.g. Public speaking"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
            <Button variant="secondary" onClick={addSkill}>
              <Plus aria-hidden /> Add
            </Button>
          </div>
          {error && (
            <p role="alert" className="mt-1.5 text-sm text-danger">
              {error}
            </p>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
