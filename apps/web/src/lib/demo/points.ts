import type { Person, PointsRules, Team } from "./types";

export type Tier = "peer" | "manager" | "md";

export const TIER_LABEL: Record<Tier, string> = { peer: "Colleague", manager: "Manager", md: "Managing Director" };

/** Praise is worth more the more senior the person receiving it. */
export function tierOf(person: Pick<Person, "id" | "role" | "isMD">, teams: Team[]): Tier {
  if (person.isMD) return "md";
  if (person.role === "MANAGER" || teams.some((t) => t.managerId === person.id)) return "manager";
  return "peer";
}

export function praisePoints(person: Pick<Person, "id" | "role" | "isMD">, teams: Team[], rules: PointsRules) {
  return rules[tierOf(person, teams)];
}

export const DEFAULT_POINTS_RULES: PointsRules = { peer: 5, manager: 10, md: 15 };
