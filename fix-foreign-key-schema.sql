-- Fix Foreign Key Relationship Schema Cache
-- Run this in Supabase SQL Editor

-- 1. Verify the foreign key exists
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_organizations'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 2. If the foreign key doesn't exist, create it
DO $$
BEGIN
    -- Drop existing constraint if it exists (to recreate it)
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'user_organizations_org_id_fkey'
    ) THEN
        ALTER TABLE user_organizations
        DROP CONSTRAINT user_organizations_org_id_fkey;
    END IF;

    -- Create the foreign key constraint
    ALTER TABLE user_organizations
    ADD CONSTRAINT user_organizations_org_id_fkey
    FOREIGN KEY (org_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE;

    RAISE NOTICE 'Foreign key constraint created successfully';
END $$;

-- 3. Force PostgREST to reload schema cache
SELECT pg_notify('pgrst', 'reload schema');

-- 4. Wait a moment and verify the relationship works
SELECT
    uo.id,
    uo.user_id,
    uo.org_id,
    uo.role,
    o.name as organization_name
FROM user_organizations uo
JOIN organizations o ON uo.org_id = o.id
LIMIT 5;
