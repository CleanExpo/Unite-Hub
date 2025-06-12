-- Meetings table for Unite Group CRM

CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  -- user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Commented out until auth is set up
  organizer_email TEXT NOT NULL,
  customer_id UUID,
  deal_id UUID,
  location TEXT,
  meeting_link TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  attendees JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS meetings_scheduled_at_idx ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS meetings_status_idx ON meetings(status);
CREATE INDEX IF NOT EXISTS meetings_customer_id_idx ON meetings(customer_id);
CREATE INDEX IF NOT EXISTS meetings_deal_id_idx ON meetings(deal_id);
CREATE INDEX IF NOT EXISTS meetings_organizer_email_idx ON meetings(organizer_email);

-- Create function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON meetings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable RLS (simplified for now without auth)
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Public access policies (temporary - should be restricted in production)
CREATE POLICY "Public can create meetings" ON meetings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view meetings" ON meetings
  FOR SELECT USING (true);

CREATE POLICY "Public can update meetings" ON meetings
  FOR UPDATE USING (true);

CREATE POLICY "Public can delete meetings" ON meetings
  FOR DELETE USING (true);
