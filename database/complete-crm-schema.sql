-- 🚀 COMPLETE CRM SCHEMA - ALL CRITICAL ENTITIES
-- Supports: Client Management, Staff Management, Deal Pipeline, Task Management, Invoicing

-- ============================================================================
-- 1. CORE USER & AUTHENTICATION TABLES
-- ============================================================================

-- Enhanced user profiles with role-based access
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    
    -- Role and permissions
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'manager', 'staff', 'user')),
    permissions JSONB DEFAULT '{}',
    
    -- Contact information
    phone TEXT,
    job_title TEXT,
    department TEXT,
    
    -- System fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Staff hierarchy and reporting structure
CREATE TABLE IF NOT EXISTS staff_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. CLIENT MANAGEMENT TABLES
-- ============================================================================

-- Main clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    
    -- Contact details
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Australia',
    
    -- Business information
    industry TEXT,
    company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-1000', '1000+')),
    annual_revenue DECIMAL(15,2),
    
    -- CRM fields
    source TEXT, -- How they found us
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'prospect', 'customer', 'churned')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Assigned staff
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Financial tracking
    total_revenue DECIMAL(15,2) DEFAULT 0,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    average_order_value DECIMAL(15,2) DEFAULT 0,
    
    -- Engagement tracking
    last_contact_date TIMESTAMP WITH TIME ZONE,
    last_contact_type TEXT,
    next_follow_up TIMESTAMP WITH TIME ZONE,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    
    -- Additional data
    tags TEXT[],
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT valid_client_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Client contact history
CREATE TABLE IF NOT EXISTS client_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    contact_type TEXT NOT NULL CHECK (contact_type IN ('call', 'email', 'meeting', 'note', 'task', 'document')),
    subject TEXT NOT NULL,
    description TEXT,
    
    -- Contact details
    contact_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_minutes INTEGER,
    outcome TEXT,
    
    -- Staff tracking
    created_by UUID REFERENCES user_profiles(id),
    attendees UUID[], -- Array of user_profile IDs
    
    -- Follow-up
    requires_follow_up BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_assigned_to UUID REFERENCES user_profiles(id),
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Client documents and files
CREATE TABLE IF NOT EXISTS client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    
    -- Document details
    document_type TEXT CHECK (document_type IN ('contract', 'invoice', 'proposal', 'report', 'other')),
    description TEXT,
    
    -- Access control
    uploaded_by UUID REFERENCES user_profiles(id),
    is_public BOOLEAN DEFAULT false,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- 3. DEAL PIPELINE TABLES
-- ============================================================================

-- Pipeline stages configuration
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    stage_order INTEGER NOT NULL,
    probability DECIMAL(5,2) DEFAULT 0, -- Win probability percentage
    color TEXT DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT true,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pipeline stages
INSERT INTO pipeline_stages (name, description, stage_order, probability, color) 
VALUES 
    ('Lead', 'Initial contact or inquiry', 1, 10, '#ef4444'),
    ('Qualified', 'Lead has been qualified and shows interest', 2, 25, '#f59e0b'),
    ('Proposal', 'Proposal sent to client', 3, 50, '#3b82f6'),
    ('Negotiation', 'In active negotiation', 4, 75, '#8b5cf6'),
    ('Closed Won', 'Deal successfully closed', 5, 100, '#10b981'),
    ('Closed Lost', 'Deal was not successful', 6, 0, '#6b7280')
ON CONFLICT DO NOTHING;

-- Main deals table
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    title TEXT NOT NULL,
    description TEXT,
    
    -- Client and assignment
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Financial details
    value DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'AUD',
    probability DECIMAL(5,2) DEFAULT 50, -- Win probability
    
    -- Pipeline tracking
    stage_id UUID REFERENCES pipeline_stages(id),
    previous_stage_id UUID REFERENCES pipeline_stages(id),
    stage_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timeline
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Status
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'on_hold')),
    
    -- Source and competition
    source TEXT, -- How the deal originated
    competitors TEXT[],
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    
    -- Additional data
    tags TEXT[],
    metadata JSONB DEFAULT '{}'
);

-- Deal activities and notes
CREATE TABLE IF NOT EXISTS deal_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('note', 'call', 'email', 'meeting', 'stage_change', 'value_change')),
    description TEXT NOT NULL,
    
    -- Activity details
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- If stage change
    old_stage_id UUID REFERENCES pipeline_stages(id),
    new_stage_id UUID REFERENCES pipeline_stages(id),
    
    -- If value change
    old_value DECIMAL(15,2),
    new_value DECIMAL(15,2),
    
    -- Staff tracking
    created_by UUID REFERENCES user_profiles(id),
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- 4. TASK MANAGEMENT TABLES
-- ============================================================================

