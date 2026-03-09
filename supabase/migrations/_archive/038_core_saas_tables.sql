-- =====================================================
-- CORE SAAS TABLES - Phase 1 Emergency Stabilization
-- =====================================================
-- Purpose: Create missing core tables that are referenced in 10+ files
-- Date: 2025-01-18
-- Version: 1.0
-- Mode: ADDITIVE - Idempotent migration
-- Priority: P0 - SYSTEM BREAKING
-- =====================================================
-- Tables created:
-- 1. subscriptions (21 files depend on this)
-- 2. email_integrations (14 files depend on this)
-- 3. sent_emails (11 files depend on this)
-- 4. user_onboarding (11 files depend on this)
-- 5. client_emails (12 files depend on this)
-- 6. projects (referenced by media_files, mindmap features)
-- =====================================================

-- =====================================================
-- TABLE 1: projects
-- =====================================================
-- Required by: media_files, project_mindmaps, project_assignees
-- Purpose: Project management for client work

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Project Info
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),

  -- Client association
  client_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Metadata
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12, 2),
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_contact_id ON projects(client_contact_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view projects in their workspace" ON projects;
CREATE POLICY "Users can view projects in their workspace"
  ON projects FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create projects in their workspace" ON projects;
CREATE POLICY "Users can create projects in their workspace"
  ON projects FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update projects in their workspace" ON projects;
CREATE POLICY "Users can update projects in their workspace"
  ON projects FOR UPDATE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete projects in their workspace" ON projects;
CREATE POLICY "Users can delete projects in their workspace"
  ON projects FOR DELETE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- =====================================================
-- TABLE 2: subscriptions
-- =====================================================
-- Used in: 21 files
-- Purpose: Billing and subscription management (Stripe integration)

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe Data
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  stripe_product_id TEXT,

  -- Subscription Info
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise', 'custom')),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid')),

  -- Billing Cycle
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- RLS Policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org owners can view their subscription" ON subscriptions;
CREATE POLICY "Org owners can view their subscription"
  ON subscriptions FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org owners can update their subscription" ON subscriptions;
CREATE POLICY "Org owners can update their subscription"
  ON subscriptions FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- =====================================================
-- TABLE 3: email_integrations
-- =====================================================
-- Used in: 14 files
-- Purpose: Gmail/Outlook OAuth integrations per workspace

