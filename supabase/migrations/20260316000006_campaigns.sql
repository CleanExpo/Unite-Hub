-- Migration: campaigns + campaign_assets
-- Stores AI-generated marketing campaigns and their per-platform assets.
-- Part of the Synthex Campaign Engine (Pomelli-class marketing automation).

CREATE EXTENSION IF NOT EXISTS moddatetime;

-- ─── campaigns ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_profile_id  UUID        NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
  theme             TEXT        NOT NULL,
  objective         TEXT        NOT NULL
                    CHECK (objective IN ('awareness', 'engagement', 'conversion', 'retention')),
  platforms         TEXT[]      NOT NULL DEFAULT '{}',
  post_count        INTEGER     NOT NULL DEFAULT 5,
  date_range_start  DATE        NULL,
  date_range_end    DATE        NULL,
  status            TEXT        NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'generating', 'ready', 'published')),
  metadata          JSONB       NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaigns_founder_status_idx ON campaigns (founder_id, status);
CREATE INDEX IF NOT EXISTS campaigns_brand_profile_idx ON campaigns (brand_profile_id);

CREATE TRIGGER set_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select_own" ON campaigns FOR SELECT TO authenticated USING (founder_id = auth.uid());
CREATE POLICY "campaigns_insert_own" ON campaigns FOR INSERT TO authenticated WITH CHECK (founder_id = auth.uid());
CREATE POLICY "campaigns_update_own" ON campaigns FOR UPDATE TO authenticated USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "campaigns_delete_own" ON campaigns FOR DELETE TO authenticated USING (founder_id = auth.uid());
CREATE POLICY "campaigns_service_role" ON campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── campaign_assets ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_assets (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  founder_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform        TEXT        NOT NULL
                  CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'tiktok', 'youtube')),
  copy            TEXT        NOT NULL,
  headline        TEXT        NULL,
  cta             TEXT        NULL,
  hashtags        TEXT[]      NOT NULL DEFAULT '{}',
  image_url       TEXT        NULL,
  image_prompt    TEXT        NOT NULL DEFAULT '',
  width           INTEGER     NOT NULL DEFAULT 1080,
  height          INTEGER     NOT NULL DEFAULT 1080,
  variant         INTEGER     NOT NULL DEFAULT 1,
  social_post_id  UUID        NULL REFERENCES social_posts(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'pending_image'
                  CHECK (status IN ('pending_image', 'generating_image', 'ready', 'published')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_assets_campaign_idx ON campaign_assets (campaign_id);
CREATE INDEX IF NOT EXISTS campaign_assets_founder_status_idx ON campaign_assets (founder_id, status);

CREATE TRIGGER set_campaign_assets_updated_at
  BEFORE UPDATE ON campaign_assets
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime(updated_at);

ALTER TABLE campaign_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_assets_select_own" ON campaign_assets FOR SELECT TO authenticated USING (founder_id = auth.uid());
CREATE POLICY "campaign_assets_insert_own" ON campaign_assets FOR INSERT TO authenticated WITH CHECK (founder_id = auth.uid());
CREATE POLICY "campaign_assets_update_own" ON campaign_assets FOR UPDATE TO authenticated USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "campaign_assets_delete_own" ON campaign_assets FOR DELETE TO authenticated USING (founder_id = auth.uid());
CREATE POLICY "campaign_assets_service_role" ON campaign_assets FOR ALL TO service_role USING (true) WITH CHECK (true);
