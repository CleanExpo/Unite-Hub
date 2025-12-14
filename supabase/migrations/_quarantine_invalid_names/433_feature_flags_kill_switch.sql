-- Migration 433: Feature Flags & Kill-Switch Controls (Phase E18)
-- Safety controls for high-risk autonomous features
-- Note: Uses kill_switch_* tables to avoid conflict with E12 feature_flags (A/B testing)

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS kill_switch_overrides CASCADE;
DROP TABLE IF EXISTS kill_switch_flags CASCADE;

-- Feature flag categories
DO $$ BEGIN
  CREATE TYPE feature_flag_category AS ENUM (
    'delivery',
    'automation',
    'ai',
    'integrations',
    'experimental',
    'safety'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Kill Switch Flags table (global and tenant-specific flags)
CREATE TABLE kill_switch_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = global default
  key TEXT NOT NULL, -- e.g., 'autonomous_delivery', 'auto_posting'
  name TEXT NOT NULL,
  description TEXT,
  category feature_flag_category NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_kill_switch BOOLEAN NOT NULL DEFAULT FALSE, -- True for high-risk features
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX idx_kill_switch_flags_tenant ON kill_switch_flags(tenant_id);
CREATE INDEX idx_kill_switch_flags_key ON kill_switch_flags(key);
CREATE INDEX idx_kill_switch_flags_category ON kill_switch_flags(category);
CREATE INDEX idx_kill_switch_flags_enabled ON kill_switch_flags(enabled);
CREATE INDEX idx_kill_switch_flags_kill_switch ON kill_switch_flags(is_kill_switch);

-- Kill Switch Overrides table (tenant-level overrides)
CREATE TABLE kill_switch_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL,
  reason TEXT, -- Why override was applied
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Optional expiration for temporary overrides
  UNIQUE(tenant_id, flag_key)
);

CREATE INDEX idx_kill_switch_overrides_tenant ON kill_switch_overrides(tenant_id);
CREATE INDEX idx_kill_switch_overrides_flag_key ON kill_switch_overrides(flag_key);
CREATE INDEX idx_kill_switch_overrides_expires_at ON kill_switch_overrides(expires_at);

-- RLS for kill_switch_flags
ALTER TABLE kill_switch_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY kill_switch_flags_read_all ON kill_switch_flags
  FOR SELECT
  USING (tenant_id IS NULL OR tenant_id = auth.uid());

