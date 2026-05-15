# Contributing to Crel

First off — thank you for taking the time to contribute! Crel is fully open source and every contribution matters, whether it's a bug fix, a new feature, documentation, or just opening an issue.

---

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Ways to contribute](#ways-to-contribute)
- [Local development setup](#local-development-setup)
- [Project structure](#project-structure)
- [Submitting a pull request](#submitting-a-pull-request)
- [Commit style](#commit-style)
- [Coding conventions](#coding-conventions)

---

## Code of conduct

By participating, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Ways to contribute

| Type | How |
|------|-----|
| Bug report | [Open an issue](https://github.com/Gokulakrishnxn/crel/issues/new?template=bug_report.md) |
| Feature request | [Open an issue](https://github.com/Gokulakrishnxn/crel/issues/new?template=feature_request.md) |
| Fix a bug | Fork → branch → PR |
| Add a feature | Open an issue first to discuss, then PR |
| Improve docs | Edit any `.md` file and PR |
| Improve the tracker | Edit `public/crel.js` |
| Improve a query | Edit `lib/analytics/queries.ts` |

---

## Local development setup

### Prerequisites

- **Node.js 20+**
- A **Supabase** project (free tier is fine)
- **Git**

### Steps

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/crel.git
cd crel

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Fill in your Supabase URL, anon key, and service role key

# 4. Apply the database schema
# Open Supabase Dashboard → SQL Editor → paste supabase/repair.sql → Run

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and create a website.

### Load demo data (optional)

Once you have a website, visit its dashboard. If it shows "No data yet", click **Load demo data** to generate 30 days of realistic analytics for local testing.

---

## Project structure

```
app/
  (marketing)/          # Public landing page
  (auth)/               # Login, signup, forgot/reset password
  (dashboard)/          # Protected dashboard (sidebar layout)
    dashboard/
      [websiteId]/      # Per-website analytics pages
  api/
    collect/            # Public ingest endpoint (no auth)
    analytics/          # Authenticated JSON API
    seed/               # Dev-only demo data endpoint
  share/[shareId]/      # Public read-only shared dashboard
components/
  dashboard/            # Charts, tables, sidebar, cards
  ui/                   # shadcn/ui primitives
lib/
  analytics/            # Supabase queries + ingest logic
  dashboard/            # Nav helpers, session formatters
  geography/            # Country labels + map codes
  supabase/             # Browser / server / admin clients
  security/             # Rate limiter, bot filter
public/
  crel.js               # Vanilla JS tracking SDK (<6KB target)
supabase/
  migrations/           # SQL schema files
  repair.sql            # Safe idempotent schema (run this)
```

---

## Submitting a pull request

1. **Fork** the repo and create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes. Keep PRs **focused** — one feature or fix per PR.

3. Run the type checker before pushing:
   ```bash
   npx tsc --noEmit
   ```

4. Push and open a PR against `main`.

5. Fill in the PR template — describe what changed and why.

6. A maintainer will review it. We aim to respond within a few days.

### PR checklist

- [ ] TypeScript passes (`npx tsc --noEmit`)
- [ ] No secrets or `.env.local` committed
- [ ] If touching the tracker (`public/crel.js`), test it in a real browser
- [ ] If adding a new page, it's wired into the sidebar nav
- [ ] If adding a new Supabase query, the RLS policies are considered

---

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add CSV export for breakdown tables
fix: session duration not updating on heartbeat
docs: clarify Supabase Realtime setup
refactor: extract breakdown query into shared helper
chore: bump next to 16.3.0
```

---

## Coding conventions

- **TypeScript** — strict mode, no `any`
- **No comments** for obvious code. Only comment non-obvious constraints or workarounds.
- **Server components by default** — only add `"use client"` when you need browser APIs or React state
- **Supabase queries** live in `lib/analytics/queries.ts` (reads) or `lib/analytics/ingest.ts` (writes)
- **shadcn/ui** for new UI — use `DashboardCard` / `DashboardPage` wrappers (not raw `Card`) inside the dashboard
- **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the client. Only use it in `lib/supabase/admin.ts`.
- **Seed route** (`/api/seed`) is dev-only — keep the `NODE_ENV` production guard in place

---

## Good first issues

Look for issues labelled [`good first issue`](https://github.com/Gokulakrishnxn/crel/labels/good%20first%20issue) — these are scoped, well-defined tasks that are great for first-time contributors.

---

## Questions?

Open a [Discussion](https://github.com/Gokulakrishnxn/crel/discussions) or file an issue. We're happy to help.
