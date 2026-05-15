-- Allow anyone to read a website (and its analytics) via share_id
CREATE POLICY "Public share read websites" ON public.websites
  FOR SELECT USING (share_id IS NOT NULL);

-- Allow anonymous reads on sessions/pageviews/events for shared websites
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
