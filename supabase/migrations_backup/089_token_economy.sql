-- Migration 089: Token Economy
-- Required by Phase 37 - Billing Engine Token Economy Integration
-- Token wallets and usage tracking with 3x uplift pricing

-- Token wallets table
CREATE TABLE IF NOT EXISTS token_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  tier TEXT NOT NULL DEFAULT 'tier1',
  voice_tokens INTEGER NOT NULL DEFAULT 0,
  text_tokens INTEGER NOT NULL DEFAULT 0,
  voice_budget_aud NUMERIC NOT NULL DEFAULT 0,
  text_budget_aud NUMERIC NOT NULL DEFAULT 0,
  renew_day INTEGER NOT NULL DEFAULT 1,
  auto_topup BOOLEAN NOT NULL DEFAULT false,
  topup_amount_aud NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tier check
  CONSTRAINT token_wallets_tier_check CHECK (
    tier IN ('tier1', 'tier2', 'tier3', 'custom')
  ),

  -- Foreign key
  CONSTRAINT token_wallets_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique constraint
  CONSTRAINT token_wallets_org_unique UNIQUE (org_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_wallets_org ON token_wallets(org_id);
CREATE INDEX IF NOT EXISTS idx_token_wallets_tier ON token_wallets(tier);

-- Enable RLS
ALTER TABLE token_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies (owner/admin only)
CREATE POLICY token_wallets_select ON token_wallets
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY token_wallets_insert ON token_wallets
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY token_wallets_update ON token_wallets
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Trigger for updated_at
CREATE TRIGGER trg_token_wallets_updated_at
  BEFORE UPDATE ON token_wallets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE token_wallets IS 'Token wallets for billing engine with 3x uplift pricing (Phase 37)';

-- Token usage events table
CREATE TABLE IF NOT EXISTS token_usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Event type check
  CONSTRAINT token_usage_events_type_check CHECK (
    event_type IN ('voice_consume', 'text_consume', 'topup', 'renewal', 'adjustment')
  ),

  -- Foreign key
  CONSTRAINT token_usage_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_usage_events_org ON token_usage_events(org_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_events_type ON token_usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_token_usage_events_created ON token_usage_events(created_at DESC);

-- Enable RLS
ALTER TABLE token_usage_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY token_usage_events_select ON token_usage_events
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY token_usage_events_insert ON token_usage_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE token_usage_events IS 'Track all token consumption and top-up events (Phase 37)';
