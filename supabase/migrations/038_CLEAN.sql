-- =====================================================
-- Migration 038: Core SaaS Tables (Syntax Verified)
-- =====================================================

-- TABLE 1: projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  client_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12, 2),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;

-- TABLE 2: subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise', 'custom')),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);

GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;

-- TABLE 3: email_integrations
CREATE TABLE IF NOT EXISTS email_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'smtp')),
  email_address TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, email_address)
);

CREATE INDEX IF NOT EXISTS idx_email_integrations_workspace_id ON email_integrations(workspace_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON email_integrations TO authenticated;

-- TABLE 4: sent_emails
CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  integration_id UUID REFERENCES email_integrations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sent_emails_workspace_id ON sent_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_contact_id ON sent_emails(contact_id);

GRANT SELECT, INSERT, UPDATE ON sent_emails TO authenticated;

-- TABLE 5: user_onboarding
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  completed_profile BOOLEAN DEFAULT false,
  completed_workspace_setup BOOLEAN DEFAULT false,
  completed_gmail_integration BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);

GRANT SELECT, INSERT, UPDATE ON user_onboarding TO authenticated;

-- TABLE 6: client_emails
CREATE TABLE IF NOT EXISTS client_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE INDEX IF NOT EXISTS idx_client_emails_workspace_id ON client_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_contact_id ON client_emails(contact_id);

GRANT SELECT, INSERT, UPDATE ON client_emails TO authenticated;

-- Verification
DO $$
DECLARE
  tables_created INTEGER;
BEGIN
  SELECT COUNT(*) INTO tables_created
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('projects', 'subscriptions', 'email_integrations', 'sent_emails', 'user_onboarding', 'client_emails');

  IF tables_created = 6 THEN
    RAISE NOTICE '✅ Migration 038 SUCCESS: All 6 core tables created';
  ELSE
    RAISE WARNING 'Only % of 6 tables were created', tables_created;
  END IF;
END $$;
