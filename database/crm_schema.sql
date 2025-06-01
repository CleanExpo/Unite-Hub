-- ============================================
-- UNITE GROUP CRM DATABASE SCHEMA
-- ============================================
-- This schema creates the core CRM tables for client management,
-- project tracking, interactions, and tasks.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLIENTS TABLE
-- ============================================
-- Stores client/company information
CREATE TABLE IF NOT EXISTS clients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
    annual_revenue DECIMAL(15, 2),
    client_status VARCHAR(50) DEFAULT 'lead', -- 'lead', 'active', 'inactive', 'archived'
    tags TEXT[], -- Array of tags for categorization
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id),
    last_contact_date TIMESTAMP WITH TIME ZONE,
    
    -- Address information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Australia'
);

-- Create indexes for performance
CREATE INDEX idx_clients_status ON clients(client_status);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_company ON clients(company_name);

-- ============================================
-- PROJECTS TABLE
-- ============================================
-- Stores project information linked to clients
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(100), -- 'software', 'consulting', 'support', etc.
    status VARCHAR(50) DEFAULT 'planning', -- 'planning', 'active', 'on_hold', 'completed', 'cancelled'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),
    currency VARCHAR(3) DEFAULT 'AUD',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    team_members UUID[], -- Array of user IDs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id),
    
    -- Additional fields
    contract_value DECIMAL(15, 2),
    payment_terms VARCHAR(255),
    deliverables JSONB, -- JSON array of deliverables
    risks JSONB, -- JSON array of project risks
    milestones JSONB -- JSON array of project milestones
);

-- Create indexes
CREATE INDEX idx_projects_client ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_dates ON projects(start_date, end_date);

-- ============================================
-- INTERACTIONS TABLE
-- ============================================
-- Stores all client interactions (calls, emails, meetings, notes)
CREATE TABLE IF NOT EXISTS interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- Optional link to project
    interaction_type VARCHAR(50) NOT NULL, -- 'email', 'call', 'meeting', 'note', 'task'
    subject VARCHAR(255),
    summary TEXT,
    details JSONB, -- Additional structured data (duration, attendees, etc.)
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    next_action VARCHAR(255),
    next_action_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id),
    
    -- Email specific fields (when type = 'email')
    email_direction VARCHAR(20), -- 'inbound', 'outbound'
    email_message_id VARCHAR(255),
    
    -- Meeting specific fields (when type = 'meeting')
    meeting_duration INTEGER, -- Duration in minutes
    meeting_location VARCHAR(255),
    attendees JSONB -- Array of attendee information
);

-- Create indexes
CREATE INDEX idx_interactions_client ON interactions(client_id);
CREATE INDEX idx_interactions_project ON interactions(project_id);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_interactions_date ON interactions(interaction_date);

-- ============================================
-- TASKS TABLE
-- ============================================
-- Stores tasks related to projects or clients
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done', 'cancelled'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    assigned_to UUID REFERENCES auth.users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id),
    
    -- Task dependencies and relationships
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on UUID[], -- Array of task IDs this task depends on
    
    -- Additional metadata
    task_type VARCHAR(50), -- 'feature', 'bug', 'improvement', 'research'
    attachments JSONB, -- Array of attachment metadata
    checklist JSONB -- Array of checklist items
);

-- Create indexes
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
-- Stores document references for clients and projects
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(100), -- 'contract', 'proposal', 'invoice', 'report', etc.
    file_path VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(100),
    description TEXT,
    version VARCHAR(50),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    uploaded_by UUID REFERENCES auth.users(id),
    
    -- Document metadata
    tags TEXT[],
    is_confidential BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    metadata JSONB
);

-- Create indexes
CREATE INDEX idx_documents_client ON documents(client_id);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(document_type);

-- ============================================
-- CLIENT_CONSULTATIONS TABLE
-- ============================================
-- Link consultations to clients (extends existing consultations table)
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS follow_up_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'scheduled', 'completed', 'cancelled'
ADD COLUMN IF NOT EXISTS meeting_notes TEXT,
ADD COLUMN IF NOT EXISTS action_items JSONB,
ADD COLUMN IF NOT EXISTS next_steps TEXT;

-- Create index for client consultations
CREATE INDEX IF NOT EXISTS idx_consultations_client ON consultations(client_id);

-- ============================================
-- ACTIVITY_LOG TABLE
-- ============================================
-- Audit trail for all CRM activities
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'client', 'project', 'task', etc.
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted', 'status_changed'
    changes JSONB, -- JSON object with field changes
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    performed_by UUID REFERENCES auth.users(id),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_user ON activity_log(performed_by);
CREATE INDEX idx_activity_date ON activity_log(performed_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can view all clients" ON clients
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create clients" ON clients
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update clients" ON clients
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Projects policies
CREATE POLICY "Users can view all projects" ON projects
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update projects" ON projects
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Interactions policies
CREATE POLICY "Users can view all interactions" ON interactions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create interactions" ON interactions
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Tasks policies
CREATE POLICY "Users can view all tasks" ON tasks
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update assigned tasks" ON tasks
    FOR UPDATE USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- Documents policies
CREATE POLICY "Users can view all documents" ON documents
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can upload documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Activity log policies
CREATE POLICY "Users can view activity logs" ON activity_log
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can create activity logs" ON activity_log
    FOR INSERT WITH CHECK (auth.uid() = performed_by);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to tables
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- Client overview with project count
CREATE OR REPLACE VIEW client_overview AS
SELECT 
    c.*,
    COUNT(DISTINCT p.id) as project_count,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') as active_projects,
    COUNT(DISTINCT i.id) as interaction_count,
    MAX(i.interaction_date) as last_interaction_date
FROM clients c
LEFT JOIN projects p ON c.id = p.client_id
LEFT JOIN interactions i ON c.id = i.client_id
GROUP BY c.id;

-- Project overview with task summary
CREATE OR REPLACE VIEW project_overview AS
SELECT 
    p.*,
    c.company_name as client_name,
    COUNT(DISTINCT t.id) as total_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done') as completed_tasks,
    AVG(t.progress_percentage) as average_task_progress
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, c.company_name;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert sample client statuses
INSERT INTO clients (company_name, email, client_status, industry, notes)
VALUES 
    ('Sample Lead Company', 'lead@example.com', 'lead', 'Technology', 'Initial contact from website'),
    ('Active Client Corp', 'active@example.com', 'active', 'Finance', 'Long-term client since 2023')
ON CONFLICT (email) DO NOTHING;
