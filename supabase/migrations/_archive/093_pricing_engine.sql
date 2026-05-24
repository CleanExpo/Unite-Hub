-- Migration 093: Pricing Engine
-- Required by Phase 41 - Dynamic Pricing & Tier Optimisation Engine
-- Internal pricing rules and per-org recommendations

-- Pricing rules table (internal configuration)
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL DEFAULT 'global',
  region TEXT,
  industry TEXT,
  min_monthly_spend NUMERIC,
  max_monthly_spend NUMERIC,
  voice_weight NUMERIC NOT NULL DEFAULT 0.7,
  text_weight NUMERIC NOT NULL DEFAULT 0.3,
  base_multiplier NUMERIC NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Scope check
  CONSTRAINT pricing_rules_scope_check CHECK (
    scope IN ('global', 'region', 'industry', 'custom')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_rules_slug ON pricing_rules(slug);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies (internal only - no public access)
-- System/service role can access, authenticated users cannot
CREATE POLICY pricing_rules_deny_all ON pricing_rules
  FOR ALL TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND false)
  WITH CHECK (false);

-- Trigger for updated_at
CREATE TRIGGER trg_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE pricing_rules IS 'Internal pricing rules for tier optimization (Phase 41)';

-- Pricing recommendations table
CREATE TABLE IF NOT EXISTS pricing_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  current_tier TEXT NOT NULL,
  recommended_tier TEXT NOT NULL,
  estimated_monthly_savings NUMERIC NOT NULL DEFAULT 0,
  estimated_additional_capacity_percent NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  actioned_at TIMESTAMPTZ,

  -- Tier checks
  CONSTRAINT pricing_recommendations_current_tier_check CHECK (
    current_tier IN ('tier1', 'tier2', 'tier3', 'custom')
  ),
  CONSTRAINT pricing_recommendations_recommended_tier_check CHECK (
    recommended_tier IN ('tier1', 'tier2', 'tier3', 'custom')
  ),

  -- Foreign key
  CONSTRAINT pricing_recommendations_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_recommendations_org ON pricing_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_pricing_recommendations_pending
  ON pricing_recommendations(org_id) WHERE accepted = false AND dismissed = false;
CREATE INDEX IF NOT EXISTS idx_pricing_recommendations_created ON pricing_recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE pricing_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY pricing_recommendations_select ON pricing_recommendations
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY pricing_recommendations_insert ON pricing_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY pricing_recommendations_update ON pricing_recommendations
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE pricing_recommendations IS 'Per-org tier optimization recommendations (Phase 41)';
