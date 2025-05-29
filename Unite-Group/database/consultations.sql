-- Consultations schema for the Unite Group CRM

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
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER DEFAULT 60,
  meeting_link TEXT,
  meeting_notes TEXT,
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid, refunded
  payment_amount NUMERIC(10, 2) DEFAULT 550.00
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS consultations_client_email_idx ON consultations(client_email);
CREATE INDEX IF NOT EXISTS consultations_status_idx ON consultations(status);
CREATE INDEX IF NOT EXISTS consultations_user_id_idx ON consultations(user_id);
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

-- Create trigger to update updated_at on consultations
CREATE TRIGGER update_consultations_updated_at
BEFORE UPDATE ON consultations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create availability schedule table (for consultants)
CREATE TABLE IF NOT EXISTS availability_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create trigger to update updated_at on availability_schedule
CREATE TRIGGER update_availability_schedule_updated_at
BEFORE UPDATE ON availability_schedule
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create unavailable dates table (for specific dates when consultants are unavailable)
CREATE TABLE IF NOT EXISTS unavailable_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS unavailable_dates_user_id_idx ON unavailable_dates(user_id);
CREATE INDEX IF NOT EXISTS unavailable_dates_date_idx ON unavailable_dates(date);

-- Add RLS policies
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE unavailable_dates ENABLE ROW LEVEL SECURITY;

-- Public access for creating consultations
CREATE POLICY "Anyone can create a consultation" ON consultations
  FOR INSERT WITH CHECK (true);

-- Authenticated users can view their own consultations
CREATE POLICY "Users can view their own consultations" ON consultations
  FOR SELECT USING (auth.uid() = user_id OR client_email = auth.email());

-- Admin users can see all consultations
CREATE POLICY "Admins can view all consultations" ON consultations
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    )
  );

-- Admin users can update all consultations
CREATE POLICY "Admins can update all consultations" ON consultations
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    )
  );

-- Admin users can manage availability
CREATE POLICY "Admins can manage availability schedule" ON availability_schedule
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    )
  );

-- Admin users can manage unavailable dates
CREATE POLICY "Admins can manage unavailable dates" ON unavailable_dates
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'admin'
    )
  );
