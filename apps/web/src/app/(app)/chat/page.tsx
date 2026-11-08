"use client";

import { ArrowLeft, MessagesSquare, PenSquare, Search, SendHorizontal, Users } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { PeoplePicker } from "@/components/app/people-picker";
import { Guard } from "@/components/shell/guard";
import { Avatar, PresenceBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { useDemo } from "@/lib/demo/store";
import type { Conversation } from "@/lib/demo/types";
import { cn, timeAgo } from "@/lib/utils";

export default function ChatPage() {
  return (
    <Guard feature="chat">
      <Chat />
    </Guard>
  );
}

function useConversationMeta() {
  const { me, personById } = useDemo();
  return (c: Conversation) => {
    const others = c.memberIds.filter((id) => id !== me?.id).map((id) => personById(id)!).filter(Boolean);
    const title = c.type === "GROUP" ? (c.name ?? others.map((o) => o.name.split(" ")[0]).join(", ")) : (others[0]?.name ?? "Unknown");
    return { others, title };
  };
}

function Chat() {
  const { state, me } = useDemo();
  const meta = useConversationMeta();
  // Deep link: /chat?c=<id>. This view only renders in the browser, after sign-in.
  const [selected, setSelected] = useState<string | null>(() =>
    typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("c"),
  );
  const [q, setQ] = useState("");
  const [newOpen, setNewOpen] = useState(false);

  function select(id: string | null) {
    setSelected(id);
    const url = id ? `/chat?c=${id}` : "/chat";
    window.history.replaceState(null, "", url);
  }

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return state.conversations
      .filter((c) => me && c.memberIds.includes(me.id))
      .map((c) => {
        const msgs = state.messages.filter((m) => m.conversationId === c.id);
        return { c, last: msgs[msgs.length - 1], ...meta(c) };
      })
      .filter((x) => !term || x.title.toLowerCase().includes(term))
      .sort((a, b) => (b.last?.createdAt ?? "").localeCompare(a.last?.createdAt ?? ""));
  }, [state.conversations, state.messages, me, q, meta]);

  const current = list.find((x) => x.c.id === selected) ?? null;

  return (
    <>
      <h1 className="sr-only">Chat</h1>
      <div className="grid h-[calc(100dvh-8.5rem)] min-h-[480px] overflow-hidden rounded-2xl border border-line bg-surface shadow-card md:grid-cols-[320px_minmax(0,1fr)] lg:h-[calc(100dvh-9.5rem)]">
        <section aria-label="Conversations" className={cn("flex min-h-0 flex-col border-r border-line", current && "hidden md:flex")}>
          <div className="flex items-center justify-between gap-2 px-4 pt-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <Button size="icon" variant="ghost" onClick={() => setNewOpen(true)} aria-label="New conversation">
              <PenSquare className="size-5" />
            </Button>
          </div>
          <div className="relative px-4 py-3">
            <Search className="pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input aria-label="Search conversations" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            {list.length === 0 && <li className="p-6 text-center text-sm text-muted">No conversations found.</li>}
            {list.map(({ c, last, others, title }) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => select(c.id)}
                  aria-current={c.id === selected ? "true" : undefined}
                  className={cn(
                    "flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    c.id === selected ? "bg-brand-soft" : "hover:bg-surface-2",
                  )}
                >
                  {c.type === "GROUP" ? (
                    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted">
                      <Users className="size-5" aria-hidden />
                    </span>
                  ) : (
                    <Avatar name={title} status={others[0]?.status} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{title}</span>
                      {last && <span className="shrink-0 text-xs text-muted">{timeAgo(last.createdAt)}</span>}
                    </span>
                    <span className="block truncate text-sm text-muted">
                      {last ? `${last.senderId === me?.id ? "You: " : ""}${last.body}` : "No messages yet"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Conversation" className={cn("min-h-0 flex-col", current ? "flex" : "hidden md:flex")}>
          {current ? (
            <Thread conversation={current.c} title={current.title} onBack={() => select(null)} />
          ) : (
            <EmptyState
              className="my-auto"
              icon={MessagesSquare}
              title="Pick a conversation"
              description="Choose a chat on the left, or start a new one with a colleague or group."
              action={
                <Button onClick={() => setNewOpen(true)}>
                  <PenSquare aria-hidden /> New conversation
                </Button>
              }
            />
          )}
        </section>
      </div>

      <NewConversationModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={(id) => select(id)} />
    </>
  );
}

function Thread({ conversation, title, onBack }: { conversation: Conversation; title: string; onBack: () => void }) {
  const { state, me, personById, sendMessage, typing } = useDemo();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const messages = useMemo(() => state.messages.filter((m) => m.conversationId === conversation.id), [state.messages, conversation.id]);
  const others = conversation.memberIds.filter((id) => id !== me?.id).map((id) => personById(id)!).filter(Boolean);
  const typingPerson = typing[conversation.id] ? personById(typing[conversation.id]!) : undefined;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typingPerson]);

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body) return;
    sendMessage(conversation.id, body);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b border-line px-3 py-3 sm:px-5">
        <Button size="icon" variant="ghost" onClick={onBack} aria-label="Back to conversations" className="md:hidden">
          <ArrowLeft className="size-5" />
        </Button>
        {conversation.type === "GROUP" ? (
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-surface-2 text-muted">
            <Users className="size-5" aria-hidden />
          </span>
        ) : (
          <Avatar name={title} status={others[0]?.status} />
        )}
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{title}</h2>
          {conversation.type === "GROUP" ? (
            <p className="truncate text-xs text-muted">{conversation.memberIds.length} members</p>
          ) : (
            others[0] && <PresenceBadge status={others[0].status} />
          )}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5" aria-live="polite">
        {messages.length === 0 && <p className="py-10 text-center text-sm text-muted">Say hello 👋</p>}
        <ol className="flex flex-col gap-1">
          {messages.map((m, i) => {
            const mine = m.senderId === me?.id;
            const sender = personById(m.senderId);
            const prev = messages[i - 1];
            const firstOfGroup = !prev || prev.senderId !== m.senderId;
            return (
              <li key={m.id} className={cn("flex gap-2", mine ? "justify-end" : "justify-start", firstOfGroup && i > 0 && "mt-3")}>
                {!mine && <span className="w-7 shrink-0">{firstOfGroup && sender && <Avatar name={sender.name} size="xs" />}</span>}
                <div className={cn("max-w-[78%]", mine && "items-end text-right")}>
                  {firstOfGroup && !mine && conversation.type === "GROUP" && (
                    <p className="mb-1 text-xs font-semibold text-muted">{sender?.name.split(" ")[0]}</p>
                  )}
                  <p
                    className={cn(
                      "inline-block rounded-2xl px-3.5 py-2 text-left text-[15px] leading-relaxed break-words whitespace-pre-wrap",
                      mine ? "rounded-br-md bg-brand text-brand-fg" : "rounded-bl-md bg-surface-2 text-fg",
                    )}
                  >
                    {m.body}
                  </p>
                  {(!messages[i + 1] || messages[i + 1].senderId !== m.senderId) && (
                    <p className="mt-1 text-xs text-muted">{timeAgo(m.createdAt)}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        {typingPerson && (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            <span className="inline-flex gap-1" aria-hidden>
              {[0, 1, 2].map((d) => (
                <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d * 120}ms` }} />
              ))}
            </span>
            {typingPerson.name.split(" ")[0]} is typing
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-line p-3 sm:p-4">
        <label htmlFor="composer" className="sr-only">
          Message {title}
        </label>
        <textarea
          id="composer"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={`Message ${title}`}
          className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-base focus:border-brand focus:ring-4 focus:ring-brand-soft focus:outline-none sm:text-sm"
        />
        <Button type="submit" size="icon" disabled={!draft.trim()} aria-label="Send message">
          <SendHorizontal className="size-5" />
        </Button>
      </form>
    </>
  );
}

function NewConversationModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const { createConversation } = useDemo();
  const [type, setType] = useState<"DIRECT" | "GROUP">("DIRECT");
  const [members, setMembers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<{ name?: string; members?: string }>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof error = {};
    if (type === "DIRECT" && members.length !== 1) errs.members = "Choose one colleague.";
    if (type === "GROUP" && members.length < 2) errs.members = "Choose at least two colleagues for a group.";
    if (type === "GROUP" && !name.trim()) errs.name = "Give your group a name.";
    setError(errs);
    if (Object.keys(errs).length) return;
    const id = createConversation(type, members, name);
    onCreated(id);
    setMembers([]);
    setName("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New conversation"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-convo">
            {type === "DIRECT" ? "Start chat" : "Create group"}
          </Button>
        </>
      }
    >
      <form id="new-convo" onSubmit={submit} noValidate className="flex flex-col gap-5">
        <Tabs
          label="Conversation type"
          value={type}
          onChange={(t) => {
            setType(t);
            setMembers([]);
            setError({});
          }}
          tabs={[
            { id: "DIRECT", label: "Direct message" },
            { id: "GROUP", label: "Group" },
          ]}
        />
        {type === "GROUP" && (
          <Field id="group-name" label="Group name" required error={error.name}>
            <Input
              id="group-name"
              placeholder="e.g. Diwali party planning"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!error.name}
              aria-describedby={error.name ? "group-name-error" : undefined}
            />
          </Field>
        )}
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">{type === "DIRECT" ? "Who do you want to message?" : "Add members"}</legend>
          <PeoplePicker selected={members} onChange={setMembers} multiple={type === "GROUP"} label="Choose colleagues" />
          {error.members && (
            <p role="alert" className="mt-1.5 text-sm text-danger">
              {error.members}
            </p>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
