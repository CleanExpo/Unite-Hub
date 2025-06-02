-- Create emails table
CREATE TABLE IF NOT EXISTS crm_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  from_email TEXT NOT NULL,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'received')),
  thread_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'project', 'task')),
  entity_id UUID NOT NULL
);

-- Create indexes
CREATE INDEX idx_crm_emails_client_id ON crm_emails(client_id);
CREATE INDEX idx_crm_emails_thread_id ON crm_emails(thread_id);
CREATE INDEX idx_crm_emails_user_id ON crm_emails(user_id);
CREATE INDEX idx_crm_notes_entity ON crm_notes(entity_type, entity_id);
CREATE INDEX idx_crm_notes_user_id ON crm_notes(user_id);

-- Enable RLS
ALTER TABLE crm_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for emails
CREATE POLICY "Users can manage their own emails" ON crm_emails
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read client emails" ON crm_emails
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = crm_emails.client_id
  )
);

-- Create policies for notes
CREATE POLICY "Users can manage their own notes" ON crm_notes
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read entity notes" ON crm_notes
FOR SELECT USING (
  (entity_type = 'client' AND EXISTS (
    SELECT 1 FROM clients WHERE clients.id = crm_notes.entity_id
  ))
);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_communication_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_emails_updated_at
BEFORE UPDATE ON crm_emails
FOR EACH ROW EXECUTE FUNCTION update_communication_updated_at();

CREATE TRIGGER update_crm_notes_updated_at
BEFORE UPDATE ON crm_notes
FOR EACH ROW EXECUTE FUNCTION update_communication_updated_at();
