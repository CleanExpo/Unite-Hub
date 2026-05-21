-- Video assets — tracks AI-generated videos from HeyGen/Remotion
CREATE TABLE IF NOT EXISTS public.video_assets (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id          uuid NOT NULL REFERENCES auth.users(id),
  business_key        text NOT NULL,
  provider            text NOT NULL CHECK (provider IN ('heygen', 'remotion')),
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
  video_url           text,
  thumbnail_url       text,
  script              text NOT NULL,
  duration_seconds    integer,
  aspect_ratio        text NOT NULL DEFAULT '9:16',
  generated_content_id uuid REFERENCES public.generated_content(id) ON DELETE SET NULL,
  external_job_id     text,
  error_message       text,
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_video_assets_founder
  ON public.video_assets (founder_id);

CREATE INDEX IF NOT EXISTS idx_video_assets_status
  ON public.video_assets (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_assets_external_job
  ON public.video_assets (external_job_id) WHERE external_job_id IS NOT NULL;

ALTER TABLE public.video_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "founder_video_assets" ON public.video_assets;
CREATE POLICY "founder_video_assets" ON public.video_assets
  FOR ALL USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());

DROP POLICY IF EXISTS "service_role_video_assets" ON public.video_assets;
CREATE POLICY "service_role_video_assets" ON public.video_assets
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS video_assets_updated_at ON public.video_assets;
CREATE TRIGGER video_assets_updated_at
  BEFORE UPDATE ON public.video_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
