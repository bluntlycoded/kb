/**
 * Demo dataset for client presentations. Everything here is fictional.
 * Replaced by API calls once the backend (Supabase Postgres) is connected.
 */
import { minutesAgo } from "@/lib/utils";
import { DEFAULT_POINTS_RULES, praisePoints } from "./points";
import type {
  AssessmentRequest,
  AssessmentResult,
  AuditEntry,
  Cohort,
  Post,
  Task,
  Company,
  Conversation,
  DemoState,
  Message,
  NewsItem,
  Office,
  Person,
  Plan,
  PlatformUser,
  PointsEntry,
  Praise,
  Quiz,
  Team,
  Tenant,
} from "./types";

const H = 60;
const D = 24 * H;

export const OFFICES: Office[] = [
  { id: "o-blr", city: "Bengaluru", region: "Karnataka" },
  { id: "o-mum", city: "Mumbai", region: "Maharashtra" },
  { id: "o-ggn", city: "Gurugram", region: "Delhi NCR" },
];

const TEAMS: Team[] = [
  { id: "t-eng", name: "Engineering", managerId: "u-arjun" },
  { id: "t-sales", name: "Sales", managerId: "u-priya" },
  { id: "t-ops", name: "Operations", managerId: "u-rohan" },
  { id: "t-people", name: "People & Culture", managerId: "u-kavya" },
  { id: "t-lead", name: "Leadership", managerId: "u-vikram" },
];

type P = Omit<Person, "email" | "employeeCode" | "phone" | "status" | "tasks"> & { status?: Person["status"] };

const RAW_PEOPLE: P[] = [
  { id: "u-ananya", name: "Ananya Iyer", role: "EMPLOYEE", jobTitle: "Frontend Engineer", teamId: "t-eng", officeId: "o-blr", joinedAt: "2023-04-10", bio: "Builds the bits you click. Weekend trekker and filter-coffee loyalist.", skills: [{ name: "React", level: 5 }, { name: "TypeScript", level: 4 }, { name: "Design systems", level: 4 }, { name: "Accessibility", level: 3 }], points: 340, status: "ACTIVE" },
  { id: "u-arjun", name: "Arjun Mehta", role: "MANAGER", jobTitle: "Engineering Manager", teamId: "t-eng", officeId: "o-blr", joinedAt: "2021-01-18", bio: "Leads the platform team. Ask me about route optimisation or cricket.", skills: [{ name: "System design", level: 5 }, { name: "Go", level: 4 }, { name: "Mentoring", level: 5 }], points: 520, status: "BUSY" },
  { id: "u-kabir", name: "Kabir Singh", role: "EMPLOYEE", jobTitle: "Backend Engineer", teamId: "t-eng", officeId: "o-blr", joinedAt: "2022-08-01", bio: "APIs, queues and the occasional 2am pager alert.", skills: [{ name: "Node.js", level: 5 }, { name: "PostgreSQL", level: 4 }, { name: "AWS", level: 3 }], points: 410, status: "ACTIVE" },
  { id: "u-sneha", name: "Sneha Kulkarni", role: "EMPLOYEE", jobTitle: "QA Engineer", teamId: "t-eng", officeId: "o-mum", joinedAt: "2023-11-20", bio: "If it can break, I will find out how.", skills: [{ name: "Test automation", level: 4 }, { name: "Playwright", level: 4 }], points: 180, status: "AWAY" },
  { id: "u-farhan", name: "Farhan Sheikh", role: "EMPLOYEE", jobTitle: "DevOps Engineer", teamId: "t-eng", officeId: "o-blr", joinedAt: "2022-02-14", bio: "Keeps the lights on and the pipelines green.", skills: [{ name: "Kubernetes", level: 4 }, { name: "Terraform", level: 4 }, { name: "AWS", level: 5 }], points: 265, status: "OFFLINE" },
  { id: "u-priya", name: "Priya Nair", role: "MANAGER", jobTitle: "Head of Sales", teamId: "t-sales", officeId: "o-mum", joinedAt: "2020-06-01", bio: "Turning conversations into partnerships since 2012.", skills: [{ name: "Enterprise sales", level: 5 }, { name: "Negotiation", level: 5 }], points: 610, status: "ACTIVE" },
  { id: "u-dev", name: "Dev Malhotra", role: "EMPLOYEE", jobTitle: "Account Executive", teamId: "t-sales", officeId: "o-ggn", joinedAt: "2023-02-06", bio: "North India accounts. Always up for a quiz.", skills: [{ name: "Account management", level: 4 }, { name: "CRM", level: 3 }], points: 295, status: "ACTIVE" },
  { id: "u-ishita", name: "Ishita Bose", role: "EMPLOYEE", jobTitle: "Sales Development Rep", teamId: "t-sales", officeId: "o-mum", joinedAt: "2024-05-13", bio: "First hello for most of our new customers.", skills: [{ name: "Prospecting", level: 4 }, { name: "Bengali", level: 5 }], points: 150, status: "AWAY" },
  { id: "u-aditya", name: "Aditya Rao", role: "EMPLOYEE", jobTitle: "Customer Success Lead", teamId: "t-sales", officeId: "o-blr", joinedAt: "2022-10-03", bio: "Keeping customers happy after the contract is signed.", skills: [{ name: "Onboarding", level: 5 }, { name: "Kannada", level: 5 }], points: 380, status: "ACTIVE" },
  { id: "u-rohan", name: "Rohan Das", role: "MANAGER", jobTitle: "Operations Manager", teamId: "t-ops", officeId: "o-ggn", joinedAt: "2019-09-09", bio: "200 trucks, 12 warehouses, zero excuses.", skills: [{ name: "Fleet management", level: 5 }, { name: "Six Sigma", level: 4 }], points: 450, status: "ACTIVE" },
  { id: "u-meghna", name: "Meghna Pillai", role: "EMPLOYEE", jobTitle: "Fleet Coordinator", teamId: "t-ops", officeId: "o-ggn", joinedAt: "2023-07-17", bio: "Knows where every truck is, right now.", skills: [{ name: "Route planning", level: 4 }, { name: "Excel", level: 5 }], points: 220, status: "BUSY" },
  { id: "u-sameer", name: "Sameer Khan", role: "EMPLOYEE", jobTitle: "Warehouse Lead", teamId: "t-ops", officeId: "o-mum", joinedAt: "2021-12-01", bio: "Bhiwandi warehouse. Safety first, speed second.", skills: [{ name: "Inventory", level: 5 }, { name: "Team leadership", level: 4 }], points: 305, status: "OFFLINE" },
  { id: "u-nisha", name: "Nisha Verma", role: "EMPLOYEE", jobTitle: "Logistics Analyst", teamId: "t-ops", officeId: "o-ggn", joinedAt: "2024-01-08", bio: "Dashboards, forecasts and too many spreadsheets.", skills: [{ name: "SQL", level: 4 }, { name: "Power BI", level: 4 }, { name: "Forecasting", level: 3 }], points: 200, status: "ACTIVE" },
  { id: "u-kavya", name: "Kavya Reddy", role: "HR", jobTitle: "Chief HR Officer", teamId: "t-people", officeId: "o-blr", joinedAt: "2020-03-02", bio: "People first. Building a place people want to stay.", skills: [{ name: "Org design", level: 5 }, { name: "Coaching", level: 5 }], points: 480, status: "ACTIVE" },
  { id: "u-tara", name: "Tara Joseph", role: "EMPLOYEE", jobTitle: "HR Business Partner", teamId: "t-people", officeId: "o-blr", joinedAt: "2022-06-20", bio: "Your go-to for policies, payroll questions and team events.", skills: [{ name: "Employee relations", level: 4 }, { name: "Events", level: 5 }], points: 330, status: "AWAY" },
  { id: "u-vikram", name: "Vikram Shah", role: "COMPANY_ADMIN", jobTitle: "Managing Director", teamId: "t-lead", officeId: "o-mum", joinedAt: "2018-01-01", bio: "Founder. Still loves a good warehouse visit.", skills: [{ name: "Strategy", level: 5 }, { name: "Logistics", level: 5 }], points: 260, status: "BUSY", isMD: true },
];

