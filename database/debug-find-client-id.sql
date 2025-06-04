-- ============================================
-- DEBUG SCRIPT: Find where client_id is referenced
-- ============================================

-- Check if there are any existing views that reference client_id
SELECT 
    viewname,
    definition
FROM pg_views
WHERE definition LIKE '%client_id%';

-- Check if there are any existing tables with client_id column
SELECT 
    table_name,
    column_name
FROM information_schema.columns
WHERE column_name = 'client_id'
AND table_schema = 'public';

-- Check for any existing functions that might reference client_id
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE prosrc LIKE '%client_id%';

-- Check for any existing triggers
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- List all foreign key constraints that might reference client_id
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (kcu.column_name = 'client_id' OR ccu.column_name = 'client_id');
