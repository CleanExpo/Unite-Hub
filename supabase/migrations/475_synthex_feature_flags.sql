-- =====================================================================
-- Phase D46: Feature Flags & Rollout Control
-- =====================================================================
-- Tables: synthex_feature_flags, synthex_feature_flag_overrides, synthex_rollout_events
--
-- Purpose:
-- - Manage feature flag configurations with segment rules
-- - Override feature states for specific users, businesses, or tenants
-- - Track rollout events and changes over time
--
-- Key Concepts:
-- - Feature flags with default state and segment-based rules
-- - Scoped overrides (user/business/tenant level)
-- - Event log for rollout history and auditing
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08

-- =====================================================================
-- 1. Feature Flags Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS synthex_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,

  -- Feature identification
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,

  -- State & rules
  default_state boolean NOT NULL DEFAULT false,
  segment_rules jsonb, -- { "rules": [{ "type": "percentage", "value": 50 }, { "type": "user_ids", "value": ["uuid1", "uuid2"] }] }

  -- Metadata
  metadata jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. Feature Flag Overrides Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS synthex_feature_flag_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  feature_flag_id uuid NOT NULL REFERENCES synthex_feature_flags(id) ON DELETE CASCADE,

  -- Scope definition
  scope_type text NOT NULL, -- 'user' | 'business' | 'tenant' | 'segment'
  scope_ref text NOT NULL, -- UUID or segment identifier

  -- Override state
  state boolean NOT NULL,
  reason text,

  -- Metadata
  metadata jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),

  -- Unique constraint: one override per scope
  UNIQUE(feature_flag_id, scope_type, scope_ref)
);

-- =====================================================================
-- 3. Rollout Events Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS synthex_rollout_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  feature_flag_id uuid NOT NULL REFERENCES synthex_feature_flags(id) ON DELETE CASCADE,

  -- Event details
  event_type text NOT NULL, -- 'created' | 'enabled' | 'disabled' | 'override_added' | 'override_removed' | 'rules_updated'
  actor_user_id uuid, -- Who made the change
  description text,
  payload jsonb, -- Additional event data

  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 4. Indexes
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_synthex_feature_flags_tenant ON synthex_feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_feature_flags_key ON synthex_feature_flags(key);

CREATE INDEX IF NOT EXISTS idx_synthex_feature_flag_overrides_tenant ON synthex_feature_flag_overrides(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_feature_flag_overrides_lookup ON synthex_feature_flag_overrides(tenant_id, feature_flag_id, scope_type, scope_ref);

CREATE INDEX IF NOT EXISTS idx_synthex_rollout_events_tenant ON synthex_rollout_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_rollout_events_flag ON synthex_rollout_events(feature_flag_id, created_at DESC);

-- =====================================================================
-- 5. Row Level Security (RLS)
-- =====================================================================

ALTER TABLE synthex_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_feature_flag_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_rollout_events ENABLE ROW LEVEL SECURITY;

-- Feature Flags Policies
CREATE POLICY synthex_feature_flags_tenant_isolation ON synthex_feature_flags
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Feature Flag Overrides Policies
CREATE POLICY synthex_feature_flag_overrides_tenant_isolation ON synthex_feature_flag_overrides
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Rollout Events Policies
CREATE POLICY synthex_rollout_events_tenant_isolation ON synthex_rollout_events
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================================
-- 6. Helper Function: Evaluate Feature Flag
-- =====================================================================

CREATE OR REPLACE FUNCTION synthex_evaluate_feature_flag(
  p_flag_key text,
  p_tenant_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_business_id uuid DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  v_flag_id uuid;
  v_default_state boolean;
  v_override_state boolean;
BEGIN
  -- Get flag ID and default state
  SELECT id, default_state INTO v_flag_id, v_default_state
  FROM synthex_feature_flags
  WHERE key = p_flag_key AND tenant_id = p_tenant_id;

  IF v_flag_id IS NULL THEN
    RETURN false; -- Flag doesn't exist
  END IF;

  -- Check for user-level override
  IF p_user_id IS NOT NULL THEN
    SELECT state INTO v_override_state
    FROM synthex_feature_flag_overrides
    WHERE feature_flag_id = v_flag_id
      AND scope_type = 'user'
      AND scope_ref = p_user_id::text
    LIMIT 1;

    IF FOUND THEN
      RETURN v_override_state;
    END IF;
  END IF;

  -- Check for business-level override
  IF p_business_id IS NOT NULL THEN
    SELECT state INTO v_override_state
    FROM synthex_feature_flag_overrides
    WHERE feature_flag_id = v_flag_id
      AND scope_type = 'business'
      AND scope_ref = p_business_id::text
    LIMIT 1;

    IF FOUND THEN
      RETURN v_override_state;
    END IF;
  END IF;

  -- Check for tenant-level override
  SELECT state INTO v_override_state
  FROM synthex_feature_flag_overrides
  WHERE feature_flag_id = v_flag_id
    AND scope_type = 'tenant'
    AND scope_ref = p_tenant_id::text
  LIMIT 1;

  IF FOUND THEN
    RETURN v_override_state;
  END IF;

  -- Return default state
  RETURN v_default_state;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================================
-- 7. Seed Data: Common Feature Flags
-- =====================================================================

-- Note: Insert seed data with appropriate tenant_id in application code
-- Example seeds (commented out, tenant_id must be supplied):
-- INSERT INTO synthex_feature_flags (tenant_id, key, name, description, default_state) VALUES
--   ('TENANT_UUID', 'ai_content_generation', 'AI Content Generation', 'Enable AI-powered content generation features', false),
--   ('TENANT_UUID', 'advanced_analytics', 'Advanced Analytics', 'Enable advanced analytics dashboard', false),
--   ('TENANT_UUID', 'multi_channel_posting', 'Multi-Channel Posting', 'Enable posting to multiple social channels simultaneously', true);