const t = (id: string, title: string, detail: string, period: string, status: Task["status"] = "DONE"): Task => ({ id, title, detail, period, status });

/** Work each person has taken on, shown on their profile. */
const TASKS: Record<string, Task[]> = {
  "u-ananya": [
    t("tk-1", "Design system v2", "Rebuilt 40 components for the driver and customer apps", "Aug to Oct 2026"),
    { ...t("tk-2", "Accessibility audit", "Fixing contrast and keyboard issues on the tracking page", "Nov 2026", "IN_PROGRESS"), addedById: "u-arjun" },
    t("tk-3", "Onboarding buddy", "Mentored two new frontend joiners", "Jun 2026"),
  ],
  "u-kabir": [
    t("tk-4", "Tracking API rebuild", "Moved shipment tracking off the old vendor with zero downtime", "Oct 2026"),
    { ...t("tk-5", "Billing service migration", "Splitting invoices out of the main backend", "Nov 2026", "IN_PROGRESS"), addedById: "u-arjun" },
  ],
  "u-arjun": [
    t("tk-6", "Platform team roadmap", "Q4 plan for routing, tracking and the driver app", "Oct 2026"),
    t("tk-7", "Hiring: 3 engineers", "Two offers accepted, one role open", "Nov 2026", "IN_PROGRESS"),
  ],
  "u-dev": [t("tk-8", "Haryana cold-chain deal", "Largest contract this quarter", "Sep to Oct 2026")],
  "u-meghna": [t("tk-9", "Monsoon re-routing plan", "Playbook for highway closures", "Jul 2026")],
  "u-nisha": [
    t("tk-10", "Fleet utilisation dashboard", "Power BI dashboard used by every regional manager", "Sep 2026"),
    t("tk-11", "Demand forecast for Diwali", "Warehouse staffing forecast by city", "Oct 2026", "IN_PROGRESS"),
  ],
  "u-kavya": [
    t("tk-12", "Engagement programme launch", "Rolled out Engage to all 3 offices", "Oct 2026"),
    t("tk-13", "Performance review cycle", "H2 reviews for 420 employees", "Nov to Dec 2026", "IN_PROGRESS"),
  ],
  "u-tara": [t("tk-14", "Diwali celebrations", "Potlucks and decorations in all offices", "Nov 2026", "IN_PROGRESS")],
  "u-vikram": [t("tk-15", "IPO readiness", "Working with bankers and the board on the listing plan", "2026", "IN_PROGRESS")],
  "u-priya": [t("tk-16", "North India expansion", "Opened 12 new enterprise accounts", "H1 2026")],
  "u-rohan": [t("tk-17", "Warehouse safety programme", "100 days without incidents at Bhiwandi", "Aug to Oct 2026")],
};

const AVATARS: Record<string, Person["avatar"]> = {
  "u-kabir": { kind: "emoji", emoji: "🦊", tint: 2 },
  "u-priya": { kind: "emoji", emoji: "🌸", tint: 3 },
  "u-farhan": { kind: "emoji", emoji: "🚀", tint: 4 },
  "u-tara": { kind: "emoji", emoji: "🎉", tint: 5 },
};

const PEOPLE: Person[] = RAW_PEOPLE.map((p, i) => ({
  ...p,
  tasks: TASKS[p.id] ?? [],
  avatar: AVATARS[p.id],
  status: p.status ?? "OFFLINE",
  email: `${p.name.split(" ")[0].toLowerCase()}@northwind.demo`,
  employeeCode: `NW-${String(1040 + i * 7).padStart(4, "0")}`,
  phone: `+91 98${String(45000000 + i * 137911).slice(0, 8)}`,
}));

export const COMPANY_VALUES = ["Customer first", "Own it", "Better together", "Raise the bar"];

