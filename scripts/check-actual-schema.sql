-- Check what tables and columns actually exist in the database
-- Run this first to see what we're working with

-- Check projects table columns
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
ORDER BY ordinal_position;

-- Check if projects table exists at all
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'projects'
) as projects_table_exists;

-- Check workspaces table
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'workspaces'
ORDER BY ordinal_position;

-- Check mindmap tables exist
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%mindmap%'
ORDER BY table_name;
