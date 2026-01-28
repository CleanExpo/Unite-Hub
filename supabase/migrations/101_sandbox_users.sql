-- Phase 30: Sandbox Users Management Table
-- Create table for managing staff sandbox billing users

-- Create sandbox_users table
CREATE TABLE IF NOT EXISTS sandbox_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('founder', 'staff_admin', 'admin', 'engineering', 'support')),
  sandbox_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_sandbox_users_email ON sandbox_users(email);

-- Create index for enabled users
CREATE INDEX IF NOT EXISTS idx_sandbox_users_enabled ON sandbox_users(sandbox_enabled);

-- Enable RLS
ALTER TABLE sandbox_users ENABLE ROW LEVEL SECURITY;

-- Admin read/write policy
CREATE POLICY "admins_manage_sandbox_users" ON sandbox_users
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
  auth.uid() IN (
    SELECT user_id FROM user_organizations
    WHERE role IN ('owner', 'admin', 'super_admin')
  )
  OR
  auth.email() IN (
    SELECT email FROM sandbox_users WHERE role IN ('founder', 'admin')
  )
);

-- Insert initial staff registry
INSERT INTO sandbox_users (email, name, role, sandbox_enabled, notes) VALUES
  ('phill.mcgurk@gmail.com', 'Phill McGurk', 'founder', true, 'Founder - full platform access'),
  ('support@carsi.com.au', 'Claire Brooks', 'staff_admin', true, 'Staff admin - client support'),
  ('ranamuzamil1199@gmail.com', 'Rana Muzamil', 'engineering', true, 'Engineering - development'),
  ('admin@unite-group.in', 'Admin', 'admin', true, 'Internal admin account'),
  ('contact@unite-group.in', 'Contact', 'admin', true, 'Internal contact account'),
  ('dev@unite-group.in', 'Developer', 'engineering', true, 'Internal dev account')
ON CONFLICT (email) DO NOTHING;

-- Create audit log for sandbox changes
CREATE TABLE IF NOT EXISTS sandbox_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  target_email TEXT NOT NULL,
  -- Keep FK reference to auth.users (allowed in migrations)
performed_by UUID REFERENCES auth.users(id),
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for audit log queries
CREATE INDEX IF NOT EXISTS idx_sandbox_audit_target ON sandbox_audit_log(target_email);
CREATE INDEX IF NOT EXISTS idx_sandbox_audit_action ON sandbox_audit_log(action);

-- Enable RLS on audit log
ALTER TABLE sandbox_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read audit log
CREATE POLICY "admins_read_sandbox_audit" ON sandbox_audit_log
FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
  auth.uid() IN (
    SELECT user_id FROM user_organizations
    WHERE role IN ('owner', 'admin', 'super_admin')
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sandbox_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS sandbox_users_updated_at ON sandbox_users;
CREATE TRIGGER sandbox_users_updated_at
  BEFORE UPDATE ON sandbox_users
  FOR EACH ROW
  EXECUTE FUNCTION update_sandbox_users_updated_at();

-- Grant permissions
GRANT ALL ON sandbox_users TO authenticated;
GRANT ALL ON sandbox_audit_log TO authenticated;