const PRAISES: Praise[] = [
  { id: "pr-1", kind: "PRAISE", authorId: "u-arjun", recipientId: "u-kabir", message: "Kabir rebuilt the shipment-tracking API over the weekend after the vendor outage. Zero downtime for customers. Legend.", value: "Own it", points: 10, createdAt: minutesAgo(25), likes: ["u-ananya", "u-farhan", "u-priya"] },
  { id: "pr-2", kind: "ACHIEVEMENT", authorId: "u-priya", recipientId: "u-dev", message: "Dev closed the Haryana cold-chain contract, our biggest deal this quarter! 🎉", value: "Customer first", points: 10, createdAt: minutesAgo(2 * H), likes: ["u-vikram", "u-rohan", "u-ishita", "u-aditya", "u-kavya"] },
  { id: "pr-3", kind: "PRAISE", authorId: "u-ananya", recipientId: "u-sneha", message: "Thanks Sneha for catching the checkout bug before release. Your test suite saved us.", value: "Raise the bar", points: 10, createdAt: minutesAgo(5 * H), likes: ["u-arjun"] },
  { id: "pr-4", kind: "PRAISE", authorId: "u-rohan", recipientId: "u-meghna", message: "Meghna re-routed 14 trucks around the highway closure in under an hour. Every delivery made it on time.", value: "Customer first", points: 10, createdAt: minutesAgo(D), likes: ["u-nisha", "u-sameer", "u-vikram"] },
  { id: "pr-5", kind: "PRAISE", authorId: "u-tara", recipientId: "u-aditya", message: "Aditya volunteered to run the onboarding buddy programme for the new joiners. So many happy first weeks!", value: "Better together", points: 10, createdAt: minutesAgo(D + 4 * H), likes: ["u-kavya", "u-ananya"] },
  { id: "pr-6", kind: "ACHIEVEMENT", authorId: "u-kavya", recipientId: "u-nisha", message: "Nisha completed her Power BI certification. Congratulations!", value: "Raise the bar", points: 10, createdAt: minutesAgo(2 * D), likes: ["u-rohan"] },
  { id: "pr-7", kind: "PRAISE", authorId: "u-kabir", recipientId: "u-ananya", message: "Ananya's new design system made the driver app look brand new. Customers noticed too.", value: "Raise the bar", points: 10, createdAt: minutesAgo(3 * D), likes: ["u-arjun", "u-farhan", "u-sneha", "u-tara"] },
  { id: "pr-8", kind: "PRAISE", authorId: "u-vikram", recipientId: "u-sameer", message: "Sameer's Bhiwandi team hit 100 days without a safety incident. Proud of you all.", value: "Own it", points: 10, createdAt: minutesAgo(4 * D), likes: ["u-rohan", "u-kavya", "u-meghna"] },
];

// Each praise is worth what the recipient's level earns (5 / 10 / 15 by default).
for (const pr of PRAISES) {
  const r = PEOPLE.find((p) => p.id === pr.recipientId)!;
  pr.points = praisePoints(r, TEAMS, DEFAULT_POINTS_RULES);
}

const POINTS_LOG: PointsEntry[] = [
  { id: "pl-1", userId: "u-ananya", delta: 5, reason: "PRAISE_RECEIVED", note: "Praise from Kabir Singh", createdAt: minutesAgo(3 * D) },
  { id: "pl-2", userId: "u-ananya", delta: 40, reason: "QUIZ_RESULT", note: "Know Northwind quiz: 4/5", createdAt: minutesAgo(5 * D) },
  { id: "pl-3", userId: "u-ananya", delta: 15, reason: "GAME_RESULT", note: "Won Tic-Tac-Toe vs Kabir", createdAt: minutesAgo(8 * D) },
  { id: "pl-4", userId: "u-ananya", delta: 50, reason: "MANUAL_ADJUSTMENT", note: "Hackathon winner bonus", createdAt: minutesAgo(20 * D) },
];

