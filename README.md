# 💰 FinDost — Your AI Finance Companion

A personal finance tracker built for India. From your morning chai to your monthly EMI — track every expense, set category-wise budgets, and see your complete spending picture on a beautiful dashboard.

**Live:** [fin-dost.vercel.app](https://fin-dost.vercel.app)

> **Status:** Phase 4 complete — the app is deployed and live, with auth, expenses,
> categories, budgets and the dashboard all working in production.
> Phase 5 (AI features) onwards is in progress.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, JavaScript) |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Auth | NextAuth — Google OAuth + Email/Password (bcrypt) |
| Validation | Zod (server-side, on every action) |
| Charts | Recharts |
| Styling | Custom CSS design system (`app/globals.css`) + Tailwind |

---

## 🚀 Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env      # then fill in the values (see below)

# 3. Run database migrations
npx prisma migrate deploy  # or for first time: npx prisma migrate dev

# 4. Seed default categories
npx prisma db seed

# 5. Start the dev server
npm run dev                # http://localhost:3000
```

### Environment Variables

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Create a free Postgres database at [neon.tech](https://neon.tech) |
| `NEXTAUTH_SECRET` | Any random string — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Local: `http://localhost:3000` · Production: your domain |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [console.cloud.google.com](https://console.cloud.google.com) |

**Google OAuth Redirect URI** (must be added in the Google Cloud Console):

```
http://localhost:3000/api/auth/callback/google      # local
https://<your-domain>/api/auth/callback/google      # production
```

### Deploying to Vercel

Two things matter when deploying to a serverless host:

1. **The build must run `prisma generate`.** Vercel caches dependencies between
   deploys, so the `@prisma/client` postinstall hook does not run again and the
   generated client would be missing at build time. The `build` script already
   handles this: `prisma generate && next build`.

2. **Use Neon's pooled connection string for `DATABASE_URL`** (its hostname
   contains `-pooler`). With the direct endpoint, every serverless instance
   opens its own connection pool and the database quickly runs out of
   connections. A direct connection is fine for local development.

Also remember to set `NEXTAUTH_URL` to the production URL and to add the
production callback to the Google Cloud Console.

### If the database was previously created with `prisma db push`

The migrations folder was added later, so you need to baseline it once — otherwise Prisma will try to re-run `0_init`:

```bash
npx prisma migrate resolve --applied 0_init
```

---

## 📂 Project Structure

```
app/
  page.js                 Landing page
  login/ signup/          Auth pages
  api/auth/               NextAuth + signup route
  dashboard/
    page.js               Dashboard (stats + charts)
    expenses/             Expense CRUD, filters, pagination
    budgets/              Per-category monthly budgets
    finbot/ scanner/ ...  Placeholder pages for future phases
  components/             Navbar, Sidebar, DashboardChrome, AuthProvider
lib/
  actions/                Server actions (expense, budget, category)
  auth.js                 NextAuth configuration
  prisma.js               Prisma singleton
  session.js              requireUserId() — every action gets userId from here
  utils.js                Currency formatting (₹), date & timezone helpers
  validations.js          Zod schemas
  constants.js            Page size, colors
prisma/
  schema.prisma           8 models
  migrations/0_init/      Initial schema SQL
  seed.js                 13 default categories
```

---

## 📐 Design Decisions

**Money is always stored as integer paise.** ₹150 is stored as `15000` in the database. Storing money as floats leads to rounding errors — `formatCurrency()` converts to display format at render time.

**Dates represent calendar days, not timestamps.** Every expense date is stored at UTC midnight and displayed in UTC. "This month" is always determined using IST (`getCurrentMonthYear()`), regardless of the server's timezone — otherwise, deploying on Vercel (UTC) causes expenses on the first/last day of the month to land in the wrong month.

**userId never comes from the client.** Every server action extracts the userId from the session via `requireUserId()`. Updates and deletes use `updateMany`/`deleteMany` with `{ id, userId }` — ownership check and write happen in a single query, eliminating race conditions.

**Validation on both sides, trust only the server.** Client-side HTML validation exists for UX; the real enforcement is done by Zod schemas in `lib/validations.js`, which run inside every server action.

---

## 📋 Phase Progress

- [x] **Phase 1** — Setup, Prisma schema, NextAuth (Google + credentials), protected routes
- [x] **Phase 2** — Expense CRUD, categories (13 default + custom), monthly budgets, Zod validation
- [x] **Phase 3** — Dashboard: stat cards, category pie chart, 6-month trend, budget progress bars
- [x] **Phase 4** — Vercel deployment (live at [fin-dost.vercel.app](https://fin-dost.vercel.app))
- [ ] **Phase 5** — FinBot (AI function calling) + receipt scanner
- [ ] **Phase 6** — Budget alerts, subscription detection, CSV import
- [ ] **Phase 7** — Razorpay Pro integration, PDF reports, goals, 80C tax tracker

Full roadmap: [`PHASES_README.md`](./PHASES_README.md)

---

## 🔧 Challenges & Solutions

- **Duplicate categories on re-seeding** — System categories have `userId` set to `NULL`, and Postgres treats two NULLs as distinct, so `@@unique([name, userId])` didn't prevent duplicates. Fixed by replacing `upsert` with a `findFirst` + create/update pattern.

- **Month shifting due to timezone mismatch** — Month boundaries were calculated using the server's local time, but dates were stored in UTC. Resolved by standardizing everything on `getMonthRange()` (UTC) with IST-based current month detection.

- **Stats and list data mismatch** — The expense list applied category filters but stat cards showed the entire month, and the list capped at 50 items. Fixed by sharing a single `where` clause across both queries and implementing proper pagination.

---

## 📄 License

This project is open source and available under the MIT License.

---

<p align="center">Made with ❤️ in India</p>
