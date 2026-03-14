-- ============================================================
-- SOCIAL POSTS — Ensure JSONB columns + service role access
-- Date: 14/03/2026
-- Auth: founder_id = auth.uid() + service_role for API routes
--
-- NOTE: social_posts table may already exist from 20260312000001.
-- This migration ensures columns use JSONB (not text[]) and adds
-- service_role policy + additional indexes.
-- ============================================================

-- Create table if it doesn't exist yet (JSONB columns)
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

-- If table already existed with text[] columns, migrate to JSONB
-- (safe to run even if columns are already JSONB — Postgres handles USING clause)
DO $$
BEGIN
  -- Check if media_urls is text[] and needs migration
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'social_posts'
      AND column_name = 'media_urls'
      AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.social_posts
      ALTER COLUMN media_urls TYPE JSONB USING to_jsonb(media_urls),
      ALTER COLUMN media_urls SET DEFAULT '[]'::jsonb;
  END IF;

  -- Check if platforms is text[] and needs migration
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'social_posts'
      AND column_name = 'platforms'
      AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.social_posts
      ALTER COLUMN platforms TYPE JSONB USING to_jsonb(platforms),
      ALTER COLUMN platforms SET DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_posts_select" ON public.social_posts;
CREATE POLICY "social_posts_select"
  ON public.social_posts FOR SELECT
  USING (founder_id = auth.uid());

DROP POLICY IF EXISTS "social_posts_insert" ON public.social_posts;
CREATE POLICY "social_posts_insert"
  ON public.social_posts FOR INSERT
  WITH CHECK (founder_id = auth.uid());

DROP POLICY IF EXISTS "social_posts_update" ON public.social_posts;
CREATE POLICY "social_posts_update"
  ON public.social_posts FOR UPDATE
  USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());

DROP POLICY IF EXISTS "social_posts_delete" ON public.social_posts;
CREATE POLICY "social_posts_delete"
  ON public.social_posts FOR DELETE
  USING (founder_id = auth.uid());

DROP POLICY IF EXISTS "social_posts_service_role" ON public.social_posts;
CREATE POLICY "social_posts_service_role"
  ON public.social_posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_social_posts_founder ON public.social_posts(founder_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_business ON public.social_posts(business_key);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON public.social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_created ON public.social_posts(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER (reuses standard function)
-- ============================================================
DROP TRIGGER IF EXISTS social_posts_updated_at ON public.social_posts;
DROP TRIGGER IF EXISTS update_social_posts_updated_at ON public.social_posts;
CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
