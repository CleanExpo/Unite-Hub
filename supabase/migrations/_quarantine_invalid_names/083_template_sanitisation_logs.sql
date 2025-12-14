-- Migration 083: Template Sanitisation Logs
-- Required by Phase 28 - Public Copy Sanitisation Engine
-- Tracks when public copy or templates are auto-sanitised

CREATE TABLE IF NOT EXISTS template_sanitisation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  location TEXT NOT NULL,
  detected_term TEXT NOT NULL,
  replacement TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT template_sanitisation_logs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_template_logs_org ON template_sanitisation_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_template_logs_term ON template_sanitisation_logs(detected_term);
CREATE INDEX IF NOT EXISTS idx_template_logs_created ON template_sanitisation_logs(created_at DESC);

-- Enable RLS
ALTER TABLE template_sanitisation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY template_sanitisation_logs_select ON template_sanitisation_logs
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY template_sanitisation_logs_insert ON template_sanitisation_logs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE template_sanitisation_logs IS 'Tracks when public copy or templates are auto-sanitised (Phase 28)';
