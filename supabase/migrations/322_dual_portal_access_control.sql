-- ============================================================================
-- Migration 322: Dual Portal Access Control (Unite-Hub CRM + Synthex Client Portal)
-- ============================================================================
-- Creates staff_users, staff_invites, and clients tables for access control
-- Owner: phill.mcgurk@gmail.com (hardcoded seed)
-- ============================================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS staff_invites CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS staff_users CASCADE;

-- ============================================================================
-- 1. STAFF_USERS TABLE - Whitelist of staff with CRM access
-- ============================================================================
CREATE TABLE staff_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'developer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'disabled')),
  approved_by UUID REFERENCES staff_users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX idx_staff_users_email ON staff_users(email);
CREATE INDEX idx_staff_users_user_id ON staff_users(user_id);
CREATE INDEX idx_staff_users_status ON staff_users(status);

-- ============================================================================
-- 2. STAFF_INVITES TABLE - Pending staff invitations
-- ============================================================================
CREATE TABLE staff_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'developer')),
  invited_by UUID NOT NULL REFERENCES staff_users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_invites_email ON staff_invites(email);
CREATE INDEX idx_staff_invites_status ON staff_invites(status);

-- ============================================================================
-- 3. CLIENTS TABLE - Synthex client accounts
-- ============================================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  trade_type TEXT CHECK (trade_type IN ('plumber', 'electrician', 'builder', 'hvac', 'landscaper', 'painter', 'roofer', 'other')),
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'business')),
  onboarding_complete BOOLEAN DEFAULT FALSE,
  assigned_staff UUID REFERENCES staff_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_subscription ON clients(subscription_tier);
CREATE INDEX idx_clients_assigned_staff ON clients(assigned_staff);

-- ============================================================================
-- 4. HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- ============================================================================

-- Check if user is a staff member
CREATE OR REPLACE FUNCTION is_staff_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_users
    WHERE user_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is owner
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_users
    WHERE user_id = auth.uid()
    AND role = 'owner'
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is admin or owner
CREATE OR REPLACE FUNCTION is_staff_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM staff_users
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get staff role for current user
CREATE OR REPLACE FUNCTION get_staff_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM staff_users
  WHERE user_id = auth.uid()
  AND status = 'active';
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 5. RLS POLICIES FOR STAFF_USERS
-- ============================================================================
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;

-- Staff can view all staff members
CREATE POLICY staff_users_select ON staff_users
  FOR SELECT
  USING (is_staff_member());

-- Only owner can insert new staff
CREATE POLICY staff_users_insert ON staff_users
  FOR INSERT
  WITH CHECK (is_owner());

-- Only owner can update staff (approve, disable, change role)
CREATE POLICY staff_users_update ON staff_users
  FOR UPDATE
  USING (is_owner())
  WITH CHECK (is_owner());

-- Only owner can delete staff
CREATE POLICY staff_users_delete ON staff_users
  FOR DELETE
  USING (is_owner());

-- ============================================================================
-- 6. RLS POLICIES FOR STAFF_INVITES
-- ============================================================================
ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;

-- Staff can view all invites
CREATE POLICY staff_invites_select ON staff_invites
  FOR SELECT
  USING (is_staff_member());

-- Admin or owner can create invites
CREATE POLICY staff_invites_insert ON staff_invites
  FOR INSERT
  WITH CHECK (is_staff_admin());

-- Only owner can update invites
CREATE POLICY staff_invites_update ON staff_invites
  FOR UPDATE
  USING (is_owner());

-- Only owner can delete invites
CREATE POLICY staff_invites_delete ON staff_invites
  FOR DELETE
  USING (is_owner());

-- ============================================================================
-- 7. RLS POLICIES FOR CLIENTS
-- ============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Staff can view all clients
CREATE POLICY clients_staff_select ON clients
  FOR SELECT
  USING (is_staff_member());

-- Clients can view their own record
CREATE POLICY clients_self_select ON clients
  FOR SELECT
  USING (id = auth.uid());

-- Staff can insert clients
CREATE POLICY clients_staff_insert ON clients
  FOR INSERT
  WITH CHECK (is_staff_member());

-- Clients can insert their own record (on signup)
CREATE POLICY clients_self_insert ON clients
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Staff can update any client
CREATE POLICY clients_staff_update ON clients
  FOR UPDATE
  USING (is_staff_member());

-- Clients can update their own record
CREATE POLICY clients_self_update ON clients
  FOR UPDATE
  USING (id = auth.uid());

-- Only admin/owner can delete clients
CREATE POLICY clients_delete ON clients
  FOR DELETE
  USING (is_staff_admin());

-- ============================================================================
-- 8. SEED OWNER ACCOUNT
-- ============================================================================
-- Note: user_id will be linked when phill.mcgurk@gmail.com logs in
INSERT INTO staff_users (email, role, status, approved_at)
VALUES ('phill.mcgurk@gmail.com', 'owner', 'active', NOW())
ON CONFLICT (email) DO UPDATE SET
  role = 'owner',
  status = 'active',
  approved_at = COALESCE(staff_users.approved_at, NOW());

-- ============================================================================
-- 9. TRIGGER TO LINK STAFF USER_ID ON LOGIN
-- ============================================================================
CREATE OR REPLACE FUNCTION link_staff_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- When a user signs up/logs in, link their auth.users.id to staff_users if email matches
  UPDATE staff_users
  SET user_id = NEW.id,
      updated_at = NOW()
  WHERE email = NEW.email
  AND user_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_link_staff ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_link_staff
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_staff_user_id();

-- ============================================================================
-- 10. UPDATE EXISTING OWNER IF ALREADY EXISTS IN AUTH.USERS
-- ============================================================================
DO $$
DECLARE
  owner_auth_id UUID;
BEGIN
  -- Find owner in auth.users
  SELECT id INTO owner_auth_id
  FROM auth.users
  WHERE email = 'phill.mcgurk@gmail.com'
  LIMIT 1;

  -- Link if found
  IF owner_auth_id IS NOT NULL THEN
    UPDATE staff_users
    SET user_id = owner_auth_id
    WHERE email = 'phill.mcgurk@gmail.com';
  END IF;
END $$;

-- ============================================================================
-- 11. GRANT PERMISSIONS
-- ============================================================================
GRANT SELECT ON staff_users TO authenticated;
GRANT SELECT ON staff_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE ON clients TO authenticated;

-- Service role gets full access (for admin operations)
GRANT ALL ON staff_users TO service_role;
GRANT ALL ON staff_invites TO service_role;
GRANT ALL ON clients TO service_role;
