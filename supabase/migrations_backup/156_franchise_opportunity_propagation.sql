-- Migration 156: Franchise Opportunity Propagation Engine (FOPE)
-- Phase 113: Propagates opportunities to child agencies

CREATE TABLE IF NOT EXISTS franchise_opportunity_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('growth', 'risk', 'market', 'compliance', 'creative')),
  opportunity_payload JSONB NOT NULL,
  target_regions JSONB NOT NULL DEFAULT '[]',
  target_agencies JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  propagated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_franchise_opp_parent ON franchise_opportunity_windows(parent_agency_id);
CREATE INDEX IF NOT EXISTS idx_franchise_opp_scope ON franchise_opportunity_windows(scope);
CREATE INDEX IF NOT EXISTS idx_franchise_opp_created ON franchise_opportunity_windows(created_at DESC);

ALTER TABLE franchise_opportunity_windows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view franchise opportunities" ON franchise_opportunity_windows;
CREATE POLICY "Users can view franchise opportunities" ON franchise_opportunity_windows FOR SELECT
  USING (parent_agency_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

COMMENT ON TABLE franchise_opportunity_windows IS 'Phase 113: Franchise opportunity propagation windows';
