-- Consultations schema for the Unite Group CRM

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Ensure scheduled_at column exists (addresses migration for existing tables)
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS consultations_client_email_idx ON consultations(client_email);
CREATE INDEX IF NOT EXISTS consultations_status_idx ON consultations(status);
-- CREATE INDEX IF NOT EXISTS consultations_user_id_idx ON consultations(user_id); -- Commented out until auth is set up
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

-- Drop and recreate trigger for consultations
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_consultations_updated_at'
  ) THEN
    DROP TRIGGER update_consultations_updated_at ON consultations;
  END IF;
END $$;

CREATE TRIGGER update_consultations_updated_at
BEFORE UPDATE ON consultations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create availability schedule table (for consultants)
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

-- Drop and recreate trigger for availability_schedule
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_availability_schedule_updated_at'
  ) THEN
    DROP TRIGGER update_availability_schedule_updated_at ON availability_schedule;
  END IF;
END $$;

CREATE TRIGGER update_availability_schedule_updated_at
BEFORE UPDATE ON availability_schedule
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create unavailable dates table (for specific dates when consultants are unavailable)
CREATE TABLE IF NOT EXISTS unavailable_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Commented out until auth is set up
  consultant_email TEXT NOT NULL, -- Using email instead of user_id for now
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for faster queries
-- CREATE INDEX IF NOT EXISTS unavailable_dates_user_id_idx ON unavailable_dates(user_id); -- Commented out until auth is set up
CREATE INDEX IF NOT EXISTS unavailable_dates_consultant_email_idx ON unavailable_dates(consultant_email);
CREATE INDEX IF NOT EXISTS unavailable_dates_date_idx ON unavailable_dates(date);

-- Add RLS policies (simplified for now without auth)
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE unavailable_dates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create a consultation" ON consultations;
DROP POLICY IF EXISTS "Public can view consultations" ON consultations;
DROP POLICY IF EXISTS "Public can update consultations" ON consultations;
DROP POLICY IF EXISTS "Public can manage availability schedule" ON availability_schedule;
DROP POLICY IF EXISTS "Public can manage unavailable dates" ON unavailable_dates;

-- Public access for creating consultations
CREATE POLICY "Anyone can create a consultation" ON consultations
  FOR INSERT WITH CHECK (true);

-- Public can view all consultations (temporary - should be restricted in production)
CREATE POLICY "Public can view consultations" ON consultations
  FOR SELECT USING (true);

-- Public can update consultations (temporary - should be restricted in production)
CREATE POLICY "Public can update consultations" ON consultations
  FOR UPDATE USING (true);

-- Public access for availability (temporary - should be restricted in production)
CREATE POLICY "Public can manage availability schedule" ON availability_schedule
  FOR ALL USING (true);

-- Public access for unavailable dates (temporary - should be restricted in production)
CREATE POLICY "Public can manage unavailable dates" ON unavailable_dates
  FOR ALL USING (true);
