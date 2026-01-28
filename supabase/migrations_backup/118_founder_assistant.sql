-- Migration 118: Founder Executive Assistant System
-- Phase 51: AI-powered executive assistant for founder oversight

-- Founder memory graph nodes
CREATE TABLE IF NOT EXISTS founder_memory_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Node details
  node_type TEXT NOT NULL CHECK (node_type IN (
    'client', 'project', 'invoice', 'receipt', 'task',
    'event', 'staff_member', 'email_thread', 'voice_command', 'financial_entry'
  )),
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,

  -- Context
  context_data JSONB DEFAULT '{}'::jsonb,
  importance_score INTEGER DEFAULT 50 CHECK (importance_score >= 0 AND importance_score <= 100),

  -- Relationships
  related_nodes JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Founder email intelligence
CREATE TABLE IF NOT EXISTS founder_email_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Email reference
  email_id UUID,
  thread_id TEXT,
  message_id TEXT,

  -- Extracted data
  sender TEXT NOT NULL,
  sender_domain TEXT,
  subject TEXT,
  received_at TIMESTAMPTZ,

  -- AI Analysis
  category TEXT CHECK (category IN (
    'client_communication', 'invoice', 'receipt', 'meeting',
    'staff', 'urgent', 'marketing', 'legal', 'financial', 'other'
  )),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- Extracted entities
  extracted_client_id UUID REFERENCES contacts(id),
  extracted_amount DECIMAL(12,2),
  extracted_currency TEXT DEFAULT 'AUD',
  extracted_due_date DATE,
  extracted_invoice_number TEXT,

  -- Summary
  ai_summary TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  key_points JSONB DEFAULT '[]'::jsonb,

  -- Processing
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Founder daily briefings
CREATE TABLE IF NOT EXISTS founder_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Briefing details
  briefing_date DATE NOT NULL,
  briefing_type TEXT DEFAULT 'daily' CHECK (briefing_type IN ('daily', 'weekly', 'monthly', 'ad_hoc')),

  -- Content sections
  executive_summary TEXT,
  key_metrics JSONB DEFAULT '{}'::jsonb,
  client_updates JSONB DEFAULT '[]'::jsonb,
  financial_summary JSONB DEFAULT '{}'::jsonb,
  staff_activity JSONB DEFAULT '[]'::jsonb,
  action_items JSONB DEFAULT '[]'::jsonb,
  upcoming_events JSONB DEFAULT '[]'::jsonb,
  alerts JSONB DEFAULT '[]'::jsonb,

  -- AI generation
  ai_insights JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Founder voice commands log
CREATE TABLE IF NOT EXISTS founder_voice_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Command details
  command_text TEXT NOT NULL,
  command_type TEXT NOT NULL CHECK (command_type IN (
    'show_briefing', 'show_financials', 'summarise_emails',
    'list_clients', 'list_staff_activity', 'fetch_invoice',
    'fetch_receipt', 'run_report', 'custom'
  )),

  -- Execution
  executed BOOLEAN DEFAULT false,
  execution_result JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,

  -- Context
  context_data JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  executed_at TIMESTAMPTZ
);

-- Founder staff insights
CREATE TABLE IF NOT EXISTS founder_staff_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Activity metrics
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Metrics
  tasks_completed INTEGER DEFAULT 0,
  tasks_in_progress INTEGER DEFAULT 0,
  hours_logged DECIMAL(6,2) DEFAULT 0,
  client_interactions INTEGER DEFAULT 0,
  content_generated INTEGER DEFAULT 0,

  -- AI Analysis
  productivity_score INTEGER CHECK (productivity_score >= 0 AND productivity_score <= 100),
  engagement_score INTEGER CHECK (engagement_score >= 0 AND engagement_score <= 100),
  ai_insights JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Founder financial extractions (invoices/receipts)
