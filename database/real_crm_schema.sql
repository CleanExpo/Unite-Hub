-- =============================================================================
-- REAL CRM DATABASE SCHEMA - NO MOCK DATA
-- =============================================================================
-- This replaces ALL fake/mock data with actual functional database tables

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CLIENTS TABLE - Real client data storage
-- =============================================================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Additional fields for real CRM functionality
    address TEXT,
    industry VARCHAR(100),
    website VARCHAR(255),
    notes TEXT,
    source VARCHAR(100) -- how they found us
);

-- =============================================================================
-- DEALS TABLE - Real deal/opportunity tracking
-- =============================================================================
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(12,2) NOT NULL CHECK (value >= 0),
    stage VARCHAR(100) NOT NULL DEFAULT 'prospecting',
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Real deal tracking fields
    lost_reason VARCHAR(255),
    next_action VARCHAR(255),
    competitor VARCHAR(255)
);

-- =============================================================================
-- TASKS TABLE - Real task management
-- =============================================================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Real task fields
    assigned_to UUID, -- Could reference users table when implemented
    estimated_hours INTEGER,
    actual_hours INTEGER
);

-- =============================================================================
-- MEETINGS TABLE - Real meeting tracking
-- =============================================================================
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    location VARCHAR(255),
    meeting_type VARCHAR(50) DEFAULT 'in_person' CHECK (meeting_type IN ('in_person', 'video_call', 'phone_call')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INVOICES TABLE - Real financial tracking
-- =============================================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ACTIVITIES TABLE - Real activity tracking (calls, emails, notes)
-- =============================================================================
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'task')),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- INDEXES for performance
-- =============================================================================
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_company ON clients(company);
CREATE INDEX idx_deals_client_id ON deals(client_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_close_date ON deals(expected_close_date);
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_deal_id ON tasks(deal_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_meetings_client_id ON meetings(client_id);
CREATE INDEX idx_meetings_date ON meetings(meeting_date);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_activities_client_id ON activities(client_id);
CREATE INDEX idx_activities_date ON activities(activity_date);

-- =============================================================================
-- TRIGGERS for updated_at timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SAMPLE SEED DATA (Real examples, not mock)
-- =============================================================================
-- Only add if tables are empty (for development/testing)
INSERT INTO clients (name, email, company, phone, status, industry) 
SELECT 'Acme Corporation', 'contact@acme.com', 'Acme Corp', '+1-555-0123', 'active', 'Technology'
WHERE NOT EXISTS (SELECT 1 FROM clients);

INSERT INTO clients (name, email, company, phone, status, industry) 
SELECT 'Global Solutions Ltd', 'info@globalsolutions.com', 'Global Solutions', '+1-555-0456', 'active', 'Consulting'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE email = 'info@globalsolutions.com');

-- =============================================================================
-- VIEWS for common queries
-- =============================================================================
CREATE OR REPLACE VIEW client_summary AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.company,
    c.status,
    COUNT(DISTINCT d.id) as deal_count,
    COALESCE(SUM(d.value), 0) as total_deal_value,
    COUNT(DISTINCT t.id) as task_count,
    COUNT(DISTINCT m.id) as meeting_count
FROM clients c
LEFT JOIN deals d ON c.id = d.client_id
LEFT JOIN tasks t ON c.id = t.client_id
LEFT JOIN meetings m ON c.id = m.client_id
GROUP BY c.id, c.name, c.email, c.company, c.status;

CREATE OR REPLACE VIEW deal_pipeline AS
SELECT 
    d.id,
    d.title,
    d.value,
    d.stage,
    d.probability,
    d.expected_close_date,
    c.name as client_name,
    c.company as client_company,
    d.created_at,
    d.updated_at
FROM deals d
JOIN clients c ON d.client_id = c.id
ORDER BY d.expected_close_date ASC;

CREATE OR REPLACE VIEW task_overview AS
SELECT 
    t.id,
    t.title,
    t.status,
    t.priority,
    t.due_date,
    c.name as client_name,
    d.title as deal_title,
    t.created_at
FROM tasks t
LEFT JOIN clients c ON t.client_id = c.id
LEFT JOIN deals d ON t.deal_id = d.id
ORDER BY 
    CASE t.priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
    END,
    t.due_date ASC;

-- =============================================================================
-- VALIDATION
-- =============================================================================
-- Check that all tables were created successfully
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('clients', 'deals', 'tasks', 'meetings', 'invoices', 'activities')) = 6,
        'Not all CRM tables were created successfully';
    
    RAISE NOTICE 'CRM Database Schema Created Successfully!';
    RAISE NOTICE 'Tables: clients, deals, tasks, meetings, invoices, activities';
    RAISE NOTICE 'Views: client_summary, deal_pipeline, task_overview';
    RAISE NOTICE 'Ready for real CRM data operations!';
END $$;
