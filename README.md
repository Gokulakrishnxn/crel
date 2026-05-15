# Crel — Open-source privacy-first analytics

Crel is a **100% open-source** web analytics platform (Umami / Plausible inspired) built with **Next.js**, **shadcn/ui**, and **Supabase**. Deploy the dashboard on **Vercel** and store data in **Supabase Postgres** with Auth, RLS, and Realtime.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for diagrams, tech decisions, and folder layout.

| Component | Stack |
|-----------|--------|
| App | Next.js 16 App Router + TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 + dark/light mode |
| Charts | Recharts |
| DB / Auth / Realtime | Supabase |
| Tracker | `public/crel.js` (vanilla JS, batched ingest) |

---

## 1. Project setup

### Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com) project
- [Vercel](https://vercel.com) account (optional, for deploy)

### Commands

```bash
# Clone or use existing repo
cd crel

# If starting fresh:
# npx create-next-app@latest crel --typescript --tailwind --eslint --app --src-dir=false
# cd crel

npm install

# Initialize shadcn/ui (already done in this repo)
npx shadcn@latest init -d
npx shadcn@latest add card table tabs dropdown-menu input label separator avatar select popover calendar badge skeleton sheet sidebar button

# Environment
cp .env.example .env.local
# Fill in Supabase URL, anon key, service role key

# Apply database schema (Supabase SQL Editor or CLI)
# Paste supabase/repair.sql (safe to re-run; fixes partial/duplicate errors)

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 2. Supabase database schema

Full SQL: [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)

### Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (linked to `auth.users`) |
| `websites` | Sites owned by `user_id`, with `tracking_id` for ingest |
| `sessions` | Visitor sessions, UTM, device, bounce, duration |
| `pageviews` | Per-path hits |
| `events` | Custom events (partitioned by month) |
| `daily_stats` | Optional rollups |

### Indexes & partitioning

- B-tree indexes on `(website_id, created_at)` for pageviews and sessions
- `events` uses **RANGE partitioning** on `created_at` (extend monthly)
- GIN index on `events.properties`

### RLS

- Dashboard reads gated by `user_has_website_access()`
- Ingest uses **service role** in `/api/collect` only
- Websites owned directly by the authenticated user (RLS on `user_id`)

### Realtime

In Supabase Dashboard → Database → Replication, enable **`pageviews`** for live dashboard updates.

---

## 3. Tracking SDK

File: [`public/crel.js`](public/crel.js)

### Install snippet

```html
<script
  async
  src="https://YOUR_APP.vercel.app/crel.js"
  data-website-id="YOUR_TRACKING_ID"
></script>
```

### API

```javascript
// Custom event
window.crel.track("signup", { plan: "pro" });

// Manual pageview (auto-tracked on load + SPA navigation)
window.crel.pageview();

// Flush queue immediately
window.crel.flush();
```

### Features

- Auto pageviews + History API (SPA)
- Session & visitor IDs (localStorage, 30m timeout)
- UTM parsing, device/browser/OS detection
- Batch flush every 3s + `sendBeacon` on unload
- Exponential backoff retries (3×)

---

## 4. Next.js project structure

```
app/
  (marketing)/page.tsx          # Landing
  (auth)/login|signup/
  (dashboard)/dashboard/
    layout.tsx                  # Sidebar shell
    page.tsx                    # Website list
    [websiteId]/page.tsx        # Analytics dashboard
    settings/page.tsx           # Add website
  api/collect/route.ts          # Public ingest
  api/analytics/[websiteId]/   # Authenticated JSON API
components/
  dashboard/                    # Charts, tables, sidebar, date picker
  ui/                           # shadcn components
lib/
  analytics/queries.ts          # Dashboard aggregations
  analytics/ingest.ts           # Write path for collect API
  supabase/                     # Browser, server, admin clients
  security/rate-limit.ts
public/crel.js
supabase/migrations/
```

---

## 5. Implementation roadmap

### Phase 1 — MVP (this repo)

- [x] Tracking SDK + `/api/collect`
- [x] Sessions, pageviews, custom events
- [x] Dashboard: overview stats, time series, top pages/sources/geo/tech
- [x] Auth + website creation
- [x] Date range filter

### Phase 2 — Advanced analytics

- [ ] `daily_stats` materialized refresh (pg_cron)
- [ ] Custom event explorer + funnels
- [ ] Segmentation (UTM, country, device filters)
- [ ] Export CSV
- [ ] Upstash Redis rate limiting (multi-region)

### Phase 3 — Collaboration & scale

- [ ] Invite collaborators per website
- [ ] Organization / team workspaces (optional)
- [ ] Shareable public dashboards (`share_id`)
- [ ] Automated event partition creation
- [ ] GeoIP via open dataset (e.g. MaxMind GeoLite2 self-hosted)

---

## 6. Vercel + Supabase deployment

### Supabase

1. Create project → copy **Project URL**, **anon key**, **service role key**
2. Run migrations in SQL Editor
3. Auth → enable Email provider
4. Enable Realtime on `pageviews`
5. (Optional) Set custom SMTP for auth emails

### Vercel

1. Import Git repo
2. Set environment variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — server only |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

3. Deploy

### One-click

Add a Deploy button to your fork:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=...)
```

---

## 7. Security & best practices

| Topic | Implementation |
|-------|----------------|
| Rate limiting | 120 req/min/IP on `/api/collect` (swap to Upstash for production) |
| Bot filtering | User-agent heuristics; skip recording |
| API auth | Dashboard uses Supabase session; ingest uses tracking ID + service role |
| RLS | Analytics read-protected by website ownership (`user_id`) |
| Secrets | Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client |
| CORS | Collect endpoint allows `*` — restrict via `websites.settings.allowedOrigins` in Phase 2 |
| Domain validation | Validate `Origin` / `Referer` against `websites.domain` (recommended hardening) |

---

## License

MIT — fully open source. Use, modify, and self-host without restriction.
