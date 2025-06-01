-- CRM Activity Tracking Table
CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'email', 'call', 'meeting', 'note'
    subject VARCHAR(255),
    summary TEXT,
    details JSONB,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    next_action VARCHAR(255),
    next_action_date DATE,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Email specific fields
    email_direction VARCHAR(20), -- 'inbound', 'outbound'
    email_message_id VARCHAR(255),
    
    -- Meeting specific fields
    meeting_duration INTEGER, -- Duration in minutes
    meeting_location VARCHAR(255),
    attendees JSONB, -- Array of attendee information
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_activities_client ON crm_activities(client_id);
CREATE INDEX idx_activities_date ON crm_activities(interaction_date);
CREATE INDEX idx_activities_type ON crm_activities(interaction_type);

-- Enable Row Level Security
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their activities" ON crm_activities
FOR SELECT USING (auth.uid() = performed_by);

CREATE POLICY "Users can create activities" ON crm_activities
FOR INSERT WITH CHECK (auth.uid() = performed_by);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_activity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_activities_updated_at
BEFORE UPDATE ON crm_activities
FOR EACH ROW EXECUTE FUNCTION update_activity_updated_at();
