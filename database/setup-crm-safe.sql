-- ============================================
-- SAFE CRM DATABASE SETUP FOR UNITE GROUP
-- ============================================
-- This script safely creates CRM tables, checking for existing ones
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CLIENTS TABLE
-- ============================================
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

-- ============================================
-- 2. PIPELINES & STAGES (needed before deals)
-- ============================================
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

-- ============================================
-- 3. PROJECTS TABLE
-- ============================================
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
-- 4. DEALS TABLE
-- ============================================
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

-- ============================================
-- 5. INTERACTIONS TABLE
-- ============================================
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

-- ============================================
-- 6. TASKS TABLE
-- ============================================
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
-- 7. OTHER TABLES
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    performed_by UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    file_path VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(100),
    description TEXT,
    version VARCHAR(50),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    uploaded_by UUID REFERENCES auth.users(id),
    tags TEXT[],
    is_confidential BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    metadata JSONB
);

-- ============================================
-- UPDATE EXISTING CONSULTATIONS TABLE (if exists)
-- ============================================
DO $$
BEGIN
    -- Check if consultations table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'consultations') THEN
        -- Add client_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'consultations' AND column_name = 'client_id') THEN
            ALTER TABLE consultations ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL;
        END IF;
        
        -- Add project_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'consultations' AND column_name = 'project_id') THEN
            ALTER TABLE consultations ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
        END IF;
        
        -- Add other columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'consultations' AND column_name = 'follow_up_status') THEN
            ALTER TABLE consultations ADD COLUMN follow_up_status VARCHAR(50) DEFAULT 'pending';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'consultations' AND column_name = 'meeting_notes') THEN
            ALTER TABLE consultations ADD COLUMN meeting_notes TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'consultations' AND column_name = 'action_items') THEN
            ALTER TABLE consultations ADD COLUMN action_items JSONB;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'consultations' AND column_name = 'next_steps') THEN
            ALTER TABLE consultations ADD COLUMN next_steps TEXT;
        END IF;
        
        -- Create index if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_consultations_client') THEN
            CREATE INDEX idx_consultations_client ON consultations(client_id);
        END IF;
    END IF;
END $$;

-- ============================================
-- CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(client_status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_interactions_client ON interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_stage ON deals(pipeline_id, stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_client ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES (Drop existing first)
-- ============================================
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view all clients" ON clients;
    DROP POLICY IF EXISTS "Users can view all projects" ON projects;
    DROP POLICY IF EXISTS "Users can view all interactions" ON interactions;
    DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can view all deals" ON deals;
    DROP POLICY IF EXISTS "Users can view pipelines" ON pipelines;
    DROP POLICY IF EXISTS "Users can view pipeline stages" ON pipeline_stages;
    DROP POLICY IF EXISTS "Users can create clients" ON clients;
    DROP POLICY IF EXISTS "Users can update clients" ON clients;
    DROP POLICY IF EXISTS "Users can create projects" ON projects;
    DROP POLICY IF EXISTS "Users can update projects" ON projects;
    DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can create deals" ON deals;
    DROP POLICY IF EXISTS "Users can update deals" ON deals;
    DROP POLICY IF EXISTS "Users can create interactions" ON interactions;
END $$;

-- Create new policies
CREATE POLICY "Users can view all clients" ON clients
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all projects" ON projects
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all interactions" ON interactions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all tasks" ON tasks
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all deals" ON deals
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view pipelines" ON pipelines
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view pipeline stages" ON pipeline_stages
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update clients" ON clients
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update projects" ON projects
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update tasks" ON tasks
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create deals" ON deals
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update deals" ON deals
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create interactions" ON interactions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================
-- Insert default sales pipeline
INSERT INTO pipelines (name, description, is_default) 
VALUES ('Sales Pipeline', 'Default sales pipeline for new opportunities', true)
ON CONFLICT (name) DO NOTHING;

-- Insert pipeline stages
WITH pipeline AS (
    SELECT id FROM pipelines WHERE name = 'Sales Pipeline' LIMIT 1
)
INSERT INTO pipeline_stages (pipeline_id, name, order_index, probability, color)
SELECT 
    pipeline.id,
    stage.name,
    stage.order_index,
    stage.probability,
    stage.color
FROM pipeline, (
    VALUES 
        ('Lead', 1, 10, '#4a86e8'),
        ('Qualified', 2, 25, '#4285f4'),
        ('Proposal', 3, 50, '#34a853'),
        ('Negotiation', 4, 75, '#fbbc04'),
        ('Closed Won', 5, 100, '#0f9d58'),
        ('Closed Lost', 6, 0, '#ea4335')
) AS stage(name, order_index, probability, color)
WHERE pipeline.id IS NOT NULL
ON CONFLICT (pipeline_id, name) DO NOTHING;

-- ============================================
-- CREATE UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
DROP TRIGGER IF EXISTS update_pipelines_updated_at ON pipelines;
DROP TRIGGER IF EXISTS update_pipeline_stages_updated_at ON pipeline_stages;

-- Create triggers
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
-- INSERT SAMPLE DATA (Only if tables are empty)
-- ============================================
-- Insert sample clients only if table is empty
INSERT INTO clients (company_name, email, client_status, industry, notes)
SELECT 'Acme Corporation', 'contact@acme.com', 'active', 'Technology', 'Key enterprise client'
WHERE NOT EXISTS (SELECT 1 FROM clients LIMIT 1);

INSERT INTO clients (company_name, email, client_status, industry, notes)
SELECT 'TechStart Inc', 'info@techstart.com', 'lead', 'Software', 'Potential new client'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE email = 'info@techstart.com');

INSERT INTO clients (company_name, email, client_status, industry, notes)
SELECT 'Global Services Ltd', 'sales@globalservices.com', 'active', 'Consulting', 'Long-term partner'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE email = 'sales@globalservices.com');

