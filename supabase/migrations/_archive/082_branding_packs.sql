-- Migration 082: Branding Packs
-- Required by Phase 26 - Personalized Branding Packs
-- Stores branding pack configurations for organizations

CREATE TABLE IF NOT EXISTS branding_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT branding_packs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_branding_pack_org ON branding_packs(org_id);
CREATE INDEX IF NOT EXISTS idx_branding_pack_created ON branding_packs(created_at DESC);

-- Enable RLS
ALTER TABLE branding_packs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY branding_packs_select ON branding_packs
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY branding_packs_insert ON branding_packs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY branding_packs_update ON branding_packs
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE branding_packs IS 'Stores branding pack configurations for organizations (Phase 26)';
