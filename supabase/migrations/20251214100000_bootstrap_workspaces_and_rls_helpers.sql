-- =====================================================
-- Migration: Bootstrap Workspaces + RLS Helpers (timestamped)
-- Purpose:
--   Provide foundational multi-tenant tables and helper function(s) required by
--   later migrations in this repo.
--
-- Why this exists:
--   Several migrations in this repository (e.g. Guardian/Decision Circuits) reference:
--     - workspaces(id)
--     - user_organizations
--     - get_current_workspace_id()
--   but the canonical creation of these objects lives in older/quarantined migrations.
--
-- Idempotency:
--   - CREATE TABLE IF NOT EXISTS
--   - CREATE INDEX IF NOT EXISTS
--   - CREATE OR REPLACE FUNCTION
-- =====================================================

-- Enable UUID extension (needed for uuid_generate_v4 in legacy schemas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------
-- organizations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  website TEXT,
  team_size TEXT,
  industry TEXT,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT organizations_plan_check CHECK (plan IN ('starter', 'professional', 'enterprise')),
  CONSTRAINT organizations_status_check CHECK (status IN ('active', 'trial', 'cancelled'))
);

-- -----------------------------------------------------
-- workspaces
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON workspaces(org_id);

-- -----------------------------------------------------
-- user_organizations
-- -----------------------------------------------------
-- Minimal mapping used by get_current_workspace_id() helper.
-- (Some environments may already have a richer version of this table.)
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_organizations_role_check CHECK (role IN ('owner', 'admin', 'member'))
);

CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_active ON user_organizations(user_id, is_active);

-- -----------------------------------------------------
-- get_current_workspace_id()
-- -----------------------------------------------------
-- Uses auth.uid() + user_organizations -> workspaces to resolve the current workspace.
-- Returns NULL if unauthenticated or no workspace can be resolved.
CREATE OR REPLACE FUNCTION get_current_workspace_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_workspace_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT w.id INTO v_workspace_id
  FROM workspaces w
  INNER JOIN user_organizations uo ON uo.org_id = w.org_id
  WHERE uo.user_id = auth.uid()
    AND uo.is_active = true
  ORDER BY
    CASE uo.role
      WHEN 'owner' THEN 1
      WHEN 'admin' THEN 2
      ELSE 3
    END ASC,
    w.created_at ASC
  LIMIT 1;

  RETURN v_workspace_id;
END;
$$;

COMMENT ON FUNCTION get_current_workspace_id() IS
  'Resolves current user workspace for RLS policies. Returns NULL if unauthenticated or no workspace mapping exists.';
