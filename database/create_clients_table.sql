-- Create the 'clients' table if it doesn't exist
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(client_status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_name);

-- Insert sample client data
INSERT INTO clients (company_name, email, client_status, industry, notes)
VALUES 
    ('Sample Lead Company', 'lead@example.com', 'lead', 'Technology', 'Initial contact from website'),
    ('Active Client Corp', 'active@example.com', 'active', 'Finance', 'Long-term client since 2023')
ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security and create access policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE POLICY "Enable read access for authenticated users" ON clients
FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE POLICY "Enable insert for authenticated users" ON clients
FOR INSERT TO authenticated WITH CHECK (true);
