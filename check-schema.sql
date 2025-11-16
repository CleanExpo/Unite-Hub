-- Diagnostic script to check current database schema
-- Run this first to see what exists

-- Check what tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check organizations columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'organizations'
ORDER BY ordinal_position;

-- Check contacts columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contacts'
ORDER BY ordinal_position;

-- Check emails columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'emails'
ORDER BY ordinal_position;

-- Check workspaces columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'workspaces'
ORDER BY ordinal_position;

-- Check if drip_campaigns exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'drip_campaigns'
ORDER BY ordinal_position;
