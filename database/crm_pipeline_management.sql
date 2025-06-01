-- CRM Pipeline Management Schema
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
    UNIQUE (pipeline_id, name) -- Add unique constraint for conflict resolution
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

-- Pipeline automation rules
CREATE TABLE IF NOT EXISTS pipeline_automations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    trigger_stage_id UUID REFERENCES pipeline_stages(id),
    target_stage_id UUID REFERENCES pipeline_stages(id),
    condition_type VARCHAR(50) NOT NULL, -- 'time', 'action', 'field'
    condition_config JSONB NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'move', 'notify', 'create_task'
    action_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_pipelines_name ON pipelines(name);
CREATE INDEX idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX idx_deals_pipeline_stage ON deals(pipeline_id, stage_id);
CREATE INDEX idx_deals_client ON deals(client_id);
CREATE INDEX idx_deals_owner ON deals(owner_id);
CREATE INDEX idx_deals_status ON deals(status);

-- Enable Row Level Security
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_automations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Enable read access for authenticated users" ON pipelines
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable read access for authenticated users" ON pipeline_stages
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their deals" ON deals
FOR ALL TO authenticated USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON pipeline_automations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for default sales pipeline
INSERT INTO pipelines (name, description, is_default) 
VALUES 
    ('Sales Pipeline', 'Default sales pipeline for new opportunities', true)
ON CONFLICT (name) DO NOTHING;

-- Sample pipeline stages
INSERT INTO pipeline_stages (pipeline_id, name, order_index, probability, color)
SELECT id, 'Lead', 1, 10, '#4a86e8'
FROM pipelines WHERE name = 'Sales Pipeline'
ON CONFLICT (pipeline_id, name) DO NOTHING;

INSERT INTO pipeline_stages (pipeline_id, name, order_index, probability, color)
SELECT id, 'Qualified', 2, 25, '#4285f4'
FROM pipelines WHERE name = 'Sales Pipeline'
ON CONFLICT (pipeline_id, name) DO NOTHING;

INSERT INTO pipeline_stages (pipeline_id, name, order_index, probability, color)
SELECT id, 'Proposal', 3, 50, '#34a853'
FROM pipelines WHERE name = 'Sales Pipeline'
ON CONFLICT (pipeline_id, name) DO NOTHING;

INSERT INTO pipeline_stages (pipeline_id, name, order_index, probability, color)
SELECT id, 'Negotiation', 4, 75, '#fbbc04'
FROM pipelines WHERE name = 'Sales Pipeline'
ON CONFLICT (pipeline_id, name) DO NOTHING;

INSERT INTO pipeline_stages (pipeline_id, name, order_index, probability, color)
SELECT id, 'Closed Won', 5, 100, '#0f9d58'
FROM pipelines WHERE name = 'Sales Pipeline'
ON CONFLICT (pipeline_id, name) DO NOTHING;

INSERT INTO pipeline_stages (pipeline_id, name, order_index, probability, color)
SELECT id, 'Closed Lost', 6, 0, '#ea4335'
FROM pipelines WHERE name = 'Sales Pipeline'
ON CONFLICT (pipeline_id, name) DO NOTHING;
