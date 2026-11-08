"use client";

import { BarChart3, Check, Coins, Heart, MessageCircle, Plus, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/misc";
import { Tabs } from "@/components/ui/tabs";
import { useDemo } from "@/lib/demo/store";
import type { Post, Space } from "@/lib/demo/types";
import { cn, timeAgo } from "@/lib/utils";

/** Write a post or start a poll in the Lounge or a cohort. */
export function Composer({ space, placeholder = "Share anything with everyone…" }: { space: Space; placeholder?: string }) {
  const { me, addPost, addPoll } = useDemo();
  const [mode, setMode] = useState<"post" | "poll">("post");
  const [body, setBody] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState<string>();

  function submit(e: FormEvent) {
    e.preventDefault();
    if (mode === "post") {
      if (!body.trim()) return setError("Write something first.");
      addPost(space, body.trim());
      setBody("");
    } else {
      const opts = options.map((o) => o.trim()).filter(Boolean);
      if (!question.trim()) return setError("Add a question for your poll.");
      if (opts.length < 2) return setError("Add at least two options.");
      if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) return setError("Each option needs to be different.");
      addPoll(space, question.trim(), opts);
      setQuestion("");
      setOptions(["", ""]);
    }
    setError(undefined);
  }

  if (!me) return null;
  return (
    <Card className="p-4">
      <form onSubmit={submit} noValidate>
        <div className="flex items-start gap-3">
          <Avatar name={me.name} size="sm" className="mt-1" />
          <div className="min-w-0 flex-1">
            <Tabs
              label="What do you want to share?"
              value={mode}
              onChange={(m) => {
                setMode(m);
                setError(undefined);
              }}
              tabs={[
                { id: "post", label: "Post" },
                { id: "poll", label: "Poll" },
              ]}
            />
            {mode === "post" ? (
              <Textarea
                aria-label="Your post"
                className="mt-3 min-h-20"
                maxLength={500}
                placeholder={placeholder}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <Input aria-label="Poll question" placeholder="Ask a question" maxLength={140} value={question} onChange={(e) => setQuestion(e.target.value)} />
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
                {options.length < 5 && (
                  <Button size="sm" variant="ghost" className="self-start" onClick={() => setOptions([...options, ""])}>
                    <Plus aria-hidden /> Add option
                  </Button>
                )}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
              <Button type="submit" size="sm">
                {mode === "post" ? (
                  <>
                    <Send aria-hidden /> Post
                  </>
                ) : (
                  <>
                    <BarChart3 aria-hidden /> Start poll
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}

export function PollView({ post, compact }: { post: Post; compact?: boolean }) {
  const { me, vote } = useDemo();
  const poll = post.poll!;
  const total = poll.options.reduce((n, o) => n + o.votes.length, 0);
  const mine = poll.options.find((o) => me && o.votes.includes(me.id))?.id;

  return (
    <fieldset className={cn(compact ? "mt-2" : "mt-3")}>
      <legend className="font-semibold">{poll.question}</legend>
      <ul className="mt-3 flex flex-col gap-2">
        {poll.options.map((o) => {
          const pct = total ? Math.round((o.votes.length / total) * 100) : 0;
          const chosen = mine === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => vote(post.id, o.id)}
                aria-pressed={chosen}
                aria-label={`${o.label}: ${o.votes.length} votes${chosen ? ", your vote" : ""}`}
                className={cn(
                  "relative flex min-h-11 w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl border px-3 text-left text-sm transition",
                  chosen ? "border-brand" : "border-line hover:border-brand/60",
                )}
              >
                {mine && <span className="absolute inset-y-0 left-0 bg-brand-soft transition-all duration-300" style={{ width: `${pct}%` }} aria-hidden />}
                <span className="relative flex-1 font-medium">{o.label}</span>
                {chosen && <Check className="relative size-4 text-brand-text" aria-hidden />}
                {mine && <span className="relative font-semibold tabular-nums">{pct}%</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted">
        {total} {total === 1 ? "vote" : "votes"}
        {mine ? " · tap another option to change your vote" : " · vote to see results"}
      </p>
    </fieldset>
  );
}

export function PostCard({ post, showSpace }: { post: Post; showSpace?: boolean }) {
  const { me, personById, togglePostLike, addComment, state } = useDemo();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const liked = !!me && post.likes.includes(me.id);
  const cohort = post.space.startsWith("cohort:") ? state.cohorts.find((c) => `cohort:${c.id}` === post.space) : undefined;

  if (post.kind === "PRAISE_EVENT") {
    const pr = state.praises.find((p) => p.id === post.praiseId);
    const to = pr && personById(pr.recipientId);
    const from = pr && personById(pr.authorId);
    if (!pr || !to || !from) return null;
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-line bg-surface-2/60 px-4 py-3">
        <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-points-soft text-points">
          <Sparkles className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p>
            <Link href={`/people/${to.id}`} className="font-semibold hover:underline">
              {to.name}
            </Link>{" "}
            {pr.kind === "ACHIEVEMENT" ? "was celebrated by" : "was praised by"}{" "}
            <Link href={`/people/${from.id}`} className="font-semibold hover:underline">
              {from.name}
            </Link>
          </p>
          <p className="mt-0.5 line-clamp-2 text-muted">&ldquo;{pr.message}&rdquo;</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-muted">
            <span>System message · {timeAgo(post.createdAt)}</span>
            <span className="inline-flex items-center gap-1 font-semibold text-points">
              <Coins className="size-3" aria-hidden />+{pr.points}
            </span>
          </p>
        </div>
      </div>
    );
  }

  const author = post.authorId ? personById(post.authorId) : undefined;
  if (!author) return null;

  function comment(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    addComment(post.id, draft.trim());
    setDraft("");
  }

  return (
    <Card className="animate-enter p-5">
      <div className="flex items-start gap-3">
        <Avatar name={author.name} />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug">
            <Link href={`/people/${author.id}`} className="font-semibold hover:underline">
              {author.name}
            </Link>
            {post.kind === "POLL" && <span className="text-muted"> started a poll</span>}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {author.jobTitle} · {timeAgo(post.createdAt)}
            {showSpace && cohort && (
              <>
                {" · in "}
                <Link href={`/cohort/${cohort.id}`} className="font-medium text-brand-text hover:underline">
                  {cohort.emoji} {cohort.name}
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {post.body && <p className="mt-3 leading-relaxed whitespace-pre-wrap">{post.body}</p>}
      {post.kind === "POLL" && post.poll && <PollView post={post} />}

      <div className="mt-3 flex items-center gap-1">
        <button
          type="button"
          onClick={() => togglePostLike(post.id)}
          aria-pressed={liked}
          aria-label={`${liked ? "Remove your like" : "Like"} (${post.likes.length} likes)`}
          className={cn(
            "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition active:scale-95",
            liked ? "bg-danger-soft text-danger" : "text-muted hover:bg-surface-2 hover:text-fg",
          )}
        >
          <Heart className={cn("size-4", liked && "fill-current")} aria-hidden />
          <span className="tabular-nums">{post.likes.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-fg"
        >
          <MessageCircle className="size-4" aria-hidden />
          <span className="tabular-nums">{post.comments.length}</span>
          <span className="sr-only">comments</span>
        </button>
      </div>

      {(open || (post.comments.length > 0 && post.comments.length <= 2)) && (
        <div className="mt-2 border-t border-line pt-3">
          <ul className="flex flex-col gap-3">
            {post.comments.map((c) => {
              const who = personById(c.authorId);
              return (
                <li key={c.id} className="flex gap-2.5">
                  {who && <Avatar name={who.name} size="xs" />}
                  <div className="min-w-0 rounded-2xl bg-surface-2 px-3 py-2 text-sm">
                    <p>
                      <span className="font-semibold">{who?.name}</span> <span className="text-xs text-muted">{timeAgo(c.createdAt)}</span>
                    </p>
                    <p className="mt-0.5 break-words whitespace-pre-wrap">{c.body}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <form onSubmit={comment} className="mt-3 flex gap-2">
            <Input aria-label="Write a comment" placeholder="Write a comment" maxLength={300} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <Button type="submit" size="icon" variant="secondary" disabled={!draft.trim()} aria-label="Send comment">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </Card>
  );
}

export function Feed({ space, filter }: { space: Space; filter?: "all" | "polls" | "posts" }) {
  const { state } = useDemo();
  const posts = useMemo(
    () =>
      state.posts
        .filter((p) => p.space === space)
        .filter((p) => !filter || filter === "all" || (filter === "polls" ? p.kind === "POLL" : p.kind !== "POLL"))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [state.posts, space, filter],
  );
  if (posts.length === 0) {
    return (
      <Card>
        <EmptyState icon={MessageCircle} title="Nothing here yet" description="Be the first to post something or start a poll." />
      </Card>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </div>
  );
}

export function SpaceBadge({ scope }: { scope: "PLATFORM" | "COMPANY" }) {
  return <Badge tone={scope === "PLATFORM" ? "brand" : "neutral"}>{scope === "PLATFORM" ? "Platform-wide" : "Company"}</Badge>;
}
