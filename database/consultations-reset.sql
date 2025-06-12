-- Consultations schema for the Unite Group CRM
-- Complete reset script - handles existing database state

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, check if tables exist and drop policies if they do
DO $$
BEGIN
  -- Drop policies for consultations if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'consultations') THEN
    DROP POLICY IF EXISTS "Anyone can create a consultation" ON consultations;
    DROP POLICY IF EXISTS "Public can view consultations" ON consultations;
    DROP POLICY IF EXISTS "Public can update consultations" ON consultations;
  END IF;
  
  -- Drop policies for availability_schedule if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'availability_schedule') THEN
    DROP POLICY IF EXISTS "Public can manage availability schedule" ON availability_schedule;
  END IF;
  
  -- Drop policies for unavailable_dates if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'unavailable_dates') THEN
    DROP POLICY IF EXISTS "Public can manage unavailable dates" ON unavailable_dates;
  END IF;
END $$;

-- Drop existing triggers if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'consultations') THEN
    DROP TRIGGER IF EXISTS update_consultations_updated_at ON consultations CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'availability_schedule') THEN
    DROP TRIGGER IF EXISTS update_availability_schedule_updated_at ON availability_schedule CASCADE;
  END IF;
END $$;

-- Drop existing tables to ensure clean state
DROP TABLE IF EXISTS unavailable_dates CASCADE;
DROP TABLE IF EXISTS availability_schedule CASCADE;
DROP TABLE IF EXISTS consultations CASCADE;
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create consultations table
CREATE TABLE consultations (
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
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  meeting_notes TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  payment_amount NUMERIC(10, 2) DEFAULT 550.00
);

-- Create indexes
CREATE INDEX consultations_client_email_idx ON consultations(client_email);
CREATE INDEX consultations_status_idx ON consultations(status);
CREATE INDEX consultations_created_at_idx ON consultations(created_at);
CREATE INDEX consultations_scheduled_at_idx ON consultations(scheduled_at);

-- Create trigger for consultations
CREATE TRIGGER update_consultations_updated_at
BEFORE UPDATE ON consultations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create availability schedule table
CREATE TABLE availability_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_email TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
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
CREATE TABLE unavailable_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultant_email TEXT NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for unavailable_dates
CREATE INDEX unavailable_dates_consultant_email_idx ON unavailable_dates(consultant_email);
CREATE INDEX unavailable_dates_date_idx ON unavailable_dates(date);

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

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Consultations schema created successfully!';
END $$;