CREATE TABLE IF NOT EXISTS email_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Integration Type
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'smtp')),
  email_address TEXT NOT NULL,

  -- OAuth Tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- SMTP Config (if provider = 'smtp')
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT, -- Should be encrypted

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,

  -- Metadata
  scopes TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one integration per email per workspace
  UNIQUE(workspace_id, email_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_integrations_workspace_id ON email_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_integrations_org_id ON email_integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_email_integrations_user_id ON email_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_email_integrations_provider ON email_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_email_integrations_status ON email_integrations(status);

-- RLS Policies
ALTER TABLE email_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view integrations in their workspace" ON email_integrations;
CREATE POLICY "Users can view integrations in their workspace"
  ON email_integrations FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create integrations in their workspace" ON email_integrations;
CREATE POLICY "Users can create integrations in their workspace"
  ON email_integrations FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own integrations" ON email_integrations;
CREATE POLICY "Users can update their own integrations"
  ON email_integrations FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own integrations" ON email_integrations;
CREATE POLICY "Users can delete their own integrations"
  ON email_integrations FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- TABLE 4: sent_emails
-- =====================================================
-- Used in: 11 files
-- Purpose: Track all emails sent through the platform

CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Email Details
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  cc_emails TEXT[] DEFAULT '{}',
  bcc_emails TEXT[] DEFAULT '{}',
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,

  -- Associations
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  drip_campaign_id UUID REFERENCES drip_campaigns(id) ON DELETE SET NULL,
  integration_id UUID REFERENCES email_integrations(id) ON DELETE SET NULL,

  -- Sending Status
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Provider Info
  provider_message_id TEXT, -- Gmail Message-ID, etc.
  provider_thread_id TEXT,

  -- Tracking
  opened_at TIMESTAMPTZ,
  open_count INTEGER DEFAULT 0,
  clicked_at TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  replied_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sent_emails_workspace_id ON sent_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_org_id ON sent_emails(org_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_contact_id ON sent_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_campaign_id ON sent_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_drip_campaign_id ON sent_emails(drip_campaign_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_status ON sent_emails(status);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON sent_emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_sent_emails_to_email ON sent_emails(to_email);

-- RLS Policies
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sent emails in their workspace" ON sent_emails;
CREATE POLICY "Users can view sent emails in their workspace"
  ON sent_emails FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create sent emails in their workspace" ON sent_emails;
CREATE POLICY "Users can create sent emails in their workspace"
  ON sent_emails FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update sent emails in their workspace" ON sent_emails;
CREATE POLICY "Users can update sent emails in their workspace"
  ON sent_emails FOR UPDATE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- =====================================================
-- TABLE 5: user_onboarding
-- =====================================================
-- Used in: 11 files
-- Purpose: Track user onboarding progress and completion

CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Onboarding Steps
  completed_profile BOOLEAN DEFAULT false,
  completed_workspace_setup BOOLEAN DEFAULT false,
  completed_gmail_integration BOOLEAN DEFAULT false,
  completed_first_contact BOOLEAN DEFAULT false,
  completed_first_campaign BOOLEAN DEFAULT false,

  -- Step Timestamps
  profile_completed_at TIMESTAMPTZ,
  workspace_setup_completed_at TIMESTAMPTZ,
  gmail_integration_completed_at TIMESTAMPTZ,
  first_contact_completed_at TIMESTAMPTZ,
  first_campaign_completed_at TIMESTAMPTZ,

  -- Overall Status
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  onboarding_skipped BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One onboarding per user per org
  UNIQUE(user_id, org_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_org_id ON user_onboarding(org_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(onboarding_completed);

-- RLS Policies
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own onboarding" ON user_onboarding;
CREATE POLICY "Users can view their own onboarding"
  ON user_onboarding FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own onboarding" ON user_onboarding;
CREATE POLICY "Users can create their own onboarding"
  ON user_onboarding FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own onboarding" ON user_onboarding;
CREATE POLICY "Users can update their own onboarding"
  ON user_onboarding FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- TABLE 6: client_emails
-- =====================================================
-- Used in: 12 files
-- Purpose: Store emails received from/sent to clients (Gmail sync)

CREATE TABLE IF NOT EXISTS client_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Email Source
  integration_id UUID REFERENCES email_integrations(id) ON DELETE SET NULL,
  provider_message_id TEXT NOT NULL, -- Gmail Message-ID
  provider_thread_id TEXT,

  -- Email Details
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] NOT NULL DEFAULT '{}',
  cc_emails TEXT[] DEFAULT '{}',
  bcc_emails TEXT[] DEFAULT '{}',
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  snippet TEXT, -- First 200 chars

  -- Associations
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Email Metadata
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  labels TEXT[] DEFAULT '{}',

  -- AI Processing
  ai_processed BOOLEAN DEFAULT false,
  ai_intent TEXT, -- Extracted intent
  ai_sentiment TEXT CHECK (ai_sentiment IN ('positive', 'neutral', 'negative')),
  ai_summary TEXT,
  ai_processed_at TIMESTAMPTZ,

  -- Timestamps
  received_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique provider message per workspace
  UNIQUE(workspace_id, provider_message_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_emails_workspace_id ON client_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_org_id ON client_emails(org_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_contact_id ON client_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_integration_id ON client_emails(integration_id);
CREATE INDEX IF NOT EXISTS idx_client_emails_direction ON client_emails(direction);
CREATE INDEX IF NOT EXISTS idx_client_emails_received_at ON client_emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_emails_from_email ON client_emails(from_email);
CREATE INDEX IF NOT EXISTS idx_client_emails_provider_thread_id ON client_emails(provider_thread_id);

-- RLS Policies
ALTER TABLE client_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view emails in their workspace" ON client_emails;
CREATE POLICY "Users can view emails in their workspace"
  ON client_emails FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create emails in their workspace" ON client_emails;
CREATE POLICY "Users can create emails in their workspace"
  ON client_emails FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update emails in their workspace" ON client_emails;
CREATE POLICY "Users can update emails in their workspace"
  ON client_emails FOR UPDATE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE ON subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON sent_emails TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_onboarding TO authenticated;
GRANT SELECT, INSERT, UPDATE ON client_emails TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify all tables exist
DO $$
BEGIN
  ASSERT (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') = 1,
    'projects table not created';
  ASSERT (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') = 1,
    'subscriptions table not created';
  ASSERT (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_integrations') = 1,
    'email_integrations table not created';
  ASSERT (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sent_emails') = 1,
    'sent_emails table not created';
  ASSERT (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_onboarding') = 1,
    'user_onboarding table not created';
  ASSERT (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_emails') = 1,
    'client_emails table not created';

  RAISE NOTICE '✅ Migration 038 complete: All 6 core tables created successfully';
END $$;
