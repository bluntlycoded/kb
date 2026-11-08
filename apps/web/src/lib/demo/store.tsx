"use client";

/**
 * Client-side demo store. Holds the session and all data in memory and saves it
 * to localStorage so a demo survives a refresh. Every action here maps to an API
 * endpoint that replaces it once the backend is connected.
 */
import type { Feature, PresenceStatus } from "@platform/shared";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/toast";
import { readableOn } from "@/lib/utils";
import { praisePoints } from "./points";
import { createSeed, PLATFORM_USERS } from "./seed";
import type {
  AssessmentSharing,
  AvatarChoice,
  Cohort,
  Company,
  DemoState,
  GameKey,
  Person,
  PlatformUser,
  PointsEntry,
  PointsRules,
  Post,
  Skill,
  Space,
  Task,
  TaskEditing,
  Tenant,
  Trait,
} from "./types";

const STORAGE_KEY = "engage-demo-v3";

const REPLIES = [
  "Sounds good 👍",
  "On it, will get back to you shortly.",
  "Haha, absolutely!",
  "Thanks for the heads-up.",
  "Let's discuss after standup?",
  "Perfect, see you there.",
];

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const now = () => new Date().toISOString();

type SignInResult = { ok: true; home: string } | { ok: false; error: string };

interface DemoContextValue {
  state: DemoState;
  hydrated: boolean;
  me: Person | null;
  platformUser: PlatformUser | null;
  typing: Record<string, string | undefined>;
  enabledModules: Feature[];
  personById: (id: string) => Person | undefined;
  signIn: (email: string) => SignInResult;
  signOut: () => void;
  setStatus: (status: Exclude<PresenceStatus, "OFFLINE">) => void;
  givePraise: (input: { recipientId: string; kind: "PRAISE" | "ACHIEVEMENT"; message: string; value: string }) => void;
  toggleLike: (praiseId: string) => void;
  sendMessage: (conversationId: string, body: string) => void;
  createConversation: (type: "DIRECT" | "GROUP", memberIds: string[], name?: string) => string;
  sendInvite: (gameKey: string, toIds: string[], quizId?: string) => void;
  awardPoints: (delta: number, reason: PointsEntry["reason"], note: string) => void;
  moveToTeam: (userId: string, teamId: string) => void;
  addEmployee: (input: Pick<Person, "name" | "email" | "jobTitle" | "teamId" | "officeId" | "role">) => void;
  updateProfile: (patch: { bio?: string; skills?: Skill[]; avatar?: AvatarChoice | undefined; tasks?: Task[] }) => void;
  updateCompany: (patch: Partial<Pick<Company, "name" | "brandColor">>) => void;
  addPost: (space: Space, body: string) => void;
  addPoll: (space: Space, question: string, options: string[]) => void;
  vote: (postId: string, optionId: string) => void;
  togglePostLike: (postId: string) => void;
  addComment: (postId: string, body: string) => void;
  createCohort: (input: Pick<Cohort, "name" | "description" | "emoji">) => string;
  toggleCohortMembership: (cohortId: string) => void;
  setHrNote: (note: { title: string; body: string } | null) => void;
  saveAssessment: (scores: Record<Trait, number>, sharedWithHr: boolean) => void;
  setGames: (games: GameKey[]) => void;
  setPointsRules: (rules: PointsRules) => void;
  setIndustries: (industries: string[]) => void;
  setTasksFor: (personId: string, tasks: Task[]) => void;
  setResultsShared: (shared: boolean) => void;
  requestResults: (userId: string) => void;
  answerRequest: (requestId: string, accept: boolean) => void;
  setPeopleSettings: (patch: { assessmentSharing?: AssessmentSharing; taskEditing?: TaskEditing }) => void;
  toggleModule: (feature: Feature, on: boolean) => void;
  addTenant: (input: Pick<Tenant, "name" | "slug" | "sector" | "planCode" | "seats" | "adminEmail" | "status">) => void;
  updateTenant: (id: string, patch: Partial<Tenant>) => void;
  setPlanFeatures: (code: string, features: Feature[]) => void;
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside <DemoProvider>");
  return ctx;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(createSeed);
  const [hydrated, setHydrated] = useState(false);
  const [typing, setTyping] = useState<Record<string, string | undefined>>({});
  const toast = useToast();
  const router = useRouter();
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load saved demo state once, then save on every change. This must run after the
  // first render: reading localStorage during render would mismatch the server HTML.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = { ...createSeed(), ...(JSON.parse(saved) as DemoState) };
        stateRef.current = parsed;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage (external system)
        setState(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  // Apply the company's brand colour to the whole app.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand", state.company.brandColor);
    root.style.setProperty("--brand-fg", readableOn(state.company.brandColor));
  }, [state.company.brandColor]);

  const me = useMemo(
    () => (state.session?.kind === "tenant" ? (state.people.find((p) => p.id === state.session!.userId) ?? null) : null),
    [state.session, state.people],
  );
  const platformUser = useMemo(
    () => (state.session?.kind === "platform" ? (PLATFORM_USERS.find((p) => p.id === state.session!.userId) ?? null) : null),
    [state.session],
  );

  const enabledModules = useMemo(() => {
    const plan = state.plans.find((p) => p.code === state.company.planCode);
    return state.company.enabledModules.filter((f) => plan?.features.includes(f));
  }, [state.plans, state.company]);

  const personById = useCallback((id: string) => stateRef.current.people.find((p) => p.id === id), []);

  const audit = useCallback((s: DemoState, action: string, target: string): DemoState => {
    const actorId = s.session?.userId ?? "system";
    return { ...s, audit: [{ id: uid("a"), actorId, action, target, createdAt: now() }, ...s.audit] };
  }, []);

  const signIn = useCallback((email: string): SignInResult => {
    const e = email.trim().toLowerCase();
    const platform = PLATFORM_USERS.find((p) => p.email === e);
    if (platform) {
      setState((s) => ({ ...s, session: { kind: "platform", userId: platform.id } }));
      return { ok: true, home: "/console" };
    }
    const person = stateRef.current.people.find((p) => p.email === e);
    if (!person) return { ok: false, error: "We couldn't find an account with that email. Try one of the demo accounts." };
    setState((s) => ({
      ...s,
      session: { kind: "tenant", userId: person.id },
      people: s.people.map((p) => (p.id === person.id ? { ...p, status: "ACTIVE" } : p)),
    }));
    return { ok: true, home: "/home" };
  }, []);

  const signOut = useCallback(() => {
    setState((s) => ({
      ...s,
      people: s.people.map((p) => (p.id === s.session?.userId ? { ...p, status: "OFFLINE" } : p)),
      session: null,
    }));
    router.push("/login");
  }, [router]);

  const setStatus = useCallback((status: Exclude<PresenceStatus, "OFFLINE">) => {
    setState((s) => ({ ...s, people: s.people.map((p) => (p.id === s.session?.userId ? { ...p, status } : p)) }));
  }, []);

  const givePraise = useCallback<DemoContextValue["givePraise"]>(({ recipientId, kind, message, value }) => {
    setState((s) => {
      const authorId = s.session!.userId;
      const author = s.people.find((p) => p.id === authorId);
      const recipient = s.people.find((p) => p.id === recipientId)!;
      const points = praisePoints(recipient, s.teams, s.company.pointsRules);
      const praiseId = uid("pr");
      return {
        ...s,
        praises: [{ id: praiseId, kind, authorId, recipientId, message, value, points, createdAt: now(), likes: [] }, ...s.praises],
        // The Lounge gets a system message for every praise.
        posts: [{ id: uid("po"), space: "lounge", authorId: null, kind: "PRAISE_EVENT", body: "", praiseId, createdAt: now(), likes: [], comments: [] }, ...s.posts],
        people: s.people.map((p) => (p.id === recipientId ? { ...p, points: p.points + points } : p)),
        pointsLog: [
          { id: uid("pl"), userId: recipientId, delta: points, reason: "PRAISE_RECEIVED", note: `Praise from ${author?.name ?? "a colleague"}`, createdAt: now() },
          ...s.pointsLog,
        ],
      };
    });
  }, []);

  const toggleLike = useCallback((praiseId: string) => {
    setState((s) => {
      const myId = s.session!.userId;
      return {
        ...s,
        praises: s.praises.map((p) =>
          p.id !== praiseId ? p : { ...p, likes: p.likes.includes(myId) ? p.likes.filter((l) => l !== myId) : [...p.likes, myId] },
        ),
      };
    });
  }, []);

  const sendMessage = useCallback((conversationId: string, body: string) => {
    const s0 = stateRef.current;
    const myId = s0.session!.userId;
    setState((s) => ({
      ...s,
      messages: [...s.messages, { id: uid("m"), conversationId, senderId: myId, body, createdAt: now() }],
    }));

    // Simulate a colleague replying, so the demo feels live.
    const convo = s0.conversations.find((c) => c.id === conversationId);
    const responder = (convo?.memberIds ?? [])
      .filter((id) => id !== myId)
      .map((id) => s0.people.find((p) => p.id === id))
      .find((p) => p && p.status !== "OFFLINE");
    if (!responder) return;
    setTimeout(() => setTyping((t) => ({ ...t, [conversationId]: responder.id })), 700);
    setTimeout(() => {
      setTyping((t) => ({ ...t, [conversationId]: undefined }));
      setState((s) => ({
        ...s,
        messages: [
          ...s.messages,
          { id: uid("m"), conversationId, senderId: responder.id, body: REPLIES[Math.floor(Math.random() * REPLIES.length)], createdAt: now() },
        ],
      }));
    }, 2200);
  }, []);

  const createConversation = useCallback((type: "DIRECT" | "GROUP", memberIds: string[], name?: string) => {
    const s = stateRef.current;
    const myId = s.session!.userId;
    const members = [...new Set([myId, ...memberIds])];
    if (type === "DIRECT") {
      const existing = s.conversations.find(
        (c) => c.type === "DIRECT" && c.memberIds.length === 2 && members.every((m) => c.memberIds.includes(m)),
      );
      if (existing) return existing.id;
    }
    const id = uid("c");
    setState((st) => ({ ...st, conversations: [{ id, type, name: name?.trim() || undefined, memberIds: members }, ...st.conversations] }));
    return id;
  }, []);

  const sendInvite = useCallback(
    (gameKey: string, toIds: string[], quizId?: string) => {
      const s0 = stateRef.current;
      const id = uid("gi");
      setState((s) => ({
        ...s,
        invites: [{ id, gameKey, quizId, fromId: s.session!.userId, toIds, accepted: [], createdAt: now() }, ...s.invites],
      }));
      // Simulate an available colleague accepting.
      const acceptor = toIds.map((tid) => s0.people.find((p) => p.id === tid)).find((p) => p?.status === "ACTIVE");
      if (!acceptor) return;
      setTimeout(() => {
        setState((s) => ({ ...s, invites: s.invites.map((i) => (i.id === id ? { ...i, accepted: [...i.accepted, acceptor.id] } : i)) }));
        const href = gameKey === "quiz" && quizId ? `/games/quiz/${quizId}` : `/games/${gameKey}`;
        toast({
          title: `${acceptor.name.split(" ")[0]} accepted your invite`,
          description: "Your game is ready to start.",
          action: { label: "Start game", onClick: () => router.push(href) },
        });
      }, 2500);
    },
    [router, toast],
  );

  const awardPoints = useCallback((delta: number, reason: PointsEntry["reason"], note: string) => {
    setState((s) => {
      const userId = s.session!.userId;
      return {
        ...s,
        people: s.people.map((p) => (p.id === userId ? { ...p, points: p.points + delta } : p)),
        pointsLog: [{ id: uid("pl"), userId, delta, reason, note, createdAt: now() }, ...s.pointsLog],
      };
    });
  }, []);

  const moveToTeam = useCallback(
    (userId: string, teamId: string) => {
      setState((s) => {
        const person = s.people.find((p) => p.id === userId);
        const team = s.teams.find((t) => t.id === teamId);
        const next = { ...s, people: s.people.map((p) => (p.id === userId ? { ...p, teamId } : p)) };
        return audit(next, "Moved employee to team", `${person?.name} → ${team?.name}`);
      });
    },
    [audit],
  );

  const addEmployee = useCallback<DemoContextValue["addEmployee"]>(
    (input) => {
      setState((s) => {
        const person: Person = {
          ...input,
          id: uid("u"),
          joinedAt: now().slice(0, 10),
          employeeCode: `NW-${1200 + s.people.length}`,
          phone: "",
          bio: "",
          skills: [],
          tasks: [],
          points: 0,
          status: "OFFLINE",
        };
        return audit({ ...s, people: [...s.people, person] }, "Invited employee", input.email);
      });
    },
    [audit],
  );

  const updateProfile = useCallback((patch: { bio?: string; skills?: Skill[]; avatar?: AvatarChoice | undefined; tasks?: Task[] }) => {
    setState((s) => ({ ...s, people: s.people.map((p) => (p.id === s.session?.userId ? { ...p, ...patch } : p)) }));
  }, []);

  const updateCompany = useCallback(
    (patch: Partial<Pick<Company, "name" | "brandColor">>) => {
      setState((s) =>
        audit(
          { ...s, company: { ...s.company, ...patch } },
          "Updated branding",
          patch.brandColor ? `Brand colour ${patch.brandColor}` : `Company name "${patch.name}"`,
        ),
      );
    },
    [audit],
  );

  const addPost = useCallback((space: Space, body: string) => {
    setState((s) => {
      const post: Post = { id: uid("po"), space, authorId: s.session!.userId, kind: "TEXT", body, createdAt: now(), likes: [], comments: [] };
      return { ...s, posts: [post, ...s.posts] };
    });
  }, []);

  const addPoll = useCallback((space: Space, question: string, options: string[]) => {
    setState((s) => {
      const poll = { question, options: options.map((label, i) => ({ id: `o${i}`, label, votes: [] })) };
      const post: Post = { id: uid("po"), space, authorId: s.session!.userId, kind: "POLL", body: "", poll, createdAt: now(), likes: [], comments: [] };
      return { ...s, posts: [post, ...s.posts] };
    });
  }, []);

  /** One vote per person per poll; voting again moves your vote. */
  const vote = useCallback((postId: string, optionId: string) => {
    setState((s) => {
      const me = s.session!.userId;
      return {
        ...s,
        posts: s.posts.map((p) =>
          p.id !== postId || !p.poll
            ? p
            : {
                ...p,
                poll: {
                  ...p.poll,
                  options: p.poll.options.map((o) => ({
                    ...o,
                    votes: o.id === optionId ? [...new Set([...o.votes, me])] : o.votes.filter((v) => v !== me),
                  })),
                },
              },
        ),
      };
    });
  }, []);

  const togglePostLike = useCallback((postId: string) => {
    setState((s) => {
      const me = s.session!.userId;
      return {
        ...s,
        posts: s.posts.map((p) => (p.id !== postId ? p : { ...p, likes: p.likes.includes(me) ? p.likes.filter((l) => l !== me) : [...p.likes, me] })),
      };
    });
  }, []);

  const addComment = useCallback((postId: string, body: string) => {
    setState((s) => ({
      ...s,
      posts: s.posts.map((p) =>
        p.id !== postId ? p : { ...p, comments: [...p.comments, { id: uid("cm"), authorId: s.session!.userId, body, createdAt: now() }] },
      ),
    }));
  }, []);

  /** HR and admins create company cohorts; the platform team's cohorts reach every company. */
  const createCohort = useCallback<DemoContextValue["createCohort"]>(
    (input) => {
      const id = uid("ch");
      setState((s) => {
        const platform = s.session?.kind === "platform";
        const creator = platform ? PLATFORM_USERS.find((u) => u.id === s.session!.userId) : s.people.find((p) => p.id === s.session!.userId);
        const cohort: Cohort = {
          ...input,
          id,
          scope: platform ? "PLATFORM" : "COMPANY",
          createdById: s.session!.userId,
          createdByName: creator?.name ?? "Platform team",
          createdAt: now(),
          memberIds: s.people.map((p) => p.id),
        };
        return audit({ ...s, cohorts: [cohort, ...s.cohorts] }, "Created cohort", input.name);
      });
      return id;
    },
    [audit],
  );

  const toggleCohortMembership = useCallback((cohortId: string) => {
    setState((s) => {
      const me = s.session!.userId;
      return {
        ...s,
        cohorts: s.cohorts.map((c) =>
          c.id !== cohortId ? c : { ...c, memberIds: c.memberIds.includes(me) ? c.memberIds.filter((m) => m !== me) : [...c.memberIds, me] },
        ),
      };
    });
  }, []);

  const setHrNote = useCallback(
    (note: { title: string; body: string } | null) => {
      setState((s) =>
        audit(
          { ...s, company: { ...s.company, hrNote: note && { ...note, authorId: s.session!.userId, updatedAt: now() } } },
          note ? "Posted HR note" : "Removed HR note",
          note?.title ?? "",
        ),
      );
    },
    [audit],
  );

  const saveAssessment = useCallback((scores: Record<Trait, number>, sharedWithHr: boolean) => {
    setState((s) => {
      const userId = s.session!.userId;
      return {
        ...s,
        assessments: [{ userId, scores, sharedWithHr, completedAt: now() }, ...s.assessments.filter((a) => a.userId !== userId)],
      };
    });
  }, []);

  const setGames = useCallback(
    (games: GameKey[]) => setState((s) => audit({ ...s, company: { ...s.company, games } }, "Changed games", games.join(", ") || "none")),
    [audit],
  );

  const setPointsRules = useCallback(
    (rules: PointsRules) =>
      setState((s) =>
        audit({ ...s, company: { ...s.company, pointsRules: rules } }, "Changed praise points", `Colleague ${rules.peer}, manager ${rules.manager}, MD ${rules.md}`),
      ),
    [audit],
  );

  const setIndustries = useCallback(
    (industries: string[]) =>
      setState((s) => audit({ ...s, company: { ...s.company, industries } }, "Changed news industries", `${industries.length} industries`)),
    [audit],
  );

  /** Save someone's task list. Managers editing a team member's tasks are audited. */
  const setTasksFor = useCallback(
    (personId: string, tasks: Task[]) => {
      setState((s) => {
        const next = { ...s, people: s.people.map((p) => (p.id === personId ? { ...p, tasks } : p)) };
        if (personId === s.session?.userId) return next;
        return audit(next, "Updated team member's tasks", s.people.find((p) => p.id === personId)?.name ?? personId);
      });
    },
    [audit],
  );

  const setResultsShared = useCallback((shared: boolean) => {
    setState((s) => ({
      ...s,
      assessments: s.assessments.map((a) => (a.userId === s.session?.userId ? { ...a, sharedWithHr: shared } : a)),
    }));
  }, []);

  const requestResults = useCallback(
    (userId: string) => {
      setState((s) => {
        if (s.assessmentRequests.some((r) => r.userId === userId && r.status === "PENDING")) return s;
        const req = { id: uid("ar"), userId, requestedById: s.session!.userId, createdAt: now(), status: "PENDING" as const };
        return audit({ ...s, assessmentRequests: [req, ...s.assessmentRequests] }, "Requested assessment results", s.people.find((p) => p.id === userId)?.name ?? userId);
      });
    },
    [audit],
  );

  /** Accepting a request shares the results; declining keeps them private. */
  const answerRequest = useCallback((requestId: string, accept: boolean) => {
    setState((s) => {
      const req = s.assessmentRequests.find((r) => r.id === requestId);
      if (!req) return s;
      return {
        ...s,
        assessmentRequests: s.assessmentRequests.map((r) => (r.id === requestId ? { ...r, status: accept ? "ACCEPTED" : "DECLINED" } : r)),
        assessments: accept ? s.assessments.map((a) => (a.userId === req.userId ? { ...a, sharedWithHr: true } : a)) : s.assessments,
      };
    });
  }, []);

  const setPeopleSettings = useCallback(
    (patch: { assessmentSharing?: AssessmentSharing; taskEditing?: TaskEditing }) => {
      setState((s) => audit({ ...s, company: { ...s.company, ...patch } }, "Changed people settings", Object.values(patch).join(", ")));
    },
    [audit],
  );

  const toggleModule = useCallback(
    (feature: Feature, on: boolean) => {
      setState((s) => {
        const enabled = on ? [...new Set([...s.company.enabledModules, feature])] : s.company.enabledModules.filter((f) => f !== feature);
        return audit({ ...s, company: { ...s.company, enabledModules: enabled } }, on ? "Enabled module" : "Disabled module", feature);
      });
    },
    [audit],
  );

  const addTenant = useCallback<DemoContextValue["addTenant"]>((input) => {
    setState((s) => ({ ...s, tenants: [{ ...input, id: uid("tn"), activeUsers: 0, createdAt: now() }, ...s.tenants] }));
  }, []);

  const updateTenant = useCallback((id: string, patch: Partial<Tenant>) => {
    setState((s) => ({ ...s, tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }, []);

  const setPlanFeatures = useCallback((code: string, features: Feature[]) => {
    setState((s) => ({ ...s, plans: s.plans.map((p) => (p.code === code ? { ...p, features } : p)) }));
  }, []);

  const resetDemo = useCallback(() => {
    const session = stateRef.current.session;
    setState({ ...createSeed(), session });
    toast({ title: "Demo data reset", description: "Everything is back to the starting point." });
  }, [toast]);

  const value: DemoContextValue = {
    state,
    hydrated,
    me,
    platformUser,
    typing,
    enabledModules,
    personById,
    signIn,
    signOut,
    setStatus,
    givePraise,
    toggleLike,
    sendMessage,
    createConversation,
    sendInvite,
    awardPoints,
    moveToTeam,
    addEmployee,
    updateProfile,
    updateCompany,
    addPost,
    addPoll,
    vote,
    togglePostLike,
    addComment,
    createCohort,
    toggleCohortMembership,
    setHrNote,
    saveAssessment,
    setGames,
    setPointsRules,
    setIndustries,
    setTasksFor,
    setResultsShared,
    requestResults,
    answerRequest,
    setPeopleSettings,
    toggleModule,
    addTenant,
    updateTenant,
    setPlanFeatures,
    resetDemo,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
