-- Migration 4275: Synthex Tenant Profiles (renumbered from 429 for dependency ordering)
-- Phase B23: Multi-Business Tenant Onboarding & Profiles
-- Purpose: Extended tenant profiles, team members, and settings management
-- Date: 2025-12-06

-- ============================================================================
-- SECTION 1: Tenant Profiles Table
-- Extended business profile information for each tenant
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_tenant_profiles (
  tenant_id UUID PRIMARY KEY REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Business Identity
  name TEXT NOT NULL, -- Display name (may differ from business_name)
  legal_name TEXT, -- Legal entity name for invoicing
  industry TEXT NOT NULL, -- Primary industry vertical
  region TEXT NOT NULL DEFAULT 'au', -- Primary operating region
  timezone TEXT NOT NULL DEFAULT 'Australia/Sydney', -- IANA timezone

  -- Branding
  default_domain TEXT, -- Primary domain for this tenant
  logo_url TEXT, -- URL to uploaded logo
  brand_tone TEXT, -- 'formal', 'casual', 'friendly', 'professional', 'playful'
  brand_voice TEXT, -- Description of brand voice (for AI content generation)

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_region CHECK (
    region IN ('au', 'nz', 'us', 'ca', 'uk', 'eu', 'asia', 'other')
  ),
  CONSTRAINT valid_brand_tone CHECK (
    brand_tone IN ('formal', 'casual', 'friendly', 'professional', 'playful', 'authoritative', 'conversational')
  )
);

DROP INDEX IF EXISTS idx_synthex_tenant_profiles_region;
DROP INDEX IF EXISTS idx_synthex_tenant_profiles_industry;
DROP INDEX IF EXISTS idx_synthex_tenant_profiles_created;
CREATE INDEX idx_synthex_tenant_profiles_region ON synthex_tenant_profiles(region);
CREATE INDEX idx_synthex_tenant_profiles_industry ON synthex_tenant_profiles(industry);
CREATE INDEX idx_synthex_tenant_profiles_created ON synthex_tenant_profiles(created_at DESC);

COMMENT ON TABLE synthex_tenant_profiles IS 'Extended profile information for Synthex tenants';
COMMENT ON COLUMN synthex_tenant_profiles.brand_voice IS 'Text description used by AI for content generation tone matching';

-- ============================================================================
-- SECTION 2: Tenant Members Table
-- Team member invitations and role management
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Member Identity
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL if not yet accepted
  invited_email TEXT NOT NULL, -- Email for invitation

  -- Access Control
  role TEXT NOT NULL DEFAULT 'viewer', -- 'owner', 'admin', 'editor', 'viewer'
  status TEXT NOT NULL DEFAULT 'invited', -- 'active', 'invited', 'disabled'

  -- Invitation Management
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (
    role IN ('owner', 'admin', 'editor', 'viewer')
  ),
  CONSTRAINT valid_status CHECK (
    status IN ('active', 'invited', 'disabled')
  ),
  CONSTRAINT unique_member_per_tenant UNIQUE(tenant_id, invited_email)
);

DROP INDEX IF EXISTS idx_synthex_tenant_members_tenant;
DROP INDEX IF EXISTS idx_synthex_tenant_members_user;
DROP INDEX IF EXISTS idx_synthex_tenant_members_status;
DROP INDEX IF EXISTS idx_synthex_tenant_members_role;
DROP INDEX IF EXISTS idx_synthex_tenant_members_invited_email;
CREATE INDEX idx_synthex_tenant_members_tenant ON synthex_tenant_members(tenant_id);
CREATE INDEX idx_synthex_tenant_members_user ON synthex_tenant_members(user_id);
CREATE INDEX idx_synthex_tenant_members_status ON synthex_tenant_members(status);
CREATE INDEX idx_synthex_tenant_members_role ON synthex_tenant_members(role);
CREATE INDEX idx_synthex_tenant_members_invited_email ON synthex_tenant_members(invited_email);

COMMENT ON TABLE synthex_tenant_members IS 'Team members and invitation management for Synthex tenants';
COMMENT ON COLUMN synthex_tenant_members.user_id IS 'NULL until invitation is accepted and user signs up';

