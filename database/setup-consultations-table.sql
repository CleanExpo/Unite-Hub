-- ============================================
-- CREATE CONSULTATIONS TABLE
-- ============================================
-- This script creates the consultations table that was missing
-- Run this in Supabase SQL Editor

-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    service_type VARCHAR(100) NOT NULL,
    preferred_date TIMESTAMP WITH TIME ZONE NOT NULL,
    preferred_time VARCHAR(50) NOT NULL,
    alternate_date TIMESTAMP WITH TIME ZONE,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    payment_amount DECIMAL(10, 2) DEFAULT 550.00,
    payment_date TIMESTAMP WITH TIME ZONE,
    stripe_payment_id VARCHAR(255),
    consultation_date TIMESTAMP WITH TIME ZONE,
    consultation_duration INTEGER,
    consultation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consultations_email ON consultations(client_email);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(preferred_date);

-- Enable RLS
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view all consultations" ON consultations
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create consultations" ON consultations
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update consultations" ON consultations
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Create update trigger
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample consultations
INSERT INTO consultations (client_name, client_email, company, service_type, preferred_date, preferred_time, message, status)
VALUES 
    ('John Smith', 'john.smith@example.com', 'Tech Corp', 'Web Development', CURRENT_DATE + INTERVAL '3 days', '10:00 AM', 'Need a new company website', 'pending'),
    ('Sarah Johnson', 'sarah.j@example.com', 'Marketing Plus', 'Digital Marketing', CURRENT_DATE + INTERVAL '5 days', '2:00 PM', 'Looking for SEO services', 'confirmed'),
    ('Mike Davis', 'mike.d@example.com', 'Startup Inc', 'Consulting', CURRENT_DATE + INTERVAL '7 days', '3:00 PM', 'Business process optimization', 'pending')
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 'Consultations table created' as status
UNION ALL
SELECT 'Sample data count: ' || COUNT(*)::text FROM consultations;