export const NEWS: NewsItem[] = [
  // Local: Karnataka
  { id: "n-1", category: "LOCAL", region: "Karnataka", topic: "Transport", title: "Metro extends late-night service on two Bengaluru lines", summary: "Trains will run until midnight on weekdays from next month, easing commutes for late-shift workers.", source: "City Desk", publishedAt: minutesAgo(90), readMinutes: 3 },
  { id: "n-2", category: "LOCAL", region: "Karnataka", topic: "Weather", title: "Light showers expected across Bengaluru this week", summary: "Commuters are advised to plan for slower traffic on the Outer Ring Road during evening hours.", source: "Weather Watch", publishedAt: minutesAgo(5 * H), readMinutes: 2 },
  { id: "n-3", category: "LOCAL", region: "Karnataka", topic: "Community", title: "Lake clean-up drive draws record volunteer turnout", summary: "Over 2,000 residents and several corporate teams joined the Sunday drive at three city lakes.", source: "Neighbourhood News", publishedAt: minutesAgo(D), readMinutes: 4 },
  { id: "n-4", category: "LOCAL", region: "Karnataka", topic: "Events", title: "Tech and design festival returns to the city in December", summary: "The three-day event will feature workshops, startup showcases and a hiring fair.", source: "City Desk", publishedAt: minutesAgo(2 * D), readMinutes: 3 },
  // Local: Maharashtra
  { id: "n-5", category: "LOCAL", region: "Maharashtra", topic: "Transport", title: "New coastal road stretch opens to commuters in Mumbai", summary: "The link is expected to cut south-to-west suburb travel times by up to 30 minutes at peak hours.", source: "Metro Mirror", publishedAt: minutesAgo(2 * H), readMinutes: 3 },
  { id: "n-6", category: "LOCAL", region: "Maharashtra", topic: "Weather", title: "Clear skies and mild humidity forecast for the weekend", summary: "A good weekend for outdoor plans, says the regional weather office.", source: "Weather Watch", publishedAt: minutesAgo(7 * H), readMinutes: 1 },
  { id: "n-7", category: "LOCAL", region: "Maharashtra", topic: "Community", title: "Bhiwandi warehouse cluster gets new skill-training centre", summary: "The centre will offer free forklift and safety certification courses for local workers.", source: "Industrial Times", publishedAt: minutesAgo(D + 3 * H), readMinutes: 4 },
  // Local: Delhi NCR
  { id: "n-8", category: "LOCAL", region: "Delhi NCR", topic: "Air quality", title: "Air quality expected to improve after weekend winds", summary: "Authorities have eased some construction restrictions as AQI levels drop across Gurugram.", source: "Capital Report", publishedAt: minutesAgo(3 * H), readMinutes: 2 },
  { id: "n-9", category: "LOCAL", region: "Delhi NCR", topic: "Transport", title: "Rapid metro adds trains during office peak hours", summary: "Frequency on the Cyber City loop increases to every four minutes between 8 and 11 am.", source: "Capital Report", publishedAt: minutesAgo(D), readMinutes: 2 },
  // Sector: logistics
  { id: "n-10", category: "SECTOR", industry: "Logistics & Supply Chain", topic: "Policy", title: "National logistics policy update targets lower freight costs", summary: "The update focuses on multimodal hubs and digital paperwork to cut average logistics costs.", source: "Logistics Weekly", publishedAt: minutesAgo(45), readMinutes: 5 },
  { id: "n-11", category: "SECTOR", industry: "Logistics & Supply Chain", topic: "Technology", title: "Electric trucks enter mainstream for last-mile delivery", summary: "Fleet operators report lower running costs, with charging infrastructure the main hurdle.", source: "Fleet Today", publishedAt: minutesAgo(4 * H), readMinutes: 6 },
  { id: "n-12", category: "SECTOR", industry: "Logistics & Supply Chain", topic: "Market", title: "Festive season drives record warehouse demand", summary: "Grade-A warehousing absorption is up sharply year on year across major metros.", source: "Supply Chain Insider", publishedAt: minutesAgo(9 * H), readMinutes: 4 },
  { id: "n-13", category: "SECTOR", industry: "Logistics & Supply Chain", topic: "Cold chain", title: "Cold-chain capacity expands as pharma exports grow", summary: "New temperature-controlled facilities are coming up near major ports and airports.", source: "Logistics Weekly", publishedAt: minutesAgo(D + 2 * H), readMinutes: 5 },
  { id: "n-14", category: "SECTOR", industry: "Logistics & Supply Chain", topic: "Technology", title: "AI route planning cuts empty miles by double digits, study finds", summary: "Carriers using dynamic routing reported fewer empty return trips and faster delivery windows.", source: "Fleet Today", publishedAt: minutesAgo(2 * D), readMinutes: 7 },
  { id: "n-15", category: "SECTOR", industry: "Logistics & Supply Chain", topic: "Sustainability", title: "Shippers set new targets for green freight corridors", summary: "Industry groups commit to measuring and reporting freight emissions on key routes.", source: "Supply Chain Insider", publishedAt: minutesAgo(3 * D), readMinutes: 4 },
  // Other industries (Current Affairs). Sample headlines only.
  ...([
    ["Pharmaceuticals", "Exports", "Generic medicine exports continue steady growth", "Manufacturers cite demand from new markets and faster regulatory approvals.", "Pharma Pulse"],
    ["Pharmaceuticals", "Research", "Contract research firms expand clinical trial capacity", "New trial sites aim to cut patient recruitment times for global studies.", "Health Business"],
    ["Banking & Finance", "Payments", "UPI transactions set another monthly record", "Small-ticket payments in smaller towns drive most of the growth.", "Money Daily"],
    ["Banking & Finance", "Markets", "IPO pipeline stays busy as companies eye listings", "Bankers expect a steady stream of mid-sized offerings next quarter.", "Market Watch"],
    ["Information Technology", "AI", "Companies move AI pilots into everyday workflows", "Customer support and document processing lead early adoption.", "Tech Ledger"],
    ["Information Technology", "Hiring", "Tech hiring picks up for cloud and security roles", "Recruiters report more openings for mid-level engineers.", "Career Tech"],
    ["Retail & E-commerce", "Festive sales", "Festive season online sales beat expectations", "Quick-commerce and same-day delivery gained the most new shoppers.", "Retail Now"],
    ["Retail & E-commerce", "Stores", "Brands open smaller stores in tier-2 cities", "Compact formats help brands test new markets at lower cost.", "Retail Now"],
    ["Manufacturing", "Electronics", "Electronics assembly lines add new shifts", "Factories expand output ahead of the year-end demand peak.", "Factory Floor"],
    ["Manufacturing", "Automation", "Mid-sized factories invest in automation", "Owners say robotics now pays back faster than five years ago.", "Factory Floor"],
    ["Healthcare", "Digital health", "Teleconsultations become routine for follow-up visits", "Hospitals report fewer missed appointments with video check-ins.", "Health Business"],
    ["Healthcare", "Hospitals", "Hospital chains add beds in fast-growing cities", "New capacity focuses on cardiac and cancer care.", "Health Business"],
    ["Energy", "Solar", "Rooftop solar adoption rises among offices and homes", "Lower panel prices and simpler approvals speed up installations.", "Energy Today"],
    ["Energy", "EV charging", "Highway EV charging corridors expand", "Operators add fast chargers every 50 km on busy routes.", "Energy Today"],
    ["Automobiles", "EVs", "Electric two-wheeler sales climb ahead of the festive season", "More models under a lakh rupees are bringing in first-time buyers.", "Auto Track"],
    ["Automobiles", "Commercial vehicles", "Truck makers report steady demand from logistics firms", "Fleet operators are replacing older vehicles to cut fuel costs.", "Auto Track"],
    ["FMCG", "Rural demand", "Rural demand for everyday goods shows recovery", "Better harvests lift spending on packaged food and personal care.", "Consumer Desk"],
    ["FMCG", "Packaging", "Brands switch to recyclable packaging", "Companies set targets to cut single-use plastic over the next three years.", "Consumer Desk"],
  ] as const).map(([industry, topic, title, summary, source], i): NewsItem => ({
    id: `n-x${i}`,
    category: "SECTOR",
    industry,
    topic,
    title,
    summary,
    source,
    publishedAt: minutesAgo((i + 1) * 3 * H),
    readMinutes: 3 + (i % 4),
  })),
];

