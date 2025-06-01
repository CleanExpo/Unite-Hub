-- CRM Cleanup Script
-- Use this to completely remove all CRM-related objects from the database

-- Drop all policies first
DO $$ 
BEGIN
    -- Drop clients table policies
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON clients;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON clients;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON clients;
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON clients;
    DROP POLICY IF EXISTS "read_all_clients" ON clients;
    DROP POLICY IF EXISTS "insert_clients" ON clients;
    DROP POLICY IF EXISTS "update_clients" ON clients;
    DROP POLICY IF EXISTS "delete_clients" ON clients;
    
    -- Drop crm_activities policies
    DROP POLICY IF EXISTS "Users can view their activities" ON crm_activities;
    DROP POLICY IF EXISTS "Users can create activities" ON crm_activities;
    DROP POLICY IF EXISTS "view_activities" ON crm_activities;
    DROP POLICY IF EXISTS "create_activities" ON crm_activities;
    DROP POLICY IF EXISTS "update_activities" ON crm_activities;
    
    -- Drop crm_documents policies
    DROP POLICY IF EXISTS "Users can view their documents" ON crm_documents;
    DROP POLICY IF EXISTS "Users can create documents" ON crm_documents;
    DROP POLICY IF EXISTS "Users can update their documents" ON crm_documents;
    DROP POLICY IF EXISTS "view_documents" ON crm_documents;
    DROP POLICY IF EXISTS "create_documents" ON crm_documents;
    DROP POLICY IF EXISTS "update_documents" ON crm_documents;
    
    -- Drop pipeline-related policies
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON pipelines;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON pipeline_stages;
    DROP POLICY IF EXISTS "Users can manage their deals" ON deals;
    DROP POLICY IF EXISTS "view_pipelines" ON pipelines;
    DROP POLICY IF EXISTS "view_pipeline_stages" ON pipeline_stages;
    DROP POLICY IF EXISTS "manage_deals" ON deals;
EXCEPTION
    WHEN undefined_table THEN
        -- Tables don't exist, continue
        NULL;
END $$;

-- Drop all triggers
DROP TRIGGER IF EXISTS update_crm_activities_updated_at ON crm_activities;
DROP TRIGGER IF EXISTS update_pipelines_updated_at ON pipelines;
DROP TRIGGER IF EXISTS update_pipeline_stages_updated_at ON pipeline_stages;
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
DROP TRIGGER IF EXISTS update_automations_updated_at ON pipeline_automations;

-- Drop all functions
DROP FUNCTION IF EXISTS update_activity_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS pipeline_automations CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS pipeline_stages CASCADE;
DROP TABLE IF EXISTS pipelines CASCADE;
DROP TABLE IF EXISTS crm_documents CASCADE;
DROP TABLE IF EXISTS crm_activities CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Confirmation
DO $$ 
BEGIN 
    RAISE NOTICE 'CRM cleanup completed. All CRM tables and related objects have been removed.';
END $$;