-- Task categories
CREATE TABLE IF NOT EXISTS task_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default task categories
INSERT INTO task_categories (name, description, color) 
VALUES 
    ('Sales Follow-up', 'Sales related tasks and follow-ups', '#10b981'),
    ('Client Support', 'Customer support and service tasks', '#3b82f6'),
    ('Administrative', 'Administrative and operational tasks', '#6b7280'),
    ('Meeting Preparation', 'Tasks related to meeting preparation', '#8b5cf6'),
    ('Project Work', 'Project-related tasks and deliverables', '#f59e0b')
ON CONFLICT DO NOTHING;

-- Main tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic information
    title TEXT NOT NULL,
    description TEXT,
    
    -- Assignment and ownership
    assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES user_profiles(id),
    
    -- Categorization
    category_id UUID REFERENCES task_categories(id),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Status and progress
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Timeline
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Relationships
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    
    -- Additional data
    tags TEXT[],
    metadata JSONB DEFAULT '{}'
);

-- Task comments and updates
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    
    -- Staff tracking
    created_by UUID REFERENCES user_profiles(id),
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- 5. INVOICE AND BILLING TABLES
-- ============================================================================

-- Invoice templates
CREATE TABLE IF NOT EXISTS invoice_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

-- Main invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Invoice identification
    invoice_number TEXT NOT NULL UNIQUE,
    
    -- Client and deal relationship
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
    
    -- Financial details
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 10, -- GST rate
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'AUD',
    
    -- Status and timeline
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- Payment details
    payment_method TEXT,
    payment_reference TEXT,
    
    -- Staff tracking
    created_by UUID REFERENCES user_profiles(id),
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional data
    notes TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Item details
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. SYSTEM CONFIGURATION TABLES
-- ============================================================================

-- System settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES user_profiles(id)
);

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Activity details
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    
    -- User tracking
    user_id UUID REFERENCES user_profiles(id),
    user_email TEXT,
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    
    -- Request details
    ip_address INET,
    user_agent TEXT,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional context
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON user_profiles(is_active);

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);

-- Deals indexes
CREATE INDEX IF NOT EXISTS idx_deals_client_id ON deals(client_id);
CREATE INDEX IF NOT EXISTS idx_deals_assigned_to ON deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(expected_close_date);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal_id ON tasks(deal_id);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- Clients policies - staff can see clients assigned to them or they created
CREATE POLICY "Staff can view assigned clients" ON clients
    FOR SELECT USING (
        assigned_to IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        created_by IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'manager')
        )
    );

-- Deals policies
CREATE POLICY "Staff can view assigned deals" ON deals
    FOR SELECT USING (
        assigned_to IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        created_by IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'manager')
        )
    );

-- Tasks policies
CREATE POLICY "Users can view assigned tasks" ON tasks
    FOR SELECT USING (
        assigned_to IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        created_by IN (
            SELECT id FROM user_profiles WHERE user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'manager')
        )
    );

-- ============================================================================
-- 9. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activity logging function
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_log (
        action,
        entity_type,
        entity_id,
        user_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        auth.uid(),
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply activity logging triggers to key tables
CREATE TRIGGER log_clients_activity AFTER INSERT OR UPDATE OR DELETE ON clients FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_deals_activity AFTER INSERT OR UPDATE OR DELETE ON deals FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_tasks_activity AFTER INSERT OR UPDATE OR DELETE ON tasks FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_invoices_activity AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION log_activity();

-- ============================================================================
-- SCHEMA COMPLETION SUCCESS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🚀 COMPLETE CRM SCHEMA SUCCESSFULLY CREATED!';
    RAISE NOTICE '✅ Tables: %, %, %, %, %, %, %, %, %, %, %, %, %, %', 
        'user_profiles', 'staff_hierarchy', 'clients', 'client_contacts', 'client_documents',
        'pipeline_stages', 'deals', 'deal_activities', 'task_categories', 'tasks', 'task_comments',
        'invoice_templates', 'invoices', 'invoice_items', 'system_settings', 'activity_log';
    RAISE NOTICE '🔐 RLS Policies: Enabled for data security';
    RAISE NOTICE '📊 Indexes: Created for optimal performance';
    RAISE NOTICE '🔄 Triggers: Active for timestamps and audit logging';
    RAISE NOTICE '🎯 Ready for: Client Management, Staff Management, Deal Pipeline, Task Management, Invoicing';
END $$;
