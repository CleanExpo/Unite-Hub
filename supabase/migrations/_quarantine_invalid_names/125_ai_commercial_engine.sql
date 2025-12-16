-- Migration 125: AI Commercial Engine
-- Required by Phase 73 - AI Commercial Engine (ACE)
-- Autonomous pricing, packaging, and positioning system

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS offer_performance CASCADE;
DROP TABLE IF EXISTS commercial_offers CASCADE;

-- Commercial offers table
CREATE TABLE commercial_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  offer_name TEXT NOT NULL,
  category TEXT NOT NULL,
  target_market TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  dynamic_price NUMERIC,
  value_proposition TEXT,
  generated_strategy JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT commercial_offers_status_check CHECK (
    status IN ('draft', 'active', 'paused', 'retired')
  ),

  -- Foreign key
  CONSTRAINT commercial_offers_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commercial_offers_org ON commercial_offers(org_id);
CREATE INDEX IF NOT EXISTS idx_commercial_offers_category ON commercial_offers(category);
CREATE INDEX IF NOT EXISTS idx_commercial_offers_status ON commercial_offers(status);
CREATE INDEX IF NOT EXISTS idx_commercial_offers_created ON commercial_offers(created_at DESC);

-- Enable RLS
ALTER TABLE commercial_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY commercial_offers_select ON commercial_offers
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY commercial_offers_insert ON commercial_offers
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY commercial_offers_update ON commercial_offers
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE commercial_offers IS 'Commercial offers and pricing (Phase 73)';

-- Offer performance table
CREATE TABLE offer_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL,
  period TEXT NOT NULL,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,
  roi_score NUMERIC NOT NULL DEFAULT 0,
  insights JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  -- ROI score check
  CONSTRAINT offer_performance_roi_check CHECK (
    roi_score >= 0
  ),

  -- Foreign key
  CONSTRAINT offer_performance_offer_fk
    FOREIGN KEY (offer_id) REFERENCES commercial_offers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offer_performance_offer ON offer_performance(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_performance_period ON offer_performance(period);
CREATE INDEX IF NOT EXISTS idx_offer_performance_roi ON offer_performance(roi_score DESC);
CREATE INDEX IF NOT EXISTS idx_offer_performance_recorded ON offer_performance(recorded_at DESC);

-- Enable RLS
ALTER TABLE offer_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY offer_performance_select ON offer_performance
  FOR SELECT TO authenticated
  USING (offer_id IN (
    SELECT id FROM commercial_offers
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY offer_performance_insert ON offer_performance
  FOR INSERT TO authenticated
  WITH CHECK (offer_id IN (
    SELECT id FROM commercial_offers
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE offer_performance IS 'Offer performance metrics (Phase 73)';
