-- Migration 312: Create Missing Core Tables
-- DROP only truly new tables, IF NOT EXISTS for tables that may have dependencies

-- ============================================================
-- ADMIN TABLES (new, safe to drop)
-- ============================================================

DROP TABLE IF EXISTS admin_approvals CASCADE;
DROP TABLE IF EXISTS admin_trusted_devices CASCADE;

CREATE TABLE admin_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  -- Keep FK reference to auth.users (allowed in migrations)
approved_by UUID REFERENCES auth.users(id),
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'denied', 'expired')),
  token TEXT UNIQUE,
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "admin_approvals" ENABLE ROW LEVEL SECURITY;


CREATE TABLE admin_trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  user_agent TEXT,
  ip_address INET,
  trusted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "admin_trusted_devices" ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- CRM TABLES (use IF NOT EXISTS - may have data)
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  source TEXT,
  lead_status TEXT NOT NULL DEFAULT 'new',
  score INTEGER DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  converted_to_contact_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  contact_id UUID,
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  client_status TEXT NOT NULL DEFAULT 'active',
  tier TEXT DEFAULT 'standard',
  lifetime_value NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS client_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID,
  workspace_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_data JSONB DEFAULT '{}',
  -- Keep FK reference to auth.users (allowed in migrations)
performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INTEGRATIONS (use IF NOT EXISTS - Gmail uses this)
-- ============================================================

CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  -- Keep FK reference to auth.users (allowed in migrations)
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
-- SEO TABLES (use IF NOT EXISTS - have dependencies)
-- ============================================================

CREATE TABLE IF NOT EXISTS seo_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  provider TEXT NOT NULL,
  api_key_encrypted TEXT,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  domain TEXT NOT NULL,
  primary_keywords TEXT[],
  target_locations TEXT[],
  competitors TEXT[],
  settings JSONB DEFAULT '{}',
  last_audit_at TIMESTAMPTZ,
  health_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SOCIAL TABLES (use IF NOT EXISTS)
-- ============================================================

CREATE TABLE IF NOT EXISTS social_inbox_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  platform TEXT NOT NULL,
  external_id TEXT,
  sender_name TEXT,
  sender_handle TEXT,
  sender_avatar TEXT,
  message_type TEXT NOT NULL DEFAULT 'message',
  content TEXT,
  sentiment TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_replied BOOLEAN NOT NULL DEFAULT false,
  replied_at TIMESTAMPTZ,
  -- Keep FK reference to auth.users (allowed in migrations)
replied_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
-- INDEXES (use IF NOT EXISTS)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_admin_approvals_user ON admin_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_status ON admin_approvals(approval_status);
CREATE INDEX IF NOT EXISTS idx_admin_trusted_devices_user ON admin_trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_clients_workspace ON clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_actions_client ON client_actions(client_id);
CREATE INDEX IF NOT EXISTS idx_integrations_workspace ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_provider ON integrations(provider);
CREATE INDEX IF NOT EXISTS idx_seo_profiles_workspace ON seo_profiles(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_inbox_workspace ON social_inbox_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_inbox_platform ON social_inbox_messages(platform);
CREATE INDEX IF NOT EXISTS idx_social_inbox_received ON social_inbox_messages(received_at DESC);
