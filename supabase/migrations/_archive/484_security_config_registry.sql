/**
 * Migration 484: Configuration Governance (Phase E4)
 *
 * Centralized configuration registry:
 * - Global settings
 * - Product-specific settings (synthex, unitehub)
 * - Feature flags
 * - Secret management (is_secret flag)
 *
 * Related to: E-Series Security & Governance Foundation
 */

CREATE TABLE IF NOT EXISTS security_config_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  key text NOT NULL,
  value text,
  scope text NOT NULL DEFAULT 'global', -- global, synthex, unitehub, custom
  is_secret boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT security_config_settings_tenant_key_scope UNIQUE (tenant_id, key, scope)
);

CREATE INDEX IF NOT EXISTS idx_security_config_tenant ON security_config_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_config_scope ON security_config_settings(scope);

COMMENT ON TABLE security_config_settings IS 'Centralized configuration registry';
COMMENT ON COLUMN security_config_settings.is_secret IS 'Flag for sensitive values (UI should mask these)';

ALTER TABLE security_config_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant config" ON security_config_settings;
CREATE POLICY "Users can view their tenant config"
  ON security_config_settings FOR SELECT
  USING (auth.uid() IS NOT NULL AND (
    tenant_id IS NULL OR tenant_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  ));

DROP TRIGGER IF EXISTS update_security_config_settings_updated_at ON security_config_settings;

CREATE OR REPLACE FUNCTION update_security_config_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_security_config_settings_updated_at
  BEFORE UPDATE ON security_config_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_security_config_settings_updated_at();
