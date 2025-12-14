-- =====================================================
-- Migration 045: Fix RLS Security Policies
-- Created: 2025-11-19
-- Purpose: Replace overly permissive RLS policies with workspace-scoped policies
-- Security: Fixes data leakage where users could view all workspaces' data
-- =====================================================

-- =====================================================
-- IMPORTANT: RLS Security Fix
-- =====================================================
-- Current Problem: Several tables have "FOR SELECT USING (true)" policies
-- This allows ANY authenticated user to view ALL data across ALL workspaces
-- Fix: Implement workspace-scoped policies using user_organizations join
-- =====================================================

-- =====================================================
-- 1. EMAIL_INTEGRATIONS TABLE - Fix Overly Permissive Policy
-- =====================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view email integrations" ON email_integrations;

-- Create workspace-scoped SELECT policy
CREATE POLICY "workspace_isolation_select" ON email_integrations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Create workspace-scoped INSERT policy
DROP POLICY IF EXISTS "workspace_isolation_insert" ON email_integrations;
CREATE POLICY "workspace_isolation_insert" ON email_integrations
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Create workspace-scoped UPDATE policy
DROP POLICY IF EXISTS "workspace_isolation_update" ON email_integrations;
CREATE POLICY "workspace_isolation_update" ON email_integrations
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Create workspace-scoped DELETE policy
DROP POLICY IF EXISTS "workspace_isolation_delete" ON email_integrations;
CREATE POLICY "workspace_isolation_delete" ON email_integrations
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Keep service_role bypass policy for admin operations
DROP POLICY IF EXISTS "Service role can manage email integrations" ON email_integrations;
CREATE POLICY "service_role_all_access" ON email_integrations
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 2. SENT_EMAILS TABLE - Fix Overly Permissive Policy
-- =====================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view sent emails" ON sent_emails;

-- Create workspace-scoped SELECT policy
CREATE POLICY "workspace_isolation_select" ON sent_emails
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Create workspace-scoped INSERT policy
DROP POLICY IF EXISTS "workspace_isolation_insert" ON sent_emails;
CREATE POLICY "workspace_isolation_insert" ON sent_emails
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Create workspace-scoped UPDATE policy
DROP POLICY IF EXISTS "workspace_isolation_update" ON sent_emails;
CREATE POLICY "workspace_isolation_update" ON sent_emails
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Keep service_role bypass policy for admin operations
DROP POLICY IF EXISTS "Service role can manage sent emails" ON sent_emails;
CREATE POLICY "service_role_all_access" ON sent_emails
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 3. EMAIL_OPENS TABLE - Fix Overly Permissive Policy
-- =====================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view email opens" ON email_opens;

