-- Migration 087: Voice Logs
-- Required by Phase 32 - ElevenLabs Voice Engine Integration
-- Track generated voice assets for audit and re-use

CREATE TABLE IF NOT EXISTS voice_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID,
  language TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  use_case TEXT NOT NULL,
  text_hash TEXT NOT NULL,
  audio_path TEXT NOT NULL,
  duration_seconds NUMERIC,
  created_by_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT voice_logs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT voice_logs_user_fk
    -- Keep FK reference to auth.users (allowed in migrations)
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_logs_org ON voice_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_logs_org_use_case ON voice_logs(org_id, use_case);
CREATE INDEX IF NOT EXISTS idx_voice_logs_text_hash ON voice_logs(text_hash);
CREATE INDEX IF NOT EXISTS idx_voice_logs_created ON voice_logs(created_at DESC);

-- Enable RLS
ALTER TABLE voice_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY voice_logs_select ON voice_logs
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY voice_logs_insert ON voice_logs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE voice_logs IS 'Track generated voice assets for audit and re-use (Phase 32)';
