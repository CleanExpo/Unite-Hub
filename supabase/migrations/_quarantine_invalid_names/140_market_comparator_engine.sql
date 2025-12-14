-- Migration 140: Market Comparator Engine (MCE)
-- Phase 97: Anonymized aggregated benchmarking

-- Market baselines table
CREATE TABLE IF NOT EXISTS market_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric TEXT NOT NULL,
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  aggregated_value NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  sample_size INTEGER NOT NULL CHECK (sample_size > 0),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Market trends table
CREATE TABLE IF NOT EXISTS market_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID REFERENCES regions(id) ON DELETE CASCADE,
  trend_type TEXT NOT NULL CHECK (trend_type IN ('engagement', 'growth', 'conversion', 'retention', 'cost')),
  trend_vector JSONB NOT NULL,
  confidence_band TEXT NOT NULL CHECK (confidence_band IN ('high', 'medium', 'low', 'insufficient')),
  direction TEXT NOT NULL CHECK (direction IN ('up', 'down', 'stable', 'volatile')),
  magnitude NUMERIC,
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_market_baselines_metric ON market_baselines(metric);
CREATE INDEX IF NOT EXISTS idx_market_baselines_region ON market_baselines(region_id);
CREATE INDEX IF NOT EXISTS idx_market_baselines_created ON market_baselines(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_trends_region ON market_trends(region_id);
CREATE INDEX IF NOT EXISTS idx_market_trends_type ON market_trends(trend_type);
CREATE INDEX IF NOT EXISTS idx_market_trends_created ON market_trends(created_at DESC);

-- RLS
ALTER TABLE market_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view market baselines" ON market_baselines FOR SELECT USING (true);
CREATE POLICY "Users can view market trends" ON market_trends FOR SELECT USING (true);

COMMENT ON TABLE market_baselines IS 'Phase 97: Anonymized aggregated market baselines';
COMMENT ON TABLE market_trends IS 'Phase 97: Regional market trend analysis';
