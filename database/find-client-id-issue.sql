-- ============================================
-- FIND WHAT'S CAUSING CLIENT_ID ERROR
-- ============================================
-- Run each query separately to identify the issue

-- 1. Check if consultations table exists and has client_id
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'consultations'
ORDER BY ordinal_position;

-- 2. Check for any views referencing client_id
SELECT 
    viewname,
    definition
FROM pg_views
WHERE definition LIKE '%client_id%';

-- 3. Check for any existing foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND kcu.column_name = 'client_id';

-- 4. Check for any triggers that might reference client_id
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND action_statement::text LIKE '%client_id%';

-- 5. Check for any functions that might reference client_id
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE prosrc LIKE '%client_id%'
LIMIT 10;

-- 6. List all tables to see what already exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
