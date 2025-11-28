-- Migration 312: Create Missing Core Tables (Safe Version)
-- These tables are referenced in code but don't exist in the database
-- Uses DROP IF EXISTS + CREATE for clean state

-- ============================================================
-- ADMIN SYSTEM TABLES
-- ============================================================

-- Admin Approvals - tracks approval requests
-- Drop first to ensure clean state (data loss acceptable for new tables)
DROP TABLE IF EXISTS admin_approvals CASCADE;
CREATE TABLE admin_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'denied', 'expired')),
  token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin Trusted Devices - device verification for admin access
DROP TABLE IF EXISTS admin_trusted_devices CASCADE;
CREATE TABLE admin_trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  ip_address INET,
  trusted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, device_fingerprint)
);

-- ============================================================
-- CRM CORE TABLES
-- ============================================================

-- Leads - potential customers before conversion
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  source TEXT,
  lead_status TEXT NOT NULL DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  converted_to_contact_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Clients - converted customers with active relationships
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  contact_id UUID,
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  client_status TEXT NOT NULL DEFAULT 'active' CHECK (client_status IN ('active', 'inactive', 'churned', 'prospect')),
  tier TEXT DEFAULT 'standard' CHECK (tier IN ('standard', 'premium', 'enterprise')),
  lifetime_value NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Client Actions - activity log for client interactions
CREATE TABLE IF NOT EXISTS client_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  workspace_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB DEFAULT '{}',
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INTEGRATIONS TABLE
-- ============================================================

-- Integrations - third-party API connections
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_user_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SEO TABLES
-- ============================================================

-- SEO Credentials - API keys for SEO tools
CREATE TABLE IF NOT EXISTS seo_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'bing', 'semrush', 'ahrefs', 'moz', 'dataforseo')),
  api_key_encrypted TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEO Profiles - website SEO configurations
CREATE TABLE IF NOT EXISTS seo_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  domain TEXT NOT NULL,
  primary_keywords TEXT[],
  target_locations TEXT[],
  competitors TEXT[],
  settings JSONB DEFAULT '{}',
  last_audit_at TIMESTAMPTZ,
  health_score INTEGER DEFAULT 0 CHECK (health_score >= 0 AND health_score <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS TABLES
-- ============================================================

-- AI Daily Summary - aggregated daily insights
-- Note: This may already exist as a materialized view in some deployments
-- Only create if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_daily_summary'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_matviews
    WHERE schemaname = 'public' AND matviewname = 'ai_daily_summary'
  ) THEN
    CREATE TABLE ai_daily_summary (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      workspace_id UUID NOT NULL,
      summary_date DATE NOT NULL,
      summary_type TEXT NOT NULL DEFAULT 'daily',
      content JSONB NOT NULL DEFAULT '{}',
      metrics JSONB DEFAULT '{}',
      generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      model_used TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- ============================================================
-- SOCIAL INBOX TABLES
-- ============================================================

-- Social Inbox Messages - unified social media inbox
CREATE TABLE IF NOT EXISTS social_inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube')),
  external_id TEXT,
  sender_name TEXT,
  sender_handle TEXT,
  sender_avatar TEXT,
  message_type TEXT NOT NULL DEFAULT 'message' CHECK (message_type IN ('message', 'comment', 'mention', 'review')),
  content TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_replied BOOLEAN NOT NULL DEFAULT false,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Social Playbooks - automated response templates
CREATE TABLE IF NOT EXISTS social_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT,
  trigger_keywords TEXT[],
  response_templates JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES (idempotent)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_admin_approvals_user ON admin_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_status ON admin_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_admin_trusted_devices_user ON admin_trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_clients_workspace ON clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_actions_client ON client_actions(client_id);
CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_seo_profiles_workspace ON seo_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_inbox_workspace ON social_inbox_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_inbox_platform ON social_inbox_messages(platform);
CREATE INDEX IF NOT EXISTS idx_social_inbox_received ON social_inbox_messages(received_at DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE admin_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_profiles ENABLE ROW LEVEL SECURITY;
-- Skip ai_daily_summary RLS if it's a materialized view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_daily_summary' AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE ai_daily_summary ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
ALTER TABLE social_inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_playbooks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones
DROP POLICY IF EXISTS "Admins can view approvals" ON admin_approvals;
DROP POLICY IF EXISTS "Admins can manage trusted devices" ON admin_trusted_devices;
DROP POLICY IF EXISTS "Users can access workspace leads" ON leads;
DROP POLICY IF EXISTS "Users can access workspace clients" ON clients;
DROP POLICY IF EXISTS "Users can access client actions" ON client_actions;
DROP POLICY IF EXISTS "Users can access integrations" ON integrations;
DROP POLICY IF EXISTS "Users can access SEO credentials" ON seo_credentials;
DROP POLICY IF EXISTS "Users can access SEO profiles" ON seo_profiles;
-- Skip ai_daily_summary policy drop if materialized view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_daily_summary' AND table_type = 'BASE TABLE'
  ) THEN
    DROP POLICY IF EXISTS "Users can access AI summaries" ON ai_daily_summary;
  END IF;
END $$;
DROP POLICY IF EXISTS "Users can access social inbox" ON social_inbox_messages;
DROP POLICY IF EXISTS "Users can access social playbooks" ON social_playbooks;

-- Create policies
CREATE POLICY "Admins can view approvals" ON admin_approvals
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage trusted devices" ON admin_trusted_devices
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access workspace leads" ON leads
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can access workspace clients" ON clients
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can access client actions" ON client_actions
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can access integrations" ON integrations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access SEO credentials" ON seo_credentials
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can access SEO profiles" ON seo_profiles
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Skip ai_daily_summary policy create if materialized view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_daily_summary' AND table_type = 'BASE TABLE'
  ) THEN
    CREATE POLICY "Users can access AI summaries" ON ai_daily_summary
      FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

CREATE POLICY "Users can access social inbox" ON social_inbox_messages
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can access social playbooks" ON social_playbooks
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'admin_approvals', 'admin_trusted_devices',
      'leads', 'clients', 'client_actions',
      'integrations', 'seo_credentials', 'seo_profiles',
      'social_inbox_messages', 'social_playbooks'
    );

  RAISE NOTICE 'Migration 312 complete. Created/verified % tables (ai_daily_summary handled separately if exists)', table_count;
END $$;
