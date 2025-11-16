-- ==================================================
-- Database Cleanup Script
-- Removes invalid UUID organizations
-- Run this in Supabase SQL Editor
-- ==================================================

-- STEP 1: Inspect Invalid Organizations
-- Run this first to see what will be deleted
SELECT
    id,
    name,
    created_at,
    'INVALID UUID' as issue
FROM organizations
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Expected: Should show "default-org" and any other invalid UUIDs

-- STEP 2: Check User Organizations
SELECT
    uo.id,
    uo.user_id,
    uo.org_id,
    uo.role,
    u.email as user_email,
    'LINKED TO INVALID ORG' as issue
FROM user_organizations uo
LEFT JOIN user_profiles u ON u.id = uo.user_id
WHERE uo.org_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Expected: Shows users linked to invalid organizations

-- STEP 3: Check Workspaces
SELECT
    id,
    name,
    org_id,
    created_at,
    'INVALID ORG_ID' as issue
FROM workspaces
WHERE org_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Expected: Shows workspaces with invalid org_id

-- ==================================================
-- CLEANUP (RUN AFTER INSPECTION)
-- ==================================================

BEGIN;

-- STEP 4: Delete user_organizations entries
DELETE FROM user_organizations
WHERE org_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- STEP 5: Delete workspaces
DELETE FROM workspaces
WHERE org_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- STEP 6: Delete contacts (if they exist)
DELETE FROM contacts
WHERE workspace_id IN (
    SELECT id FROM workspaces
    WHERE org_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- STEP 7: Delete campaigns (if they exist)
DELETE FROM campaigns
WHERE workspace_id IN (
    SELECT id FROM workspaces
    WHERE org_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- STEP 8: Delete organizations
DELETE FROM organizations
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- STEP 9: Verify cleanup
SELECT COUNT(*) as total_orgs FROM organizations;
SELECT COUNT(*) as valid_orgs FROM organizations
WHERE id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

COMMIT;

-- Expected: All counts should show only valid UUID organizations

-- ==================================================
-- POST-CLEANUP VERIFICATION
-- ==================================================

-- Verify no invalid UUIDs remain
SELECT
    'organizations' as table_name,
    COUNT(*) as invalid_count
FROM organizations
WHERE id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
UNION ALL
SELECT
    'workspaces' as table_name,
    COUNT(*) as invalid_count
FROM workspaces
WHERE org_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
UNION ALL
SELECT
    'user_organizations' as table_name,
    COUNT(*) as invalid_count
FROM user_organizations
WHERE org_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Expected: All counts should be 0

-- ==================================================
-- NOTES
-- ==================================================
-- After running this script:
-- 1. Clear browser localStorage: localStorage.clear()
-- 2. Log out and log back in
-- 3. New organizations will be created with proper UUIDs
-- 4. Test workspace isolation
