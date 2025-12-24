-- Migration 904: AI Search Intelligence Tracking
-- Tracks Google AI Overview, Bing Copilot, and Perplexity citation algorithm changes
-- Enables automatic client strategy updates when AI Search algorithms shift

CREATE TABLE IF NOT EXISTS ai_search_algorithm_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  detected_at TIMESTAMP DEFAULT NOW(),
  source TEXT NOT NULL CHECK (source IN ('google_ai_overview', 'bing_copilot', 'perplexity_citations')),
  change_type TEXT NOT NULL CHECK (change_type IN (
    'ranking_factor',
    'citation_format',
    'snippet_structure',
    'answer_preference',
    'source_prioritization',
    'freshness_signal',
    'entity_prominence'
  )),
  description TEXT NOT NULL,
  affected_industries TEXT[] DEFAULT ARRAY[]::TEXT[],
  affected_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  confidence_score NUMERIC(3, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  evidence JSONB NOT NULL,
  recommended_actions JSONB,
  status TEXT DEFAULT 'detected' CHECK (status IN ('detected', 'confirmed', 'acted_upon', 'resolved')),
  client_notifications_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger for algorithm change detection events
CREATE TABLE IF NOT EXISTS ai_search_detection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  algorithm_change_id UUID REFERENCES ai_search_algorithm_changes(id) ON DELETE CASCADE,
  detection_method TEXT NOT NULL,
  test_queries TEXT[] NOT NULL,
  serp_snapshot JSONB NOT NULL,
  detection_timestamp TIMESTAMP DEFAULT NOW()
);

-- Track automated strategy updates triggered by algorithm changes
CREATE TABLE IF NOT EXISTS ai_search_triggered_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  algorithm_change_id UUID NOT NULL REFERENCES ai_search_algorithm_changes(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN (
    'content_regeneration',
    'video_generation',
    'citation_optimization',
    'snippet_refresh',
    'freshness_boost'
  )),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'executing', 'completed', 'failed')),
  affected_content_count INTEGER DEFAULT 0,
  result_metrics JSONB,
  triggered_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_search_changes_workspace ON ai_search_algorithm_changes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_search_changes_source ON ai_search_algorithm_changes(source);
CREATE INDEX IF NOT EXISTS idx_ai_search_changes_detected ON ai_search_algorithm_changes(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_search_changes_status ON ai_search_algorithm_changes(status);
CREATE INDEX IF NOT EXISTS idx_ai_search_changes_industry ON ai_search_algorithm_changes USING GIN (affected_industries);

CREATE INDEX IF NOT EXISTS idx_detection_logs_change ON ai_search_detection_logs(algorithm_change_id);
CREATE INDEX IF NOT EXISTS idx_triggered_updates_workspace ON ai_search_triggered_updates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_triggered_updates_change ON ai_search_triggered_updates(algorithm_change_id);
CREATE INDEX IF NOT EXISTS idx_triggered_updates_status ON ai_search_triggered_updates(status);

-- Enable RLS
ALTER TABLE ai_search_algorithm_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_search_detection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_search_triggered_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for algorithm changes
DROP POLICY IF EXISTS "algorithm_changes_tenant_isolation" ON ai_search_algorithm_changes;
CREATE POLICY "algorithm_changes_tenant_isolation" ON ai_search_algorithm_changes
  FOR ALL
  USING (workspace_id = (SELECT current_setting('request.jwt.claims', true)::jsonb->>'workspace_id')::uuid);

-- RLS Policies for detection logs (follow algorithm changes)
DROP POLICY IF EXISTS "detection_logs_tenant_isolation" ON ai_search_detection_logs;
CREATE POLICY "detection_logs_tenant_isolation" ON ai_search_detection_logs
  FOR ALL
  USING (
    algorithm_change_id IN (
      SELECT id FROM ai_search_algorithm_changes
      WHERE workspace_id = (SELECT current_setting('request.jwt.claims', true)::jsonb->>'workspace_id')::uuid
    )
  );

-- RLS Policies for triggered updates
DROP POLICY IF EXISTS "triggered_updates_tenant_isolation" ON ai_search_triggered_updates;
CREATE POLICY "triggered_updates_tenant_isolation" ON ai_search_triggered_updates
  FOR ALL
  USING (workspace_id = (SELECT current_setting('request.jwt.claims', true)::jsonb->>'workspace_id')::uuid);

-- Comment for clarity
COMMENT ON TABLE ai_search_algorithm_changes IS 'Tracks detected changes in Google AI Overview, Bing Copilot, and Perplexity citation algorithms. Enables automatic client strategy updates.';
COMMENT ON TABLE ai_search_detection_logs IS 'Audit trail of how algorithm changes were detected (SERP snapshots, test queries, detection method).';
COMMENT ON TABLE ai_search_triggered_updates IS 'Track automated updates triggered by algorithm changes (video generation, content refresh, citation optimization).';
