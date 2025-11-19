-- Migration 050: Client RLS Policies
-- Phase 2 Step 5 - Client Authentication
-- Created: 2025-11-19
--
-- This migration enables Row Level Security (RLS) for client-related tables
-- Following patterns from PHASE2_CLIENT_AUTH_IMPLEMENTATION.md

-- ============================================================================
-- 1. CLIENT_USERS TABLE RLS
-- ============================================================================

-- Enable RLS on client_users table
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own record
CREATE POLICY "Clients can view own record"
ON client_users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Clients can update their own record (name, preferences, etc.)
CREATE POLICY "Clients can update own record"
ON client_users
FOR UPDATE
USING (auth.uid() = id);

-- ============================================================================
-- 2. IDEAS TABLE RLS
-- ============================================================================

-- Enable RLS on ideas table (if not already enabled)
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own ideas
CREATE POLICY "Clients can view own ideas"
ON ideas
FOR SELECT
USING (auth.uid() = client_id);

-- Policy: Clients can create their own ideas
CREATE POLICY "Clients can create ideas"
ON ideas
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Policy: Clients can update their own ideas
CREATE POLICY "Clients can update own ideas"
ON ideas
FOR UPDATE
USING (auth.uid() = client_id);

-- ============================================================================
-- 3. PROPOSAL_SCOPES TABLE RLS
-- ============================================================================

-- Enable RLS on proposal_scopes table
ALTER TABLE proposal_scopes ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own proposals
CREATE POLICY "Clients can view own proposals"
ON proposal_scopes
FOR SELECT
USING (auth.uid() = client_id);

-- ============================================================================
-- 4. PROJECTS TABLE RLS (Client access)
-- ============================================================================

-- Note: Projects table may already have RLS enabled for staff
-- We add client-specific policies

-- Policy: Clients can view projects they are associated with
CREATE POLICY "Clients can view own projects"
ON projects
FOR SELECT
USING (auth.uid() = client_id);

-- ============================================================================
-- 5. DIGITAL_VAULT TABLE RLS
-- ============================================================================

-- Enable RLS on digital_vault table
ALTER TABLE digital_vault ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own vault entries
CREATE POLICY "Clients can view own vault entries"
ON digital_vault
FOR SELECT
USING (auth.uid() = client_id);

-- Policy: Clients can create vault entries
CREATE POLICY "Clients can create vault entries"
ON digital_vault
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Policy: Clients can update their own vault entries
CREATE POLICY "Clients can update own vault entries"
ON digital_vault
FOR UPDATE
USING (auth.uid() = client_id);

-- Policy: Clients can delete their own vault entries
CREATE POLICY "Clients can delete own vault entries"
ON digital_vault
FOR DELETE
USING (auth.uid() = client_id);

-- ============================================================================
-- 6. VERIFY RLS IS WORKING
-- ============================================================================

-- Test query (run as authenticated client user):
-- SELECT * FROM client_users WHERE id = auth.uid();
-- Should return only the authenticated client's record

-- Test query (run as authenticated client user):
-- SELECT * FROM ideas WHERE client_id = auth.uid();
-- Should return only the authenticated client's ideas

-- Test query (run as authenticated client user):
-- SELECT * FROM digital_vault WHERE client_id = auth.uid();
-- Should return only the authenticated client's vault entries

-- ============================================================================
-- NOTES:
-- ============================================================================
--
-- 1. These policies ensure that clients can only access their own data
-- 2. Staff users should have separate policies (from previous migrations)
-- 3. Service role key bypasses RLS (for admin operations)
-- 4. To test RLS, use client authentication (not service role)
-- 5. If a table doesn't exist, the policy creation will fail gracefully
--
-- ============================================================================
-- END MIGRATION 050
-- ============================================================================
