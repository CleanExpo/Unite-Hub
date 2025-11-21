-- Migration 085: Feature Flags
-- Required by Phase 30 - Tenant-Level Feature Flags & Image Engine Kill Switches
-- Toggle image-engine features per organization

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT feature_flags_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique constraint
  CONSTRAINT feature_flags_org_key_unique
    UNIQUE (org_id, feature_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_org_key
  ON feature_flags(org_id, feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_feature
  ON feature_flags(feature_key);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY feature_flags_select ON feature_flags
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY feature_flags_insert ON feature_flags
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY feature_flags_update ON feature_flags
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Comment
COMMENT ON TABLE feature_flags IS 'Toggle image-engine features per organization (Phase 30)';

-- Create global_settings table for kill switches
CREATE TABLE IF NOT EXISTS global_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for global settings
CREATE INDEX IF NOT EXISTS idx_global_settings_key
  ON global_settings(key);
CREATE INDEX IF NOT EXISTS idx_global_settings_env
  ON global_settings(environment);

-- Comment
COMMENT ON TABLE global_settings IS 'Global system settings and kill switches (Phase 30)';

-- Insert default image engine kill switch
INSERT INTO global_settings (key, value, environment)
VALUES (
  'image_engine_global_enabled',
  '{"enabled": true, "reason": null, "disabled_at": null}'::jsonb,
  'production'
)
ON CONFLICT (key) DO NOTHING;
