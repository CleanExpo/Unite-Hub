-- =====================================================
-- DATABASE TYPE DIAGNOSTIC
-- =====================================================
-- Run this in Supabase SQL Editor to check current types

-- Check organizations table
SELECT
  'organizations.id' as column_ref,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
  AND column_name = 'id';

-- Check all tables with org_id foreign keys
SELECT
  table_name || '.org_id' as column_ref,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'org_id'
ORDER BY table_name;

-- Check foreign key constraints
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'organizations'
  AND ccu.column_name = 'id'
ORDER BY tc.table_name;

-- Check if there are any invalid UUID values in organizations.id
-- (This will help determine if conversion is safe)
SELECT
  'organizations' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as valid_uuids,
  COUNT(CASE WHEN id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as invalid_uuids
FROM organizations;

-- Summary
SELECT
  '=== SUMMARY ===' as info,
  CASE
    WHEN (
      SELECT data_type FROM information_schema.columns
      WHERE table_name = 'organizations' AND column_name = 'id'
    ) = 'uuid' THEN '✅ organizations.id is already UUID'
    ELSE '❌ organizations.id is TEXT/VARCHAR - needs migration'
  END as status;
