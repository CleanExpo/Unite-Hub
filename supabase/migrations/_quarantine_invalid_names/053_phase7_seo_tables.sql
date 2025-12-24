-- Phase 7: Docker Multi-Tenant Architecture - Database Tables
-- Date: 2025-11-19
-- Purpose: SEO client profiles, audit history, storage audit, autonomy queue

-- ============================================================================
-- 1. SEO Client Profiles Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_client_profiles (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(org_id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  subscription_tier TEXT NOT NULL CHECK (subscription_tier IN ('Free', 'Starter', 'Pro', 'Enterprise')),
  geo_radius_km INTEGER NOT NULL CHECK (geo_radius_km IN (3, 5, 10, 15, 20, 25, 50)),
  geo_config JSONB DEFAULT '{}'::jsonb,
  owner_email TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seo_client_profiles_org ON seo_client_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_seo_client_profiles_domain ON seo_client_profiles(domain);
CREATE INDEX IF NOT EXISTS idx_seo_client_profiles_tier ON seo_client_profiles(subscription_tier);

-- ============================================================================
-- 2. SEO Audit History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_audit_history (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('full', 'snapshot', 'onboarding', 'geo')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  report_paths TEXT[],
  error_message TEXT,
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seo_audit_history_client ON seo_audit_history(client_id);
CREATE INDEX IF NOT EXISTS idx_seo_audit_history_type ON seo_audit_history(audit_type);
CREATE INDEX IF NOT EXISTS idx_seo_audit_history_status ON seo_audit_history(status);
CREATE INDEX IF NOT EXISTS idx_seo_audit_history_created ON seo_audit_history(created_at DESC);

-- ============================================================================
-- 3. Client Storage Audit Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS client_storage_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'provision', 'write', 'read', 'delete', 'archive',
    'folder_create', 'geo_radius_update', 'autonomy_queued',
    'credential_save', 'credential_retrieve'
  )),
  file_path TEXT,
  file_size_bytes BIGINT,
  storage_mb NUMERIC,
  archived_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_storage_audit_client ON client_storage_audit(client_id);
CREATE INDEX IF NOT EXISTS idx_client_storage_audit_action ON client_storage_audit(action);
CREATE INDEX IF NOT EXISTS idx_client_storage_audit_timestamp ON client_storage_audit(timestamp DESC);

-- ============================================================================
-- 4. Autonomy Queue Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS autonomy_queue (
  queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('onboarding', 'snapshot', 'geo', 'full_audit')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 5),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
  audit_id UUID REFERENCES seo_audit_history(audit_id),
  result JSONB,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_autonomy_queue_client ON autonomy_queue(client_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_queue_status ON autonomy_queue(status);
CREATE INDEX IF NOT EXISTS idx_autonomy_queue_priority ON autonomy_queue(priority, created_at);

-- ============================================================================
-- 5. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE seo_client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_audit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_storage_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_queue ENABLE ROW LEVEL SECURITY;

-- SEO Client Profiles Policies
CREATE POLICY "Users can view their organization's SEO clients"
  ON seo_client_profiles
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create SEO clients for their organization"
  ON seo_client_profiles
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's SEO clients"
  ON seo_client_profiles
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- SEO Audit History Policies
CREATE POLICY "Users can view audits for their organization's clients"
  ON seo_audit_history
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create audits for their organization's clients"
  ON seo_audit_history
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update audits for their organization's clients"
  ON seo_audit_history
  FOR UPDATE
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- Client Storage Audit Policies
CREATE POLICY "Users can view storage audit for their organization's clients"
  ON client_storage_audit
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create storage audit entries for their organization's clients"
  ON client_storage_audit
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- Autonomy Queue Policies
CREATE POLICY "Users can view autonomy queue for their organization's clients"
  ON autonomy_queue
  FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can queue tasks for their organization's clients"
  ON autonomy_queue
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update queue entries for their organization's clients"
  ON autonomy_queue
  FOR UPDATE
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- 6. Helper Functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_seo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_seo_client_profiles_updated_at
  BEFORE UPDATE ON seo_client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_updated_at();

-- ============================================================================
-- 7. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE seo_client_profiles IS 'Phase 7: Client profiles for SEO/GEO service with tier and radius configuration';
COMMENT ON TABLE seo_audit_history IS 'Phase 7: History of all SEO audits performed with health scores and report paths';
COMMENT ON TABLE client_storage_audit IS 'Phase 7: Audit trail for all Docker volume file operations';
COMMENT ON TABLE autonomy_queue IS 'Phase 7: Background task queue for autonomous SEO operations';

COMMENT ON COLUMN seo_client_profiles.geo_radius_km IS 'Service area radius in kilometers (3-50 km)';
COMMENT ON COLUMN seo_client_profiles.subscription_tier IS 'Free, Starter, Pro, or Enterprise tier';
COMMENT ON COLUMN seo_client_profiles.geo_config IS 'GEO configuration from questionnaire (primary address, service areas, etc.)';

COMMENT ON COLUMN client_storage_audit.action IS 'Type of storage operation performed';
COMMENT ON COLUMN client_storage_audit.storage_mb IS 'Storage usage in MB at time of operation';
COMMENT ON COLUMN client_storage_audit.metadata IS 'Additional context about the operation (JSON)';

COMMENT ON COLUMN autonomy_queue.priority IS 'Task priority 1 (highest) to 5 (lowest)';
COMMENT ON COLUMN autonomy_queue.task_type IS 'Type of autonomous task (onboarding, snapshot, geo, full_audit)';
