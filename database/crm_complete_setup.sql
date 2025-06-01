-- CRM Complete Setup Script
-- This script safely drops and recreates all CRM-related database objects

-- Drop existing policies first (if they exist)
DO $$ 
BEGIN
    -- Drop clients table policies
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON clients;
    DROP POLICY IF EXISTS "Enable insert for authenticated users" ON clients;
    DROP POLICY IF EXISTS "Enable update for authenticated users" ON clients;
    DROP POLICY IF EXISTS "Enable delete for authenticated users" ON clients;
    
    -- Drop crm_activities policies
    DROP POLICY IF EXISTS "Users can view their activities" ON crm_activities;
    DROP POLICY IF EXISTS "Users can create activities" ON crm_activities;
    
    -- Drop crm_documents policies
    DROP POLICY IF EXISTS "Users can view their documents" ON crm_documents;
    DROP POLICY IF EXISTS "Users can create documents" ON crm_documents;
    DROP POLICY IF EXISTS "Users can update their documents" ON crm_documents;
    
    -- Drop pipeline-related policies
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON pipelines;
    DROP POLICY IF EXISTS "Enable read access for authenticated users" ON pipeline_stages;
    DROP POLICY IF EXISTS "Users can manage their deals" ON deals;
EXCEPTION
    WHEN undefined_table THEN
        -- Tables don't exist yet, continue
        NULL;
END $$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_crm_activities_updated_at ON crm_activities;
DROP TRIGGER IF EXISTS update_pipelines_updated_at ON pipelines;
DROP TRIGGER IF EXISTS update_pipeline_stages_updated_at ON pipeline_stages;
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
DROP TRIGGER IF EXISTS update_automations_updated_at ON pipeline_automations;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_activity_updated_at();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS pipeline_automations CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS pipeline_stages CASCADE;
DROP TABLE IF EXISTS pipelines CASCADE;
DROP TABLE IF EXISTS crm_documents CASCADE;
DROP TABLE IF EXISTS crm_activities CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create clients table
CREATE TABLE clients (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    last_contact_date TIMESTAMP WITH TIME ZONE,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Australia'
);

-- Create indexes for clients
CREATE INDEX idx_clients_status ON clients(client_status);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_company ON clients(company_name);

-- 2. Create activities table
CREATE TABLE crm_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    summary TEXT,
    details JSONB,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    next_action VARCHAR(255),
    next_action_date DATE,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email_direction VARCHAR(20),
    email_message_id VARCHAR(255),
    meeting_duration INTEGER,
    meeting_location VARCHAR(255),
    attendees JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for activities
CREATE INDEX idx_activities_client ON crm_activities(client_id);
CREATE INDEX idx_activities_date ON crm_activities(interaction_date);
CREATE INDEX idx_activities_type ON crm_activities(interaction_type);

-- 3. Create documents table
CREATE TABLE crm_documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_confidential BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    metadata JSONB,
    previous_version UUID REFERENCES crm_documents(id) ON DELETE SET NULL,
    version_notes TEXT
);

-- Create indexes for documents
CREATE INDEX idx_documents_client ON crm_documents(client_id);
CREATE INDEX idx_documents_project ON crm_documents(project_id);
CREATE INDEX idx_documents_type ON crm_documents(document_type);

-- 4. Create pipeline tables
CREATE TABLE pipelines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pipeline_stages (
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

CREATE TABLE deals (
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

CREATE TABLE pipeline_automations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    trigger_stage_id UUID REFERENCES pipeline_stages(id),
    target_stage_id UUID REFERENCES pipeline_stages(id),
    condition_type VARCHAR(50) NOT NULL,
    condition_config JSONB NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for pipeline tables
CREATE INDEX idx_pipelines_name ON pipelines(name);
CREATE INDEX idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX idx_deals_pipeline_stage ON deals(pipeline_id, stage_id);
CREATE INDEX idx_deals_client ON deals(client_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_status ON deals(status);

-- Enable Row Level Security on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_automations ENABLE ROW LEVEL SECURITY;

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON crm_activities
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON pipeline_automations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS Policies
-- Clients policies
CREATE POLICY "read_all_clients" ON clients
FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_clients" ON clients
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "update_clients" ON clients
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "delete_clients" ON clients
FOR DELETE TO authenticated USING (true);

-- Activities policies
CREATE POLICY "view_activities" ON crm_activities
FOR SELECT TO authenticated USING (true);

CREATE POLICY "create_activities" ON crm_activities
FOR INSERT TO authenticated WITH CHECK (auth.uid() = performed_by);

CREATE POLICY "update_activities" ON crm_activities
FOR UPDATE TO authenticated USING (auth.uid() = performed_by);

-- Documents policies
CREATE POLICY "view_documents" ON crm_documents
FOR SELECT TO authenticated USING (true);

CREATE POLICY "create_documents" ON crm_documents
FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "update_documents" ON crm_documents
FOR UPDATE TO authenticated USING (auth.uid() = uploaded_by);

-- Pipeline policies
CREATE POLICY "view_pipelines" ON pipelines
FOR SELECT TO authenticated USING (true);

CREATE POLICY "view_pipeline_stages" ON pipeline_stages
FOR SELECT TO authenticated USING (true);

CREATE POLICY "manage_deals" ON deals
FOR ALL TO authenticated USING (true);

-- Insert default data
INSERT INTO pipelines (name, description, is_default) 
VALUES ('Sales Pipeline', 'Default sales pipeline for new opportunities', true)
ON CONFLICT (name) DO NOTHING;

-- Insert pipeline stages
WITH sales_pipeline AS (
    SELECT id FROM pipelines WHERE name = 'Sales Pipeline' LIMIT 1
)
INSERT INTO pipeline_stages (pipeline_id, name, order_index, probability, color)
SELECT 
    sp.id,
    stage.name,
    stage.order_index,
    stage.probability,
    stage.color
FROM sales_pipeline sp
CROSS JOIN (
    VALUES 
        ('Lead', 1, 10, '#4a86e8'),
        ('Qualified', 2, 25, '#4285f4'),
        ('Proposal', 3, 50, '#34a853'),
        ('Negotiation', 4, 75, '#fbbc04'),
        ('Closed Won', 5, 100, '#0f9d58'),
        ('Closed Lost', 6, 0, '#ea4335')
) AS stage(name, order_index, probability, color)
ON CONFLICT (pipeline_id, name) DO NOTHING;

-- Insert sample clients
INSERT INTO clients (company_name, email, client_status, industry, notes)
VALUES 
    ('Sample Lead Company', 'lead@example.com', 'lead', 'Technology', 'Initial contact from website'),
    ('Active Client Corp', 'active@example.com', 'active', 'Finance', 'Long-term client since 2023')
ON CONFLICT (email) DO NOTHING;

-- Confirmation message
DO $$ 
BEGIN 
    RAISE NOTICE 'CRM setup completed successfully!';
END $$;
