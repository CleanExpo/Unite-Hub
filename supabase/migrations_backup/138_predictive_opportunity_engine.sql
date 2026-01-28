-- Migration 138: Predictive Opportunity Engine (POE)
-- Phase 95: Safe forecasting with truth-layer compliance

-- Opportunity windows table
CREATE TABLE IF NOT EXISTS opportunity_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  client_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  window_type TEXT NOT NULL CHECK (window_type IN ('7_day', '14_day', '30_day')),
  opportunity_category TEXT NOT NULL CHECK (opportunity_category IN ('creative', 'posting', 'campaign', 'brand', 'engagement', 'audience', 'timing')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  supporting_nodes JSONB NOT NULL DEFAULT '[]',
  uncertainty_notes TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'dismissed', 'acted_upon')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Opportunity signals table
CREATE TABLE IF NOT EXISTS opportunity_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunity_windows(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL,
  signal_value FLOAT NOT NULL,
  signal_label TEXT,
  source_node_id UUID REFERENCES intelligence_nodes(id) ON DELETE SET NULL,
  weight FLOAT NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for opportunity_windows
CREATE INDEX IF NOT EXISTS idx_opportunity_windows_tenant ON opportunity_windows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_windows_region ON opportunity_windows(region_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_windows_client ON opportunity_windows(client_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_windows_type ON opportunity_windows(window_type);
CREATE INDEX IF NOT EXISTS idx_opportunity_windows_category ON opportunity_windows(opportunity_category);
CREATE INDEX IF NOT EXISTS idx_opportunity_windows_status ON opportunity_windows(status);
CREATE INDEX IF NOT EXISTS idx_opportunity_windows_expires ON opportunity_windows(expires_at);
CREATE INDEX IF NOT EXISTS idx_opportunity_windows_created ON opportunity_windows(created_at DESC);

-- Indexes for opportunity_signals
CREATE INDEX IF NOT EXISTS idx_opportunity_signals_opportunity ON opportunity_signals(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_signals_source ON opportunity_signals(source_node_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_signals_type ON opportunity_signals(signal_type);

-- RLS policies
ALTER TABLE opportunity_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_signals ENABLE ROW LEVEL SECURITY;

-- RLS for opportunity_windows
CREATE POLICY "Users can view their tenant opportunities"
  ON opportunity_windows FOR SELECT
  USING (
    tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
    OR tenant_id IS NULL
  );

CREATE POLICY "Users can insert opportunities for their tenant"
  ON opportunity_windows FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
    OR tenant_id IS NULL
  );

CREATE POLICY "Users can update their tenant opportunities"
  ON opportunity_windows FOR UPDATE
  USING (
    tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
    OR tenant_id IS NULL
  );

-- RLS for opportunity_signals
CREATE POLICY "Users can view signals for their opportunities"
  ON opportunity_signals FOR SELECT
  USING (
    opportunity_id IN (
      SELECT id FROM opportunity_windows WHERE tenant_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
      OR tenant_id IS NULL
    )
  );

CREATE POLICY "Users can insert signals for their opportunities"
  ON opportunity_signals FOR INSERT
  WITH CHECK (
    opportunity_id IN (
      SELECT id FROM opportunity_windows WHERE tenant_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
      OR tenant_id IS NULL
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_opportunity_windows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_opportunity_windows_updated_at
  BEFORE UPDATE ON opportunity_windows
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunity_windows_updated_at();

-- Function to expire old windows
CREATE OR REPLACE FUNCTION expire_old_opportunity_windows()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE opportunity_windows
  SET status = 'expired'
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get opportunity summary
CREATE OR REPLACE FUNCTION get_opportunity_summary(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  window_type TEXT,
  category TEXT,
  total_count BIGINT,
  avg_confidence FLOAT,
  high_confidence_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ow.window_type,
    ow.opportunity_category as category,
    COUNT(*) as total_count,
    AVG(ow.confidence) as avg_confidence,
    COUNT(*) FILTER (WHERE ow.confidence >= 0.7) as high_confidence_count
  FROM opportunity_windows ow
  WHERE ow.status = 'active'
    AND (p_tenant_id IS NULL OR ow.tenant_id = p_tenant_id)
  GROUP BY ow.window_type, ow.opportunity_category
  ORDER BY ow.window_type, ow.opportunity_category;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE opportunity_windows IS 'Phase 95: Predictive opportunity windows with truth-layer compliance';
COMMENT ON TABLE opportunity_signals IS 'Phase 95: Supporting signals for opportunity windows';
COMMENT ON COLUMN opportunity_windows.confidence IS 'Probability score 0.0-1.0 based on real data quality';
COMMENT ON COLUMN opportunity_windows.uncertainty_notes IS 'Required truth layer disclosure about prediction limitations';
