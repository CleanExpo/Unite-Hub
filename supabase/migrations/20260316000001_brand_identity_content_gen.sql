-- Brand identities — one row per business
CREATE TABLE IF NOT EXISTS public.brand_identities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id       uuid NOT NULL REFERENCES auth.users(id),
  business_key     text NOT NULL UNIQUE,
  tone_of_voice    text NOT NULL DEFAULT '',
  target_audience  text NOT NULL DEFAULT '',
  industry_keywords text[] NOT NULL DEFAULT '{}',
  unique_selling_points jsonb NOT NULL DEFAULT '[]',
  character_male   jsonb NOT NULL DEFAULT '{}',
  character_female  jsonb NOT NULL DEFAULT '{}',
  colour_primary   text,
  colour_secondary text,
  do_list          text[] NOT NULL DEFAULT '{}',
  dont_list        text[] NOT NULL DEFAULT '{}',
  sample_content   jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_identities_founder
  ON public.brand_identities (founder_id);

ALTER TABLE public.brand_identities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "founder_brand_identities" ON public.brand_identities;
CREATE POLICY "founder_brand_identities" ON public.brand_identities
  FOR ALL USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());

DROP POLICY IF EXISTS "service_role_brand_identities" ON public.brand_identities;
CREATE POLICY "service_role_brand_identities" ON public.brand_identities
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS brand_identities_updated_at ON public.brand_identities;
CREATE TRIGGER brand_identities_updated_at
  BEFORE UPDATE ON public.brand_identities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generated content — every piece AI produces
CREATE TABLE IF NOT EXISTS public.generated_content (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id       uuid NOT NULL REFERENCES auth.users(id),
  business_key     text NOT NULL,
  content_type     text NOT NULL CHECK (content_type IN ('social_post', 'blog_intro', 'email_campaign', 'video_script', 'thread')),
  platform         text,
  title            text,
  body             text NOT NULL,
  media_prompt     text,
  media_urls       jsonb NOT NULL DEFAULT '[]',
  hashtags         text[] NOT NULL DEFAULT '{}',
  cta              text,
  character_used   text CHECK (character_used IS NULL OR character_used IN ('male', 'female')),
  ai_model         text,
  input_tokens     integer,
  output_tokens    integer,
  generation_source text NOT NULL CHECK (generation_source IN ('cron_auto', 'manual_request', 'repurpose')),
  social_post_id   uuid REFERENCES public.social_posts(id) ON DELETE SET NULL,
  status           text NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'approved', 'rejected', 'published')),
  metadata         jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_generated_content_founder
  ON public.generated_content (founder_id);

CREATE INDEX IF NOT EXISTS idx_generated_content_business
  ON public.generated_content (founder_id, business_key);

CREATE INDEX IF NOT EXISTS idx_generated_content_status
  ON public.generated_content (status, created_at DESC);

ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "founder_generated_content" ON public.generated_content;
CREATE POLICY "founder_generated_content" ON public.generated_content
  FOR ALL USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());

DROP POLICY IF EXISTS "service_role_generated_content" ON public.generated_content;
CREATE POLICY "service_role_generated_content" ON public.generated_content
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS generated_content_updated_at ON public.generated_content;
CREATE TRIGGER generated_content_updated_at
  BEFORE UPDATE ON public.generated_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
