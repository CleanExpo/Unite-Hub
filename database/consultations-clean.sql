-- Consultations schema for the Unite Group CRM
-- Clean installation script - drops existing objects first

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_consultations_updated_at ON consultations CASCADE;
DROP TRIGGER IF EXISTS update_availability_schedule_updated_at ON availability_schedule CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can create a consultation" ON consultations;
DROP POLICY IF EXISTS "Public can view consultations" ON consultations;
DROP POLICY IF EXISTS "Public can update consultations" ON consultations;
DROP POLICY IF EXISTS "Public can manage availability schedule" ON availability_schedule;
DROP POLICY IF EXISTS "Public can manage unavailable dates" ON unavailable_dates;

-- Drop existing tables (comment out if you want to preserve data)
-- DROP TABLE IF EXISTS unavailable_dates CASCADE;
-- DROP TABLE IF EXISTS availability_schedule CASCADE;
-- DROP TABLE IF EXISTS consultations CASCADE;

-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  service_type TEXT NOT NULL,
  preferred_date TIMESTAMP WITH TIME ZONE,
  preferred_time TEXT,
  alternate_date TIMESTAMP WITH TIME ZONE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, scheduled, completed, canceled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  -- user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Commented out until auth is set up
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  meeting_notes TEXT,
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid, refunded
  payment_amount NUMERIC(10, 2) DEFAULT 550.00
);

-- Ensure scheduled_at column exists (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name='consultations' AND column_name='scheduled_at'
  ) THEN
    ALTER TABLE consultations ADD COLUMN scheduled_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS consultations_client_email_idx ON consultations(client_email);
CREATE INDEX IF NOT EXISTS consultations_status_idx ON consultations(status);
CREATE INDEX IF NOT EXISTS consultations_created_at_idx ON consultations(created_at);
CREATE INDEX IF NOT EXISTS consultations_scheduled_at_idx ON consultations(scheduled_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for consultations
CREATE TRIGGER update_consultations_updated_at
BEFORE UPDATE ON consultations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create availability schedule table
CREATE TABLE IF NOT EXISTS availability_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Commented out until auth is set up
  consultant_email TEXT NOT NULL, -- Using email instead of user_id for now
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create trigger for availability_schedule
CREATE TRIGGER update_availability_schedule_updated_at
BEFORE UPDATE ON availability_schedule
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create unavailable dates table
CREATE TABLE IF NOT EXISTS unavailable_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Commented out until auth is set up
  consultant_email TEXT NOT NULL, -- Using email instead of user_id for now
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for unavailable_dates
CREATE INDEX IF NOT EXISTS unavailable_dates_consultant_email_idx ON unavailable_dates(consultant_email);
CREATE INDEX IF NOT EXISTS unavailable_dates_date_idx ON unavailable_dates(date);

-- Enable Row Level Security
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE unavailable_dates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can create a consultation" ON consultations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view consultations" ON consultations
  FOR SELECT USING (true);

CREATE POLICY "Public can update consultations" ON consultations
  FOR UPDATE USING (true);

CREATE POLICY "Public can manage availability schedule" ON availability_schedule
  FOR ALL USING (true);

CREATE POLICY "Public can manage unavailable dates" ON unavailable_dates
  FOR ALL USING (true);
