-- WhatsApp Business Integration Migration
-- Created: 2025-11-15
-- Description: Full WhatsApp messaging system with AI intelligence

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Message data
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'document', 'audio', 'location', 'template', 'interactive')),
  content TEXT NOT NULL,

  -- Media
  media_url TEXT,
  media_type TEXT,
  media_size_bytes INTEGER,
  caption TEXT,

  -- Status tracking
  status TEXT CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  whatsapp_message_id TEXT UNIQUE,
  error_message TEXT,

  -- AI Intelligence
  ai_summary TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'urgent')),
  intent TEXT, -- question, complaint, request, info, feedback, etc.
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  requires_response BOOLEAN DEFAULT false,

  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create whatsapp_templates table (pre-approved message templates)
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Template data
  template_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('marketing', 'utility', 'authentication')),
  language TEXT NOT NULL DEFAULT 'en',

  -- Template content
  header_type TEXT CHECK (header_type IN ('none', 'text', 'image', 'video', 'document')),
  header_content TEXT,
  body_content TEXT NOT NULL,
  footer_content TEXT,

  -- Template variables
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  whatsapp_template_id TEXT UNIQUE,

  -- Metadata
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create whatsapp_conversations table (thread management)
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,

  -- Conversation state
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'archived', 'blocked')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Conversation metadata
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_direction TEXT CHECK (last_message_direction IN ('inbound', 'outbound')),
  unread_count INTEGER DEFAULT 0,

  -- AI summary
  ai_topic_summary TEXT,
  ai_sentiment TEXT,
  needs_attention BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_at TIMESTAMP WITH TIME ZONE,

  -- Unique constraint
  CONSTRAINT unique_workspace_phone UNIQUE(workspace_id, phone_number)
);

-- Create whatsapp_webhooks table (webhook logs)
CREATE TABLE IF NOT EXISTS whatsapp_webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Webhook data
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,

  -- Processing info
  processing_error TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_workspace ON whatsapp_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact ON whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone ON whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_whatsapp_id ON whatsapp_messages(whatsapp_message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_workspace ON whatsapp_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_name ON whatsapp_templates(template_name);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_workspace ON whatsapp_conversations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_contact ON whatsapp_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_assigned ON whatsapp_conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message ON whatsapp_conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_workspace ON whatsapp_webhooks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_processed ON whatsapp_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_received ON whatsapp_webhooks(received_at DESC);

-- Enable Row Level Security
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_messages
CREATE POLICY "Users can view messages in their workspace"
  ON whatsapp_messages FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert messages"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update messages"
  ON whatsapp_messages FOR UPDATE
  USING (true);

-- RLS Policies for whatsapp_templates
CREATE POLICY "Users can view templates in their workspace"
  ON whatsapp_templates FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage templates"
  ON whatsapp_templates FOR ALL
  USING (true);

-- RLS Policies for whatsapp_conversations
CREATE POLICY "Users can view conversations in their workspace"
  ON whatsapp_conversations FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage conversations"
  ON whatsapp_conversations FOR ALL
  USING (true);

-- RLS Policies for whatsapp_webhooks
CREATE POLICY "Service role can manage webhooks"
  ON whatsapp_webhooks FOR ALL
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_updated_at();

-- Add comment
COMMENT ON TABLE whatsapp_messages IS 'WhatsApp Business messages with AI intelligence';
COMMENT ON TABLE whatsapp_templates IS 'Pre-approved WhatsApp message templates';
COMMENT ON TABLE whatsapp_conversations IS 'WhatsApp conversation threads';
COMMENT ON TABLE whatsapp_webhooks IS 'WhatsApp webhook event logs';
