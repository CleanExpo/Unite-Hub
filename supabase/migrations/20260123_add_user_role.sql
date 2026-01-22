-- Add role column to user_profiles for founder access control
-- Migration: 20260123_add_user_role.sql

-- Add role column with default 'user'
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add workspace_id column if not exists (for workspace association)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id);

-- Set founder role for primary user
UPDATE user_profiles
SET role = 'founder'
WHERE email = 'phill.mcgurk@gmail.com';

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Comment
COMMENT ON COLUMN user_profiles.role IS 'User role: user, founder, admin';
