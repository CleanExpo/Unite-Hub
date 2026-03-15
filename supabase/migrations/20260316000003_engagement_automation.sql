-- Social engagements — tracks comments, DMs, mentions, reviews
CREATE TABLE IF NOT EXISTS public.social_engagements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id        uuid NOT NULL REFERENCES auth.users(id),
  business_key      text NOT NULL,
  platform          text NOT NULL,
  post_external_id  text,
  engagement_type   text NOT NULL CHECK (engagement_type IN ('comment', 'dm', 'mention', 'review')),
  author_name       text,
  author_id         text,
  content           text NOT NULL,
  sentiment         text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  ai_reply          text,
  reply_status      text NOT NULL DEFAULT 'pending' CHECK (reply_status IN ('pending', 'auto_replied', 'manual_replied', 'skipped', 'flagged')),
  replied_at        timestamptz,
  metadata          jsonb NOT NULL DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_engagements_founder
  ON public.social_engagements (founder_id);
CREATE INDEX IF NOT EXISTS idx_social_engagements_status
  ON public.social_engagements (reply_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_engagements_platform
  ON public.social_engagements (founder_id, platform, business_key);

ALTER TABLE public.social_engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founder_social_engagements" ON public.social_engagements
  FOR ALL USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());
CREATE POLICY "service_role_social_engagements" ON public.social_engagements
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS social_engagements_updated_at ON public.social_engagements;
CREATE TRIGGER social_engagements_updated_at
  BEFORE UPDATE ON public.social_engagements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Email campaigns
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id          uuid NOT NULL REFERENCES auth.users(id),
  business_key        text NOT NULL,
  subject             text NOT NULL,
  body_html           text NOT NULL,
  body_text           text,
  recipient_list      jsonb NOT NULL DEFAULT '[]',
  status              text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at        timestamptz,
  sent_at             timestamptz,
  open_count          integer NOT NULL DEFAULT 0,
  click_count         integer NOT NULL DEFAULT 0,
  generated_content_id uuid REFERENCES public.generated_content(id) ON DELETE SET NULL,
  error_message       text,
  metadata            jsonb NOT NULL DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_founder
  ON public.email_campaigns (founder_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status
  ON public.email_campaigns (status, scheduled_at);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founder_email_campaigns" ON public.email_campaigns
  FOR ALL USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());
CREATE POLICY "service_role_email_campaigns" ON public.email_campaigns
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS email_campaigns_updated_at ON public.email_campaigns;
CREATE TRIGGER email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
