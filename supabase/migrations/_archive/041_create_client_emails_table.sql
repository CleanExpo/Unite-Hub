-- Migration 041: Create client_emails table
-- Purpose: Store emails synced from Gmail/Outlook integrations
-- Dependencies: Requires workspaces, organizations, email_integrations, contacts tables

-- Create client_emails table
CREATE TABLE IF NOT EXISTS client_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES email_integrations(id) ON DELETE SET NULL,
  provider_message_id TEXT NOT NULL,
  from_email TEXT NOT NULL,
  to_emails TEXT[] DEFAULT '{}',
  subject TEXT,
  snippet TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  is_read BOOLEAN DEFAULT false,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, provider_message_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_emails_workspace_id ON client_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_org_id ON client_emails(org_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_contact_id ON client_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_integration_id ON client_emails(integration_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_received_at ON client_emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_emails_direction ON client_emails(direction);
CREATE INDEX IF NOT EXISTS idx_client_emails_is_read ON client_emails(is_read);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_client_emails_updated_at BEFORE UPDATE ON client_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE client_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view client_emails in their workspaces
CREATE POLICY "Users can view client_emails in their workspaces" ON client_emails
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Users can insert client_emails in their workspaces
CREATE POLICY "Users can insert client_emails in their workspaces" ON client_emails
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Users can update client_emails in their workspaces
CREATE POLICY "Users can update client_emails in their workspaces" ON client_emails
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON client_emails TO authenticated;

-- Verification query
-- SELECT COUNT(*) as client_emails_count FROM client_emails;
