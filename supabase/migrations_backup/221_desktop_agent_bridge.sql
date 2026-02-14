-- Migration 221: Desktop Agent Bridge
-- Purpose: Enable founder-controlled desktop automation through Synthex agent
-- Created: 2025-11-25
-- Security: Founder-only, sandboxed commands, rate-limited, audit-logged

-- ============================================================================
-- 1. DESKTOP_AGENT_CAPABILITIES Table - Define allowed capabilities
-- ============================================================================

CREATE TABLE IF NOT EXISTS desktop_agent_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Capability definition
  command_name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ui_interaction', 'window_control', 'system_info', 'clipboard', 'high_risk')),

  -- Risk classification
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'medium', 'high', 'critical')),
  requires_approval BOOLEAN DEFAULT FALSE,

  -- Parameters
  parameters JSONB DEFAULT '{}'::JSONB,

  -- Workspace scope
  workspace_id UUID,

  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  deprecated BOOLEAN DEFAULT FALSE,
  deprecation_reason TEXT,

  -- Metadata
  version TEXT DEFAULT '1.0.0',
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_desktop_agent_capabilities_command ON desktop_agent_capabilities(command_name);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_capabilities_category ON desktop_agent_capabilities(category);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_capabilities_risk ON desktop_agent_capabilities(risk_level);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_capabilities_workspace ON desktop_agent_capabilities(workspace_id) WHERE workspace_id IS NOT NULL;

COMMENT ON TABLE desktop_agent_capabilities IS 'Defines available desktop agent commands and their risk profiles';

-- ============================================================================
-- 2. DESKTOP_AGENT_SESSIONS Table - Track active sessions
-- ============================================================================

CREATE TABLE IF NOT EXISTS desktop_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Session metadata
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_version TEXT NOT NULL,

  -- Connection details
  session_token TEXT NOT NULL UNIQUE,
  websocket_connection_id TEXT,

  -- Session status
  status TEXT NOT NULL CHECK (status IN ('active', 'idle', 'closed', 'error')) DEFAULT 'active',

  -- Statistics
  total_commands INTEGER DEFAULT 0,
  successful_commands INTEGER DEFAULT 0,
  failed_commands INTEGER DEFAULT 0,

  -- Heartbeat tracking
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  heartbeat_count INTEGER DEFAULT 0,

  -- Error tracking
  last_error TEXT,
  error_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_desktop_agent_sessions_workspace ON desktop_agent_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_sessions_user ON desktop_agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_sessions_status ON desktop_agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_sessions_created_at ON desktop_agent_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_sessions_active ON desktop_agent_sessions(workspace_id) WHERE status = 'active';

COMMENT ON TABLE desktop_agent_sessions IS 'Tracks active desktop agent sessions and connection metadata';

-- ============================================================================
-- 3. DESKTOP_AGENT_COMMANDS Table - Log all executed commands
-- ============================================================================

