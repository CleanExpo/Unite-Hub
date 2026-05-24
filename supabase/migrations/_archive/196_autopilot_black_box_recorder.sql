-- Migration 196: Autopilot Black Box Recorder (ABBR)
-- Phase 163: Complete decision recording for replay and audit

-- Black box decision logs table
CREATE TABLE IF NOT EXISTS black_box_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  context JSONB NOT NULL,
  inputs JSONB NOT NULL,
  outputs JSONB NOT NULL,
  reasoning TEXT,
  confidence REAL NOT NULL DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Replay sessions table
CREATE TABLE IF NOT EXISTS replay_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  session_name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  log_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_black_box_tenant ON black_box_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_black_box_agent ON black_box_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_black_box_time ON black_box_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_replay_sessions_tenant ON replay_sessions(tenant_id);

-- RLS
ALTER TABLE black_box_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE replay_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their black box logs" ON black_box_logs;
CREATE POLICY "Users can view their black box logs" ON black_box_logs
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view their replay sessions" ON replay_sessions;
CREATE POLICY "Users can view their replay sessions" ON replay_sessions
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