export const INDUSTRIES = [
  "Logistics & Supply Chain",
  "Pharmaceuticals",
  "Banking & Finance",
  "Information Technology",
  "Retail & E-commerce",
  "Manufacturing",
  "Healthcare",
  "Energy",
  "Automobiles",
  "FMCG",
];


const CONVERSATIONS: Conversation[] = [
  { id: "c-1", type: "DIRECT", memberIds: ["u-ananya", "u-kabir"] },
  { id: "c-2", type: "DIRECT", memberIds: ["u-ananya", "u-arjun"] },
  { id: "c-3", type: "GROUP", name: "Eng Fun Friday", memberIds: ["u-ananya", "u-kabir", "u-arjun", "u-sneha", "u-farhan"] },
  { id: "c-4", type: "GROUP", name: "Bengaluru office", memberIds: ["u-ananya", "u-kabir", "u-arjun", "u-farhan", "u-aditya", "u-kavya", "u-tara"] },
  { id: "c-5", type: "DIRECT", memberIds: ["u-kavya", "u-vikram"] },
  { id: "c-6", type: "GROUP", name: "People & Culture", memberIds: ["u-kavya", "u-tara"] },
  { id: "c-7", type: "DIRECT", memberIds: ["u-arjun", "u-kavya"] },
];

const MESSAGES: Message[] = [
  { id: "m-1", conversationId: "c-1", senderId: "u-kabir", body: "Hey! Did the tracking page pick up the new API?", createdAt: minutesAgo(70) },
  { id: "m-2", conversationId: "c-1", senderId: "u-ananya", body: "Yes, all wired up. Load times went from 2s to 400ms 🚀", createdAt: minutesAgo(65) },
  { id: "m-3", conversationId: "c-1", senderId: "u-kabir", body: "Quiz rematch at 5? I'm not losing twice in a row.", createdAt: minutesAgo(12) },
  { id: "m-4", conversationId: "c-2", senderId: "u-arjun", body: "Can you demo the new design system in Thursday's all-hands?", createdAt: minutesAgo(3 * H) },
  { id: "m-5", conversationId: "c-2", senderId: "u-ananya", body: "Sure, 10 minutes is enough. I'll prep a short walkthrough.", createdAt: minutesAgo(3 * H - 5) },
  { id: "m-6", conversationId: "c-3", senderId: "u-farhan", body: "Friday trivia theme this week: 90s Bollywood. No phones!", createdAt: minutesAgo(5 * H) },
  { id: "m-7", conversationId: "c-3", senderId: "u-sneha", body: "I'm bringing samosas from the Andheri place 😄", createdAt: minutesAgo(4 * H) },
  { id: "m-8", conversationId: "c-3", senderId: "u-arjun", body: "Count me in. Losers buy chai.", createdAt: minutesAgo(3 * H) },
  { id: "m-9", conversationId: "c-4", senderId: "u-tara", body: "Reminder: Diwali potluck on Friday, 4pm, terrace. Sign-up sheet is pinned!", createdAt: minutesAgo(D) },
  { id: "m-10", conversationId: "c-4", senderId: "u-aditya", body: "Signed up for dessert duty 🍬", createdAt: minutesAgo(D - 30) },
  { id: "m-11", conversationId: "c-5", senderId: "u-kavya", body: "The engagement report for October is ready. Participation is up 18%.", createdAt: minutesAgo(6 * H) },
  { id: "m-12", conversationId: "c-5", senderId: "u-vikram", body: "Excellent. Let's share the highlights in the town hall.", createdAt: minutesAgo(5 * H) },
  { id: "m-13", conversationId: "c-6", senderId: "u-tara", body: "Draft of the new recognition guidelines is in the shared drive.", createdAt: minutesAgo(2 * H) },
  { id: "m-14", conversationId: "c-7", senderId: "u-arjun", body: "Could we move Sneha into the platform squad next sprint?", createdAt: minutesAgo(8 * H) },
  { id: "m-15", conversationId: "c-7", senderId: "u-kavya", body: "Makes sense given her skills. I'll update the team in the people view.", createdAt: minutesAgo(7 * H) },
];

export const QUIZZES: Quiz[] = [
  {
    id: "q-northwind",
    title: "Know Northwind",
    description: "How well do you know your own company?",
    createdById: "u-kavya",
    pointsPerCorrect: 10,
    questions: [
      { prompt: "In which year was Northwind Logistics founded?", options: ["2012", "2015", "2018", "2020"], correctIndex: 2 },
      { prompt: "Which city is home to our largest warehouse?", options: ["Bhiwandi", "Hosur", "Manesar", "Chakan"], correctIndex: 0 },
      { prompt: "Which of these is one of our company values?", options: ["Move fast", "Own it", "Think big", "Stay hungry"], correctIndex: 1 },
      { prompt: "Roughly how many trucks are in our fleet?", options: ["50", "120", "200", "500"], correctIndex: 2 },
      { prompt: "Which team runs the driver app?", options: ["Sales", "Operations", "Engineering", "People & Culture"], correctIndex: 2 },
    ],
  },
  {
    id: "q-supply",
    title: "Supply Chain Trivia",
    description: "Ports, pallets and payloads. Test your industry knowledge.",
    createdById: "u-tara",
    pointsPerCorrect: 10,
    questions: [
      { prompt: "What does 'FTL' stand for in trucking?", options: ["Full Truck Load", "Freight Transfer Log", "Fast Track Lane", "Fixed Tariff Logistics"], correctIndex: 0 },
      { prompt: "A standard shipping container is how many feet long?", options: ["10 or 15", "20 or 40", "25 or 50", "30 or 60"], correctIndex: 1 },
      { prompt: "What is 'cross-docking'?", options: ["Repairing docks", "Moving goods inbound to outbound with little storage", "Shipping between two ports", "Double-checking invoices"], correctIndex: 1 },
      { prompt: "What does 'last mile' refer to?", options: ["The final leg of delivery to the customer", "The last truck of the day", "A port's final berth", "The shortest route"], correctIndex: 0 },
      { prompt: "What does 'SKU' stand for?", options: ["Standard Kit Unit", "Stock Keeping Unit", "Shipping Key Unit", "Store Keeping Usage"], correctIndex: 1 },
    ],
  },
  {
    id: "q-india",
    title: "Friday General Knowledge",
    description: "A quick five-question warm-up for the weekend.",
    createdById: "u-tara",
    pointsPerCorrect: 10,
    questions: [
      { prompt: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], correctIndex: 1 },
      { prompt: "How many players are on a cricket team on the field?", options: ["9", "10", "11", "12"], correctIndex: 2 },
      { prompt: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3 },
      { prompt: "Which gas do plants absorb from the air?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], correctIndex: 2 },
      { prompt: "How many minutes are in a full day?", options: ["1,240", "1,440", "1,640", "2,400"], correctIndex: 1 },
    ],
  },
];

