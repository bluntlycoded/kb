import type { Trait } from "./types";

/**
 * A short work-style self-assessment. Original statements, five traits, four
 * statements each (one reverse-scored). A reflection tool, not a clinical or hiring test.
 */
export const TRAITS: { key: Trait; name: string; high: string; low: string; tip: string }[] = [
  {
    key: "openness",
    name: "Curiosity",
    high: "You enjoy new ideas and trying different ways of working.",
    low: "You prefer proven methods and like to master what you know.",
    tip: "Pair up with someone who scores differently when starting something new.",
  },
  {
    key: "organisation",
    name: "Organisation",
    high: "You plan ahead, keep track of details and finish on time.",
    low: "You work flexibly and adapt as things come up.",
    tip: "A short weekly plan helps flexible workers; leaving room for surprises helps planners.",
  },
  {
    key: "drive",
    name: "Drive",
    high: "You set ambitious goals and push through when things get hard.",
    low: "You value balance and steady progress over big stretch goals.",
    tip: "Agree with your manager which goals are stretch goals and which are must-haves.",
  },
  {
    key: "collaboration",
    name: "Collaboration",
    high: "You involve others, help colleagues and see other points of view.",
    low: "You do your best work independently, with focus.",
    tip: "Tell your team how you like to work: some people need quiet time, others thrive on discussion.",
  },
  {
    key: "composure",
    name: "Composure",
    high: "You stay calm under pressure and recover quickly from setbacks.",
    low: "You care deeply about getting things right and feel pressure strongly.",
    tip: "Breaking big deadlines into small check-ins makes pressure easier to manage.",
  },
];

export const STATEMENTS: { id: string; trait: Trait; text: string; reverse?: boolean }[] = [
  { id: "s1", trait: "openness", text: "I enjoy trying new ways of doing my work." },
  { id: "s2", trait: "organisation", text: "I plan my week before it starts." },
  { id: "s3", trait: "drive", text: "I set ambitious goals for myself." },
  { id: "s4", trait: "collaboration", text: "I make time to help colleagues with their work." },
  { id: "s5", trait: "composure", text: "I stay calm when plans change at the last minute." },
  { id: "s6", trait: "openness", text: "I like learning about topics outside my role." },
  { id: "s7", trait: "organisation", text: "I finish tasks before their deadline." },
  { id: "s8", trait: "drive", text: "I keep going when a task gets difficult." },
  { id: "s9", trait: "collaboration", text: "I ask for other people's views before I decide." },
  { id: "s10", trait: "composure", text: "I recover quickly after a setback." },
  { id: "s11", trait: "openness", text: "I prefer sticking to methods I already know.", reverse: true },
  { id: "s12", trait: "organisation", text: "My files and work area are often disorganised.", reverse: true },
  { id: "s13", trait: "drive", text: "I'm happy doing just what is asked of me.", reverse: true },
  { id: "s14", trait: "collaboration", text: "I prefer working alone to working in a team.", reverse: true },
  { id: "s15", trait: "composure", text: "I worry a lot about making mistakes.", reverse: true },
  { id: "s16", trait: "openness", text: "I come up with ideas others haven't thought of." },
  { id: "s17", trait: "organisation", text: "I notice the details others miss." },
  { id: "s18", trait: "drive", text: "I take the lead when something needs to get done." },
  { id: "s19", trait: "collaboration", text: "I can see a disagreement from the other person's side." },
  { id: "s20", trait: "composure", text: "Pressure helps me focus rather than throwing me off." },
];

export const SCALE = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];

/** Answers are 1-5. Each trait: 4 statements, 4-20 raw, scaled to 0-100. */
export function score(answers: Record<string, number>): Record<Trait, number> {
  const out = { openness: 0, organisation: 0, drive: 0, collaboration: 0, composure: 0 } as Record<Trait, number>;
  for (const s of STATEMENTS) out[s.trait] += s.reverse ? 6 - answers[s.id] : answers[s.id];
  for (const k of Object.keys(out) as Trait[]) out[k] = Math.round(((out[k] - 4) / 16) * 100);
  return out;
}

export const band = (v: number) => (v >= 67 ? "High" : v >= 34 ? "Moderate" : "Low");

/** Averages are only shown for groups of at least this many people, to protect privacy. */
export const MIN_GROUP = 3;
