-- Phase 35: Integrity Framework
-- AI Event Timeline for full transparency

-- AI Event Log table
CREATE TABLE IF NOT EXISTS ai_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_used TEXT NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_event_log_client ON ai_event_log(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_event_log_model ON ai_event_log(model_used);
CREATE INDEX IF NOT EXISTS idx_ai_event_log_type ON ai_event_log(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_event_log_created ON ai_event_log(created_at DESC);

-- Enable RLS
ALTER TABLE ai_event_log ENABLE ROW LEVEL SECURITY;

-- RLS policies: clients can only view their own events
CREATE POLICY "clients_view_own_events" ON ai_event_log
FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND client_id = auth.uid());

-- Service role can insert events
CREATE POLICY "service_role_insert_events" ON ai_event_log
FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_all_events" ON ai_event_log
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON ai_event_log TO authenticated;
