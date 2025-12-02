-- =====================================================
-- Migration: 080_workspace_isolation_constraints.sql
-- Purpose: Add database-level workspace isolation enforcement
-- Date: 2025-12-02
-- Risk: MEDIUM (schema changes, requires backfill)
-- =====================================================

-- IMPORTANT: Before running this migration:
-- 1. Check for NULL workspace_id values in all tables
-- 2. Backfill any NULL values with appropriate workspace IDs
-- 3. Test in development environment first
-- 4. Run during low-traffic window

BEGIN;

-- =====================================================
-- STEP 1: Add NOT NULL Constraints
-- =====================================================

-- Check for existing NULL values before adding constraints
DO $$
DECLARE
  null_contacts INT;
  null_emails INT;
  null_campaigns INT;
  null_drip INT;
  null_steps INT;
  null_enrollments INT;
  null_content INT;
BEGIN
  SELECT COUNT(*) INTO null_contacts FROM contacts WHERE workspace_id IS NULL;
  SELECT COUNT(*) INTO null_emails FROM emails WHERE workspace_id IS NULL;
  SELECT COUNT(*) INTO null_campaigns FROM campaigns WHERE workspace_id IS NULL;
  SELECT COUNT(*) INTO null_drip FROM drip_campaigns WHERE workspace_id IS NULL;
  SELECT COUNT(*) INTO null_steps FROM campaign_steps WHERE workspace_id IS NULL;
  SELECT COUNT(*) INTO null_enrollments FROM campaign_enrollments WHERE workspace_id IS NULL;
  SELECT COUNT(*) INTO null_content FROM "generatedContent" WHERE workspace_id IS NULL;

  IF null_contacts > 0 THEN
    RAISE WARNING 'Found % contacts with NULL workspace_id - must backfill first', null_contacts;
  END IF;

  IF null_emails > 0 THEN
    RAISE WARNING 'Found % emails with NULL workspace_id - must backfill first', null_emails;
  END IF;

  IF null_campaigns > 0 THEN
    RAISE WARNING 'Found % campaigns with NULL workspace_id - must backfill first', null_campaigns;
  END IF;

  IF null_drip > 0 THEN
    RAISE WARNING 'Found % drip_campaigns with NULL workspace_id - must backfill first', null_drip;
  END IF;

  IF null_steps > 0 THEN
    RAISE WARNING 'Found % campaign_steps with NULL workspace_id - must backfill first', null_steps;
  END IF;

  IF null_enrollments > 0 THEN
    RAISE WARNING 'Found % campaign_enrollments with NULL workspace_id - must backfill first', null_enrollments;
  END IF;

  IF null_content > 0 THEN
    RAISE WARNING 'Found % generatedContent with NULL workspace_id - must backfill first', null_content;
  END IF;

  -- Only proceed if no NULL values found
  IF null_contacts + null_emails + null_campaigns + null_drip + null_steps + null_enrollments + null_content > 0 THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraints while NULL workspace_id values exist. Run backfill script first.';
  END IF;
END $$;

-- Add NOT NULL constraints (only if no NULL values exist)
ALTER TABLE contacts
  ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE emails
  ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE campaigns
  ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE drip_campaigns
  ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE campaign_steps
  ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE campaign_enrollments
  ALTER COLUMN workspace_id SET NOT NULL;

ALTER TABLE "generatedContent"
  ALTER COLUMN workspace_id SET NOT NULL;

-- =====================================================
-- STEP 2: Add Check Constraints
-- =====================================================

-- Prevent empty UUID strings (some ORMs might pass empty strings instead of NULL)
ALTER TABLE contacts
  ADD CONSTRAINT contacts_workspace_id_not_empty
  CHECK (workspace_id::text != '' AND workspace_id::text != '00000000-0000-0000-0000-000000000000');

ALTER TABLE emails
  ADD CONSTRAINT emails_workspace_id_not_empty
  CHECK (workspace_id::text != '' AND workspace_id::text != '00000000-0000-0000-0000-000000000000');

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_workspace_id_not_empty
  CHECK (workspace_id::text != '' AND workspace_id::text != '00000000-0000-0000-0000-000000000000');

ALTER TABLE drip_campaigns
  ADD CONSTRAINT drip_campaigns_workspace_id_not_empty
  CHECK (workspace_id::text != '' AND workspace_id::text != '00000000-0000-0000-0000-000000000000');

ALTER TABLE campaign_steps
  ADD CONSTRAINT campaign_steps_workspace_id_not_empty
  CHECK (workspace_id::text != '' AND workspace_id::text != '00000000-0000-0000-0000-000000000000');

ALTER TABLE campaign_enrollments
  ADD CONSTRAINT campaign_enrollments_workspace_id_not_empty
  CHECK (workspace_id::text != '' AND workspace_id::text != '00000000-0000-0000-0000-000000000000');

