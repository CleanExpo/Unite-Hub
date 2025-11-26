/**
 * Platform Mode Toggle
 *
 * Allows admins (Phill & Rana) to toggle between Test and Live mode for Stripe integration
 * Migration Version: 271
 * Created: 2025-11-27
 */

-- Create platform mode table
CREATE TABLE IF NOT EXISTS sys_platform_mode (
  id SERIAL PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'test',  -- 'test' or 'live'
  stripe_mode TEXT NOT NULL DEFAULT 'test',  -- Mirrors mode, used for clarity
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT mode_valid CHECK (mode IN ('test', 'live')),
  CONSTRAINT stripe_mode_valid CHECK (stripe_mode IN ('test', 'live'))
);

-- Create index on mode for fast lookups
CREATE INDEX idx_platform_mode_latest ON sys_platform_mode(updated_at DESC) WHERE id = 1;

-- Insert default row
INSERT INTO sys_platform_mode (id, mode, stripe_mode) VALUES (1, 'test', 'test')
ON CONFLICT (id) DO NOTHING;

-- Create audit log for mode changes
CREATE TABLE IF NOT EXISTS sys_platform_mode_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_mode TEXT NOT NULL,
  new_mode TEXT NOT NULL,
  reason TEXT,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_platform_mode_audit_changed_at ON sys_platform_mode_audit(changed_at DESC);
CREATE INDEX idx_platform_mode_audit_changed_by ON sys_platform_mode_audit(changed_by);

-- Function to get current platform mode
CREATE OR REPLACE FUNCTION get_platform_mode()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT mode FROM sys_platform_mode WHERE id = 1 LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if user is admin (Phill or Rana)
CREATE OR REPLACE FUNCTION is_platform_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = user_id
    AND email IN ('phill.mcgurk@gmail.com', 'ranamuzamil1199@gmail.com')
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS on platform mode tables
ALTER TABLE sys_platform_mode ENABLE ROW LEVEL SECURITY;
ALTER TABLE sys_platform_mode_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Only admins can read/write
CREATE POLICY "admins_read_platform_mode" ON sys_platform_mode
  FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "admins_update_platform_mode" ON sys_platform_mode
  FOR UPDATE
  USING (is_platform_admin(auth.uid()))
  WITH CHECK (is_platform_admin(auth.uid()));

CREATE POLICY "admins_read_mode_audit" ON sys_platform_mode_audit
  FOR SELECT
  USING (is_platform_admin(auth.uid()));

CREATE POLICY "admins_insert_mode_audit" ON sys_platform_mode_audit
  FOR INSERT
  WITH CHECK (is_platform_admin(auth.uid()));

-- Log migration completion (if migration_log table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'migration_log') THEN
    INSERT INTO public.migration_log (version, name, status, completed_at)
    VALUES (271, 'platform_mode_toggle', 'success', NOW())
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
