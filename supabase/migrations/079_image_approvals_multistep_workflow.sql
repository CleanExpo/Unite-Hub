-- Migration 079: Image Approvals Multi-Step Workflow
-- Required by Phase 20 - Gemini Directed Propagation
-- Creates the image_approvals table with multi-step approval states

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create image_approvals table
CREATE TABLE IF NOT EXISTS image_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  contact_id UUID,
  category TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  use_case TEXT,
  platform TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  requested_by UUID NOT NULL,
  reviewed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status constraint
  CONSTRAINT image_approvals_status_check CHECK (
    status IN ('pending', 'revised', 'approved', 'rejected')
  ),

  -- Unique constraint
  CONSTRAINT image_approvals_org_file_unique UNIQUE (org_id, file_path),

  -- Foreign keys
  CONSTRAINT image_approvals_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT image_approvals_contact_fk
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL,
  CONSTRAINT image_approvals_requested_by_fk
    -- Keep FK reference to auth.users (allowed in migrations)
FOREIGN KEY (requested_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT image_approvals_reviewed_by_fk
    -- Keep FK reference to auth.users (allowed in migrations)
FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_image_approvals_org_id ON image_approvals(org_id);
CREATE INDEX IF NOT EXISTS idx_image_approvals_status ON image_approvals(status);
CREATE INDEX IF NOT EXISTS idx_image_approvals_category ON image_approvals(category);
CREATE INDEX IF NOT EXISTS idx_image_approvals_created_at ON image_approvals(created_at DESC);

-- Enable RLS
ALTER TABLE image_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org isolation
CREATE POLICY org_isolation_select ON image_approvals
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY org_isolation_insert ON image_approvals
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY org_isolation_update ON image_approvals
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY org_isolation_delete ON image_approvals
  FOR DELETE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Create audit log table for tracking status transitions
CREATE TABLE IF NOT EXISTS image_approvals_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  approval_id UUID NOT NULL REFERENCES image_approvals(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  -- Keep FK reference to auth.users (allowed in migrations)
changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit lookups
CREATE INDEX IF NOT EXISTS idx_image_approvals_audit_approval_id
  ON image_approvals_audit(approval_id);

-- Enable RLS on audit table
ALTER TABLE image_approvals_audit ENABLE ROW LEVEL SECURITY;

-- Audit table inherits access from parent approval record
CREATE POLICY audit_select ON image_approvals_audit
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND approval_id IN (
    SELECT id FROM image_approvals WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_image_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER image_approvals_updated_at_trigger
  BEFORE UPDATE ON image_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_image_approvals_updated_at();

-- Trigger to log status changes to audit table
CREATE OR REPLACE FUNCTION log_image_approval_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO image_approvals_audit (
      approval_id,
      previous_status,
      new_status,
      changed_by,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.reviewed_by,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER image_approvals_status_audit_trigger
  AFTER UPDATE ON image_approvals
  FOR EACH ROW
  EXECUTE FUNCTION log_image_approval_status_change();

-- Comment for documentation
COMMENT ON TABLE image_approvals IS 'Multi-step approval workflow for AI-generated images (Phase 20)';
COMMENT ON TABLE image_approvals_audit IS 'Audit log for image approval status transitions';
