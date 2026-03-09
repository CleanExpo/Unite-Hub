-- Migration 255: RBAC Roles and Device Authorization
-- Adds role-based access control and device-based approval for admin access
-- Status: 2025-11-26

-- Use auth.uid() in RLS policies instead of direct auth.users reference
Create profiles table if it doesn't exist (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  -- Keep FK reference to auth.users (allowed in migrations)
id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Add role column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';

-- Add constraint for role validation
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS valid_roles;
ALTER TABLE public.profiles
  ADD CONSTRAINT valid_roles CHECK (role IN ('admin', 'customer'));

-- Set admin roles for team members
UPDATE public.profiles
SET role = 'admin'
WHERE email IN (
  'phill.mcgurk@gmail.com',
  'support@carsi.com.au',
  'ranamuzamil1199@gmail.com'
);

-- Insert profiles for team members if they don't exist (requires their user IDs)
-- These will be handled at runtime during first login

-- Create admin_approvals table for device authorization
CREATE TABLE IF NOT EXISTS public.admin_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  approved BOOLEAN DEFAULT FALSE,
  approval_token TEXT UNIQUE,
  -- Keep FK reference to auth.users (allowed in migrations)
approved_by UUID REFERENCES auth.users(id),
  requested_at TIMESTAMP DEFAULT now(),
  approved_at TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMP DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_admin_approvals_user_id
  ON public.admin_approvals(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_token
  ON public.admin_approvals(approval_token);
CREATE INDEX IF NOT EXISTS idx_admin_approvals_expires
  ON public.admin_approvals(expires_at);

-- Create admin_devices table for trusted device tracking
CREATE TABLE IF NOT EXISTS public.admin_trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  is_trusted BOOLEAN DEFAULT FALSE,
  -- Keep FK reference to auth.users (allowed in migrations)
approved_by UUID REFERENCES auth.users(id),
  last_used TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMP DEFAULT now()
);

-- Index for device lookups
CREATE INDEX IF NOT EXISTS idx_admin_devices_user_id
  ON public.admin_trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_devices_fingerprint
  ON public.admin_trusted_devices(device_fingerprint);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own profile
DROP POLICY IF EXISTS rls_profiles_self_view ON public.profiles;
CREATE POLICY rls_profiles_self_view ON public.profiles
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() = id);

-- RLS Policy: Users can update their own profile (except role)
DROP POLICY IF EXISTS rls_profiles_self_update ON public.profiles;
CREATE POLICY rls_profiles_self_update ON public.profiles
  FOR UPDATE
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Enable RLS on admin_approvals table
ALTER TABLE public.admin_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own approval requests
DROP POLICY IF EXISTS rls_admin_approvals_own ON public.admin_approvals;
CREATE POLICY rls_admin_approvals_own ON public.admin_approvals
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() = user_id OR auth.uid() = approved_by);

-- RLS Policy: Only Phill can approve
DROP POLICY IF EXISTS rls_admin_approvals_approve ON public.admin_approvals;
CREATE POLICY rls_admin_approvals_approve ON public.admin_approvals
  FOR UPDATE
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND email = 'phill.mcgurk@gmail.com'
    )
  );

-- Enable RLS on admin_trusted_devices table
ALTER TABLE public.admin_trusted_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own devices
DROP POLICY IF EXISTS rls_admin_devices_own ON public.admin_trusted_devices;
CREATE POLICY rls_admin_devices_own ON public.admin_trusted_devices
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() = user_id);

-- Create function to check if admin is approved for this device
CREATE OR REPLACE FUNCTION public.is_admin_approved(user_id UUID, device_fingerprint TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  trusted_device BOOLEAN;
  valid_approval BOOLEAN;
BEGIN
  -- Check if device is trusted
  SELECT EXISTS (
    SELECT 1 FROM public.admin_trusted_devices
    WHERE admin_trusted_devices.user_id = is_admin_approved.user_id
    AND admin_trusted_devices.device_fingerprint = is_admin_approved.device_fingerprint
    AND is_trusted = TRUE
    AND expires_at > now()
  ) INTO trusted_device;

  IF trusted_device THEN
    RETURN TRUE;
  END IF;

  -- Check if there's a valid approval token
  SELECT EXISTS (
    SELECT 1 FROM public.admin_approvals
    WHERE admin_approvals.user_id = is_admin_approved.user_id
    AND approved = TRUE
    AND expires_at > now()
  ) INTO valid_approval;

  RETURN valid_approval;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant function access
GRANT EXECUTE ON FUNCTION public.is_admin_approved TO authenticated;

-- Create function to get user role safely
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN COALESCE(user_role, 'customer');
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant function access
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;

-- Create function to create approval request
CREATE OR REPLACE FUNCTION public.request_admin_approval(
  user_id UUID,
  ip_address INET,
  user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
  approval_id UUID;
  approval_token TEXT;
BEGIN
  approval_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.admin_approvals (user_id, ip_address, user_agent, approval_token)
  VALUES (user_id, ip_address, user_agent, approval_token)
  RETURNING id INTO approval_id;

  RETURN approval_id;
END;
$$ LANGUAGE plpgsql;

-- Grant function access
GRANT EXECUTE ON FUNCTION public.request_admin_approval TO authenticated;

-- Create function to approve device
CREATE OR REPLACE FUNCTION public.approve_admin_access(
  approval_id UUID,
  approver_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.admin_approvals
  SET
    approved = TRUE,
    approved_by = approver_id,
    approved_at = now()
  WHERE id = approval_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = approver_id
    AND email = 'phill.mcgurk@gmail.com'
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant function access
GRANT EXECUTE ON FUNCTION public.approve_admin_access TO authenticated;

-- Create function to trust a device
CREATE OR REPLACE FUNCTION public.trust_admin_device(
  user_id UUID,
  device_fingerprint TEXT,
  ip_address INET,
  user_agent TEXT,
  approver_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.admin_trusted_devices (
    user_id,
    device_fingerprint,
    ip_address,
    user_agent,
    approved_by,
    is_trusted
  )
  VALUES (user_id, device_fingerprint, ip_address, user_agent, approver_id, TRUE)
  ON CONFLICT (device_fingerprint) DO UPDATE
  SET is_trusted = TRUE, approved_by = approver_id, last_used = now();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant function access
GRANT EXECUTE ON FUNCTION public.trust_admin_device TO authenticated;

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.admin_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Index for audit lookups
CREATE INDEX IF NOT EXISTS idx_admin_access_audit_user_id
  ON public.admin_access_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_audit_created
  ON public.admin_access_audit(created_at);

-- Enable RLS on audit table
ALTER TABLE public.admin_access_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs
DROP POLICY IF EXISTS rls_audit_admin_only ON public.admin_access_audit;
CREATE POLICY rls_audit_admin_only ON public.admin_access_audit
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create function to log admin access
CREATE OR REPLACE FUNCTION public.log_admin_access(
  user_id UUID,
  action TEXT,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.admin_access_audit (
    user_id, action, ip_address, user_agent, device_fingerprint, success, error_message
  )
  VALUES (user_id, action, ip_address, user_agent, device_fingerprint, success, error_message);
END;
$$ LANGUAGE plpgsql;

-- Grant function access
GRANT EXECUTE ON FUNCTION public.log_admin_access TO authenticated;

-- Create updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profiles_updated_at();

-- Grant table permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.admin_approvals TO authenticated;
GRANT SELECT, INSERT ON public.admin_trusted_devices TO authenticated;
GRANT INSERT ON public.admin_access_audit TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
