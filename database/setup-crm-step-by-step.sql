-- ============================================
-- STEP-BY-STEP CRM SETUP
-- ============================================
-- Run each section separately to identify where the error occurs

-- SECTION 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SECTION 2: Create clients table ONLY
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

-- If the above works, continue with:

-- SECTION 3: Create pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SECTION 4: Create pipeline_stages table
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

-- SECTION 5: Create tasks table (minimal version)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- SECTION 6: Create interactions table (minimal version)
CREATE TABLE IF NOT EXISTS interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    interaction_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255),
    summary TEXT,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- SECTION 7: Create deals table (requires clients, pipelines, pipeline_stages)
CREATE TABLE IF NOT EXISTS deals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2) CHECK (amount >= 0),
    currency VARCHAR(10) DEFAULT 'AUD',
    pipeline_id UUID NOT NULL REFERENCES pipelines(id),
    stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    client_id UUID NOT NULL REFERENCES clients(id),
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

-- SECTION 8: Insert default pipeline data
INSERT INTO pipelines (name, description, is_default) 
VALUES ('Sales Pipeline', 'Default sales pipeline', true)
ON CONFLICT (name) DO NOTHING;

-- SECTION 9: Insert pipeline stages
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

-- SECTION 10: Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- SECTION 11: Create basic policies
CREATE POLICY "Users can view all clients" ON clients
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all pipelines" ON pipelines
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all pipeline_stages" ON pipeline_stages
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all deals" ON deals
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all tasks" ON tasks
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all interactions" ON interactions
    FOR SELECT USING (auth.uid() IS NOT NULL);
