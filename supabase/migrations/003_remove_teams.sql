-- Migrate teams → user-owned websites (safe if teams already removed)
-- Prefer supabase/repair.sql for messy partial states.

ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

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
    WHERE w.user_id IS NULL;
  END IF;
END $$;

UPDATE public.websites
SET user_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE user_id IS NULL
  AND EXISTS (SELECT 1 FROM auth.users LIMIT 1);

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

DELETE FROM public.websites WHERE user_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'websites' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.websites ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_websites_user_id ON public.websites(user_id);

CREATE OR REPLACE FUNCTION public.user_has_website_access(p_website_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.websites w
    WHERE w.id = p_website_id AND w.user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "Users read own websites" ON public.websites;
DROP POLICY IF EXISTS "Users create own websites" ON public.websites;
DROP POLICY IF EXISTS "Users update own websites" ON public.websites;
DROP POLICY IF EXISTS "Users delete own websites" ON public.websites;

CREATE POLICY "Users read own websites" ON public.websites
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create own websites" ON public.websites
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own websites" ON public.websites
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own websites" ON public.websites
  FOR DELETE USING (user_id = auth.uid());

DROP TYPE IF EXISTS public.member_role;
