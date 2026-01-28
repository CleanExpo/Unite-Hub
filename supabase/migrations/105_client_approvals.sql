-- Phase 35: Integrity Framework
-- Client Approvals Pipeline

-- Client Approvals table
CREATE TABLE IF NOT EXISTS client_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  model_used TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_approvals_client ON client_approvals(client_id);
CREATE INDEX IF NOT EXISTS idx_client_approvals_status ON client_approvals(status);
CREATE INDEX IF NOT EXISTS idx_client_approvals_item ON client_approvals(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_client_approvals_generated ON client_approvals(generated_at DESC);

-- Enable RLS
ALTER TABLE client_approvals ENABLE ROW LEVEL SECURITY;

-- RLS policies: clients can only access their own approvals
CREATE POLICY "clients_view_own_approvals" ON client_approvals
FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND client_id = auth.uid());

CREATE POLICY "clients_update_own_approvals" ON client_approvals
FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND client_id = auth.uid());

-- Service role can insert (for AI-generated content)
CREATE POLICY "service_role_insert_approvals" ON client_approvals
FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_all_approvals" ON client_approvals
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON client_approvals TO authenticated;
