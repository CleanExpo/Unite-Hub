-- Migration 133: Voice-First Agent Execution Layer
-- Required by Phase 81 - Voice-First Agent Execution Layer (VFAEL)
-- Unified voice-first control layer for MAOS orchestration

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS voice_command_audit CASCADE;
DROP TABLE IF EXISTS voice_command_sessions CASCADE;

-- Voice command sessions table
CREATE TABLE voice_command_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en',
  transcript TEXT,
  parsed_intent JSONB DEFAULT '{}'::jsonb,
  orchestrator_run_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT voice_command_sessions_status_check CHECK (
    status IN ('pending', 'transcribing', 'parsing', 'executing', 'completed', 'failed', 'cancelled')
  ),

  -- Foreign keys
  CONSTRAINT voice_command_sessions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT voice_command_sessions_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_command_sessions_org ON voice_command_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_command_sessions_user ON voice_command_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_command_sessions_language ON voice_command_sessions(language_code);
CREATE INDEX IF NOT EXISTS idx_voice_command_sessions_status ON voice_command_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_command_sessions_created ON voice_command_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE voice_command_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY voice_command_sessions_select ON voice_command_sessions
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY voice_command_sessions_insert ON voice_command_sessions
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY voice_command_sessions_update ON voice_command_sessions
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE voice_command_sessions IS 'Voice command sessions (Phase 81)';

-- Voice command audit table
CREATE TABLE voice_command_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  action_name TEXT NOT NULL,
  result_status TEXT NOT NULL,
  token_cost_estimate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT voice_command_audit_session_fk
    FOREIGN KEY (session_id) REFERENCES voice_command_sessions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_command_audit_session ON voice_command_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_command_audit_action ON voice_command_audit(action_name);
CREATE INDEX IF NOT EXISTS idx_voice_command_audit_status ON voice_command_audit(result_status);
CREATE INDEX IF NOT EXISTS idx_voice_command_audit_created ON voice_command_audit(created_at DESC);

-- Enable RLS
ALTER TABLE voice_command_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via voice_command_sessions)
CREATE POLICY voice_command_audit_select ON voice_command_audit
  FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT id FROM voice_command_sessions
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY voice_command_audit_insert ON voice_command_audit
  FOR INSERT TO authenticated
  WITH CHECK (session_id IN (
    SELECT id FROM voice_command_sessions
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE voice_command_audit IS 'Voice command audit trail (Phase 81)';
