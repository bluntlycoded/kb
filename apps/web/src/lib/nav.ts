import { can, type Feature, type Permission, type TenantRole } from "@platform/shared";
import {
  Brain,
  BookOpenCheck,
  Building2,
  Coffee,
  Search,
  ChartColumn,
  Contact,
  Gamepad2,
  House,
  type LucideIcon,
  MessagesSquare,
  Newspaper,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  feature?: Feature;
  permission?: Permission;
}

export const WORKSPACE_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/lounge", label: "Lounge", icon: Coffee, feature: "lounge" },
  { href: "/cohort", label: "Cohorts", icon: Sparkles, feature: "cohort" },
  { href: "/news", label: "Current Affairs", icon: Newspaper, feature: "news" },
  { href: "/games", label: "Games & Quizzes", icon: Gamepad2, feature: "games" },
  { href: "/chat", label: "Chat", icon: MessagesSquare, feature: "chat" },
  { href: "/directory", label: "Directory", icon: Search, feature: "profile" },
  { href: "/assessments", label: "Psychometric", icon: Brain, feature: "assessments" },
  { href: "/profile", label: "My profile", icon: UserRound, feature: "profile" },
];

export const MANAGE_NAV: NavItem[] = [
  { href: "/team", label: "My team", icon: UsersRound, permission: "profile.read.team" },
  { href: "/people", label: "People", icon: Contact, permission: "profile.read.all" },
  { href: "/insights", label: "Insights", icon: ChartColumn, permission: "analytics.read" },
  { href: "/hr-toolkit", label: "HR toolkit", icon: BookOpenCheck, permission: "assessments.review" },
  { href: "/admin", label: "Company admin", icon: Building2, permission: "tenant.settings" },
];

export type Access = { ok: true } | { ok: false; reason: "module" | "role" };

export function checkAccess(
  item: { feature?: Feature; permission?: Permission },
  role: TenantRole,
  enabledModules: readonly Feature[],
): Access {
  if (item.feature && !enabledModules.includes(item.feature)) return { ok: false, reason: "module" };
  if (item.permission && !can(role, item.permission)) return { ok: false, reason: "role" };
  return { ok: true };
}

export const ROLE_LABEL: Record<TenantRole, string> = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  HR: "HR",
  COMPANY_ADMIN: "Company admin",
};

export const FEATURE_LABEL: Record<Feature, string> = {
  cohort: "Cohorts & recognition",
  lounge: "Lounge",
  news: "Current Affairs",
  games: "Games & Quizzes",
  chat: "Chat",
  profile: "Profiles & directory",
  assessments: "Work-style assessment",
};
