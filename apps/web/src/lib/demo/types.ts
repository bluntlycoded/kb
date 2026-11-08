import type { Feature, PlatformRole, PresenceStatus, TenantRole } from "@platform/shared";

export interface Skill {
  name: string;
  level: number; // 1-5
}

export interface Person {
  id: string;
  name: string;
  email: string;
  role: TenantRole;
  jobTitle: string;
  teamId: string;
  officeId: string;
  joinedAt: string;
  employeeCode: string;
  phone: string;
  bio: string;
  skills: Skill[];
  points: number;
  status: PresenceStatus;
  /** Profile picture (data URL) or a chosen avatar. */
  avatar?: AvatarChoice;
  /** Managing Director: praise to them earns the top points tier. */
  isMD?: boolean;
  tasks: Task[];
}

export type AvatarChoice = { kind: "photo"; src: string } | { kind: "emoji"; emoji: string; tint: number };

export interface Task {
  id: string;
  title: string;
  detail: string;
  period: string;
  status: "IN_PROGRESS" | "DONE";
  /** Who added it: the person themself, or their manager. Missing = the person. */
  addedById?: string;
}

export interface Team {
  id: string;
  name: string;
  managerId: string | null;
}

export interface Office {
  id: string;
  city: string;
  region: string;
}

export interface Praise {
  id: string;
  kind: "PRAISE" | "ACHIEVEMENT";
  authorId: string;
  recipientId: string;
  message: string;
  value: string;
  points: number;
  createdAt: string;
  likes: string[];
}

/** Who can see a feed: the Lounge, or one cohort. */
export type Space = "lounge" | `cohort:${string}`;

export interface PollOption {
  id: string;
  label: string;
  votes: string[];
}

export interface Poll {
  question: string;
  options: PollOption[];
}

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Post {
  id: string;
  space: Space;
  /** null = posted by the system, e.g. "Kabir was praised by Arjun". */
  authorId: string | null;
  kind: "TEXT" | "POLL" | "PRAISE_EVENT";
  body: string;
  poll?: Poll;
  praiseId?: string;
  createdAt: string;
  likes: string[];
  comments: Comment[];
}

export interface Cohort {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Created by the platform team for every company, or by this company's HR. */
  scope: "PLATFORM" | "COMPANY";
  createdById: string;
  createdByName: string;
  createdAt: string;
  memberIds: string[];
  pinned?: boolean;
}

export interface HrNote {
  authorId: string;
  title: string;
  body: string;
  updatedAt: string;
}

export type Trait = "openness" | "organisation" | "drive" | "collaboration" | "composure";

export interface AssessmentResult {
  userId: string;
  completedAt: string;
  /** 0-100 per trait. */
  scores: Record<Trait, number>;
  sharedWithHr: boolean;
}

export interface AssessmentRequest {
  id: string;
  userId: string;
  requestedById: string;
  createdAt: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
}

/** Employees always decide whether to share. This only controls whether HR may ask. */
export type AssessmentSharing = "EMPLOYEE_CHOICE" | "HR_CAN_REQUEST";
export type TaskEditing = "SELF_ONLY" | "SELF_AND_MANAGER";

export type GameKey = "quiz" | "tic-tac-toe" | "chess" | "sudoku";

export interface PointsRules {
  peer: number;
  manager: number;
  md: number;
}

export interface PointsEntry {
  id: string;
  userId: string;
  delta: number;
  reason: "PRAISE_RECEIVED" | "QUIZ_RESULT" | "GAME_RESULT" | "MANUAL_ADJUSTMENT";
  note: string;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  category: "LOCAL" | "SECTOR";
  region?: string;
  /** For SECTOR stories: which industry. */
  industry?: string;
  topic: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  readMinutes: number;
}

export interface Conversation {
  id: string;
  type: "DIRECT" | "GROUP";
  name?: string;
  memberIds: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  createdById: string;
  pointsPerCorrect: number;
  questions: QuizQuestion[];
}

export interface GameInvite {
  id: string;
  gameKey: string;
  quizId?: string;
  fromId: string;
  toIds: string[];
  accepted: string[];
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string;
  action: string;
  target: string;
  createdAt: string;
}

export interface Company {
  name: string;
  sector: string;
  brandColor: string;
  planCode: string;
  enabledModules: Feature[];
  values: string[];
  /** Games this company has switched on. */
  games: GameKey[];
  pointsRules: PointsRules;
  /** Industries shown in Current Affairs. */
  industries: string[];
  hrNote: HrNote | null;
  assessmentSharing: AssessmentSharing;
  taskEditing: TaskEditing;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  sector: string;
  planCode: string;
  seats: number;
  activeUsers: number;
  status: "TRIAL" | "ACTIVE" | "SUSPENDED";
  adminEmail: string;
  createdAt: string;
}

export interface Plan {
  code: string;
  name: string;
  pricePerSeat: number;
  description: string;
  features: Feature[];
  extras: string[];
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
}

export type Session = { kind: "tenant"; userId: string } | { kind: "platform"; userId: string } | null;

export interface DemoState {
  session: Session;
  people: Person[];
  teams: Team[];
  praises: Praise[];
  pointsLog: PointsEntry[];
  conversations: Conversation[];
  messages: Message[];
  invites: GameInvite[];
  audit: AuditEntry[];
  company: Company;
  tenants: Tenant[];
  plans: Plan[];
  cohorts: Cohort[];
  posts: Post[];
  assessments: AssessmentResult[];
  assessmentRequests: AssessmentRequest[];
}
