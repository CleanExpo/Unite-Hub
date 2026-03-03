-- Contractor Availability Database Schema
-- Australian-first design with QLD focus

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Australian States Enum
CREATE TYPE australian_state AS ENUM (
  'QLD',  -- Queensland (default for Brisbane)
  'NSW',  -- New South Wales
  'VIC',  -- Victoria
  'SA',   -- South Australia
  'WA',   -- Western Australia
  'TAS',  -- Tasmania
  'NT',   -- Northern Territory
  'ACT'   -- Australian Capital Territory
);

-- Availability Status Enum
CREATE TYPE availability_status AS ENUM (
  'available',
  'booked',
  'tentative',
  'unavailable'
);

-- Contractors Table
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) NOT NULL,  -- Format: 04XX XXX XXX (Australian mobile)
  abn VARCHAR(20),               -- Format: XX XXX XXX XXX (Australian Business Number)
  email VARCHAR(255),
  specialisation VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT mobile_format CHECK (mobile ~ '^04\d{2} \d{3} \d{3}$'),
  CONSTRAINT abn_format CHECK (abn IS NULL OR abn ~ '^\d{2} \d{3} \d{3} \d{3}$'),
  CONSTRAINT email_format CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Availability Slots Table
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,      -- AEST timezone (UTC+10)
  start_time TIME NOT NULL,        -- 24-hour format
  end_time TIME NOT NULL,          -- 24-hour format
  suburb VARCHAR(100) NOT NULL,    -- Brisbane suburb (e.g., Indooroopilly)
  state australian_state NOT NULL DEFAULT 'QLD',
  postcode VARCHAR(4),             -- Australian 4-digit postcode
  status availability_status NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT end_after_start CHECK (end_time > start_time),
  CONSTRAINT postcode_format CHECK (postcode IS NULL OR postcode ~ '^\d{4}$')
);

-- Indexes for performance
CREATE INDEX idx_contractors_mobile ON contractors(mobile);
CREATE INDEX idx_contractors_abn ON contractors(abn);
CREATE INDEX idx_availability_slots_contractor_id ON availability_slots(contractor_id);
CREATE INDEX idx_availability_slots_date ON availability_slots(date);
CREATE INDEX idx_availability_slots_suburb_state ON availability_slots(suburb, state);
CREATE INDEX idx_availability_slots_status ON availability_slots(status);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to contractors
CREATE TRIGGER update_contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE contractors IS 'Contractors with Australian mobile/ABN format';
COMMENT ON TABLE availability_slots IS 'Availability slots with Brisbane/QLD location focus';
COMMENT ON COLUMN contractors.mobile IS 'Australian mobile format: 04XX XXX XXX';
COMMENT ON COLUMN contractors.abn IS 'Australian Business Number: XX XXX XXX XXX';
COMMENT ON COLUMN availability_slots.date IS 'AEST timezone (UTC+10)';
COMMENT ON COLUMN availability_slots.suburb IS 'Brisbane suburbs (Indooroopilly, Toowong, etc.)';
COMMENT ON COLUMN availability_slots.state IS 'Australian state, default QLD (Queensland)';
