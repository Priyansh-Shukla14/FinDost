# FinDost — Phases Roadmap (Summary)

This document consolidates the 7-phase roadmap and project guide into a single, actionable README focused on what to build, how to build it, the done criteria, and common pitfalls to avoid.

---

## Phase 1 — Foundation: Setup + Database + Login

- Goal: Get a working dev environment, database, and secure authentication.
- Core steps:
  - Install Node.js 18+, Git; create project with Next.js App Router and Tailwind.
  - Create repo and push early and often (small commits).
  - Provision PostgreSQL (Neon) and add `DATABASE_URL` to `.env` (keep .env out of git).
  - Install and configure Prisma: define tables (User, Expense, Category, Budget, Subscription, Goal), run `npx prisma migrate dev` and optionally seed.
  - Configure Google OAuth and NextAuth; add protected routes and session checks.
- Tools: Node, Git, Neon (Postgres), Prisma, NextAuth.
- Done when: Google login shows user profile in dashboard and a `User` record exists in the DB; logout and protected routes work.
- Common mistakes: committing `.env`, changing schema haphazardly, wrong OAuth redirect URL.

---

## Phase 2 — Core: Expenses + Categories + Budgets

- Goal: Implement robust expense CRUD, categories, and monthly budgets.
- Core steps:
  - Seed Indian categories via `prisma/seed` (Chai, Auto, EMI, Recharge, etc.).
  - Add Zod validation on server actions for expense inputs.
  - Implement add/edit/delete/list actions using `session.user.id` for scoping.
  - Implement filters (month, category) and budget model + progress calculations (aggregate/groupBy).
- Tools: Zod, Prisma, Server Actions.
- Done when: Add/Edit/Delete works reliably, filters and budgets show correct aggregates, and cross-account data access is impossible.
- Common mistakes: storing money in `float` (use integer paise or Decimal), trusting client validation, using `userId` from form/URL instead of session.

---

## Phase 3 — Dashboard: Charts & Responsive UI

- Goal: Build a mobile-first dashboard showing spending, trends, and progress.
- Core steps:
  - Implement data functions: `getMonthlyTotal()`, `getSpendByCategory()`, `getLast6MonthsTrend()`, `getBudgetStatus()`.
  - Use `recharts` for pie/bar charts (client components) and `Intl.NumberFormat('en-IN')` for ₹ formatting.
  - Add empty-state UX and ensure responsive grid layout.
- Tools: Recharts, Tailwind, server/client component separation.
- Done when: Dashboard metrics match raw data and layout works on mobile.
- Common mistakes: mixing client chart libs into server components, timezone bugs when determining "this month".

---

## Phase 4 — Deploy #1: Website LIVE

- Goal: Deploy a stable production instance and verify end-to-end flows.
- Core steps:
  - Connect repo to Vercel and add env vars in Vercel dashboard.
  - Update Google OAuth redirect to production URL.
  - Test signup, login, add expense flow from multiple devices and accounts.
- Done when: Public URL allows signup and expense creation; live demo is resume-ready.
- Common mistakes: forgetting env vars in Vercel and pushing broken code to main without testing.

---

## Phase 5 — AI: FinBot + Receipt Scanner

- Goal: Add secure, function-calling LLM chat (FinBot) and vision-based receipt parsing.
- Core steps:
  - Obtain OpenAI API key and implement basic chat UI (bubbles, streaming optional).
  - Define safe, read-only backend functions (tools) for FinBot: e.g., `getSpendByCategory`, `getBudgetStatus`, `getRecentTransactions`, `getMonthlyTotal`.
  - Implement the function-calling loop: send user message + tools list → if model requests a function, run it server-side with `session.user.id` → return results to model → display final answer.
  - Build receipt upload flow: send image to vision model with a strict prompt that returns JSON `{merchant, amount, date}` → validate via Zod before saving.
  - Add rate-limiting per user to cap OpenAI usage.
- Tools: OpenAI (function calling & vision), server-side validation (Zod), rate-limiter.
- Done when: FinBot answers 5 test QA matching dashboard numbers, refuses cross-user data requests, and receipt parsing reliably pre-fills expense forms.
- Common mistakes: dumping raw user data into prompts, trusting AI output without validation, exposing API keys on frontend.

---

## Phase 6 — Automation: Alerts, Subscriptions, CSV Import

- Goal: Add scheduled alerts, subscription detection, and bulk imports.
- Core steps:
  - Configure emails (Resend) and cron jobs (Vercel Cron) for daily/ monthly automation.
  - Implement budget alert job: compute spent% and email when thresholds crossed; store per-month alert flag to avoid repeats.
  - Implement subscription detector: algorithm to find recurring payments (same merchant, similar amount, ~28–33 day cadence) and suggest subscription entries.
  - CSV import with column mapping and preview using PapaParse and `prisma.createMany`, with duplicate checks (hashing date+amount+desc).
- Done when: Budget alerts trigger once per threshold per month, subscription candidates are detected and user-confirmable, and CSV import works with preview and dedup protection.
- Common mistakes: unsecured cron endpoints, duplicate imports, and missing alert dedupe logic.

---

## Phase 7 — Business: Payments, Reports & Extras

- Goal: Add Razorpay subscriptions for Pro, generate PDF reports, implement FinScore and other business features.
- Core steps:
  - Decide Free vs Pro feature split and enforce plan checks server-side.
  - Integrate Razorpay in Test Mode and implement subscription checkout + webhook handler (verify signature HMAC).
  - Implement goal CRUD, 80C tax tracker, FinScore algorithm and monthly PDF report generation (React PDF or server-side), email via Resend.
  - Add landing page, screenshots, and finalize README/challenges for resume.
- Done when: Test-mode payment upgrades account to Pro via verified webhook; monthly PDF report emails successfully; FinScore and goals work end-to-end.
- Common mistakes: skipping webhook signature verification, enforcing plan client-side only, and rushing to live (use Test Mode for payments first).

---

## General Notes, Highlights & Best Practices

- Always scope DB queries by `session.user.id`.
- Validate everything server-side with Zod (including AI/receipt outputs).
- Prefer paise/integer or Decimal types over float for monetary values.
- Keep `.env` secrets out of Git and store production secrets in Vercel.
- Use small, clear commits and record a short "what was hard / how solved" note after each phase for README's Challenges section.

---

## How to use this file

1. Follow phases in order — only move to the next phase when the DONE checklist is satisfied.
2. Use Phase 3's data functions as the foundation for Phase 5 (FinBot tools).
3. For payments, use Razorpay Test Mode until you are ready for KYC and live transactions.

---

This summary was generated from the repository notes and roadmap documents to provide a single, actionable reference for building FinDost.