-- ============================================================================
-- SECTION 3: Tenant Settings Table
-- Configurable settings and feature flags per tenant
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Default Settings (JSONB for flexibility)
  defaults JSONB NOT NULL DEFAULT '{
    "email_from_name": null,
    "email_reply_to": null,
    "default_timezone": "Australia/Sydney",
    "default_currency": "AUD",
    "locale": "en-AU"
  }'::jsonb,

  -- Feature Flags (JSONB for easy feature toggling)
  feature_flags JSONB NOT NULL DEFAULT '{
    "ai_content_enabled": true,
    "multi_channel_enabled": false,
    "advanced_analytics_enabled": false,
    "api_access_enabled": false,
    "white_label_enabled": false,
    "custom_domain_enabled": false
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_synthex_tenant_settings_created;
CREATE INDEX idx_synthex_tenant_settings_created ON synthex_tenant_settings(created_at DESC);

COMMENT ON TABLE synthex_tenant_settings IS 'Per-tenant configuration settings and feature flags';
COMMENT ON COLUMN synthex_tenant_settings.defaults IS 'Default values for campaigns, emails, etc.';
COMMENT ON COLUMN synthex_tenant_settings.feature_flags IS 'Toggle features on/off based on plan or beta access';

-- ============================================================================
-- SECTION 4: Helper Functions
-- Functions for profile and member management
-- ============================================================================

-- Function: Get tenant profile with fallback to synthex_tenants
CREATE OR REPLACE FUNCTION public.get_tenant_profile(tenant_id_param UUID)
RETURNS TABLE (
  tenant_id UUID,
  name TEXT,
  legal_name TEXT,
  industry TEXT,
  region TEXT,
  timezone TEXT,
  default_domain TEXT,
  logo_url TEXT,
  brand_tone TEXT,
  brand_voice TEXT,
  business_name TEXT,
  website_url TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS tenant_id,
    COALESCE(tp.name, t.business_name) AS name,
    tp.legal_name,
    COALESCE(tp.industry, t.industry) AS industry,
    COALESCE(tp.region, t.region) AS region,
    COALESCE(tp.timezone, 'Australia/Sydney') AS timezone,
    tp.default_domain,
    tp.logo_url,
    tp.brand_tone,
    tp.brand_voice,
    t.business_name,
    t.website_url,
    t.status
  FROM synthex_tenants t
  LEFT JOIN synthex_tenant_profiles tp ON t.id = tp.tenant_id
  WHERE t.id = tenant_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Check if user is member of tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(tenant_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_member BOOLEAN;
BEGIN
  -- Check if user is owner
  SELECT EXISTS(
    SELECT 1 FROM synthex_tenants
    WHERE id = tenant_id_param
    AND owner_user_id = user_id_param
  ) INTO is_member;

  IF is_member THEN
    RETURN true;
  END IF;

  -- Check if user is in members table with active status
  SELECT EXISTS(
    SELECT 1 FROM synthex_tenant_members
    WHERE tenant_id = tenant_id_param
    AND user_id = user_id_param
    AND status = 'active'
  ) INTO is_member;

  RETURN is_member;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Get member role
CREATE OR REPLACE FUNCTION public.get_tenant_member_role(tenant_id_param UUID, user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  member_role TEXT;
BEGIN
  -- Check if user is owner
  SELECT 'owner' INTO member_role
  FROM synthex_tenants
  WHERE id = tenant_id_param
  AND owner_user_id = user_id_param;

  IF member_role IS NOT NULL THEN
    RETURN member_role;
  END IF;

  -- Get role from members table
  SELECT role INTO member_role
  FROM synthex_tenant_members
  WHERE tenant_id = tenant_id_param
  AND user_id = user_id_param
  AND status = 'active';

  RETURN COALESCE(member_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_tenant_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tenant_member_role(UUID, UUID) TO authenticated;

-- ============================================================================
-- SECTION 5: Row Level Security (RLS) Policies
-- Secure access to profile, member, and settings tables
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE synthex_tenant_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_tenant_settings ENABLE ROW LEVEL SECURITY;

-- Tenant Profiles Policies
DROP POLICY IF EXISTS "tenant_profiles_select" ON synthex_tenant_profiles;
DROP POLICY IF EXISTS "tenant_profiles_insert" ON synthex_tenant_profiles;
DROP POLICY IF EXISTS "tenant_profiles_update" ON synthex_tenant_profiles;
CREATE POLICY "tenant_profiles_select" ON synthex_tenant_profiles
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
    OR public.is_tenant_member(tenant_id, auth.uid())
  );

CREATE POLICY "tenant_profiles_insert" ON synthex_tenant_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_profiles_update" ON synthex_tenant_profiles
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
    OR (
      public.is_tenant_member(tenant_id, auth.uid())
      AND public.get_tenant_member_role(tenant_id, auth.uid()) IN ('admin', 'editor')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
    OR (
      public.is_tenant_member(tenant_id, auth.uid())
      AND public.get_tenant_member_role(tenant_id, auth.uid()) IN ('admin', 'editor')
    )
  );

-- Tenant Members Policies
DROP POLICY IF EXISTS "tenant_members_select" ON synthex_tenant_members;
DROP POLICY IF EXISTS "tenant_members_insert" ON synthex_tenant_members;
DROP POLICY IF EXISTS "tenant_members_update" ON synthex_tenant_members;
DROP POLICY IF EXISTS "tenant_members_delete" ON synthex_tenant_members;
CREATE POLICY "tenant_members_select" ON synthex_tenant_members
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
    OR public.is_tenant_member(tenant_id, auth.uid())
  );

CREATE POLICY "tenant_members_insert" ON synthex_tenant_members
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
    OR (
      public.is_tenant_member(tenant_id, auth.uid())
      AND public.get_tenant_member_role(tenant_id, auth.uid()) IN ('admin')
    )
  );

CREATE POLICY "tenant_members_update" ON synthex_tenant_members
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
    OR (
      public.is_tenant_member(tenant_id, auth.uid())
      AND public.get_tenant_member_role(tenant_id, auth.uid()) IN ('admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
    OR (
      public.is_tenant_member(tenant_id, auth.uid())
      AND public.get_tenant_member_role(tenant_id, auth.uid()) IN ('admin')
    )
  );

CREATE POLICY "tenant_members_delete" ON synthex_tenant_members
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
    OR (
      public.is_tenant_member(tenant_id, auth.uid())
      AND public.get_tenant_member_role(tenant_id, auth.uid()) IN ('admin')
    )
  );

-- Tenant Settings Policies
DROP POLICY IF EXISTS "tenant_settings_select" ON synthex_tenant_settings;
DROP POLICY IF EXISTS "tenant_settings_insert" ON synthex_tenant_settings;
DROP POLICY IF EXISTS "tenant_settings_update" ON synthex_tenant_settings;
CREATE POLICY "tenant_settings_select" ON synthex_tenant_settings
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
    OR public.is_tenant_member(tenant_id, auth.uid())
  );

