-- Custom Integrations Table (Elite Tier Feature)
-- Allows businesses to connect custom APIs and webhooks

CREATE TABLE IF NOT EXISTS custom_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Integration details
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('webhook', 'rest_api', 'oauth', 'custom')),

  -- Configuration (stored as JSONB for flexibility)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  last_executed TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  execution_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_integrations_workspace ON custom_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_custom_integrations_status ON custom_integrations(status);
CREATE INDEX IF NOT EXISTS idx_custom_integrations_type ON custom_integrations(type);

-- RLS Policies
ALTER TABLE custom_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON custom_integrations;
CREATE POLICY "tenant_isolation" ON custom_integrations
FOR ALL USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Only allow Elite tier workspaces to create integrations
DROP POLICY IF EXISTS "elite_tier_only" ON custom_integrations;
CREATE POLICY "elite_tier_only" ON custom_integrations
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT s.workspace_id FROM subscriptions s
    WHERE s.tier = 'elite' AND s.status = 'active'
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_custom_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_custom_integrations_updated_at ON custom_integrations;
CREATE TRIGGER trigger_custom_integrations_updated_at
  BEFORE UPDATE ON custom_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_integrations_updated_at();
