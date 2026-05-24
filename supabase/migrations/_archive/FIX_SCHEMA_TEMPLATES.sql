-- ============================================================================
-- IMMEDIATE FIX: Add missing columns to schema_templates
-- Run this AFTER FIX_CONTENT_OPTIMIZATION_SCHEMA.sql and BEFORE 301
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Starting schema_templates schema fix...';

    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_templates') THEN
        
        -- Add template_name column if missing (old schema uses 'name')
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'schema_templates' 
                      AND column_name = 'template_name') THEN
            ALTER TABLE schema_templates ADD COLUMN template_name text;
            RAISE NOTICE '✓ Added template_name column';
            
            -- Migrate data from 'name' to 'template_name' if 'name' exists
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'schema_templates' 
                      AND column_name = 'name') THEN
                UPDATE schema_templates 
                SET template_name = name 
                WHERE template_name IS NULL;
                RAISE NOTICE '✓ Migrated data from name to template_name';
            END IF;
        ELSE
            RAISE NOTICE '→ template_name column already exists';
        END IF;

        -- Add schema_body column if missing (old schema uses 'template_json')
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'schema_templates' 
                      AND column_name = 'schema_body') THEN
            ALTER TABLE schema_templates ADD COLUMN schema_body jsonb;
            RAISE NOTICE '✓ Added schema_body column';
            
            -- Migrate data from 'template_json' to 'schema_body' if 'template_json' exists
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'schema_templates' 
                      AND column_name = 'template_json') THEN
                UPDATE schema_templates 
                SET schema_body = template_json 
                WHERE schema_body IS NULL;
                RAISE NOTICE '✓ Migrated data from template_json to schema_body';
            END IF;
        ELSE
            RAISE NOTICE '→ schema_body column already exists';
        END IF;

        -- Add founder_business_id column if missing (old schema uses 'workspace_id')
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'schema_templates' 
                      AND column_name = 'founder_business_id') THEN
            ALTER TABLE schema_templates ADD COLUMN founder_business_id uuid;
            RAISE NOTICE '✓ Added founder_business_id column';
            
            -- NOTE: Migration of workspace_id to founder_business_id requires lookup logic
            -- This should be handled separately based on your workspace->business mapping
            RAISE NOTICE '⚠ Manual migration needed: workspace_id → founder_business_id';
        ELSE
            RAISE NOTICE '→ founder_business_id column already exists';
        END IF;

        RAISE NOTICE '==================================================';
        RAISE NOTICE 'Schema templates fix completed!';
        RAISE NOTICE 'You can now run migration 301.';
        RAISE NOTICE '==================================================';

    ELSE
        RAISE NOTICE '! Table schema_templates does not exist yet';
        RAISE NOTICE '! This is expected if you haven''t run migration 276 or 301 yet';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'ERROR: %', SQLERRM;
    RAISE;
END $$;
