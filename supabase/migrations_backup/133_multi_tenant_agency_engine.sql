-- Migration 133: Unified Multi-Tenant Agency Engine
-- Phase 90: Nucleus Mode - Full tenant isolation

-- ============================================================================
-- Table 1: agencies
-- Top-level tenant/agency container
-- ============================================================================

CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Identity
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,

  -- Hierarchy (franchise/white-label support)
  parent_agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,

  -- Status
  active BOOLEAN NOT NULL DEFAULT true,

  -- Settings
  settings JSONB NOT NULL DEFAULT '{
    "timezone": "UTC",
    "locale": "en-US",
    "branding": {},
    "features": {}
  }'::jsonb,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agencies_slug ON agencies(slug);
CREATE INDEX IF NOT EXISTS idx_agencies_parent ON agencies(parent_agency_id);
CREATE INDEX IF NOT EXISTS idx_agencies_active ON agencies(active);

-- ============================================================================
-- Table 2: agency_users
-- Role binding between users and agencies
-- ============================================================================

CREATE TABLE IF NOT EXISTS agency_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'client')),

  -- Permissions
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Unique constraint
  UNIQUE(agency_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agency_users_agency ON agency_users(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_users_user ON agency_users(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_users_role ON agency_users(role);

-- ============================================================================
-- Add tenant_id to existing tables
-- ============================================================================

-- Add tenant_id column to core tables (nullable initially for migration)
DO $$
BEGIN
  -- contacts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'tenant_id') THEN
    ALTER TABLE contacts ADD COLUMN tenant_id UUID REFERENCES agencies(id);
  END IF;

  -- early_warning_events
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'early_warning_events' AND column_name = 'tenant_id') THEN
    ALTER TABLE early_warning_events ADD COLUMN tenant_id UUID REFERENCES agencies(id);
  END IF;

  -- performance_reality_snapshots
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_reality_snapshots' AND column_name = 'tenant_id') THEN
    ALTER TABLE performance_reality_snapshots ADD COLUMN tenant_id UUID REFERENCES agencies(id);
  END IF;

  -- scaling_health_snapshots
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scaling_health_snapshots' AND column_name = 'tenant_id') THEN
    ALTER TABLE scaling_health_snapshots ADD COLUMN tenant_id UUID REFERENCES agencies(id);
  END IF;

  -- founder_intel_snapshots
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'founder_intel_snapshots' AND column_name = 'tenant_id') THEN
    ALTER TABLE founder_intel_snapshots ADD COLUMN tenant_id UUID REFERENCES agencies(id);
  END IF;

  -- combat_rounds
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'combat_rounds' AND column_name = 'tenant_id') THEN
    ALTER TABLE combat_rounds ADD COLUMN tenant_id UUID REFERENCES agencies(id);
  END IF;

  -- autopilot_playbooks
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'autopilot_playbooks' AND column_name = 'tenant_id') THEN
    ALTER TABLE autopilot_playbooks ADD COLUMN tenant_id UUID REFERENCES agencies(id);
  END IF;

  -- autopilot_actions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'autopilot_actions' AND column_name = 'tenant_id') THEN
    ALTER TABLE autopilot_actions ADD COLUMN tenant_id UUID REFERENCES agencies(id);
  END IF;

  -- autopilot_preferences
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'autopilot_preferences' AND column_name = 'tenant_id') THEN
    ALTER TABLE autopilot_preferences ADD COLUMN tenant_id UUID REFERENCES agencies(id);
  END IF;

  -- vif_archive_entries (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vif_archive_entries') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vif_archive_entries' AND column_name = 'tenant_id') THEN
      ALTER TABLE vif_archive_entries ADD COLUMN tenant_id UUID REFERENCES agencies(id);
    END IF;
  END IF;

  -- posting_engine_posts (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posting_engine_posts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posting_engine_posts' AND column_name = 'tenant_id') THEN
      ALTER TABLE posting_engine_posts ADD COLUMN tenant_id UUID REFERENCES agencies(id);
    END IF;
  END IF;

  -- orchestration_schedules (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orchestration_schedules') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orchestration_schedules' AND column_name = 'tenant_id') THEN
      ALTER TABLE orchestration_schedules ADD COLUMN tenant_id UUID REFERENCES agencies(id);
    END IF;
  END IF;
END $$;

-- Create indexes for tenant_id on existing tables (conditionally)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'early_warning_events' AND column_name = 'tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_early_warning_tenant ON early_warning_events(tenant_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_reality_snapshots' AND column_name = 'tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_perf_reality_tenant ON performance_reality_snapshots(tenant_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'scaling_health_snapshots' AND column_name = 'tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_scaling_health_tenant ON scaling_health_snapshots(tenant_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'founder_intel_snapshots' AND column_name = 'tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_founder_intel_tenant ON founder_intel_snapshots(tenant_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'combat_rounds' AND column_name = 'tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_combat_rounds_tenant ON combat_rounds(tenant_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'autopilot_playbooks' AND column_name = 'tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_autopilot_playbooks_tenant ON autopilot_playbooks(tenant_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'autopilot_actions' AND column_name = 'tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_autopilot_actions_tenant ON autopilot_actions(tenant_id);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'autopilot_preferences' AND column_name = 'tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_autopilot_prefs_tenant ON autopilot_preferences(tenant_id);
  END IF;
END $$;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_users ENABLE ROW LEVEL SECURITY;

-- Agencies policies
CREATE POLICY "Users can view agencies they belong to" ON agencies
  FOR SELECT USING (
    id IN (
      SELECT agency_id FROM agency_users WHERE user_id = auth.uid()
    )
    OR
    parent_agency_id IN (
      SELECT agency_id FROM agency_users WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Owners can manage their agencies" ON agencies
  FOR ALL USING (
    id IN (
      SELECT agency_id FROM agency_users WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Agency users policies
CREATE POLICY "Users can view their own agency memberships" ON agency_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Agency owners can manage users" ON agency_users
  FOR ALL USING (
    agency_id IN (
      SELECT agency_id FROM agency_users WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get user's agencies with roles
CREATE OR REPLACE FUNCTION get_user_agencies(p_user_id UUID)
RETURNS TABLE (
  agency_id UUID,
  agency_name TEXT,
  agency_slug TEXT,
  role TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS agency_id,
    a.name AS agency_name,
    a.slug AS agency_slug,
    au.role,
    a.active AS is_active
  FROM agencies a
  JOIN agency_users au ON a.id = au.agency_id
  WHERE au.user_id = p_user_id
  ORDER BY a.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has access to tenant
CREATE OR REPLACE FUNCTION user_has_tenant_access(
  p_user_id UUID,
  p_tenant_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM agency_users
    WHERE user_id = p_user_id AND agency_id = p_tenant_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tenant hierarchy (for franchise support)
CREATE OR REPLACE FUNCTION get_tenant_hierarchy(p_tenant_id UUID)
RETURNS TABLE (
  agency_id UUID,
  agency_name TEXT,
  level INTEGER
) AS $$
WITH RECURSIVE hierarchy AS (
  SELECT id, name, 0 AS level
  FROM agencies
  WHERE id = p_tenant_id

  UNION ALL

  SELECT a.id, a.name, h.level + 1
  FROM agencies a
  JOIN hierarchy h ON a.parent_agency_id = h.id
)
SELECT id, name, level FROM hierarchy ORDER BY level;
$$ LANGUAGE sql;

-- Get tenant stats
CREATE OR REPLACE FUNCTION get_tenant_stats(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (
      SELECT COUNT(*) FROM agency_users WHERE agency_id = p_tenant_id
    ),
    'total_contacts', (
      SELECT COUNT(*) FROM contacts WHERE tenant_id = p_tenant_id
    ),
    'active_playbooks', (
      SELECT COUNT(*) FROM autopilot_playbooks
      WHERE tenant_id = p_tenant_id AND status = 'active'
    ),
    'sub_agencies', (
      SELECT COUNT(*) FROM agencies WHERE parent_agency_id = p_tenant_id
    )
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_agencies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_agencies_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE agencies IS 'Phase 90: Top-level tenant/agency containers';
COMMENT ON TABLE agency_users IS 'Phase 90: User-agency role bindings';
COMMENT ON COLUMN agencies.parent_agency_id IS 'Supports franchise/white-label hierarchy';
COMMENT ON COLUMN agency_users.role IS 'owner | manager | staff | client';
