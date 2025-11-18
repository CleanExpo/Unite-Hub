-- =====================================================
-- Migration 038: Create Tables One Constraint at a Time
-- =====================================================

-- Create projects table without FK constraints
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  client_contact_id UUID,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12, 2),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK constraints ONE AT A TIME
ALTER TABLE projects ADD CONSTRAINT fk_projects_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE projects ADD CONSTRAINT fk_projects_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE projects ADD CONSTRAINT fk_projects_contact FOREIGN KEY (client_contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE projects ADD CONSTRAINT fk_projects_user FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Disable RLS, add indexes, grant permissions
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;

-- email_integrations
CREATE TABLE IF NOT EXISTS email_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'smtp')),
  email_address TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE email_integrations ADD CONSTRAINT fk_email_integrations_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE email_integrations ADD CONSTRAINT fk_email_integrations_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE email_integrations ADD CONSTRAINT fk_email_integrations_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE email_integrations ADD CONSTRAINT unique_workspace_email UNIQUE(workspace_id, email_address);

ALTER TABLE email_integrations DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_email_integrations_workspace_id ON email_integrations(workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON email_integrations TO authenticated;

-- sent_emails
CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  org_id UUID NOT NULL,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  contact_id UUID,
  campaign_id UUID,
  integration_id UUID,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sent_emails ADD CONSTRAINT fk_sent_emails_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE sent_emails ADD CONSTRAINT fk_sent_emails_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE sent_emails ADD CONSTRAINT fk_sent_emails_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE sent_emails ADD CONSTRAINT fk_sent_emails_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE sent_emails ADD CONSTRAINT fk_sent_emails_integration FOREIGN KEY (integration_id) REFERENCES email_integrations(id) ON DELETE SET NULL;

ALTER TABLE sent_emails DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sent_emails_workspace_id ON sent_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_contact_id ON sent_emails(contact_id);
GRANT SELECT, INSERT, UPDATE ON sent_emails TO authenticated;

-- client_emails
CREATE TABLE IF NOT EXISTS client_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  org_id UUID NOT NULL,
  integration_id UUID,
  provider_message_id TEXT NOT NULL,
  from_email TEXT NOT NULL,
  to_emails TEXT[] DEFAULT '{}',
  subject TEXT,
  snippet TEXT,
  contact_id UUID,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  is_read BOOLEAN DEFAULT false,
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE client_emails ADD CONSTRAINT fk_client_emails_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE client_emails ADD CONSTRAINT fk_client_emails_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE client_emails ADD CONSTRAINT fk_client_emails_integration FOREIGN KEY (integration_id) REFERENCES email_integrations(id) ON DELETE SET NULL;
ALTER TABLE client_emails ADD CONSTRAINT fk_client_emails_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
ALTER TABLE client_emails ADD CONSTRAINT unique_workspace_message UNIQUE(workspace_id, provider_message_id);

ALTER TABLE client_emails DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_client_emails_workspace_id ON client_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_contact_id ON client_emails(contact_id);
GRANT SELECT, INSERT, UPDATE ON client_emails TO authenticated;

-- Verification
SELECT 'SUCCESS: 4 new tables created (projects, email_integrations, sent_emails, client_emails)' AS result;