export const GAMES = [
  { key: "quiz", name: "Team Quiz", description: "Answer five questions, earn points for each correct answer.", players: "1 to 50 players", href: "#quizzes", points: "10 per correct answer" },
  { key: "chess", name: "Chess", description: "Play the computer at three levels. Beat it to earn points.", players: "1 to 2 players", href: "/games/chess", points: "10 to 30 for a win" },
  { key: "sudoku", name: "Sudoku", description: "A fresh puzzle every time, in three difficulties.", players: "1 player", href: "/games/sudoku", points: "10 to 30 per puzzle" },
  { key: "tic-tac-toe", name: "Tic-Tac-Toe", description: "The classic. Win to earn 15 points.", players: "2 players", href: "/games/tic-tac-toe", points: "15 for a win" },
] as const;

const COHORTS: Cohort[] = [
  { id: "ch-diwali", name: "Diwali 2026", description: "Lights, sweets and celebrations. Share photos, plans and wishes.", emoji: "🪔", scope: "PLATFORM", createdById: "p-core", createdByName: "Sarthak & team", createdAt: minutesAgo(6 * D), memberIds: PEOPLE.map((p) => p.id), pinned: true },
  { id: "ch-ipo", name: "Road to IPO", description: "Updates from leadership on our listing journey. Ask anything.", emoji: "📈", scope: "COMPANY", createdById: "u-vikram", createdByName: "Vikram Shah", createdAt: minutesAgo(12 * D), memberIds: PEOPLE.map((p) => p.id), pinned: true },
  { id: "ch-ex", name: "Employee Experience", description: "Ideas to make work better, from desks to day-one onboarding.", emoji: "💡", scope: "PLATFORM", createdById: "p-core", createdByName: "Sarthak & team", createdAt: minutesAgo(20 * D), memberIds: PEOPLE.filter((_, i) => i % 3 !== 2).map((p) => p.id) },
  { id: "ch-together", name: "Bring Everyone Together", description: "Meetups, potlucks, sports and volunteering across offices.", emoji: "🤝", scope: "PLATFORM", createdById: "p-core", createdByName: "Sarthak & team", createdAt: minutesAgo(25 * D), memberIds: PEOPLE.filter((_, i) => i % 2 === 0).map((p) => p.id) },
];

const opt = (id: string, label: string, votes: string[]) => ({ id, label, votes });