ALTER TABLE "generatedContent"
  ADD CONSTRAINT generatedContent_workspace_id_not_empty
  CHECK (workspace_id::text != '' AND workspace_id::text != '00000000-0000-0000-0000-000000000000');

-- =====================================================
-- STEP 3: Create Foreign Key Constraints
-- =====================================================

-- Ensure workspace_id references valid workspaces
ALTER TABLE contacts
  ADD CONSTRAINT contacts_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE emails
  ADD CONSTRAINT emails_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE campaigns
  ADD CONSTRAINT campaigns_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE drip_campaigns
  ADD CONSTRAINT drip_campaigns_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE campaign_steps
  ADD CONSTRAINT campaign_steps_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE campaign_enrollments
  ADD CONSTRAINT campaign_enrollments_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE "generatedContent"
  ADD CONSTRAINT generatedContent_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 4: Create Composite Indexes for Performance
-- =====================================================

-- Contacts: Most common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_workspace_id_email
  ON contacts(workspace_id, email);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_workspace_id_status
  ON contacts(workspace_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_workspace_id_ai_score
  ON contacts(workspace_id, ai_score DESC)
  WHERE ai_score >= 80;  -- Partial index for hot leads

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_workspace_id_created_at
  ON contacts(workspace_id, created_at DESC);

-- Emails: Common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_workspace_id_contact_id
  ON emails(workspace_id, contact_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_workspace_id_processed
  ON emails(workspace_id, is_processed)
  WHERE is_processed = false;  -- Partial index for unprocessed

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_emails_workspace_id_received_at
  ON emails(workspace_id, received_at DESC);

-- Campaigns: Common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_workspace_id_status
  ON campaigns(workspace_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_workspace_id_created_at
  ON campaigns(workspace_id, created_at DESC);

-- Drip Campaigns: Common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drip_campaigns_workspace_id_status
  ON drip_campaigns(workspace_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drip_campaigns_workspace_id_created_at
  ON drip_campaigns(workspace_id, created_at DESC);

-- Campaign Steps: Join optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_steps_workspace_id_campaign_id
  ON campaign_steps(workspace_id, campaign_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_steps_campaign_id_step_number
  ON campaign_steps(campaign_id, step_number);

-- Campaign Enrollments: Common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_enrollments_workspace_id_status
  ON campaign_enrollments(workspace_id, status)
  WHERE status = 'active';  -- Partial index for active enrollments

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_enrollments_contact_id_campaign_id
  ON campaign_enrollments(contact_id, campaign_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_enrollments_workspace_id_created_at
  ON campaign_enrollments(workspace_id, created_at DESC);

-- Generated Content: Common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generatedContent_workspace_id_status
  ON "generatedContent"(workspace_id, status)
  WHERE status = 'draft';  -- Partial index for drafts

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generatedContent_workspace_id_created_at
  ON "generatedContent"(workspace_id, created_at DESC);

-- =====================================================
-- STEP 5: Create Workspace Context Function
-- =====================================================

-- Function to set workspace context in session
CREATE OR REPLACE FUNCTION set_workspace_context(workspace_uuid uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_workspace_id', workspace_uuid::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current workspace context
CREATE OR REPLACE FUNCTION get_workspace_context()
RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.current_workspace_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- STEP 6: Create Audit Trigger for Cross-Workspace Access
-- =====================================================

-- Function to log cross-workspace access attempts
CREATE OR REPLACE FUNCTION log_workspace_access()
RETURNS TRIGGER AS $$
DECLARE
  current_workspace uuid;
  accessed_workspace uuid;
BEGIN
  -- Get current workspace from context
  current_workspace := get_workspace_context();

  -- Get workspace being accessed
  accessed_workspace := COALESCE(NEW.workspace_id, OLD.workspace_id);

  -- Log if workspaces don't match (potential violation)
  IF current_workspace IS NOT NULL AND current_workspace != accessed_workspace THEN
    INSERT INTO audit_logs (
      org_id,
      action,
      resource,
      resource_id,
      agent,
      status,
      details,
      error_message
    ) VALUES (
      (SELECT org_id FROM workspaces WHERE id = current_workspace),
      'workspace_access_violation',
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      'database_trigger',
      'warning',
      jsonb_build_object(
        'current_workspace', current_workspace,
        'accessed_workspace', accessed_workspace,
        'operation', TG_OP,
        'user', current_user,
        'timestamp', now()
      ),
      'Attempted access to resource in different workspace'
    );

    RAISE WARNING 'Cross-workspace access detected: % in workspace % accessed from workspace %',
      TG_TABLE_NAME, accessed_workspace, current_workspace;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit logging (disabled by default, enable after testing)
-- Uncomment to enable:

-- CREATE TRIGGER contacts_workspace_audit
--   BEFORE INSERT OR UPDATE OR DELETE ON contacts
--   FOR EACH ROW EXECUTE FUNCTION log_workspace_access();

-- CREATE TRIGGER emails_workspace_audit
--   BEFORE INSERT OR UPDATE OR DELETE ON emails
--   FOR EACH ROW EXECUTE FUNCTION log_workspace_access();

-- CREATE TRIGGER campaigns_workspace_audit
--   BEFORE INSERT OR UPDATE OR DELETE ON campaigns
--   FOR EACH ROW EXECUTE FUNCTION log_workspace_access();

-- =====================================================
-- STEP 7: Create Helper Views
-- =====================================================

-- View to identify potential workspace isolation issues
CREATE OR REPLACE VIEW workspace_isolation_violations AS
SELECT
  'contacts' AS table_name,
  id,
  workspace_id,
  email,
  created_at,
  updated_at
FROM contacts
WHERE workspace_id IS NULL OR workspace_id::text = ''

UNION ALL

SELECT
  'emails' AS table_name,
  id,
  workspace_id,
  subject AS email,
  created_at,
  updated_at
FROM emails
WHERE workspace_id IS NULL OR workspace_id::text = ''

UNION ALL

SELECT
  'campaigns' AS table_name,
  id,
  workspace_id,
  name AS email,
  created_at,
  updated_at
FROM campaigns
WHERE workspace_id IS NULL OR workspace_id::text = '';

-- View to analyze workspace usage
CREATE OR REPLACE VIEW workspace_stats AS
SELECT
  w.id AS workspace_id,
  w.name AS workspace_name,
  o.name AS org_name,
  COUNT(DISTINCT c.id) AS contact_count,
  COUNT(DISTINCT e.id) AS email_count,
  COUNT(DISTINCT camp.id) AS campaign_count,
  COUNT(DISTINCT dc.id) AS drip_campaign_count,
  MAX(c.created_at) AS last_contact_created,
  MAX(e.created_at) AS last_email_created
FROM workspaces w
LEFT JOIN organizations o ON w.org_id = o.id
LEFT JOIN contacts c ON c.workspace_id = w.id
LEFT JOIN emails e ON e.workspace_id = w.id
LEFT JOIN campaigns camp ON camp.workspace_id = w.id
LEFT JOIN drip_campaigns dc ON dc.workspace_id = w.id
GROUP BY w.id, w.name, o.name
ORDER BY contact_count DESC;

-- =====================================================
-- STEP 8: Grant Permissions
-- =====================================================

-- Grant execute on workspace context functions to authenticated users
GRANT EXECUTE ON FUNCTION set_workspace_context(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_workspace_context() TO authenticated;

-- Grant select on helper views
GRANT SELECT ON workspace_isolation_violations TO authenticated;
GRANT SELECT ON workspace_stats TO authenticated;

COMMIT;

-- =====================================================
-- Post-Migration Verification
-- =====================================================

-- Run these queries after migration to verify:

-- 1. Check for any remaining NULL workspace_id values
-- SELECT 'contacts' AS table_name, COUNT(*) AS null_count FROM contacts WHERE workspace_id IS NULL
-- UNION ALL
-- SELECT 'emails', COUNT(*) FROM emails WHERE workspace_id IS NULL
-- UNION ALL
-- SELECT 'campaigns', COUNT(*) FROM campaigns WHERE workspace_id IS NULL;

-- 2. Verify indexes were created
-- SELECT schemaname, tablename, indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('contacts', 'emails', 'campaigns', 'drip_campaigns')
--   AND indexname LIKE 'idx_%workspace_id%'
-- ORDER BY tablename, indexname;

-- 3. Check workspace stats
-- SELECT * FROM workspace_stats;

-- 4. Test workspace context functions
-- SELECT set_workspace_context('YOUR-WORKSPACE-UUID');
-- SELECT get_workspace_context();

-- =====================================================
-- Rollback Plan (if needed)
-- =====================================================

-- To rollback this migration:
-- 1. Drop NOT NULL constraints:
--    ALTER TABLE contacts ALTER COLUMN workspace_id DROP NOT NULL;
--    (repeat for all tables)
--
-- 2. Drop check constraints:
--    ALTER TABLE contacts DROP CONSTRAINT contacts_workspace_id_not_empty;
--    (repeat for all tables)
--
-- 3. Drop foreign key constraints:
--    ALTER TABLE contacts DROP CONSTRAINT contacts_workspace_id_fkey;
--    (repeat for all tables)
--
-- 4. Drop indexes:
--    DROP INDEX CONCURRENTLY idx_contacts_workspace_id_email;
--    (repeat for all indexes)
--
-- 5. Drop functions and views:
--    DROP FUNCTION IF EXISTS set_workspace_context(uuid);
--    DROP FUNCTION IF EXISTS get_workspace_context();
--    DROP FUNCTION IF EXISTS log_workspace_access();
--    DROP VIEW IF EXISTS workspace_isolation_violations;
--    DROP VIEW IF EXISTS workspace_stats;