-- Insert sample interactions
INSERT INTO interactions (client_id, interaction_type, subject, summary)
SELECT 
    c.id,
    'meeting',
    'Initial consultation',
    'Discussed project requirements and timeline'
FROM clients c
WHERE c.email = 'contact@acme.com'
AND NOT EXISTS (SELECT 1 FROM interactions WHERE client_id = c.id LIMIT 1);

-- Insert sample tasks only if table is empty
INSERT INTO tasks (title, description, status, priority)
SELECT 'Review contract terms', 'Review and finalize contract for Acme Corporation', 'todo', 'high'
WHERE NOT EXISTS (SELECT 1 FROM tasks LIMIT 1);

INSERT INTO tasks (title, description, status, priority)
SELECT 'Prepare project proposal', 'Create detailed proposal for TechStart', 'in-progress', 'medium'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Prepare project proposal');

INSERT INTO tasks (title, description, status, priority)
SELECT 'Schedule follow-up meeting', 'Arrange quarterly review with Global Services', 'todo', 'low'
WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE title = 'Schedule follow-up meeting');

-- Insert sample deals
WITH pipeline_data AS (
    SELECT p.id as pipeline_id, ps.id as stage_id, ps.name as stage_name
    FROM pipelines p
    JOIN pipeline_stages ps ON ps.pipeline_id = p.id
    WHERE p.name = 'Sales Pipeline'
)
INSERT INTO deals (name, description, amount, pipeline_id, stage_id, client_id, status)
SELECT 
    'Enterprise Software Solution',
    'Custom software development project',
    150000,
    pd.pipeline_id,
    pd.stage_id,
    c.id,
    'open'
FROM pipeline_data pd, clients c
WHERE pd.stage_name = 'Proposal' 
AND c.email = 'contact@acme.com'
AND NOT EXISTS (SELECT 1 FROM deals WHERE name = 'Enterprise Software Solution');

-- ============================================
-- FINAL STATUS CHECK
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'CRM Setup Complete!';
    RAISE NOTICE '==================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '- clients: % rows', (SELECT COUNT(*) FROM clients);
    RAISE NOTICE '- projects: % rows', (SELECT COUNT(*) FROM projects);
    RAISE NOTICE '- deals: % rows', (SELECT COUNT(*) FROM deals);
    RAISE NOTICE '- tasks: % rows', (SELECT COUNT(*) FROM tasks);
    RAISE NOTICE '- interactions: % rows', (SELECT COUNT(*) FROM interactions);
    RAISE NOTICE '- pipelines: % rows', (SELECT COUNT(*) FROM pipelines);
    RAISE NOTICE '- pipeline_stages: % rows', (SELECT COUNT(*) FROM pipeline_stages);
END $$;
