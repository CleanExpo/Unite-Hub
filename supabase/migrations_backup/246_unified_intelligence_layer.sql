-- Phase 6: Unified Agent Intelligence Layer
-- Stores shared memory, agent state, collaboration messages, global insights, and metrics

-- Unified agent memory fabric
CREATE TABLE IF NOT EXISTS unified_agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  agent TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('short_term', 'working', 'long_term')),
  topic TEXT NOT NULL,
  payload JSONB NOT NULL,
  importance DECIMAL(3,2) NOT NULL CHECK (importance >= 0 AND importance <= 1),
  expires_at TIMESTAMP WITH TIME ZONE,
  tags TEXT[]
);

-- Agent state snapshots
CREATE TABLE IF NOT EXISTS agent_state_snapshot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  agent TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('idle', 'running', 'degraded', 'error')),
  health_score DECIMAL(5,2) NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  active_workflows INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  cpu_usage DECIMAL(5,2),
  memory_usage DECIMAL(5,2)
);

-- Agent collaboration messages
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  msg_from TEXT NOT NULL,
  msg_to TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('orchestrator', 'specialist', 'observer')),
  intent TEXT NOT NULL CHECK (intent IN (
    'request_data', 'share_insight', 'propose_plan', 'feedback',
    'notify_risk', 'request_approval', 'acknowledge', 'error_report'
  )),
  topic TEXT NOT NULL,
  payload JSONB NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  reply_to_id UUID REFERENCES agent_messages(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Global insights aggregated from multiple agents
CREATE TABLE IF NOT EXISTS global_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source_agents TEXT[] NOT NULL,
  timeframe TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN (
    'email_engagement', 'content_quality', 'scheduling_efficiency',
    'staff_utilization', 'financial_health', 'risk_alert', 'opportunity', 'cross_domain'
  )),
  summary TEXT NOT NULL,
  details TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  action_items TEXT[],
  CONSTRAINT unique_insight UNIQUE (theme, created_at)
);

-- Intelligence system metrics
CREATE TABLE IF NOT EXISTS intelligence_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  agent TEXT NOT NULL,
  metric TEXT NOT NULL,
  value DECIMAL(15,4) NOT NULL,
  unit TEXT,
  meta JSONB
);

-- Meta reasoner decisions (audit trail)
CREATE TABLE IF NOT EXISTS meta_reasoner_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  system_status TEXT NOT NULL CHECK (system_status IN ('healthy', 'degraded', 'critical')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  focus_areas TEXT[] NOT NULL,
  recommended_actions TEXT[] NOT NULL,
  next_review_in INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1)
);

-- Enable RLS
ALTER TABLE unified_agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_state_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_reasoner_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated read only for now)
CREATE POLICY "Allow authenticated read unified_memory" ON unified_agent_memory
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read agent_state" ON agent_state_snapshot
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read messages" ON agent_messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read insights" ON global_insights
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read metrics" ON intelligence_metrics
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read decisions" ON meta_reasoner_decisions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_unified_memory_agent ON unified_agent_memory(agent);
CREATE INDEX IF NOT EXISTS idx_unified_memory_scope ON unified_agent_memory(scope);
CREATE INDEX IF NOT EXISTS idx_unified_memory_topic ON unified_agent_memory(topic);
CREATE INDEX IF NOT EXISTS idx_unified_memory_importance ON unified_agent_memory(importance DESC);
CREATE INDEX IF NOT EXISTS idx_unified_memory_created ON unified_agent_memory(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_state_agent ON agent_state_snapshot(agent);
CREATE INDEX IF NOT EXISTS idx_agent_state_status ON agent_state_snapshot(status);
CREATE INDEX IF NOT EXISTS idx_agent_state_health ON agent_state_snapshot(health_score);
CREATE INDEX IF NOT EXISTS idx_agent_state_created ON agent_state_snapshot(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_messages_to ON agent_messages(msg_to);
CREATE INDEX IF NOT EXISTS idx_agent_messages_from ON agent_messages(msg_from);
CREATE INDEX IF NOT EXISTS idx_agent_messages_intent ON agent_messages(intent);
CREATE INDEX IF NOT EXISTS idx_agent_messages_priority ON agent_messages(priority);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created ON agent_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_global_insights_theme ON global_insights(theme);
CREATE INDEX IF NOT EXISTS idx_global_insights_severity ON global_insights(severity);
CREATE INDEX IF NOT EXISTS idx_global_insights_confidence ON global_insights(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_global_insights_created ON global_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_insights_source_agents ON global_insights USING GIN(source_agents);

CREATE INDEX IF NOT EXISTS idx_intelligence_metrics_agent ON intelligence_metrics(agent);
CREATE INDEX IF NOT EXISTS idx_intelligence_metrics_metric ON intelligence_metrics(metric);
CREATE INDEX IF NOT EXISTS idx_intelligence_metrics_timestamp ON intelligence_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_intelligence_metrics_agent_metric ON intelligence_metrics(agent, metric, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_meta_reasoner_created ON meta_reasoner_decisions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_reasoner_priority ON meta_reasoner_decisions(priority);

-- Comments
DO $$
BEGIN
  COMMENT ON TABLE unified_agent_memory IS 'Shared memory fabric across all agents: short_term (hours), working (task), long_term (permanent)';
  COMMENT ON TABLE agent_state_snapshot IS 'Real-time state of each agent including health, status, workload, and resource usage';
  COMMENT ON TABLE agent_messages IS 'Message bus for agent-to-agent collaboration and coordination';
  COMMENT ON TABLE global_insights IS 'Cross-agent insights aggregated and ranked by severity and confidence';
  COMMENT ON TABLE intelligence_metrics IS 'Performance metrics (latency, throughput, error rate) for all agents';
  COMMENT ON TABLE meta_reasoner_decisions IS 'Audit trail of meta reasoner decisions and focus recommendations';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