const POSTS: Post[] = [
  // Lounge
  { id: "po-1", space: "lounge", authorId: "u-tara", kind: "POLL", body: "", poll: { question: "Where should we hold the Diwali party?", options: [opt("a", "Office terrace", ["u-ananya", "u-kabir", "u-sneha", "u-aditya"]), opt("b", "Banquet hall", ["u-priya", "u-dev", "u-vikram"]), opt("c", "Rooftop restaurant", ["u-farhan", "u-nisha"])] }, createdAt: minutesAgo(40), likes: ["u-kavya"], comments: [{ id: "cm-1", authorId: "u-kabir", body: "Terrace! With the lights it looked amazing last year.", createdAt: minutesAgo(30) }] },
  { id: "po-2", space: "lounge", authorId: "u-farhan", kind: "TEXT", body: "Anyone else hooked on the new Sudoku in Games? I've done three on Hard today and I'm not sorry.", createdAt: minutesAgo(3 * H), likes: ["u-ananya", "u-nisha"], comments: [] },
  { id: "po-3", space: "lounge", authorId: "u-ishita", kind: "TEXT", body: "Lost: a blue steel bottle with stickers, 4th floor pantry, Mumbai office. It has sentimental value (and my sticker collection) 🙏", createdAt: minutesAgo(6 * H), likes: [], comments: [{ id: "cm-2", authorId: "u-sameer", body: "Saw one at reception this morning!", createdAt: minutesAgo(5 * H) }] },
  { id: "po-4", space: "lounge", authorId: "u-nisha", kind: "TEXT", body: "Book club pick for November: anything under 300 pages. Suggestions welcome 📚", createdAt: minutesAgo(D + 2 * H), likes: ["u-tara", "u-meghna", "u-kavya"], comments: [] },
  // Diwali
  { id: "po-5", space: "cohort:ch-diwali", authorId: "u-tara", kind: "TEXT", body: "Rangoli competition on Thursday at 3pm in every office. Teams of 3, materials provided. Winners get 50 points each!", createdAt: minutesAgo(5 * H), likes: ["u-ananya", "u-sneha", "u-meghna", "u-ishita"], comments: [{ id: "cm-3", authorId: "u-ananya", body: "Engineering is coming for that trophy.", createdAt: minutesAgo(4 * H) }] },
  { id: "po-6", space: "cohort:ch-diwali", authorId: "u-kavya", kind: "POLL", body: "", poll: { question: "Best Diwali sweet?", options: [opt("a", "Kaju katli", ["u-kavya", "u-dev", "u-ananya", "u-rohan"]), opt("b", "Gulab jamun", ["u-kabir", "u-sameer"]), opt("c", "Soan papdi", ["u-farhan"]), opt("d", "Motichoor laddoo", ["u-priya", "u-meghna"])] }, createdAt: minutesAgo(D), likes: ["u-tara"], comments: [] },
  // IPO
  { id: "po-7", space: "cohort:ch-ipo", authorId: "u-vikram", kind: "TEXT", body: "Thank you all for an incredible year. We've started preparing for a public listing. I'll share updates here, and we'll hold an open Q&A every month. No question is too small.", createdAt: minutesAgo(2 * D), likes: ["u-kavya", "u-priya", "u-rohan", "u-arjun", "u-kabir", "u-dev"], comments: [{ id: "cm-4", authorId: "u-dev", body: "Will employees be able to take part in the employee share plan?", createdAt: minutesAgo(2 * D - 60) }, { id: "cm-5", authorId: "u-vikram", body: "Great question, Dev. HR will share the details at the next Q&A.", createdAt: minutesAgo(2 * D - 30) }] },
  { id: "po-8", space: "cohort:ch-ipo", authorId: "u-kavya", kind: "POLL", body: "", poll: { question: "What should the next IPO Q&A cover first?", options: [opt("a", "Employee share plan", ["u-dev", "u-ananya", "u-kabir", "u-nisha", "u-sameer"]), opt("b", "Timeline", ["u-priya", "u-aditya"]), opt("c", "What changes day to day", ["u-meghna"])] }, createdAt: minutesAgo(D + 3 * H), likes: [], comments: [] },
  // Employee experience
  { id: "po-9", space: "cohort:ch-ex", authorId: "u-sneha", kind: "TEXT", body: "Idea: a quiet room on each floor for focus work and calls. The pantry is lovely but loud 😅", createdAt: minutesAgo(3 * D), likes: ["u-ananya", "u-farhan", "u-tara", "u-kavya"], comments: [{ id: "cm-6", authorId: "u-kavya", body: "Love this. Facilities is looking at the 3rd floor meeting room.", createdAt: minutesAgo(3 * D - 120) }] },
  // Together
  { id: "po-10", space: "cohort:ch-together", authorId: "u-aditya", kind: "TEXT", body: "Saturday cricket at the Koramangala ground, 7am. We need two more players. Bring your own bat if you have one!", createdAt: minutesAgo(D + 6 * H), likes: ["u-arjun", "u-kabir"], comments: [] },
];

// Every praise also shows in the Lounge as a system message.
for (const pr of PRAISES) {
  POSTS.push({ id: `po-pr-${pr.id}`, space: "lounge", authorId: null, kind: "PRAISE_EVENT", body: "", praiseId: pr.id, createdAt: pr.createdAt, likes: [], comments: [] });
}

// Farhan completed it privately; HR has asked, and he hasn't answered yet.
const ASSESSMENT_REQUESTS: AssessmentRequest[] = [{ id: "ar-1", userId: "u-farhan", requestedById: "u-kavya", createdAt: minutesAgo(5 * H), status: "PENDING" }];

const score = (o: number, g: number, d: number, c: number, m: number) => ({ openness: o, organisation: g, drive: d, collaboration: c, composure: m });

/** Sample work-style results so the HR and manager views have data. */
const ASSESSMENTS: AssessmentResult[] = [
  { userId: "u-kabir", completedAt: minutesAgo(4 * D), scores: score(72, 64, 81, 58, 69), sharedWithHr: true },
  { userId: "u-sneha", completedAt: minutesAgo(6 * D), scores: score(55, 88, 62, 70, 74), sharedWithHr: true },
  { userId: "u-farhan", completedAt: minutesAgo(9 * D), scores: score(68, 79, 66, 52, 83), sharedWithHr: false },
  { userId: "u-priya", completedAt: minutesAgo(3 * D), scores: score(66, 71, 92, 84, 77), sharedWithHr: true },
  { userId: "u-dev", completedAt: minutesAgo(2 * D), scores: score(61, 58, 88, 79, 63), sharedWithHr: true },
  { userId: "u-aditya", completedAt: minutesAgo(5 * D), scores: score(59, 69, 74, 91, 71), sharedWithHr: true },
  { userId: "u-rohan", completedAt: minutesAgo(8 * D), scores: score(48, 90, 79, 72, 81), sharedWithHr: true },
  { userId: "u-meghna", completedAt: minutesAgo(7 * D), scores: score(52, 84, 70, 75, 60), sharedWithHr: false },
  { userId: "u-nisha", completedAt: minutesAgo(D), scores: score(78, 82, 68, 61, 66), sharedWithHr: true },
  { userId: "u-tara", completedAt: minutesAgo(10 * D), scores: score(70, 66, 64, 93, 76), sharedWithHr: true },
];

const AUDIT: AuditEntry[] = [
  { id: "a-1", actorId: "u-kavya", action: "Moved employee to team", target: "Nisha Verma → Operations", createdAt: minutesAgo(3 * H) },
  { id: "a-2", actorId: "u-vikram", action: "Updated branding", target: "Brand colour changed", createdAt: minutesAgo(D) },
  { id: "a-3", actorId: "u-kavya", action: "Published quiz", target: "Know Northwind", createdAt: minutesAgo(2 * D) },
  { id: "a-4", actorId: "u-tara", action: "Invited employee", target: "ishita@northwind.demo", createdAt: minutesAgo(4 * D) },
  { id: "a-5", actorId: "u-kavya", action: "Adjusted points", target: "Ananya Iyer +50 (Hackathon winner)", createdAt: minutesAgo(20 * D) },
  { id: "a-6", actorId: "u-vikram", action: "Enabled module", target: "Games & Quizzes", createdAt: minutesAgo(30 * D) },
];

