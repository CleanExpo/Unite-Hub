-- Decision Circuits Social Agent v1.3.0 Migration
-- Autonomous execution-only agent for social media publishing
-- Applied on top of v1.0-1.2 migrations

-- Social agent executions table (audit trail for all publish attempts)
CREATE TABLE IF NOT EXISTS social_agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  circuit_execution_id TEXT NOT NULL,
  client_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin')),

  -- Execution details
  published BOOLEAN NOT NULL,
  platform_post_id TEXT,
  platform_url TEXT,
  published_at TIMESTAMPTZ,

  -- Content snapshot
  text_content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',
  scheduled_for TIMESTAMPTZ,

  -- Retry tracking
  attempt_number INT DEFAULT 1,
  retry_count INT DEFAULT 0,
  last_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT social_agent_executions_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_social_agent_executions_workspace
  ON social_agent_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_agent_executions_circuit
  ON social_agent_executions(circuit_execution_id);
CREATE INDEX IF NOT EXISTS idx_social_agent_executions_client
  ON social_agent_executions(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_social_agent_executions_platform
  ON social_agent_executions(workspace_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_agent_executions_published_at
  ON social_agent_executions(published_at DESC);

-- Social agent metrics table (engagement tracking)
CREATE TABLE IF NOT EXISTS social_agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  circuit_execution_id TEXT NOT NULL,
  platform_post_id TEXT NOT NULL,
  platform TEXT NOT NULL,

  -- Metrics
  impressions INT DEFAULT 0,
  likes INT DEFAULT 0,
  shares INT DEFAULT 0,
  comments INT DEFAULT 0,
  clicks INT DEFAULT 0,
  engagement_rate FLOAT DEFAULT 0.0,

  -- Collection timestamp
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT social_agent_metrics_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_social_agent_metrics_workspace
  ON social_agent_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_agent_metrics_circuit
  ON social_agent_metrics(circuit_execution_id);
CREATE INDEX IF NOT EXISTS idx_social_agent_metrics_platform_post
  ON social_agent_metrics(platform_post_id);
CREATE INDEX IF NOT EXISTS idx_social_agent_metrics_collected_at
  ON social_agent_metrics(collected_at DESC);

-- Enable Row Level Security on all new tables
ALTER TABLE social_agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_agent_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
DROP POLICY IF EXISTS "social_agent_executions_tenant_isolation" ON social_agent_executions;
CREATE POLICY "social_agent_executions_tenant_isolation" ON social_agent_executions
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "social_agent_metrics_tenant_isolation" ON social_agent_metrics;
CREATE POLICY "social_agent_metrics_tenant_isolation" ON social_agent_metrics
FOR ALL USING (workspace_id = get_current_workspace_id());

-- View for social agent performance summary
CREATE OR REPLACE VIEW social_agent_performance AS
SELECT
  workspace_id,
  platform,
  COUNT(*) as total_posts,
  SUM(CASE WHEN published THEN 1 ELSE 0 END) as successful_posts,
  SUM(retry_count) as total_retries,
  AVG(CASE WHEN published THEN retry_count ELSE NULL END) as avg_retries_on_success,
  ROUND(
    100.0 * SUM(CASE WHEN published THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as success_rate
FROM social_agent_executions
GROUP BY workspace_id, platform;

-- Comments
COMMENT ON TABLE social_agent_executions IS 'Audit trail for all social agent execution attempts with full context';
COMMENT ON TABLE social_agent_metrics IS 'Engagement metrics collected from social platforms after publishing';
COMMENT ON VIEW social_agent_performance IS 'Performance summary of social agent across platforms';