CREATE POLICY "tenant_settings_insert" ON synthex_tenant_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_settings_update" ON synthex_tenant_settings
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
    OR (
      public.is_tenant_member(tenant_id, auth.uid())
      AND public.get_tenant_member_role(tenant_id, auth.uid()) IN ('admin')
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
    OR (
      public.is_tenant_member(tenant_id, auth.uid())
      AND public.get_tenant_member_role(tenant_id, auth.uid()) IN ('admin')
    )
  );

-- ============================================================================
-- SECTION 6: Triggers for updated_at
-- Automatically update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_tenant_profiles ON synthex_tenant_profiles;
DROP TRIGGER IF EXISTS set_updated_at_tenant_members ON synthex_tenant_members;
DROP TRIGGER IF EXISTS set_updated_at_tenant_settings ON synthex_tenant_settings;

CREATE TRIGGER set_updated_at_tenant_profiles
  BEFORE UPDATE ON synthex_tenant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_tenant_members
  BEFORE UPDATE ON synthex_tenant_members
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_tenant_settings
  BEFORE UPDATE ON synthex_tenant_settings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- Verification Queries
-- ============================================================================
/*
-- Check tenant profile
SELECT * FROM public.get_tenant_profile('your-tenant-id');

-- Check if user is member
SELECT public.is_tenant_member('tenant-id', 'user-id');

-- Get member role
SELECT public.get_tenant_member_role('tenant-id', 'user-id');

-- List all members for a tenant
SELECT * FROM synthex_tenant_members WHERE tenant_id = 'your-tenant-id';
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================
