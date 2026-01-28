-- Migration 097: Concierge System
-- Required by Phase 45 - AI Concierge System (Unified UX Layer)
-- Chat sessions and action tracking for AI assistant

-- Concierge sessions table
CREATE TABLE IF NOT EXISTS concierge_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en-AU',
  session_context JSONB DEFAULT '{}'::jsonb,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT concierge_sessions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT concierge_sessions_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concierge_sessions_org ON concierge_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_concierge_sessions_user ON concierge_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_concierge_sessions_last_used ON concierge_sessions(last_used_at DESC);

-- Enable RLS
ALTER TABLE concierge_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY concierge_sessions_select ON concierge_sessions
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY concierge_sessions_insert ON concierge_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY concierge_sessions_update ON concierge_sessions
  FOR UPDATE TO authenticated
  USING (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- Comment
COMMENT ON TABLE concierge_sessions IS 'AI Concierge chat sessions per user (Phase 45)';

-- Concierge actions table
CREATE TABLE IF NOT EXISTS concierge_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  input_payload JSONB DEFAULT '{}'::jsonb,
  output_payload JSONB DEFAULT '{}'::jsonb,
  model_used TEXT NOT NULL,
  token_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Action type check
  CONSTRAINT concierge_actions_type_check CHECK (
    action_type IN (
      'chat',
      'voice',
      'automation',
      'insight',
      'report',
      'project_query',
      'billing_query',
      'task_execution'
    )
  ),

  -- Foreign key
  CONSTRAINT concierge_actions_session_fk
    FOREIGN KEY (session_id) REFERENCES concierge_sessions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_concierge_actions_session ON concierge_actions(session_id);
CREATE INDEX IF NOT EXISTS idx_concierge_actions_created ON concierge_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_concierge_actions_type ON concierge_actions(action_type);

-- Enable RLS
ALTER TABLE concierge_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via session ownership)
CREATE POLICY concierge_actions_select ON concierge_actions
  FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT id FROM concierge_sessions
    WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
      AND user_id = auth.uid()
  ));

CREATE POLICY concierge_actions_insert ON concierge_actions
  FOR INSERT TO authenticated
  WITH CHECK (session_id IN (
    SELECT id FROM concierge_sessions
    WHERE org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
      AND user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE concierge_actions IS 'Individual actions/messages in concierge sessions (Phase 45)';
