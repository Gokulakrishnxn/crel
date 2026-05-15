# Crel — Open-source privacy-first analytics

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/Gokulakrishnxn/crel/actions/workflows/ci.yml/badge.svg)](https://github.com/Gokulakrishnxn/crel/actions/workflows/ci.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Crel is a **lightweight, privacy-first web analytics platform** — self-hosted on your own Vercel + Supabase. No cookies. No third-party trackers. You own every byte.

> Inspired by [Umami](https://umami.is) and [Plausible](https://plausible.io), built on the modern Next.js App Router stack.

---

## Features

- **< 6 KB tracking script** — vanilla JS, no dependencies, works on any site
- **Real-time dashboard** — live pageview counter via Supabase Realtime
- **Session explorer** — browse individual visits with country, device, source
- **Geography map** — interactive world map with country breakdown
- **Custom events** — `window.crel.track('signup', { plan: 'pro' })`
- **UTM campaign tracking** — source / medium / campaign / term / content
- **Dark mode** — full light/dark theme
- **Public shared dashboards** — shareable read-only links per website
- **Self-hostable** — deploy on Vercel in minutes, data stays in your Supabase

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| Charts | Recharts + react-svg-worldmap |
| Database / Auth / Realtime | Supabase (Postgres + RLS) |
| Tracker | `public/crel.js` — vanilla JS |
| Deployment | Vercel (Edge Middleware) |

---

## Quick start

### 1. Clone

```bash
git clone https://github.com/Gokulakrishnxn/crel.git
cd crel
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL**, **anon key**, and **service role key**
3. In the SQL Editor, paste and run [`supabase/repair.sql`](supabase/repair.sql)
4. Go to Authentication → Providers → enable **Email**
5. Go to Database → Replication → enable `pageviews` table for Realtime

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, and add your first website.

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Gokulakrishnxn/crel&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,NEXT_PUBLIC_APP_URL&envDescription=Supabase%20credentials%20and%20your%20app%20URL&project-name=crel&repository-name=crel)

After deploying, set these environment variables in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — never expose to browser |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

---

## Add tracking to your website

Paste this before `</head>` on any site:

```html
<script
  async
  src="https://your-app.vercel.app/crel.js"
  data-website-id="YOUR_TRACKING_ID"
></script>
```

Your tracking ID is shown in the **Tracking** tab of each website in the dashboard.

### Custom events

```javascript
window.crel.track('signup', { plan: 'pro' });
window.crel.track('purchase', { value: 49, currency: 'USD' });
```

---

## Project structure

```
app/
  (marketing)/                # Public landing page
  (auth)/                     # Login, signup, forgot / reset password
  (dashboard)/dashboard/
    [websiteId]/              # Overview, Sessions, Pages, Sources,
                              # Geography, Technology, Events, Tracking, Settings
  api/collect/                # Public ingest (no auth required)
  api/analytics/[websiteId]/  # Authenticated JSON API
  share/[shareId]/            # Public read-only shared dashboard
components/dashboard/         # Charts, tables, sidebar, session list
lib/
  analytics/                  # Supabase queries + ingest logic
  geography/                  # Country labels + ISO map codes
  dashboard/                  # Nav helpers, session formatters
public/crel.js                # Tracking SDK (<6 KB)
supabase/
  repair.sql                  # Safe idempotent schema — run this
  migrations/                 # Individual migration files
```

---

## Database schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profile, linked to `auth.users` |
| `websites` | Sites owned by a user, holds `tracking_id` |
| `sessions` | Visitor sessions — UTM, device, bounce, duration |
| `pageviews` | Per-path hits |
| `events` | Custom events (partitioned monthly by `created_at`) |
| `daily_stats` | Optional rollup table |

Full schema: [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)

---

## Roadmap

### Phase 1 — MVP ✅
- [x] Tracking SDK + `/api/collect`
- [x] Sessions, pageviews, custom events
- [x] Dashboard: overview, sessions, pages, sources, geography, technology, events
- [x] Auth (email/password, forgot password, reset password)
- [x] Date range filter
- [x] Public shared dashboards
- [x] Self-tracking support

### Phase 2 — Advanced analytics
- [ ] Export CSV
- [ ] Funnel analysis
- [ ] Segmentation filters (UTM, country, device)
- [ ] `daily_stats` rollup via pg_cron
- [ ] Upstash Redis rate limiting (multi-region)

### Phase 3 — Collaboration & scale
- [ ] Invite collaborators per website
- [ ] GeoIP enrichment (MaxMind GeoLite2)
- [ ] Automated monthly event partition creation
- [ ] Organization / team workspaces

---

## Contributing

Contributions are welcome and encouraged! Read [CONTRIBUTING.md](CONTRIBUTING.md) to get started.

- Found a bug? [Open an issue](https://github.com/Gokulakrishnxn/crel/issues/new?template=bug_report.md)
- Have an idea? [Start a discussion](https://github.com/Gokulakrishnxn/crel/discussions)
- Want to contribute code? Fork → branch → PR

---

## License

[MIT](LICENSE) — free to use, modify, and self-host.
