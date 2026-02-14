-- Migration 088: Client Chat
-- Required by Phase 33 - Client Portal AI Chatbot with Text + Voice
-- Track chat sessions and messages for client portal

-- Chat sessions table
CREATE TABLE IF NOT EXISTS client_chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  project_id UUID,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT client_chat_sessions_status_check CHECK (
    status IN ('open', 'closed', 'escalated')
  ),

  -- Foreign keys
  CONSTRAINT client_chat_sessions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT client_chat_sessions_user_fk
    -- Keep FK reference to auth.users (allowed in migrations)
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_chat_sessions_org_user
  ON client_chat_sessions(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_client_chat_sessions_status
  ON client_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_client_chat_sessions_created
  ON client_chat_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE client_chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY client_chat_sessions_select ON client_chat_sessions
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY client_chat_sessions_insert ON client_chat_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY client_chat_sessions_update ON client_chat_sessions
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- Trigger for updated_at
CREATE TRIGGER trg_client_chat_sessions_updated_at
  BEFORE UPDATE ON client_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE client_chat_sessions IS 'Track chat sessions per client user and project (Phase 33)';

-- Chat messages table
CREATE TABLE IF NOT EXISTS client_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  org_id UUID NOT NULL,
  sender_type TEXT NOT NULL,
  text TEXT NOT NULL,
  audio_path TEXT,
  language TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Sender type check
  CONSTRAINT client_chat_messages_sender_check CHECK (
    sender_type IN ('user', 'assistant', 'system')
  ),

  -- Foreign keys
  CONSTRAINT client_chat_messages_session_fk
    FOREIGN KEY (session_id) REFERENCES client_chat_sessions(id) ON DELETE CASCADE,
  CONSTRAINT client_chat_messages_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_chat_messages_session
  ON client_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_client_chat_messages_created
  ON client_chat_messages(created_at);

-- Enable RLS
ALTER TABLE client_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY client_chat_messages_select ON client_chat_messages
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY client_chat_messages_insert ON client_chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE client_chat_messages IS 'Store individual messages in chat sessions (Phase 33)';
