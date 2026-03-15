-- ============================================================
-- Phase 5, Task 22a: Platform Analytics Pipeline
-- Tracks per-post metrics from each social platform per day.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_analytics (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id                uuid NOT NULL REFERENCES auth.users(id),
  business_key              text NOT NULL,
  platform                  text NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'tiktok', 'youtube')),
  post_external_id          text NOT NULL,
  social_post_id            uuid REFERENCES public.social_posts(id) ON DELETE SET NULL,
  metric_date               date NOT NULL,
  impressions               integer DEFAULT 0,
  reach                     integer DEFAULT 0,
  engagements               integer DEFAULT 0,
  likes                     integer DEFAULT 0,
  comments                  integer DEFAULT 0,
  shares                    integer DEFAULT 0,
  saves                     integer DEFAULT 0,
  clicks                    integer DEFAULT 0,
  video_views               integer DEFAULT 0,
  video_watch_time_seconds  integer DEFAULT 0,
  follower_delta            integer DEFAULT 0,
  engagement_rate           numeric(8,4) DEFAULT 0,
  metadata                  jsonb DEFAULT '{}',
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now(),

  CONSTRAINT platform_analytics_unique_per_day
    UNIQUE (founder_id, platform, post_external_id, metric_date)
);

-- Index for dashboard queries (business + date range)
CREATE INDEX IF NOT EXISTS idx_platform_analytics_business_date
  ON public.platform_analytics (founder_id, business_key, metric_date);

-- Index for platform filtering
CREATE INDEX IF NOT EXISTS idx_platform_analytics_platform_date
  ON public.platform_analytics (founder_id, platform, metric_date);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS platform_analytics_updated_at ON public.platform_analytics;
CREATE TRIGGER platform_analytics_updated_at
  BEFORE UPDATE ON public.platform_analytics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.platform_analytics ENABLE ROW LEVEL SECURITY;

-- Founder can read their own analytics
DROP POLICY IF EXISTS "platform_analytics_select" ON public.platform_analytics;
CREATE POLICY "platform_analytics_select"
  ON public.platform_analytics
  FOR SELECT
  TO authenticated
  USING (founder_id = auth.uid());

-- Service role bypass for server-side ingestion
DROP POLICY IF EXISTS "platform_analytics_service_all" ON public.platform_analytics;
CREATE POLICY "platform_analytics_service_all"
  ON public.platform_analytics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