CREATE TABLE IF NOT EXISTS founder_financial_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Source
  source_type TEXT NOT NULL CHECK (source_type IN ('email', 'upload', 'xero', 'manual')),
  source_id UUID,

  -- Document type
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'receipt', 'quote', 'statement')),

  -- Extracted data
  vendor_name TEXT,
  client_name TEXT,
  document_number TEXT,
  document_date DATE,
  due_date DATE,

  -- Financial
  subtotal DECIMAL(12,2),
  tax_amount DECIMAL(12,2),
  total_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'AUD',

  -- Line items
  line_items JSONB DEFAULT '[]'::jsonb,

  -- Categorization
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,

  -- Files
  file_url TEXT,
  thumbnail_url TEXT,

  -- Xero sync
  xero_id TEXT,
  synced_to_xero BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,

  -- Verification
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_founder_memory_founder ON founder_memory_nodes(founder_id);
CREATE INDEX IF NOT EXISTS idx_founder_memory_type ON founder_memory_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_founder_memory_entity ON founder_memory_nodes(entity_id);
CREATE INDEX IF NOT EXISTS idx_founder_memory_importance ON founder_memory_nodes(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_founder_email_founder ON founder_email_intelligence(founder_id);
CREATE INDEX IF NOT EXISTS idx_founder_email_category ON founder_email_intelligence(category);
CREATE INDEX IF NOT EXISTS idx_founder_email_priority ON founder_email_intelligence(priority);
CREATE INDEX IF NOT EXISTS idx_founder_briefing_founder ON founder_briefings(founder_id);
CREATE INDEX IF NOT EXISTS idx_founder_briefing_date ON founder_briefings(briefing_date DESC);
CREATE INDEX IF NOT EXISTS idx_founder_voice_founder ON founder_voice_commands(founder_id);
CREATE INDEX IF NOT EXISTS idx_founder_staff_founder ON founder_staff_insights(founder_id);
CREATE INDEX IF NOT EXISTS idx_founder_staff_staff ON founder_staff_insights(staff_id);
CREATE INDEX IF NOT EXISTS idx_founder_financial_founder ON founder_financial_extractions(founder_id);
CREATE INDEX IF NOT EXISTS idx_founder_financial_type ON founder_financial_extractions(document_type);

-- RLS Policies
ALTER TABLE founder_memory_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_email_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_staff_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_financial_extractions ENABLE ROW LEVEL SECURITY;

-- Only founders can access their data
CREATE POLICY "founder_own_memory" ON founder_memory_nodes
  FOR ALL USING (auth.uid() = founder_id);

CREATE POLICY "founder_own_email_intel" ON founder_email_intelligence
  FOR ALL USING (auth.uid() = founder_id);

CREATE POLICY "founder_own_briefings" ON founder_briefings
  FOR ALL USING (auth.uid() = founder_id);

CREATE POLICY "founder_own_voice_commands" ON founder_voice_commands
  FOR ALL USING (auth.uid() = founder_id);

CREATE POLICY "founder_own_staff_insights" ON founder_staff_insights
  FOR ALL USING (auth.uid() = founder_id);

CREATE POLICY "founder_own_financials" ON founder_financial_extractions
  FOR ALL USING (auth.uid() = founder_id);

-- Service role access
CREATE POLICY "service_role_memory" ON founder_memory_nodes
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_email_intel" ON founder_email_intelligence
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_briefings" ON founder_briefings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_voice" ON founder_voice_commands
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_staff_insights" ON founder_staff_insights
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_financials" ON founder_financial_extractions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Update triggers
CREATE TRIGGER update_founder_memory_timestamp
  BEFORE UPDATE ON founder_memory_nodes
  FOR EACH ROW EXECUTE FUNCTION update_launch_kit_timestamp();

CREATE TRIGGER update_founder_financial_timestamp
  BEFORE UPDATE ON founder_financial_extractions
  FOR EACH ROW EXECUTE FUNCTION update_launch_kit_timestamp();

-- Comments
COMMENT ON TABLE founder_memory_nodes IS 'Founder AI memory graph for context tracking';
COMMENT ON TABLE founder_email_intelligence IS 'AI-extracted intelligence from founder emails';
COMMENT ON TABLE founder_briefings IS 'Auto-generated founder daily/weekly briefings';
COMMENT ON TABLE founder_voice_commands IS 'Voice command history for hands-free control';
COMMENT ON TABLE founder_staff_insights IS 'AI-generated staff activity insights';
COMMENT ON TABLE founder_financial_extractions IS 'Extracted invoices and receipts';
