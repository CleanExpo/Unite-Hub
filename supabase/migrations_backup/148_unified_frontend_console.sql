-- Migration 148: Unified Frontend Console
-- Required by Phase 96 - UFC
-- Console configuration and role-based visibility

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS ufc_user_preferences CASCADE;
DROP TABLE IF EXISTS ufc_module_access CASCADE;

-- UFC module access table
CREATE TABLE ufc_module_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  module_name TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Access level check
  CONSTRAINT ufc_module_access_level_check CHECK (
    access_level IN ('admin', 'operator', 'viewer', 'auditor')
  ),

  -- Module name check
  CONSTRAINT ufc_module_access_module_check CHECK (
    module_name IN (
      'maos', 'asrs', 'mcse', 'upewe', 'aire', 'sorie', 'egcbi',
      'grh', 'raaoe', 'gslpie', 'aglbase', 'tcpqel', 'ucscel', 'overview'
    )
  ),

  -- Unique per user/module
  CONSTRAINT ufc_module_access_unique UNIQUE (tenant_id, user_id, module_name),

  -- Foreign keys
  CONSTRAINT ufc_module_access_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT ufc_module_access_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ufc_module_access_tenant ON ufc_module_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ufc_module_access_user ON ufc_module_access(user_id);
CREATE INDEX IF NOT EXISTS idx_ufc_module_access_module ON ufc_module_access(module_name);

-- Enable RLS
ALTER TABLE ufc_module_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ufc_module_access_select ON ufc_module_access
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE ufc_module_access IS 'Role-based module access control (Phase 96)';

-- UFC user preferences table
CREATE TABLE ufc_user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  default_tenant_id UUID,
  sidebar_collapsed BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'dark',
  favorite_modules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT ufc_user_preferences_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ufc_user_preferences_user ON ufc_user_preferences(user_id);

-- Enable RLS
ALTER TABLE ufc_user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ufc_user_preferences_select ON ufc_user_preferences
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY ufc_user_preferences_insert ON ufc_user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY ufc_user_preferences_update ON ufc_user_preferences
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Comment
COMMENT ON TABLE ufc_user_preferences IS 'User console preferences (Phase 96)';
