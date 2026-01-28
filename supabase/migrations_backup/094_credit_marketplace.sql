-- Migration 094: Credit Marketplace
-- Required by Phase 42 - Credit Marketplace & Smart Upsell Engine
-- Credit packs catalogue and upsell triggers

-- Credit packs table (marketplace catalogue)
CREATE TABLE IF NOT EXISTS credit_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  tier_restriction TEXT,
  voice_tokens INTEGER NOT NULL DEFAULT 0,
  text_tokens INTEGER NOT NULL DEFAULT 0,
  price_aud NUMERIC NOT NULL,
  stripe_price_id TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tier restriction check
  CONSTRAINT credit_packs_tier_check CHECK (
    tier_restriction IS NULL OR tier_restriction IN ('tier1', 'tier2', 'tier3', 'custom')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_packs_slug ON credit_packs(slug);
CREATE INDEX IF NOT EXISTS idx_credit_packs_active ON credit_packs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_credit_packs_featured ON credit_packs(is_featured) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for authenticated users)
CREATE POLICY credit_packs_select ON credit_packs
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER trg_credit_packs_updated_at
  BEFORE UPDATE ON credit_packs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE credit_packs IS 'Credit pack catalogue for marketplace (Phase 42)';

-- Seed default packs
INSERT INTO credit_packs (slug, label, description, voice_tokens, text_tokens, price_aud, is_featured) VALUES
  ('boost-small', 'Quick Boost', 'Top up a small bundle of credits to finish the week.', 2000, 5000, 10, false),
  ('boost-medium', 'Campaign Booster', 'Extra credits for campaigns and busy periods.', 6000, 15000, 25, true),
  ('boost-large', 'Power User Pack', 'High-volume credit pack for heavy usage.', 15000, 40000, 60, false)
ON CONFLICT (slug) DO NOTHING;

-- Upsell triggers table
CREATE TABLE IF NOT EXISTS upsell_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  offer_type TEXT NOT NULL,
  credit_pack_id UUID,
  recommended_tier TEXT,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Trigger type check
  CONSTRAINT upsell_triggers_type_check CHECK (
    trigger_type IN (
      'predicted_runout',
      'recent_lockout',
      'frequent_topup',
      'seasonal',
      'usage_spike'
    )
  ),

  -- Offer type check
  CONSTRAINT upsell_triggers_offer_check CHECK (
    offer_type IN ('credit_pack', 'tier_upgrade', 'tier_upgrade_plus_pack')
  ),

  -- Foreign keys
  CONSTRAINT upsell_triggers_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT upsell_triggers_pack_fk
    FOREIGN KEY (credit_pack_id) REFERENCES credit_packs(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upsell_triggers_org ON upsell_triggers(org_id);
CREATE INDEX IF NOT EXISTS idx_upsell_triggers_active
  ON upsell_triggers(org_id) WHERE accepted_at IS NULL AND dismissed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_upsell_triggers_shown ON upsell_triggers(shown_at DESC);

-- Enable RLS
ALTER TABLE upsell_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY upsell_triggers_select ON upsell_triggers
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upsell_triggers_insert ON upsell_triggers
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upsell_triggers_update ON upsell_triggers
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE upsell_triggers IS 'Smart upsell triggers based on usage signals (Phase 42)';
