-- Phase 5 Agent 2: Research Agent Tables
-- Stores research queries, insights, and threat assessments

CREATE TABLE IF NOT EXISTS research_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  brand_id TEXT NOT NULL,
  category TEXT NOT NULL,
  query TEXT NOT NULL,
  insights JSONB NOT NULL,
  summary TEXT NOT NULL,
  threat_level TEXT NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  recommendations TEXT[],
  requires_founder_review BOOLEAN NOT NULL DEFAULT FALSE,
  founder_reviewed_at TIMESTAMP WITH TIME ZONE,
  founder_decision TEXT,
  founder_notes TEXT,
  themes TEXT[],
  metadata JSONB,
  CONSTRAINT valid_brand FOREIGN KEY (brand_id) REFERENCES brand_metadata(brand_id) ON DELETE RESTRICT,
  CONSTRAINT valid_category CHECK (category IN ('competitor', 'industry', 'technology', 'algorithm', 'ai_models')),
  CONSTRAINT valid_threat CHECK (threat_level IN ('low', 'medium', 'high')),
  CONSTRAINT valid_risk CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
);

-- Research batch tracking (for monitoring multiple queries)
CREATE TABLE IF NOT EXISTS research_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  brand_id TEXT NOT NULL,
  batch_name TEXT NOT NULL,
  category TEXT NOT NULL,
  query_count INTEGER NOT NULL,
  insight_count INTEGER NOT NULL,
  high_threat_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  CONSTRAINT valid_brand_batch FOREIGN KEY (brand_id) REFERENCES brand_metadata(brand_id) ON DELETE RESTRICT
);

-- Link research to batches
CREATE TABLE IF NOT EXISTS research_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES research_batches(id) ON DELETE CASCADE,
  insight_id UUID NOT NULL REFERENCES research_insights(id) ON DELETE CASCADE,
  UNIQUE(batch_id, insight_id)
);

-- Enable RLS
ALTER TABLE research_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_batch_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY research_insights_authenticated_read ON research_insights
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY research_batches_authenticated_read ON research_batches
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY research_batch_items_authenticated_read ON research_batch_items
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_research_insights_brand ON research_insights(brand_id);
CREATE INDEX IF NOT EXISTS idx_research_insights_category ON research_insights(category);
CREATE INDEX IF NOT EXISTS idx_research_insights_threat ON research_insights(threat_level);
CREATE INDEX IF NOT EXISTS idx_research_insights_risk ON research_insights(risk_level);
CREATE INDEX IF NOT EXISTS idx_research_insights_requires_review ON research_insights(requires_founder_review);
CREATE INDEX IF NOT EXISTS idx_research_insights_created ON research_insights(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_batches_brand ON research_batches(brand_id);
CREATE INDEX IF NOT EXISTS idx_research_batches_category ON research_batches(category);
CREATE INDEX IF NOT EXISTS idx_research_batches_status ON research_batches(status);
CREATE INDEX IF NOT EXISTS idx_research_batches_created ON research_batches(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_batch_items_batch ON research_batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_research_batch_items_insight ON research_batch_items(insight_id);

-- Comments
COMMENT ON TABLE research_insights IS 'Stores research query results with threat assessment and recommendations. Integrated with founder approval engine.';
COMMENT ON TABLE research_batches IS 'Groups multiple research queries into batches for bulk analysis.';
COMMENT ON TABLE research_batch_items IS 'Links research insights to batches for organization and filtering.';

COMMENT ON COLUMN research_insights.threat_level IS 'Detected threat level: low (no action needed), medium (monitor closely), high (requires founder review).';
COMMENT ON COLUMN research_insights.requires_founder_review IS 'TRUE if threat level is high OR risk level is high/critical.';
COMMENT ON COLUMN research_insights.themes IS 'Identified themes in insights (e.g., AI adoption, market shift, competitive pressure).';
