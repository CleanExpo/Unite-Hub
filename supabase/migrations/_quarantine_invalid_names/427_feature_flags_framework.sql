-- Migration 427: Feature Flags & Safe Rollouts (Phase E12)
-- Progressive feature delivery with audience targeting

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS feature_audiences CASCADE;
DROP TABLE IF EXISTS feature_variants CASCADE;
DROP TABLE IF EXISTS feature_flags CASCADE;

-- Feature Flags table (flag definitions)
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE, -- e.g., 'new_dashboard', 'ai_content_v2'
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  default_variant TEXT DEFAULT 'control', -- 'control', 'treatment', 'variant_a', etc.
  rollout_percentage INTEGER DEFAULT 0, -- 0-100, global rollout %
  is_global BOOLEAN NOT NULL DEFAULT TRUE, -- applies to all tenants
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feature_flags_key ON feature_flags(key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);

-- Feature Variants table (A/B test variants)
CREATE TABLE feature_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- 'control', 'treatment', 'variant_a', 'variant_b'
  rollout_percentage INTEGER NOT NULL DEFAULT 0, -- 0-100
  config JSONB DEFAULT '{}'::jsonb, -- variant-specific config
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(flag_id, name)
);

CREATE INDEX idx_feature_variants_flag ON feature_variants(flag_id);

-- Feature Audiences table (tenant/user targeting)
CREATE TABLE feature_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = global audience
  conditions JSONB DEFAULT '{}'::jsonb, -- targeting rules (role, plan, country, etc.)
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  override_variant TEXT, -- force specific variant for this audience
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feature_audiences_flag ON feature_audiences(flag_id);
CREATE INDEX idx_feature_audiences_tenant ON feature_audiences(tenant_id);

-- RLS for feature_flags (read-only for tenants)
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY feature_flags_read_all ON feature_flags
  FOR SELECT
  USING (TRUE); -- Everyone can read flags

CREATE POLICY feature_flags_admin_write ON feature_flags
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- RLS for feature_variants
ALTER TABLE feature_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY feature_variants_read_all ON feature_variants
  FOR SELECT
  USING (TRUE);

CREATE POLICY feature_variants_admin_write ON feature_variants
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- RLS for feature_audiences
ALTER TABLE feature_audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY feature_audiences_read_own ON feature_audiences
  FOR SELECT
  USING (tenant_id = auth.uid() OR tenant_id IS NULL);

CREATE POLICY feature_audiences_admin_write ON feature_audiences
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- Function: Evaluate feature flag for context
CREATE OR REPLACE FUNCTION evaluate_feature_flag(
  p_flag_key TEXT,
  p_tenant_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_flag RECORD;
  v_audience RECORD;
  v_variant RECORD;
  v_hash INTEGER;
  v_bucket INTEGER;
  v_enabled BOOLEAN := FALSE;
  v_variant_name TEXT := 'control';
  v_variant_config JSONB := '{}'::jsonb;
BEGIN
  -- Get flag
  SELECT * INTO v_flag
  FROM feature_flags
  WHERE key = p_flag_key;

  IF NOT FOUND OR NOT v_flag.enabled THEN
    RETURN jsonb_build_object(
      'enabled', FALSE,
      'variant', 'control',
      'config', '{}'::jsonb
    );
  END IF;

  -- Check for audience override
  IF p_tenant_id IS NOT NULL THEN
    SELECT * INTO v_audience
    FROM feature_audiences
    WHERE flag_id = v_flag.id
      AND (tenant_id = p_tenant_id OR tenant_id IS NULL)
      AND enabled = TRUE
    ORDER BY tenant_id NULLS LAST
    LIMIT 1;

    IF FOUND THEN
      v_enabled := TRUE;
      IF v_audience.override_variant IS NOT NULL THEN
        v_variant_name := v_audience.override_variant;
      END IF;
    END IF;
  END IF;

  -- Rollout percentage check (deterministic based on user/tenant ID)
  IF NOT v_enabled THEN
    IF p_user_id IS NOT NULL OR p_tenant_id IS NOT NULL THEN
      v_hash := hashtext(COALESCE(p_user_id::TEXT, p_tenant_id::TEXT));
      v_bucket := ABS(v_hash) % 100;

      IF v_bucket < v_flag.rollout_percentage THEN
        v_enabled := TRUE;
      END IF;
    END IF;
  END IF;

  -- Get variant config
  IF v_enabled THEN
    SELECT * INTO v_variant
    FROM feature_variants
    WHERE flag_id = v_flag.id
      AND name = v_variant_name;

    IF FOUND THEN
      v_variant_config := v_variant.config;
    ELSE
      v_variant_name := v_flag.default_variant;
    END IF;
  ELSE
    v_variant_name := 'control';
  END IF;

  RETURN jsonb_build_object(
    'enabled', v_enabled,
    'variant', v_variant_name,
    'config', v_variant_config
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION evaluate_feature_flag TO authenticated;

-- Seed default feature flags
INSERT INTO feature_flags (key, name, description, enabled, default_variant, rollout_percentage)
VALUES
  ('ai_content_generation', 'AI Content Generation', 'Enable AI-powered content generation', TRUE, 'control', 100),
  ('advanced_analytics', 'Advanced Analytics', 'Advanced analytics dashboard', FALSE, 'control', 0),
  ('automation_v2', 'Automation v2', 'Next-gen automation engine', FALSE, 'control', 10),
  ('social_scheduler', 'Social Scheduler', 'Multi-platform social post scheduler', TRUE, 'control', 100)
ON CONFLICT (key) DO NOTHING;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_feature_flags_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_timestamp();

CREATE TRIGGER feature_variants_updated_at
  BEFORE UPDATE ON feature_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_timestamp();

CREATE TRIGGER feature_audiences_updated_at
  BEFORE UPDATE ON feature_audiences
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_timestamp();
