-- =============================================================================
-- Crel — full schema (safe to re-run)
-- Use this in Supabase SQL Editor. Also available as supabase/repair.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum: skip if already created
DO $$ BEGIN
  CREATE TYPE public.device_type AS ENUM ('desktop', 'mobile', 'tablet', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Websites (create fresh OR upgrade from team-based schema)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  tracking_id TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  share_id TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Backfill user_id from team_members only when that table still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'team_members'
  ) THEN
    UPDATE public.websites w
    SET user_id = tm.user_id
    FROM public.team_members tm
    WHERE w.team_id = tm.team_id
      AND tm.role = 'owner'
      AND w.user_id IS NULL;

    UPDATE public.websites w
    SET user_id = (
      SELECT tm.user_id FROM public.team_members tm
      WHERE tm.team_id = w.team_id
      LIMIT 1
    )
    WHERE w.user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'websites' AND column_name = 'team_id'
      );
  END IF;
END $$;

-- Assign orphan websites to the first auth user (dev fallback)
UPDATE public.websites
SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE user_id IS NULL
  AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);

DELETE FROM public.websites WHERE user_id IS NULL;

-- Drop legacy team objects (only when those tables exist)
DROP POLICY IF EXISTS "Members read websites" ON public.websites;
DROP POLICY IF EXISTS "Admins manage websites" ON public.websites;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teams') THEN
    DROP POLICY IF EXISTS "Members read teams" ON public.teams;
    DROP POLICY IF EXISTS "Owners create teams" ON public.teams;
    DROP POLICY IF EXISTS "Authenticated users create teams" ON public.teams;
    DROP TRIGGER IF EXISTS teams_updated_at ON public.teams;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_members') THEN
    DROP POLICY IF EXISTS "Members read team roster" ON public.team_members;
    DROP POLICY IF EXISTS "Owners manage members" ON public.team_members;
    DROP POLICY IF EXISTS "Users join teams as self" ON public.team_members;
  END IF;
END $$;

DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP FUNCTION IF EXISTS public.user_team_role(UUID);

ALTER TABLE public.websites DROP COLUMN IF EXISTS team_id;
DROP INDEX IF EXISTS idx_websites_team_id;

-- Require user_id when websites table has rows
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.websites LIMIT 1) THEN
    ALTER TABLE public.websites ALTER COLUMN user_id SET NOT NULL;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'websites' AND column_name = 'user_id'
  ) THEN
    -- empty table: still enforce for new inserts
    BEGIN
      ALTER TABLE public.websites ALTER COLUMN user_id SET NOT NULL;
    EXCEPTION WHEN others THEN NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_websites_user_id ON public.websites(user_id);
CREATE INDEX IF NOT EXISTS idx_websites_tracking_id ON public.websites(tracking_id);
CREATE INDEX IF NOT EXISTS idx_websites_domain ON public.websites(domain);

-- ---------------------------------------------------------------------------
-- Analytics tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY,
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT NOT NULL DEFAULT 0,
  is_bounce BOOLEAN NOT NULL DEFAULT true,
  pageview_count INT NOT NULL DEFAULT 0,
  country TEXT,
  region TEXT,
  city TEXT,
  device public.device_type NOT NULL DEFAULT 'unknown',
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  screen TEXT,
  language TEXT,
  referrer TEXT,
  referrer_domain TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_website_started ON public.sessions(website_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON public.sessions(website_id, visitor_id);

CREATE TABLE IF NOT EXISTS public.pageviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  title TEXT,
  referrer TEXT,
  query_string TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pageviews_website_created ON public.pageviews(website_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pageviews_session ON public.pageviews(session_id);
CREATE INDEX IF NOT EXISTS idx_pageviews_path ON public.pageviews(website_id, path);

CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL,
  session_id UUID NOT NULL,
  name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE IF NOT EXISTS public.events_2026_05 PARTITION OF public.events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE IF NOT EXISTS public.events_2026_06 PARTITION OF public.events
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE IF NOT EXISTS public.events_2026_07 PARTITION OF public.events
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE IF NOT EXISTS public.events_2026_08 PARTITION OF public.events
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE INDEX IF NOT EXISTS idx_events_website_created ON public.events(website_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  pageviews INT NOT NULL DEFAULT 0,
  sessions INT NOT NULL DEFAULT 0,
  visitors INT NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_duration_seconds NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE (website_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_website_date ON public.daily_stats(website_id, date DESC);

-- ---------------------------------------------------------------------------
-- Functions & triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_website_access(p_website_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.websites w
    WHERE w.id = p_website_id AND w.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS websites_updated_at ON public.websites;
CREATE TRIGGER websites_updated_at BEFORE UPDATE ON public.websites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users read own websites" ON public.websites;
DROP POLICY IF EXISTS "Users create own websites" ON public.websites;
DROP POLICY IF EXISTS "Users update own websites" ON public.websites;
DROP POLICY IF EXISTS "Users delete own websites" ON public.websites;
CREATE POLICY "Users read own websites" ON public.websites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create own websites" ON public.websites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own websites" ON public.websites FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own websites" ON public.websites FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read sessions" ON public.sessions;
DROP POLICY IF EXISTS "Members read sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users read pageviews" ON public.pageviews;
DROP POLICY IF EXISTS "Members read pageviews" ON public.pageviews;
DROP POLICY IF EXISTS "Users read events" ON public.events;
DROP POLICY IF EXISTS "Members read events" ON public.events;
DROP POLICY IF EXISTS "Users read daily_stats" ON public.daily_stats;
DROP POLICY IF EXISTS "Members read daily_stats" ON public.daily_stats;

CREATE POLICY "Users read sessions" ON public.sessions
  FOR SELECT USING (public.user_has_website_access(website_id));
CREATE POLICY "Users read pageviews" ON public.pageviews
  FOR SELECT USING (public.user_has_website_access(website_id));
CREATE POLICY "Users read events" ON public.events
  FOR SELECT USING (public.user_has_website_access(website_id));
CREATE POLICY "Users read daily_stats" ON public.daily_stats
  FOR SELECT USING (public.user_has_website_access(website_id));

DROP TYPE IF EXISTS public.member_role;

-- ---------------------------------------------------------------------------
-- Public share policies (anonymous read via share_id)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public share read websites" ON public.websites;
DROP POLICY IF EXISTS "Public share read sessions" ON public.sessions;
DROP POLICY IF EXISTS "Public share read pageviews" ON public.pageviews;
DROP POLICY IF EXISTS "Public share read events" ON public.events;

CREATE POLICY "Public share read websites" ON public.websites
  FOR SELECT USING (share_id IS NOT NULL);

CREATE POLICY "Public share read sessions" ON public.sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.websites w
      WHERE w.id = website_id AND w.share_id IS NOT NULL
    )
  );

CREATE POLICY "Public share read pageviews" ON public.pageviews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.websites w
      WHERE w.id = website_id AND w.share_id IS NOT NULL
    )
  );

CREATE POLICY "Public share read events" ON public.events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.websites w
      WHERE w.id = website_id AND w.share_id IS NOT NULL
    )
  );

-- Done
SELECT 'Crel schema repair complete' AS status;