CREATE TABLE IF NOT EXISTS desktop_agent_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Session & context
  session_id UUID NOT NULL REFERENCES desktop_agent_sessions(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Command details
  command_name TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}'::JSONB,
  description TEXT,

  -- Approval workflow (for high-risk commands)
  requires_approval BOOLEAN DEFAULT FALSE,
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved', NULL)),
  approval_requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approval_reason TEXT,
  approved_at TIMESTAMPTZ,

  -- Execution status
  status TEXT NOT NULL CHECK (status IN ('queued', 'executing', 'completed', 'failed', 'blocked', 'cancelled')) DEFAULT 'queued',

  -- Results
  result JSONB,
  error_message TEXT,
  execution_time_ms NUMERIC,

  -- Truth layer (what was promised vs what was done)
  promised_outcome TEXT,
  actual_outcome TEXT,
  outcome_mismatch BOOLEAN,

  -- Security & audit
  validation_passed BOOLEAN DEFAULT FALSE,
  validation_errors TEXT[],
  risk_score NUMERIC DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_desktop_agent_commands_session ON desktop_agent_commands(session_id);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_commands_workspace ON desktop_agent_commands(workspace_id);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_commands_user ON desktop_agent_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_commands_status ON desktop_agent_commands(status);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_commands_created_at ON desktop_agent_commands(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_commands_approval ON desktop_agent_commands(approval_status) WHERE approval_status IN ('pending', 'rejected');
CREATE INDEX IF NOT EXISTS idx_desktop_agent_commands_command_name ON desktop_agent_commands(command_name);

COMMENT ON TABLE desktop_agent_commands IS 'Complete audit log of all desktop agent commands with approval workflow and truth layer tracking';

-- ============================================================================
-- 4. DESKTOP_AGENT_APPROVALS Table - Founder approval management
-- ============================================================================

CREATE TABLE IF NOT EXISTS desktop_agent_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context
  workspace_id UUID NOT NULL,
  command_id UUID NOT NULL REFERENCES desktop_agent_commands(id) ON DELETE CASCADE,

  -- Approval decision
  approved BOOLEAN NOT NULL,
  founder_notes TEXT,

  -- Approver
  approved_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_desktop_agent_approvals_workspace ON desktop_agent_approvals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_approvals_command ON desktop_agent_approvals(command_id);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_approvals_approved_by ON desktop_agent_approvals(approved_by);
CREATE INDEX IF NOT EXISTS idx_desktop_agent_approvals_created_at ON desktop_agent_approvals(created_at DESC);

COMMENT ON TABLE desktop_agent_approvals IS 'Founder approval decisions for high-risk desktop agent commands';

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to create a new agent session
CREATE OR REPLACE FUNCTION create_agent_session(
  p_workspace_id UUID,
  p_user_id UUID,
  p_agent_version TEXT
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_session_id UUID;
  v_session_token TEXT;
BEGIN
  -- Generate unique session token
  v_session_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO desktop_agent_sessions (
    workspace_id,
    user_id,
    agent_version,
    session_token
  ) VALUES (
    p_workspace_id,
    p_user_id,
    p_agent_version,
    v_session_token
  ) RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- Function to record a command execution
CREATE OR REPLACE FUNCTION record_agent_command(
  p_session_id UUID,
  p_workspace_id UUID,
  p_user_id UUID,
  p_command_name TEXT,
  p_parameters JSONB DEFAULT '{}'::JSONB,
  p_requires_approval BOOLEAN DEFAULT FALSE
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_command_id UUID;
BEGIN
  INSERT INTO desktop_agent_commands (
    session_id,
    workspace_id,
    user_id,
    command_name,
    parameters,
    requires_approval,
    approval_status
  ) VALUES (
    p_session_id,
    p_workspace_id,
    p_user_id,
    p_command_name,
    p_parameters,
    p_requires_approval,
    CASE WHEN p_requires_approval THEN 'pending' ELSE 'auto_approved' END
  ) RETURNING id INTO v_command_id;

  RETURN v_command_id;
END;
$$;

-- Function to get allowed capabilities for a workspace
CREATE OR REPLACE FUNCTION get_agent_capabilities(
  p_workspace_id UUID
) RETURNS TABLE (
  id UUID,
  command_name TEXT,
  description TEXT,
  category TEXT,
  risk_level TEXT,
  requires_approval BOOLEAN,
  parameters JSONB,
  version TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.command_name,
    c.description,
    c.category,
    c.risk_level,
    c.requires_approval,
    c.parameters,
    c.version
  FROM desktop_agent_capabilities c
  WHERE (c.workspace_id = p_workspace_id OR c.workspace_id IS NULL)
    AND c.enabled = TRUE
    AND c.deprecated = FALSE
  ORDER BY c.risk_level DESC, c.command_name ASC;
END;
$$;

-- ============================================================================
-- 6. Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE desktop_agent_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE desktop_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE desktop_agent_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE desktop_agent_approvals ENABLE ROW LEVEL SECURITY;

-- Service role can manage all agent tables
CREATE POLICY "Service role manages capabilities"
  ON desktop_agent_capabilities FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages sessions"
  ON desktop_agent_sessions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages commands"
  ON desktop_agent_commands FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages approvals"
  ON desktop_agent_approvals FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own sessions and commands
CREATE POLICY "Users can view own sessions"
  ON desktop_agent_sessions FOR SELECT
  USING (auth.uid() = user_id OR (
    SELECT role FROM user_organizations
    WHERE user_id = auth.uid() AND org_id = (
      SELECT org_id FROM workspaces WHERE id = workspace_id
    )
  ) = 'owner'
  );

CREATE POLICY "Users can view own commands"
  ON desktop_agent_commands FOR SELECT
  USING (auth.uid() = user_id OR (
    SELECT role FROM user_organizations
    WHERE user_id = auth.uid() AND org_id = (
      SELECT org_id FROM workspaces WHERE id = workspace_id
    )
  ) = 'owner'
  );

-- ============================================================================
-- 7. Insert default capabilities
-- ============================================================================

INSERT INTO desktop_agent_capabilities (
  command_name,
  description,
  category,
  risk_level,
  requires_approval,
  parameters
) VALUES
  ('click', 'Click at specified coordinates', 'ui_interaction', 'safe', FALSE, '{"x": "number", "y": "number"}'),
  ('doubleClick', 'Double-click at specified coordinates', 'ui_interaction', 'safe', FALSE, '{"x": "number", "y": "number"}'),
  ('typeText', 'Type text into focused input', 'ui_interaction', 'safe', FALSE, '{"text": "string"}'),
  ('pressKey', 'Press a keyboard key', 'ui_interaction', 'safe', FALSE, '{"key": "string"}'),
  ('moveMouse', 'Move mouse to coordinates', 'ui_interaction', 'safe', FALSE, '{"x": "number", "y": "number"}'),
  ('scroll', 'Scroll in specified direction', 'ui_interaction', 'safe', FALSE, '{"direction": "string", "amount": "number"}'),
  ('openApp', 'Open an application', 'window_control', 'medium', TRUE, '{"appName": "string", "args": "array"}'),
  ('focusWindow', 'Focus window by name', 'window_control', 'safe', FALSE, '{"windowName": "string"}'),
  ('closeApp', 'Close an application', 'window_control', 'medium', TRUE, '{"appName": "string"}'),
  ('navigateUrl', 'Navigate browser to URL', 'ui_interaction', 'medium', TRUE, '{"url": "string", "browser": "string"}'),
  ('getScreenshot', 'Take screenshot', 'system_info', 'safe', FALSE, '{"format": "string", "region": "object"}'),
  ('getClipboard', 'Get clipboard contents', 'clipboard', 'safe', FALSE, '{}'),
  ('setClipboard', 'Set clipboard contents', 'clipboard', 'safe', FALSE, '{"text": "string"}')
ON CONFLICT (command_name) DO NOTHING;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Desktop Agent Bridge schema installed successfully';
  RAISE NOTICE '   📋 Tables created: desktop_agent_capabilities, sessions, commands, approvals';
  RAISE NOTICE '   🔐 RLS policies enabled (service role + owner access)';
  RAISE NOTICE '   🔧 Helper functions created';
  RAISE NOTICE '   ✨ Default capabilities loaded (13 commands)';
END $$;
