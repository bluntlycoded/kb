# Scope

Source: the client's two handwritten pages, plus our follow-up notes.

## Business model

We build the product for our client. They sell it to customer companies,
and each customer company is a **tenant**.

| Layer | Who | Role in code |
|---|---|---|
| Platform | Us (developer company) | `CORE_ADMIN` (PlatformUser) |
| Reseller | Our client | `RESELLER_ADMIN` (PlatformUser), still to be confirmed |
| Customer company | Director | `COMPANY_ADMIN` |
| | CHRO / HR | `HR` |
| | Team managers | `MANAGER` |
| | Everyone | `EMPLOYEE` |

## Roles (from the brief)

- **Employee**: uses the portal.
- **Manager**: sees details of employees in their team.
- **HR (CHRO)**: sees all employees and can reallocate teams.
- **Admin (Company Director)**: monitors everything in their company.
- **Core Admin**: stays with the developer company.

Code: `packages/shared/src/roles.ts` (`PERMISSIONS`, `can()`).

## Modules

| Module | Brief | Status |
|---|---|---|
| Cohort | Community page; praise and achievements; employees earn points for praise | API: feed and give praise (with points ledger). UI placeholder |
| News | Local/region news and company-sector news | API: read endpoint. Ingestion waits on the provider choice. UI placeholder |
| Games & Quizzes | Engagement games; see colleagues' status (active / away / busy); invite to play | API: catalogue, invite, respond. Socket presence and invites. UI placeholder |
| Chat | DMs and groups | API: conversations, history. Socket send. UI placeholder |
| Profile | Employment details, points, skills | API: me, by id (detail level depends on role), people list. UI placeholder |

Each module is a feature flag on the tenant's plan (`packages/shared/src/features.ts`).

## Suggested phases

1. **Foundation:** tenants, plans, sign-in, roles, profiles, teams, Cohort, News
2. **Live layer:** presence, then Chat
3. **Games & quizzes**, built on presence
4. **Reseller console:** onboarding, plans, billing, branding

## Open questions for the client

**Business**
1. Do you (the reseller) need your own admin console to manage customers, or will you go through us?
2. Which plans or tiers will you sell, and which modules go in each?
3. Branding: should customers see your brand, their own, or both? Custom subdomains?
4. Who owns the code, and who hosts it? Is there a maintenance retainer?
5. Who provides first-line support to customer companies?
6. How many employees per customer company (typical and largest)?

**Product**
7. Points: what are they for? Is there a rewards store? Who can give praise, and are there limits?
8. News: a paid news API, HR-curated articles, or both? Is region taken from the office location?
9. Games: which games? Who writes quizzes? Do games award points?
10. Manager view: exactly which fields can a manager see (salary? performance?).
11. "Admin monitors everything": does that include private chats? (Legal and privacy issue.)
12. HR team allocation: moved by hand, or suggestions based on skills?
13. Sign-in: Microsoft or Google SSO? How do employee records get in (CSV or HRIS sync)?
14. Web only, or iOS and Android apps too?
15. Data residency and compliance needs (DPDP Act for India, GDPR for EU customers, SOC 2)?
