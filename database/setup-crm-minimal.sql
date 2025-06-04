-- ============================================
-- MINIMAL CRM DATABASE SETUP FOR UNITE GROUP
-- ============================================
-- This script creates only the essential CRM tables
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: Create base tables (no dependencies)
-- ============================================

-- Create clients table first
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    annual_revenue DECIMAL(15, 2),
    client_status VARCHAR(50) DEFAULT 'lead',
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id),
    last_contact_date TIMESTAMP WITH TIME ZONE,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Australia'
);

-- Create pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- STEP 2: Create tables with single dependencies
-- ============================================

-- Create pipeline_stages (depends on pipelines)
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    probability DECIMAL(5,2) CHECK (probability BETWEEN 0 AND 100),
    color VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (pipeline_id, name)
);

-- Create projects (depends on clients)
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'planning',
    priority VARCHAR(20) DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'AUD',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    team_members UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id),
    contract_value DECIMAL(15, 2),
    payment_terms VARCHAR(255),
    deliverables JSONB,
    risks JSONB,
    milestones JSONB
);

-- ============================================
-- STEP 3: Create tables with multiple dependencies
-- ============================================

-- Create deals (depends on clients, pipelines, pipeline_stages)
CREATE TABLE IF NOT EXISTS deals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) CHECK (amount >= 0),
    currency VARCHAR(10) DEFAULT 'AUD',
    pipeline_id UUID NOT NULL REFERENCES pipelines(id),
    stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    owner_id UUID REFERENCES auth.users(id),
    expected_close_date DATE,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_reason TEXT,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
    stage VARCHAR(100) GENERATED ALWAYS AS (
        CASE 
            WHEN status = 'won' THEN 'Closed Won'
            WHEN status = 'lost' THEN 'Closed Lost'
            ELSE 'Active'
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create interactions (depends on clients, projects)
CREATE TABLE IF NOT EXISTS interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    summary TEXT,
    details JSONB,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    next_action VARCHAR(255),
    next_action_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id),
    email_direction VARCHAR(20),
    email_message_id VARCHAR(255),
    meeting_duration INTEGER,
    meeting_location VARCHAR(255),
    attendees JSONB
);

-- Create tasks (depends on clients, projects)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID REFERENCES auth.users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id),
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on UUID[],
    task_type VARCHAR(50),
    attachments JSONB,
    checklist JSONB
);

-- ============================================
-- STEP 4: Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(client_status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_stage ON deals(pipeline_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_client ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_interactions_client ON interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ============================================
-- STEP 5: Enable RLS
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Create basic RLS policies
-- ============================================
-- Allow authenticated users to view all data
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view all clients" ON clients;
    DROP POLICY IF EXISTS "Users can view all projects" ON projects;
    DROP POLICY IF EXISTS "Users can view all pipelines" ON pipelines;
    DROP POLICY IF EXISTS "Users can view all pipeline_stages" ON pipeline_stages;
    DROP POLICY IF EXISTS "Users can view all deals" ON deals;
    DROP POLICY IF EXISTS "Users can view all interactions" ON interactions;
    DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Create view policies
CREATE POLICY "Users can view all clients" ON clients
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all projects" ON projects
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all pipelines" ON pipelines
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all pipeline_stages" ON pipeline_stages
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all deals" ON deals
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all interactions" ON interactions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all tasks" ON tasks
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================
-- STEP 7: Insert default pipeline data
-- ============================================
INSERT INTO pipelines (name, description, is_default) 
VALUES ('Sales Pipeline', 'Default sales pipeline', true)
ON CONFLICT (name) DO NOTHING;

-- Insert pipeline stages
INSERT INTO pipeline_stages (pipeline_id, name, order_index, probability, color)
SELECT 
    p.id,
    stage.name,
    stage.order_index,
    stage.probability,
    stage.color
FROM pipelines p, (
    VALUES 
        ('Lead', 1, 10, '#4a86e8'),
        ('Qualified', 2, 25, '#4285f4'),
        ('Proposal', 3, 50, '#34a853'),
        ('Negotiation', 4, 75, '#fbbc04'),
        ('Closed Won', 5, 100, '#0f9d58'),
        ('Closed Lost', 6, 0, '#ea4335')
) AS stage(name, order_index, probability, color)
WHERE p.name = 'Sales Pipeline'
ON CONFLICT (pipeline_id, name) DO NOTHING;

-- ============================================
-- STEP 8: Create update triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
DROP TRIGGER IF EXISTS update_pipelines_updated_at ON pipelines;
DROP TRIGGER IF EXISTS update_pipeline_stages_updated_at ON pipeline_stages;

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 9: Verify setup
-- ============================================
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    -- Count created tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('clients', 'projects', 'deals', 'tasks', 'interactions', 'pipelines', 'pipeline_stages');
    
    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'CRM SETUP COMPLETE!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Tables created: %', table_count;
    RAISE NOTICE '';
    RAISE NOTICE 'You can now insert sample data or start using the CRM.';
    RAISE NOTICE '====================================';
END $$;
