-- ============================================================
-- SOCIAL POSTS — Content calendar entries for social platforms
-- Date: 14/03/2026
-- Auth: founder_id = auth.uid() + service_role for API routes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.social_posts (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_key        TEXT NOT NULL,
  title               TEXT,
  content             TEXT NOT NULL,
  media_urls          JSONB NOT NULL DEFAULT '[]',
  platforms           JSONB NOT NULL DEFAULT '[]',
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  scheduled_at        TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  platform_post_ids   JSONB NOT NULL DEFAULT '{}',
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_posts_select"
  ON public.social_posts FOR SELECT
  USING (founder_id = auth.uid());

CREATE POLICY "social_posts_insert"
  ON public.social_posts FOR INSERT
  WITH CHECK (founder_id = auth.uid());

CREATE POLICY "social_posts_update"
  ON public.social_posts FOR UPDATE
  USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());

CREATE POLICY "social_posts_delete"
  ON public.social_posts FOR DELETE
  USING (founder_id = auth.uid());

CREATE POLICY "social_posts_service_role"
  ON public.social_posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_social_posts_founder ON public.social_posts(founder_id);
CREATE INDEX idx_social_posts_business ON public.social_posts(business_key);
CREATE INDEX idx_social_posts_status ON public.social_posts(status);
CREATE INDEX idx_social_posts_created ON public.social_posts(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER (reuses existing function)
-- ============================================================
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