-- Create policy based on sent_email relationship
CREATE POLICY "workspace_isolation_select" ON email_opens
  FOR SELECT
  USING (
    sent_email_id IN (
      SELECT se.id FROM sent_emails se
      JOIN workspaces w ON se.workspace_id = w.id
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Create INSERT policy for tracking opens
DROP POLICY IF EXISTS "workspace_isolation_insert" ON email_opens;
CREATE POLICY "workspace_isolation_insert" ON email_opens
  FOR INSERT
  WITH CHECK (
    sent_email_id IN (
      SELECT se.id FROM sent_emails se
      JOIN workspaces w ON se.workspace_id = w.id
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Keep service_role bypass policy for admin operations
DROP POLICY IF EXISTS "Service role can manage email opens" ON email_opens;
CREATE POLICY "service_role_all_access" ON email_opens
  FOR ALL
  USING (auth.role() = 'service_role');

-- Allow anonymous INSERT for tracking pixel (public endpoint)
DROP POLICY IF EXISTS "public_tracking_insert" ON email_opens;
CREATE POLICY "public_tracking_insert" ON email_opens
  FOR INSERT
  WITH CHECK (true); -- Allow tracking pixel to record opens

-- =====================================================
-- 4. EMAIL_CLICKS TABLE - Fix Overly Permissive Policy
-- =====================================================

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view email clicks" ON email_clicks;

-- Create policy based on sent_email relationship
CREATE POLICY "workspace_isolation_select" ON email_clicks
  FOR SELECT
  USING (
    sent_email_id IN (
      SELECT se.id FROM sent_emails se
      JOIN workspaces w ON se.workspace_id = w.id
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Create INSERT policy for tracking clicks
DROP POLICY IF EXISTS "workspace_isolation_insert" ON email_clicks;
CREATE POLICY "workspace_isolation_insert" ON email_clicks
  FOR INSERT
  WITH CHECK (
    sent_email_id IN (
      SELECT se.id FROM sent_emails se
      JOIN workspaces w ON se.workspace_id = w.id
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Keep service_role bypass policy for admin operations
DROP POLICY IF EXISTS "Service role can manage email clicks" ON email_clicks;
CREATE POLICY "service_role_all_access" ON email_clicks
  FOR ALL
  USING (auth.role() = 'service_role');

-- Allow anonymous INSERT for tracking links (public endpoint)
DROP POLICY IF EXISTS "public_tracking_insert" ON email_clicks;
CREATE POLICY "public_tracking_insert" ON email_clicks
  FOR INSERT
  WITH CHECK (true); -- Allow tracking link to record clicks

-- =====================================================
-- 5. VERIFICATION
-- =====================================================

DO $$
DECLARE
  email_integrations_policies INTEGER;
  sent_emails_policies INTEGER;
  email_opens_policies INTEGER;
  email_clicks_policies INTEGER;
  total_policies INTEGER;
  overly_permissive_count INTEGER;
BEGIN
  -- Count policies per table
  SELECT COUNT(*) INTO email_integrations_policies
  FROM pg_policies
  WHERE tablename = 'email_integrations';

  SELECT COUNT(*) INTO sent_emails_policies
  FROM pg_policies
  WHERE tablename = 'sent_emails';

  SELECT COUNT(*) INTO email_opens_policies
  FROM pg_policies
  WHERE tablename = 'email_opens';

  SELECT COUNT(*) INTO email_clicks_policies
  FROM pg_policies
  WHERE tablename = 'email_clicks';

  total_policies := email_integrations_policies + sent_emails_policies + email_opens_policies + email_clicks_policies;

  -- Check for any remaining overly permissive policies
  SELECT COUNT(*) INTO overly_permissive_count
  FROM pg_policies
  WHERE tablename IN ('email_integrations', 'sent_emails', 'email_opens', 'email_clicks')
    AND (qual IS NULL OR qual::text = 'true'); -- USING (true) is overly permissive for SELECT

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 045 Complete!';
  RAISE NOTICE '🔒 Security Status:';
  RAISE NOTICE '   email_integrations: % policies', email_integrations_policies;
  RAISE NOTICE '   sent_emails: % policies', sent_emails_policies;
  RAISE NOTICE '   email_opens: % policies', email_opens_policies;
  RAISE NOTICE '   email_clicks: % policies', email_clicks_policies;
  RAISE NOTICE '   Total policies: %', total_policies;
  RAISE NOTICE '';

  IF overly_permissive_count > 0 THEN
    RAISE WARNING '⚠️  WARNING: % overly permissive policies still exist!', overly_permissive_count;
    RAISE WARNING '   Review policies with USING (true) for SELECT operations';
  ELSE
    RAISE NOTICE '✨ SUCCESS: All tables have workspace-scoped security policies!';
    RAISE NOTICE '   Data isolation is now enforced - users can only access their workspace data';
  END IF;

  -- Additional security check
  IF total_policies >= 15 THEN
    RAISE NOTICE '✅ Comprehensive RLS coverage achieved';
  ELSE
    RAISE WARNING '⚠️  Expected at least 15 policies, found %', total_policies;
  END IF;
END $$;

-- =====================================================
-- 6. COMMENTS (Documentation)
-- =====================================================

COMMENT ON POLICY "workspace_isolation_select" ON email_integrations IS 'Users can only view email integrations in their own workspaces';
COMMENT ON POLICY "workspace_isolation_insert" ON email_integrations IS 'Users can only create email integrations in their own workspaces';
COMMENT ON POLICY "workspace_isolation_update" ON email_integrations IS 'Users can only update email integrations in their own workspaces';
COMMENT ON POLICY "workspace_isolation_delete" ON email_integrations IS 'Users can only delete email integrations in their own workspaces';
COMMENT ON POLICY "service_role_all_access" ON email_integrations IS 'Service role can bypass RLS for admin operations';

COMMENT ON POLICY "workspace_isolation_select" ON sent_emails IS 'Users can only view sent emails in their own workspaces';
COMMENT ON POLICY "workspace_isolation_insert" ON sent_emails IS 'Users can only create sent email records in their own workspaces';
COMMENT ON POLICY "workspace_isolation_update" ON sent_emails IS 'Users can only update sent emails in their own workspaces';
COMMENT ON POLICY "service_role_all_access" ON sent_emails IS 'Service role can bypass RLS for admin operations';

COMMENT ON POLICY "workspace_isolation_select" ON email_opens IS 'Users can only view email opens for their workspace sent emails';
COMMENT ON POLICY "workspace_isolation_insert" ON email_opens IS 'Users can only create open records for their workspace sent emails';
COMMENT ON POLICY "service_role_all_access" ON email_opens IS 'Service role can bypass RLS for admin operations';
COMMENT ON POLICY "public_tracking_insert" ON email_opens IS 'Public tracking pixel can record opens (anonymous access)';

COMMENT ON POLICY "workspace_isolation_select" ON email_clicks IS 'Users can only view email clicks for their workspace sent emails';
COMMENT ON POLICY "workspace_isolation_insert" ON email_clicks IS 'Users can only create click records for their workspace sent emails';
COMMENT ON POLICY "service_role_all_access" ON email_clicks IS 'Service role can bypass RLS for admin operations';
COMMENT ON POLICY "public_tracking_insert" ON email_clicks IS 'Public tracking link can record clicks (anonymous access)';

-- =====================================================
-- 7. SECURITY NOTES
-- =====================================================

-- This migration fixes the following security vulnerabilities:
--
-- BEFORE (VULNERABLE):
--   CREATE POLICY "Users can view email integrations" ON email_integrations FOR SELECT USING (true);
--   Result: ANY authenticated user could view ALL email integrations across ALL workspaces
--
-- AFTER (SECURE):
--   CREATE POLICY "workspace_isolation_select" ON email_integrations FOR SELECT USING (workspace_id IN (...));
--   Result: Users can ONLY view email integrations in their own workspaces
--
-- Impact: Prevents data leakage between workspaces
-- Scope: Affects email_integrations, sent_emails, email_opens, email_clicks tables
-- Compatibility: Existing queries must filter by workspace_id (already enforced by app logic)