const COMPANY: Company = {
  name: "Northwind Logistics",
  sector: "Logistics & Supply Chain",
  brandColor: "#4f46e5",
  planCode: "pro",
  enabledModules: ["cohort", "lounge", "news", "games", "chat", "profile", "assessments"],
  values: COMPANY_VALUES,
  games: ["quiz", "chess", "sudoku", "tic-tac-toe"],
  pointsRules: DEFAULT_POINTS_RULES,
  industries: ["Logistics & Supply Chain", "Retail & E-commerce", "Manufacturing", "Banking & Finance", "Automobiles", "Energy"],
  hrNote: {
    authorId: "u-kavya",
    title: "Diwali week at Northwind",
    body: "All offices close at 4pm on Friday so you can get home early. Health insurance enrolment for parents closes on 15 November. Wishing you and your families a bright and safe Diwali! 🪔",
    updatedAt: minutesAgo(3 * H),
  },
  assessmentSharing: "HR_CAN_REQUEST",
  taskEditing: "SELF_AND_MANAGER",
};

const PLANS: Plan[] = [
  { code: "basic", name: "Basic", pricePerSeat: 99, description: "Recognition and news for growing teams.", features: ["cohort", "lounge", "news", "profile"], extras: ["Email sign-in", "Standard support"] },
  { code: "pro", name: "Pro", pricePerSeat: 199, description: "The full engagement suite with chat and games.", features: ["cohort", "lounge", "news", "games", "chat", "profile", "assessments"], extras: ["Microsoft and Google sign-in", "Engagement insights", "Priority support"] },
  { code: "enterprise", name: "Enterprise", pricePerSeat: 299, description: "For large companies with custom needs.", features: ["cohort", "lounge", "news", "games", "chat", "profile", "assessments"], extras: ["Custom domain and branding", "HRIS sync", "Dedicated success manager", "99.9% uptime SLA"] },
];

const TENANTS: Tenant[] = [
  { id: "tn-1", name: "Northwind Logistics", slug: "northwind", sector: "Logistics & Supply Chain", planCode: "pro", seats: 420, activeUsers: 376, status: "ACTIVE", adminEmail: "vikram@northwind.demo", createdAt: minutesAgo(210 * D) },
  { id: "tn-2", name: "Acme Pharma", slug: "acme-pharma", sector: "Pharmaceuticals", planCode: "enterprise", seats: 1200, activeUsers: 1034, status: "ACTIVE", adminEmail: "it@acmepharma.demo", createdAt: minutesAgo(160 * D) },
  { id: "tn-3", name: "Lotus Hospitality", slug: "lotus", sector: "Hospitality", planCode: "basic", seats: 150, activeUsers: 61, status: "TRIAL", adminEmail: "hr@lotushotels.demo", createdAt: minutesAgo(9 * D) },
  { id: "tn-4", name: "Zenith Fintech", slug: "zenith", sector: "Financial Services", planCode: "pro", seats: 300, activeUsers: 271, status: "ACTIVE", adminEmail: "people@zenith.demo", createdAt: minutesAgo(95 * D) },
  { id: "tn-5", name: "Brightline Retail", slug: "brightline", sector: "Retail", planCode: "basic", seats: 800, activeUsers: 512, status: "ACTIVE", adminEmail: "hr@brightline.demo", createdAt: minutesAgo(70 * D) },
  { id: "tn-6", name: "Cedar Health", slug: "cedar-health", sector: "Healthcare", planCode: "pro", seats: 260, activeUsers: 0, status: "SUSPENDED", adminEmail: "admin@cedarhealth.demo", createdAt: minutesAgo(130 * D) },
];

export const PLATFORM_USERS: PlatformUser[] = [
  { id: "p-meera", name: "Meera Kapoor", email: "meera@reseller.demo", role: "RESELLER_ADMIN" },
  { id: "p-core", name: "Platform Team", email: "core@platform.demo", role: "CORE_ADMIN" },
];

/** Accounts shown on the login page for the demo. */
export const DEMO_ACCOUNTS = [
  { email: "ananya@northwind.demo", label: "Employee", who: "Ananya Iyer, Frontend Engineer" },
  { email: "arjun@northwind.demo", label: "Manager", who: "Arjun Mehta, Engineering Manager" },
  { email: "kavya@northwind.demo", label: "HR", who: "Kavya Reddy, Chief HR Officer" },
  { email: "vikram@northwind.demo", label: "Company admin", who: "Vikram Shah, Managing Director" },
  { email: "meera@reseller.demo", label: "Reseller", who: "Meera Kapoor, Reseller console" },
] as const;

/** Weekly engagement figures for the insights page (last 8 weeks, oldest first). */
export const INSIGHTS = {
  weeks: ["Sep 8", "Sep 15", "Sep 22", "Sep 29", "Oct 6", "Oct 13", "Oct 20", "Oct 27"],
  praise: [41, 38, 52, 47, 63, 58, 71, 76],
  activeRate: [61, 63, 66, 64, 70, 72, 74, 78],
  byTeam: [
    { team: "Engineering", score: 86 },
    { team: "Sales", score: 81 },
    { team: "People & Culture", score: 92 },
    { team: "Operations", score: 68 },
    { team: "Leadership", score: 74 },
  ],
};

export function createSeed(): DemoState {
  return {
    session: null,
    people: PEOPLE,
    teams: TEAMS,
    praises: PRAISES,
    pointsLog: POINTS_LOG,
    conversations: CONVERSATIONS,
    messages: MESSAGES,
    invites: [],
    audit: AUDIT,
    company: COMPANY,
    tenants: TENANTS,
    plans: PLANS,
    cohorts: COHORTS,
    posts: POSTS,
    assessments: ASSESSMENTS,
    assessmentRequests: ASSESSMENT_REQUESTS,
  };
}
