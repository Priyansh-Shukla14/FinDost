# 💰 FinDost — Your AI Finance Companion

India ke liye banaya gaya personal finance tracker. Chai se lekar EMI tak — har kharcha
track karo, category-wise budget set karo, aur dashboard pe apni poori spending picture dekho.

> **Status:** Phase 3 complete — auth, expenses, categories, budgets aur dashboard live hain.
> Phase 4 (deploy) se aage ka kaam abhi baaki hai.

---

## 🛠️ Tech Stack

| Layer | Kya use hua |
|---|---|
| Framework | Next.js 14 (App Router, JavaScript) |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Auth | NextAuth — Google OAuth + email/password (bcrypt) |
| Validation | Zod (server-side, har action pe) |
| Charts | Recharts |
| Styling | Custom CSS design system (`app/globals.css`) + Tailwind |

---

## 🚀 Local Setup

```bash
# 1. Dependencies
npm install

# 2. Environment
cp .env.example .env      # phir values bharo (neeche dekho)

# 3. Database schema
npx prisma migrate deploy  # ya pehli baar: npx prisma migrate dev

# 4. Default Indian categories
npx prisma db seed

# 5. Chalao
npm run dev                # http://localhost:3000
```

### Environment variables

| Variable | Kahan se milega |
|---|---|
| `DATABASE_URL` | [neon.tech](https://neon.tech) pe free Postgres banao |
| `NEXTAUTH_SECRET` | Koi bhi random string — `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Local: `http://localhost:3000` · Prod: apna domain |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [console.cloud.google.com](https://console.cloud.google.com) |

**Google OAuth redirect URI** (Cloud Console mein add karna zaroori hai):

```
http://localhost:3000/api/auth/callback/google      # local
https://<your-domain>/api/auth/callback/google      # production
```

### Agar database pehle se `prisma db push` se bana hai

Migrations folder baad mein add hua hai, isliye ek baar baseline mark kar do —
warna Prisma "0_init" ko dobara chalane ki koshish karega:

```bash
npx prisma migrate resolve --applied 0_init
```

---

## 📁 Structure

```
app/
  page.js                 landing page
  login/ signup/          auth pages
  api/auth/               NextAuth + signup route
  dashboard/
    page.js               dashboard (stats + charts)
    expenses/             expense CRUD, filters, pagination
    budgets/              per-category monthly budgets
    finbot/ scanner/ ...  aage ke phases ke placeholder pages
  components/             Navbar, Sidebar, DashboardChrome, AuthProvider
lib/
  actions/                server actions (expense, budget, category)
  auth.js                 NextAuth config
  prisma.js               Prisma singleton
  session.js              requireUserId() — har action isse userId leta hai
  utils.js                paise/₹, date + timezone helpers
  validations.js          Zod schemas
  constants.js            page size, colors
prisma/
  schema.prisma           8 models
  migrations/0_init/      initial schema SQL
  seed.js                 13 default Indian categories
```

---

## 📐 Design decisions

**Paisa hamesha integer paise mein.** `₹150` DB mein `15000` hai. Float mein paise
rakhne se rounding errors aate hain — `formatCurrency()` display ke waqt convert karta hai.

**Date sirf calendar din hai, time nahi.** Har expense date UTC midnight pe store hoti
hai aur display bhi UTC mein hota hai. "Is mahine" ka matlab hamesha IST se decide hota
hai (`getCurrentMonthYear()`), chahe server UTC pe ho — warna Vercel pe deploy karte hi
mahine ke pehle/aakhri din ke expenses galat month mein chale jaate.

**userId kabhi client se nahi aata.** Har server action `requireUserId()` se session se
userId leta hai. Update/delete `updateMany`/`deleteMany` with `{ id, userId }` use karte
hain — ek hi query mein ownership check + write, koi race condition nahi.

**Validation dono taraf, bharosa sirf server pe.** Client pe HTML validation UX ke liye
hai; asli check `lib/validations.js` ke Zod schemas hain, jo har action mein chalte hain.

---

## ✅ Phase Progress

- [x] **Phase 1** — Setup, Prisma schema, NextAuth (Google + credentials), protected routes
- [x] **Phase 2** — Expense CRUD, categories (13 default + custom), monthly budgets, Zod
- [x] **Phase 3** — Dashboard: stat cards, category pie, 6-month trend, budget progress
- [ ] **Phase 4** — Vercel deploy
- [ ] **Phase 5** — FinBot (function calling) + receipt scanner
- [ ] **Phase 6** — Budget alerts, subscription detection, CSV import
- [ ] **Phase 7** — Razorpay Pro, PDF reports, goals, 80C tracker

Poori roadmap: [`PHASES_README.md`](./PHASES_README.md)

---

## 🐛 Jo mushkil tha (aur kaise solve hua)

- **Seed dobara chalane pe duplicate categories** — system categories ka `userId` NULL hai,
  aur Postgres do NULL ko alag maanta hai, isliye `@@unique([name, userId])` ne unhe roka
  nahi. `upsert` hata ke `findFirst` + create/update kiya.
- **Timezone se mahina khisakna** — month boundaries server ke local time se ban rahi thi
  par dates UTC mein store thi. Sab kuch `getMonthRange()` (UTC) + IST-based current month
  pe le aaya.
- **Stats aur list ka mismatch** — expense list pe category filter lagta tha par stat cards
  poore month ke dikhate the, aur list sirf 50 tak rukti thi. Ab ek hi `where` clause dono
  ke liye, aur proper pagination.
