-- Migration: 274_pre_client_historical_email_tables.sql
-- Description: Schema for historical email ingestion and identity reconstruction
-- Created: 2025-11-28

-- ============================================================================
-- PRE-CLIENT PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  notes TEXT,
  source TEXT DEFAULT 'email_discovery',
  status TEXT DEFAULT 'discovered' CHECK (status IN ('discovered', 'ingesting', 'analyzed', 'converted', 'archived')),

  -- Aggregated stats
  total_threads INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  first_contact_date TIMESTAMPTZ,
  last_contact_date TIMESTAMPTZ,

  -- AI-generated summary
  relationship_summary TEXT,
  sentiment_score DECIMAL(3,2),
  engagement_level TEXT CHECK (engagement_level IN ('cold', 'warm', 'hot', 'active')),

  -- Conversion tracking
  converted_to_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_pre_client_email_workspace UNIQUE (workspace_id, email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pre_clients_workspace ON pre_clients(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pre_clients_email ON pre_clients(email);
CREATE INDEX IF NOT EXISTS idx_pre_clients_status ON pre_clients(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_pre_clients_last_contact ON pre_clients(workspace_id, last_contact_date DESC);

-- ============================================================================
-- PRE-CLIENT THREADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_client_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_client_id UUID NOT NULL REFERENCES pre_clients(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Thread identification
  thread_id TEXT NOT NULL,
  external_thread_id TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'other')),

  -- Thread metadata
  subject TEXT,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,

  -- AI classification
  primary_theme TEXT,
  themes TEXT[], -- Array of themes
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  importance TEXT CHECK (importance IN ('low', 'medium', 'high', 'critical')),

  -- Status tracking
  has_unresolved_items BOOLEAN DEFAULT FALSE,
  requires_followup BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_thread_per_client UNIQUE (pre_client_id, thread_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pre_client_threads_client ON pre_client_threads(pre_client_id);
CREATE INDEX IF NOT EXISTS idx_pre_client_threads_last_message ON pre_client_threads(pre_client_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_pre_client_threads_theme ON pre_client_threads(primary_theme);
CREATE INDEX IF NOT EXISTS idx_pre_client_threads_importance ON pre_client_threads(pre_client_id, importance);

-- ============================================================================
-- PRE-CLIENT MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES pre_client_threads(id) ON DELETE CASCADE,
  pre_client_id UUID NOT NULL REFERENCES pre_clients(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Message identification
  external_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'other')),

  -- Participants
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],

  -- Content
  subject TEXT,
  body_plain TEXT,
  body_html TEXT,
  snippet TEXT,

  -- Message metadata
  message_timestamp TIMESTAMPTZ NOT NULL,
  is_inbound BOOLEAN NOT NULL, -- true if from client, false if to client
  has_attachments BOOLEAN DEFAULT FALSE,
  attachment_count INTEGER DEFAULT 0,

  -- AI analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3,2),
  importance_score INTEGER CHECK (importance_score BETWEEN 1 AND 10),
  key_topics TEXT[],

  -- Extracted items
  extracted_tasks JSONB DEFAULT '[]',
  extracted_questions JSONB DEFAULT '[]',
  extracted_commitments JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_message_external UNIQUE (thread_id, external_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pre_client_messages_thread ON pre_client_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_pre_client_messages_client ON pre_client_messages(pre_client_id);
CREATE INDEX IF NOT EXISTS idx_pre_client_messages_timestamp ON pre_client_messages(pre_client_id, message_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_pre_client_messages_sentiment ON pre_client_messages(sentiment);
CREATE INDEX IF NOT EXISTS idx_pre_client_messages_importance ON pre_client_messages(importance_score DESC);

-- ============================================================================
-- PRE-CLIENT INSIGHTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_client_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_client_id UUID NOT NULL REFERENCES pre_clients(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Insight classification
  category TEXT NOT NULL CHECK (category IN (
    'task', 'opportunity', 'decision', 'commitment', 'question',
    'complaint', 'praise', 'request', 'milestone', 'risk'
  )),
  subcategory TEXT,

  -- Content
  title TEXT NOT NULL,
  detail TEXT,
  source_message_id UUID REFERENCES pre_client_messages(id) ON DELETE SET NULL,
  source_thread_id UUID REFERENCES pre_client_threads(id) ON DELETE SET NULL,

  -- Metadata
  detected_at TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed', 'converted')),
  resolved_at TIMESTAMPTZ,
  converted_to_task_id UUID,

  -- AI confidence
  confidence_score DECIMAL(3,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pre_client_insights_client ON pre_client_insights(pre_client_id);
CREATE INDEX IF NOT EXISTS idx_pre_client_insights_category ON pre_client_insights(pre_client_id, category);
CREATE INDEX IF NOT EXISTS idx_pre_client_insights_status ON pre_client_insights(pre_client_id, status);
CREATE INDEX IF NOT EXISTS idx_pre_client_insights_detected ON pre_client_insights(pre_client_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_pre_client_insights_priority ON pre_client_insights(priority, status);

-- ============================================================================
-- PRE-CLIENT TIMELINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_client_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_client_id UUID NOT NULL REFERENCES pre_clients(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'first_contact', 'meeting_scheduled', 'proposal_sent', 'proposal_accepted',
    'contract_signed', 'project_started', 'project_completed', 'issue_raised',
    'issue_resolved', 'payment_received', 'renewal_discussion', 'referral_made',
    'milestone', 'communication', 'decision', 'other'
  )),
  event_date TIMESTAMPTZ NOT NULL,

  -- Content
  summary TEXT NOT NULL,
  details TEXT,

  -- Source tracking
  source_type TEXT CHECK (source_type IN ('email', 'manual', 'ai_detected', 'integration')),
  source_message_id UUID REFERENCES pre_client_messages(id) ON DELETE SET NULL,
  source_thread_id UUID REFERENCES pre_client_threads(id) ON DELETE SET NULL,

  -- Importance
  significance TEXT CHECK (significance IN ('minor', 'moderate', 'major', 'critical')),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pre_client_timeline_client ON pre_client_timeline(pre_client_id);
CREATE INDEX IF NOT EXISTS idx_pre_client_timeline_date ON pre_client_timeline(pre_client_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_pre_client_timeline_type ON pre_client_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_pre_client_timeline_significance ON pre_client_timeline(pre_client_id, significance);

-- ============================================================================
-- INGESTION JOBS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_client_ingestion_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pre_client_id UUID NOT NULL REFERENCES pre_clients(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  connected_app_id UUID NOT NULL REFERENCES connected_apps(id) ON DELETE CASCADE,

  -- Job configuration
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  email_filter TEXT, -- Specific email to filter for

  -- Progress tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Results
  threads_found INTEGER DEFAULT 0,
  messages_ingested INTEGER DEFAULT 0,
  insights_extracted INTEGER DEFAULT 0,
  timeline_events_created INTEGER DEFAULT 0,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_client ON pre_client_ingestion_jobs(pre_client_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON pre_client_ingestion_jobs(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE pre_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_client_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_client_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_client_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_client_ingestion_jobs ENABLE ROW LEVEL SECURITY;

-- Helper function for workspace access check
CREATE OR REPLACE FUNCTION user_has_workspace_access(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_organizations uo
    JOIN workspaces w ON w.organization_id = uo.org_id
    WHERE w.id = ws_id AND uo.user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for pre_clients
CREATE POLICY "Users can view pre_clients in their workspace"
  ON pre_clients FOR SELECT
  USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert pre_clients in their workspace"
  ON pre_clients FOR INSERT
  WITH CHECK (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can update pre_clients in their workspace"
  ON pre_clients FOR UPDATE
  USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can delete pre_clients in their workspace"
  ON pre_clients FOR DELETE
  USING (user_has_workspace_access(workspace_id));

-- RLS Policies for pre_client_threads
CREATE POLICY "Users can view pre_client_threads in their workspace"
  ON pre_client_threads FOR SELECT
  USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert pre_client_threads in their workspace"
  ON pre_client_threads FOR INSERT
  WITH CHECK (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can update pre_client_threads in their workspace"
  ON pre_client_threads FOR UPDATE
  USING (user_has_workspace_access(workspace_id));

-- RLS Policies for pre_client_messages
CREATE POLICY "Users can view pre_client_messages in their workspace"
  ON pre_client_messages FOR SELECT
  USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert pre_client_messages in their workspace"
  ON pre_client_messages FOR INSERT
  WITH CHECK (user_has_workspace_access(workspace_id));

-- RLS Policies for pre_client_insights
CREATE POLICY "Users can view pre_client_insights in their workspace"
  ON pre_client_insights FOR SELECT
  USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert pre_client_insights in their workspace"
  ON pre_client_insights FOR INSERT
  WITH CHECK (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can update pre_client_insights in their workspace"
  ON pre_client_insights FOR UPDATE
  USING (user_has_workspace_access(workspace_id));

-- RLS Policies for pre_client_timeline
CREATE POLICY "Users can view pre_client_timeline in their workspace"
  ON pre_client_timeline FOR SELECT
  USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert pre_client_timeline in their workspace"
  ON pre_client_timeline FOR INSERT
  WITH CHECK (user_has_workspace_access(workspace_id));

-- RLS Policies for pre_client_ingestion_jobs
CREATE POLICY "Users can view pre_client_ingestion_jobs in their workspace"
  ON pre_client_ingestion_jobs FOR SELECT
  USING (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can insert pre_client_ingestion_jobs in their workspace"
  ON pre_client_ingestion_jobs FOR INSERT
  WITH CHECK (user_has_workspace_access(workspace_id));

CREATE POLICY "Users can update pre_client_ingestion_jobs in their workspace"
  ON pre_client_ingestion_jobs FOR UPDATE
  USING (user_has_workspace_access(workspace_id));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update pre_clients.updated_at on change
CREATE OR REPLACE FUNCTION update_pre_client_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pre_clients_updated
  BEFORE UPDATE ON pre_clients
  FOR EACH ROW EXECUTE FUNCTION update_pre_client_timestamp();

CREATE TRIGGER trg_pre_client_threads_updated
  BEFORE UPDATE ON pre_client_threads
  FOR EACH ROW EXECUTE FUNCTION update_pre_client_timestamp();

CREATE TRIGGER trg_pre_client_insights_updated
  BEFORE UPDATE ON pre_client_insights
  FOR EACH ROW EXECUTE FUNCTION update_pre_client_timestamp();

CREATE TRIGGER trg_pre_client_ingestion_jobs_updated
  BEFORE UPDATE ON pre_client_ingestion_jobs
  FOR EACH ROW EXECUTE FUNCTION update_pre_client_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE pre_clients IS 'Pre-system client profiles discovered from historical emails';
COMMENT ON TABLE pre_client_threads IS 'Email threads associated with pre-system clients';
COMMENT ON TABLE pre_client_messages IS 'Individual email messages within pre-client threads';
COMMENT ON TABLE pre_client_insights IS 'AI-extracted insights from pre-client communications';
COMMENT ON TABLE pre_client_timeline IS 'Chronological timeline of pre-client relationship events';
COMMENT ON TABLE pre_client_ingestion_jobs IS 'Background jobs for historical email ingestion';
