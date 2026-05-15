-- Crel Analytics — initial schema (user-owned websites, no teams)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE public.device_type AS ENUM ('desktop', 'mobile', 'tablet', 'unknown');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  tracking_id TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  share_id TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_websites_user_id ON public.websites(user_id);
CREATE INDEX idx_websites_tracking_id ON public.websites(tracking_id);
CREATE INDEX idx_websites_domain ON public.websites(domain);

CREATE TABLE public.sessions (
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

CREATE INDEX idx_sessions_website_started ON public.sessions(website_id, started_at DESC);
CREATE INDEX idx_sessions_visitor ON public.sessions(website_id, visitor_id);
CREATE INDEX idx_sessions_country ON public.sessions(website_id, country) WHERE country IS NOT NULL;

CREATE TABLE public.pageviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  title TEXT,
  referrer TEXT,
  query_string TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pageviews_website_created ON public.pageviews(website_id, created_at DESC);
CREATE INDEX idx_pageviews_session ON public.pageviews(session_id);
CREATE INDEX idx_pageviews_path ON public.pageviews(website_id, path);

CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL,
  session_id UUID NOT NULL,
  name TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

CREATE TABLE public.events_2026_05 PARTITION OF public.events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE public.events_2026_06 PARTITION OF public.events
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE public.events_2026_07 PARTITION OF public.events
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE public.events_2026_08 PARTITION OF public.events
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE INDEX idx_events_website_created ON public.events(website_id, created_at DESC);
CREATE INDEX idx_events_name ON public.events(website_id, name, created_at DESC);
CREATE INDEX idx_events_properties ON public.events USING gin(properties);

CREATE TABLE public.daily_stats (
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

CREATE INDEX idx_daily_stats_website_date ON public.daily_stats(website_id, date DESC);

CREATE OR REPLACE FUNCTION public.user_has_website_access(p_website_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.websites w
    WHERE w.id = p_website_id AND w.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER websites_updated_at BEFORE UPDATE ON public.websites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users read own websites" ON public.websites
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create own websites" ON public.websites
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own websites" ON public.websites
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own websites" ON public.websites
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users read sessions" ON public.sessions
  FOR SELECT USING (public.user_has_website_access(website_id));
CREATE POLICY "Users read pageviews" ON public.pageviews
  FOR SELECT USING (public.user_has_website_access(website_id));
CREATE POLICY "Users read events" ON public.events
  FOR SELECT USING (public.user_has_website_access(website_id));
CREATE POLICY "Users read daily_stats" ON public.daily_stats
  FOR SELECT USING (public.user_has_website_access(website_id));
