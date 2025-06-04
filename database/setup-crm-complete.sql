-- ============================================
-- COMPLETE CRM DATABASE SETUP FOR UNITE GROUP
-- ============================================
-- This script creates ALL required tables for the CRM system
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CLIENTS TABLE (from crm_schema.sql)
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
-- 2. PROJECTS TABLE (from crm_schema.sql)
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
-- 3. INTERACTIONS TABLE (from crm_schema.sql)
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
-- 4. TASKS TABLE (from crm_schema.sql)
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
-- 5. PIPELINE TABLES (from crm_pipeline_management.sql)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. ACTIVITY LOG TABLE (from crm_schema.sql)
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

-- ============================================
-- 7. DOCUMENTS TABLE (from crm_schema.sql)
-- ============================================
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
-- CREATE RLS POLICIES
-- ============================================
-- Allow authenticated users to read all data
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

-- Allow authenticated users to create/update/delete
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
ON CONFLICT (pipeline_id, name) DO NOTHING;

-- Insert sample data for testing
INSERT INTO clients (company_name, email, client_status, industry, notes)
VALUES 
    ('Acme Corporation', 'contact@acme.com', 'active', 'Technology', 'Key enterprise client'),
    ('TechStart Inc', 'info@techstart.com', 'lead', 'Software', 'Potential new client'),
    ('Global Services Ltd', 'sales@globalservices.com', 'active', 'Consulting', 'Long-term partner')
ON CONFLICT (email) DO NOTHING;

-- Insert sample interactions
INSERT INTO interactions (client_id, interaction_type, subject, summary)
SELECT 
    c.id,
    'meeting',
    'Initial consultation',
    'Discussed project requirements and timeline'
FROM clients c
WHERE c.email = 'contact@acme.com'
ON CONFLICT DO NOTHING;

-- Insert sample tasks
INSERT INTO tasks (title, description, status, priority)
VALUES 
    ('Review contract terms', 'Review and finalize contract for Acme Corporation', 'todo', 'high'),
    ('Prepare project proposal', 'Create detailed proposal for TechStart', 'in-progress', 'medium'),
    ('Schedule follow-up meeting', 'Arrange quarterly review with Global Services', 'todo', 'low')
ON CONFLICT DO NOTHING;

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
WHERE pd.stage_name = 'Proposal' AND c.email = 'contact@acme.com'
ON CONFLICT DO NOTHING;

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

-- Apply triggers to all tables with updated_at
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
