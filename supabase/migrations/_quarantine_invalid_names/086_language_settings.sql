-- Migration 086: Language Settings
-- Required by Phase 31 - Multilingual Preference & Language Engine
-- Store language preferences at organization and user level

-- Create helper function for updated_at if not exists
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Organization language settings
CREATE TABLE IF NOT EXISTS org_language_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  default_ui_language TEXT NOT NULL DEFAULT 'en-AU',
  default_content_language TEXT NOT NULL DEFAULT 'en-AU',
  default_voice_language TEXT NOT NULL DEFAULT 'en-AU',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT org_language_settings_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique constraint
  CONSTRAINT org_language_settings_org_unique UNIQUE (org_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_language_org_id
  ON org_language_settings(org_id);

-- Enable RLS
ALTER TABLE org_language_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY org_language_settings_select ON org_language_settings
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY org_language_settings_insert ON org_language_settings
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ));

CREATE POLICY org_language_settings_update ON org_language_settings
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- Trigger for updated_at
CREATE TRIGGER trg_org_language_updated_at
  BEFORE UPDATE ON org_language_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE org_language_settings IS 'Store default language preferences at organisation level (Phase 31)';

-- User language settings
CREATE TABLE IF NOT EXISTS user_language_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  ui_language TEXT NOT NULL DEFAULT 'en-AU',
  content_language TEXT NOT NULL DEFAULT 'en-AU',
  voice_language TEXT NOT NULL DEFAULT 'en-AU',
  preferred_voice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT user_language_settings_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT user_language_settings_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Unique constraint
  CONSTRAINT user_language_settings_org_user_unique UNIQUE (org_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_language_org_user
  ON user_language_settings(org_id, user_id);

-- Enable RLS
ALTER TABLE user_language_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY user_language_settings_select ON user_language_settings
  FOR SELECT TO authenticated
  USING (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY user_language_settings_insert ON user_language_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY user_language_settings_update ON user_language_settings
  FOR UPDATE TO authenticated
  USING (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  )
  WITH CHECK (
    org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- Trigger for updated_at
CREATE TRIGGER trg_user_language_updated_at
  BEFORE UPDATE ON user_language_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE user_language_settings IS 'Store per-user language and voice preferences (Phase 31)';