CREATE POLICY kill_switch_flags_admin_write ON kill_switch_flags
  FOR ALL
  USING (
    tenant_id = auth.uid() AND EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- RLS for kill_switch_overrides
ALTER TABLE kill_switch_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY kill_switch_overrides_read_own ON kill_switch_overrides
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY kill_switch_overrides_admin_write ON kill_switch_overrides
  FOR ALL
  USING (
    tenant_id = auth.uid() AND EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS check_feature_flag(UUID, TEXT);
DROP FUNCTION IF EXISTS enable_feature_flag(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS disable_feature_flag(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS set_feature_override(UUID, TEXT, BOOLEAN, TEXT, UUID, TIMESTAMPTZ);

-- Function: Check feature flag status
CREATE OR REPLACE FUNCTION check_feature_flag(
  p_tenant_id UUID,
  p_flag_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_override RECORD;
  v_flag RECORD;
  v_enabled BOOLEAN := FALSE;
BEGIN
  -- Check for expired overrides and delete them
  DELETE FROM kill_switch_overrides
  WHERE expires_at IS NOT NULL
    AND expires_at < now();

  -- Check for tenant-specific override first
  SELECT * INTO v_override
  FROM kill_switch_overrides
  WHERE tenant_id = p_tenant_id
    AND flag_key = p_flag_key
    AND (expires_at IS NULL OR expires_at > now());

  IF FOUND THEN
    RETURN v_override.enabled;
  END IF;

  -- Check tenant-specific flag
  SELECT * INTO v_flag
  FROM kill_switch_flags
  WHERE tenant_id = p_tenant_id
    AND key = p_flag_key;

  IF FOUND THEN
    RETURN v_flag.enabled;
  END IF;

  -- Fallback to global default
  SELECT * INTO v_flag
  FROM kill_switch_flags
  WHERE tenant_id IS NULL
    AND key = p_flag_key;

  IF FOUND THEN
    RETURN v_flag.enabled;
  END IF;

  -- Flag not found, default to disabled (fail-safe)
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Enable feature flag
CREATE OR REPLACE FUNCTION enable_feature_flag(
  p_tenant_id UUID,
  p_flag_key TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Update existing flag or insert new one
  INSERT INTO kill_switch_flags (tenant_id, key, name, category, enabled)
  VALUES (
    p_tenant_id,
    p_flag_key,
    p_flag_key,
    'experimental',
    TRUE
  )
  ON CONFLICT (tenant_id, key)
  DO UPDATE SET
    enabled = TRUE,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Disable feature flag (KILL-SWITCH)
CREATE OR REPLACE FUNCTION disable_feature_flag(
  p_tenant_id UUID,
  p_flag_key TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Update existing flag or insert new one
  INSERT INTO kill_switch_flags (tenant_id, key, name, category, enabled)
  VALUES (
    p_tenant_id,
    p_flag_key,
    p_flag_key,
    'safety',
    FALSE
  )
  ON CONFLICT (tenant_id, key)
  DO UPDATE SET
    enabled = FALSE,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Set tenant override (temporary or permanent)
CREATE OR REPLACE FUNCTION set_feature_override(
  p_tenant_id UUID,
  p_flag_key TEXT,
  p_enabled BOOLEAN,
  p_reason TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_override_id UUID;
BEGIN
  INSERT INTO kill_switch_overrides (
    tenant_id,
    flag_key,
    enabled,
    reason,
    created_by,
    expires_at
  ) VALUES (
    p_tenant_id,
    p_flag_key,
    p_enabled,
    p_reason,
    p_created_by,
    p_expires_at
  )
  ON CONFLICT (tenant_id, flag_key)
  DO UPDATE SET
    enabled = p_enabled,
    reason = p_reason,
    created_by = p_created_by,
    expires_at = p_expires_at,
    created_at = now()
  RETURNING id INTO v_override_id;

  RETURN v_override_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_feature_flag TO authenticated;
GRANT EXECUTE ON FUNCTION enable_feature_flag TO authenticated;
GRANT EXECUTE ON FUNCTION disable_feature_flag TO authenticated;
GRANT EXECUTE ON FUNCTION set_feature_override TO authenticated;

-- Seed default kill-switch flags (global, disabled by default for safety)
INSERT INTO kill_switch_flags (tenant_id, key, name, description, category, enabled, is_kill_switch, metadata)
VALUES
  -- Autonomous delivery features (HIGH RISK)
  (NULL, 'autonomous_delivery', 'Autonomous Delivery', 'Allow AI to send campaigns without human approval', 'delivery', FALSE, TRUE, '{"risk_level": "critical"}'::jsonb),
  (NULL, 'auto_posting', 'Auto Posting', 'Automatically publish social media posts without review', 'automation', FALSE, TRUE, '{"risk_level": "high"}'::jsonb),
  (NULL, 'auto_email_send', 'Auto Email Send', 'Send emails automatically without confirmation', 'delivery', FALSE, TRUE, '{"risk_level": "high"}'::jsonb),

  -- AI autonomy features (MEDIUM-HIGH RISK)
  (NULL, 'ai_content_generation', 'AI Content Generation', 'Enable AI-powered content creation', 'ai', TRUE, FALSE, '{"risk_level": "medium"}'::jsonb),
  (NULL, 'ai_campaign_optimization', 'AI Campaign Optimization', 'Allow AI to optimize campaigns autonomously', 'ai', FALSE, TRUE, '{"risk_level": "medium"}'::jsonb),
  (NULL, 'ai_audience_targeting', 'AI Audience Targeting', 'AI-driven audience segmentation and targeting', 'ai', TRUE, FALSE, '{"risk_level": "low"}'::jsonb),

  -- Integration features
  (NULL, 'gmail_integration', 'Gmail Integration', 'Enable Gmail email sync', 'integrations', TRUE, FALSE, '{"provider": "google"}'::jsonb),
  (NULL, 'outlook_integration', 'Outlook Integration', 'Enable Outlook email sync', 'integrations', TRUE, FALSE, '{"provider": "microsoft"}'::jsonb),
  (NULL, 'stripe_integration', 'Stripe Integration', 'Enable Stripe payment processing', 'integrations', TRUE, FALSE, '{"provider": "stripe"}'::jsonb),

  -- Experimental features
  (NULL, 'real_time_analytics', 'Real-Time Analytics', 'Live campaign performance tracking', 'experimental', TRUE, FALSE, '{"beta": true}'::jsonb),
  (NULL, 'advanced_segmentation', 'Advanced Segmentation', 'ML-powered audience segmentation', 'experimental', FALSE, FALSE, '{"beta": true}'::jsonb),
  (NULL, 'predictive_scoring', 'Predictive Scoring', 'AI lead scoring predictions', 'experimental', FALSE, FALSE, '{"beta": true}'::jsonb),

  -- Safety features
  (NULL, 'rate_limiting', 'Rate Limiting', 'API rate limiting and abuse detection', 'safety', TRUE, FALSE, '{}'::jsonb),
  (NULL, 'audit_logging', 'Audit Logging', 'Comprehensive audit trail logging', 'safety', TRUE, FALSE, '{}'::jsonb),
  (NULL, 'rbac_enforcement', 'RBAC Enforcement', 'Role-based access control', 'safety', TRUE, FALSE, '{}'::jsonb)
ON CONFLICT (tenant_id, key) DO NOTHING;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_feature_flag_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kill_switch_flags_updated_at
  BEFORE UPDATE ON kill_switch_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flag_timestamp();

-- Auto-cleanup expired overrides (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_overrides()
RETURNS void AS $$
BEGIN
  DELETE FROM kill_switch_overrides
  WHERE expires_at IS NOT NULL
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
