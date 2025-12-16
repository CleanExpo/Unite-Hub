-- Guardian Phase H03: AI-Enhanced Correlation Refinement
-- Migration: 553
-- Purpose: Track AI correlation refinement suggestions and decisions
-- Tables: guardian_ai_correlation_reviews

-- ============================================================================
-- TABLE: guardian_ai_correlation_reviews
-- ============================================================================
-- Stores AI-generated correlation refinement suggestions
-- Tracks whether suggestions were applied by users
-- Privacy-friendly: No raw prompts or AI responses stored
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_ai_correlation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  cluster_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  suggested_action TEXT NOT NULL CHECK (suggested_action IN ('merge', 'split', 'relabel', 'rank', 'dismiss')),
  model TEXT NOT NULL,
  ai_score NUMERIC(4, 3) CHECK (ai_score >= 0 AND ai_score <= 1),
  confidence NUMERIC(4, 3) CHECK (confidence >= 0 AND confidence <= 1),
  rationale TEXT,
  applied BOOLEAN NOT NULL DEFAULT false,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_guardian_ai_correlation_reviews_tenant
  ON guardian_ai_correlation_reviews (tenant_id, created_at DESC);

CREATE INDEX idx_guardian_ai_correlation_reviews_applied
  ON guardian_ai_correlation_reviews (tenant_id, applied, applied_at DESC);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================
ALTER TABLE guardian_ai_correlation_reviews ENABLE ROW LEVEL SECURITY;

-- Tenants can view and manage their own AI correlation reviews
CREATE POLICY tenant_rw_guardian_ai_correlation_reviews
  ON guardian_ai_correlation_reviews
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Service role: Full access
CREATE POLICY service_all_guardian_ai_correlation_reviews
  ON guardian_ai_correlation_reviews
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE guardian_ai_correlation_reviews IS 'AI correlation refinement suggestions and user decisions';
COMMENT ON COLUMN guardian_ai_correlation_reviews.cluster_ids IS 'Cluster IDs involved in suggestion (JSONB array)';
COMMENT ON COLUMN guardian_ai_correlation_reviews.suggested_action IS 'AI-suggested action: merge, split, relabel, rank, dismiss';
COMMENT ON COLUMN guardian_ai_correlation_reviews.ai_score IS 'AI relevance score 0-1 for suggestion';
COMMENT ON COLUMN guardian_ai_correlation_reviews.confidence IS 'AI confidence in suggestion (0-1)';
COMMENT ON COLUMN guardian_ai_correlation_reviews.applied IS 'Whether user applied this suggestion';
COMMENT ON COLUMN guardian_ai_correlation_reviews.rationale IS 'AI explanation for suggestion (max 500 chars)';
