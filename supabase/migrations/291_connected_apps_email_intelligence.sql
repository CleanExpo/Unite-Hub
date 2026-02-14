-- Migration 291: Connected Apps & Email Intelligence System
--
-- Purpose: Extend OAuth token storage for Gmail/Outlook and add email intelligence tables
-- Tables:
--   - connected_apps (app connection tracking)
--   - email_threads (email thread grouping)
--   - email_messages (individual email messages)
--   - email_ideas (AI-extracted insights from emails)
-- Features:
--   - Google Workspace (Gmail) OAuth
--   - Microsoft Office365 (Outlook) OAuth
--   - Email thread and message storage
--   - AI-powered idea extraction
--   - Client mapping for CRM intelligence
--   - Workspace isolation with RLS

-- ============================================================================
-- Extend OAuth Tokens Provider CHECK
-- ============================================================================

-- First, let's safely add new providers to the existing oauth_tokens table
DO $$
BEGIN
  -- Check if the constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'oauth_tokens_provider_check'
    AND table_name = 'oauth_tokens'
  ) THEN
    ALTER TABLE oauth_tokens DROP CONSTRAINT oauth_tokens_provider_check;
  END IF;

  -- Add new constraint with all providers
  ALTER TABLE oauth_tokens ADD CONSTRAINT oauth_tokens_provider_check
    CHECK (provider IN (
      'google_search_console',
      'google_business_profile',
      'google_analytics_4',
      'google_gmail',
      'google_workspace',
      'microsoft_outlook',
      'microsoft_office365'
    ));
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not update oauth_tokens constraint: %', SQLERRM;
END $$;

-- Add encrypted_access_token and encrypted_refresh_token columns if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'oauth_tokens' AND column_name = 'encrypted_access_token') THEN
    ALTER TABLE oauth_tokens ADD COLUMN encrypted_access_token BYTEA;
    ALTER TABLE oauth_tokens ADD COLUMN encrypted_refresh_token BYTEA;
    ALTER TABLE oauth_tokens ADD COLUMN encryption_iv BYTEA;
    RAISE NOTICE 'Added encryption columns to oauth_tokens';
  END IF;
END $$;

-- ============================================================================
-- Connected Apps Table (tracks all app connections)
-- ============================================================================

CREATE TABLE IF NOT EXISTS connected_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Provider info
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  provider_account_id TEXT, -- external account ID from provider
  provider_email TEXT, -- email associated with provider account
  provider_name TEXT, -- display name from provider
  provider_avatar_url TEXT, -- avatar from provider

  -- Connection status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'error')),
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,

  -- Scopes granted
  granted_scopes TEXT[] DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one connection per provider per user per workspace
  UNIQUE(workspace_id, user_id, provider)
);

-- Indexes for connected_apps
CREATE INDEX IF NOT EXISTS idx_connected_apps_workspace ON connected_apps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_connected_apps_user ON connected_apps(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_apps_provider ON connected_apps(provider);
CREATE INDEX IF NOT EXISTS idx_connected_apps_status ON connected_apps(status);

-- Enable RLS
ALTER TABLE connected_apps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for connected_apps
DROP POLICY IF EXISTS connected_apps_select ON connected_apps;
DROP POLICY IF EXISTS connected_apps_insert ON connected_apps;
DROP POLICY IF EXISTS connected_apps_update ON connected_apps;
DROP POLICY IF EXISTS connected_apps_delete ON connected_apps;

CREATE POLICY connected_apps_select ON connected_apps
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY connected_apps_insert ON connected_apps
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY connected_apps_update ON connected_apps
  FOR UPDATE TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY connected_apps_delete ON connected_apps
  FOR DELETE TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
    AND user_id = auth.uid()
  );

-- ============================================================================
-- Email Threads Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connected_app_id UUID NOT NULL REFERENCES connected_apps(id) ON DELETE CASCADE,

  -- Thread identification
  external_thread_id TEXT NOT NULL, -- Gmail thread ID or Outlook conversation ID
  subject TEXT,
  snippet TEXT, -- preview text

  -- Participants
  from_addresses TEXT[] DEFAULT '{}',
  to_addresses TEXT[] DEFAULT '{}',
  cc_addresses TEXT[] DEFAULT '{}',

  -- CRM linking
  client_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- linked CRM contact
  client_mapping_confidence REAL DEFAULT 0, -- 0-1 confidence score
  client_mapping_method TEXT, -- 'email_exact', 'domain_match', 'manual'

  -- Thread metadata
  message_count INTEGER DEFAULT 0,
  has_attachments BOOLEAN DEFAULT FALSE,
  first_message_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  labels TEXT[] DEFAULT '{}', -- Gmail labels or Outlook categories

  -- AI analysis
  sentiment_score REAL, -- -1 to 1
  priority_score REAL, -- 0 to 1
  ai_summary TEXT,

  -- Sync tracking
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
  last_sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(workspace_id, connected_app_id, external_thread_id)
);

-- Indexes for email_threads
CREATE INDEX IF NOT EXISTS idx_email_threads_workspace ON email_threads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_connected_app ON email_threads(connected_app_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_client ON email_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_external_id ON email_threads(external_thread_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_last_message ON email_threads(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_threads_subject ON email_threads USING gin(to_tsvector('english', subject));

-- Enable RLS
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_threads
DROP POLICY IF EXISTS email_threads_select ON email_threads;
DROP POLICY IF EXISTS email_threads_insert ON email_threads;
DROP POLICY IF EXISTS email_threads_update ON email_threads;
DROP POLICY IF EXISTS email_threads_delete ON email_threads;

CREATE POLICY email_threads_select ON email_threads
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY email_threads_insert ON email_threads
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY email_threads_update ON email_threads
  FOR UPDATE TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY email_threads_delete ON email_threads
  FOR DELETE TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Email Messages Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
  connected_app_id UUID NOT NULL REFERENCES connected_apps(id) ON DELETE CASCADE,

  -- Message identification
  external_message_id TEXT NOT NULL, -- Gmail message ID or Outlook item ID
  external_thread_id TEXT NOT NULL,

  -- Message content
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  snippet TEXT,

  -- Sender/Recipients
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] DEFAULT '{}',
  to_names TEXT[] DEFAULT '{}',
  cc_emails TEXT[] DEFAULT '{}',
  bcc_emails TEXT[] DEFAULT '{}',
  reply_to TEXT,

  -- Message metadata
  message_date TIMESTAMPTZ NOT NULL,
  is_incoming BOOLEAN DEFAULT TRUE, -- received vs sent
  is_read BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  is_draft BOOLEAN DEFAULT FALSE,
  labels TEXT[] DEFAULT '{}',
  importance TEXT DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high')),

  -- Attachments
  has_attachments BOOLEAN DEFAULT FALSE,
  attachment_count INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]', -- [{name, size, mimeType, url}]

  -- Headers (for threading)
  in_reply_to TEXT,
  message_references TEXT[] DEFAULT '{}',

  -- AI analysis (per message)
  sentiment_score REAL,
  intent_classification TEXT, -- 'inquiry', 'complaint', 'request', 'information', etc.
  intent_confidence REAL,

  -- Security
  is_encrypted BOOLEAN DEFAULT FALSE,
  spam_score REAL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(workspace_id, connected_app_id, external_message_id)
);

-- Indexes for email_messages
CREATE INDEX IF NOT EXISTS idx_email_messages_workspace ON email_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_thread ON email_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_connected_app ON email_messages(connected_app_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_external_id ON email_messages(external_message_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_from ON email_messages(from_email);
CREATE INDEX IF NOT EXISTS idx_email_messages_date ON email_messages(message_date DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_body_search ON email_messages USING gin(to_tsvector('english', body_text));

-- Enable RLS
ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_messages
DROP POLICY IF EXISTS email_messages_select ON email_messages;
DROP POLICY IF EXISTS email_messages_insert ON email_messages;
DROP POLICY IF EXISTS email_messages_update ON email_messages;
DROP POLICY IF EXISTS email_messages_delete ON email_messages;

CREATE POLICY email_messages_select ON email_messages
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY email_messages_insert ON email_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY email_messages_update ON email_messages
  FOR UPDATE TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY email_messages_delete ON email_messages
  FOR DELETE TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Email Ideas Table (AI-extracted insights)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES email_threads(id) ON DELETE CASCADE,
  message_id UUID REFERENCES email_messages(id) ON DELETE CASCADE,
  client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Idea classification
  idea_type TEXT NOT NULL CHECK (idea_type IN (
    'action_item',
    'meeting_request',
    'deadline',
    'follow_up',
    'opportunity',
    'concern',
    'feedback',
    'question',
    'decision_needed',
    'general_insight'
  )),

  -- Idea content
  title TEXT NOT NULL,
  description TEXT,
  extracted_text TEXT, -- original text that triggered this idea

  -- Priority and confidence
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  confidence_score REAL NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Due date (for action items, deadlines, follow-ups)
  due_date TIMESTAMPTZ,
  due_date_confidence REAL,

  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'in_progress', 'completed', 'dismissed')),
  -- Keep FK reference to auth.users (allowed in migrations)
acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Context
  source_context JSONB DEFAULT '{}', -- additional context about extraction

  -- AI model info
  ai_model TEXT,
  processing_time_ms INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email_ideas
CREATE INDEX IF NOT EXISTS idx_email_ideas_workspace ON email_ideas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_ideas_thread ON email_ideas(thread_id);
CREATE INDEX IF NOT EXISTS idx_email_ideas_message ON email_ideas(message_id);
CREATE INDEX IF NOT EXISTS idx_email_ideas_client ON email_ideas(client_id);
CREATE INDEX IF NOT EXISTS idx_email_ideas_type ON email_ideas(idea_type);
CREATE INDEX IF NOT EXISTS idx_email_ideas_status ON email_ideas(status);
CREATE INDEX IF NOT EXISTS idx_email_ideas_priority ON email_ideas(priority);
CREATE INDEX IF NOT EXISTS idx_email_ideas_due_date ON email_ideas(due_date);
CREATE INDEX IF NOT EXISTS idx_email_ideas_created ON email_ideas(created_at DESC);

-- Enable RLS
ALTER TABLE email_ideas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_ideas
DROP POLICY IF EXISTS email_ideas_select ON email_ideas;
DROP POLICY IF EXISTS email_ideas_insert ON email_ideas;
DROP POLICY IF EXISTS email_ideas_update ON email_ideas;
DROP POLICY IF EXISTS email_ideas_delete ON email_ideas;

CREATE POLICY email_ideas_select ON email_ideas
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY email_ideas_insert ON email_ideas
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY email_ideas_update ON email_ideas
  FOR UPDATE TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY email_ideas_delete ON email_ideas
  FOR DELETE TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Email Sync Log Table (tracks sync operations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connected_app_id UUID NOT NULL REFERENCES connected_apps(id) ON DELETE CASCADE,

  -- Sync info
  sync_type TEXT NOT NULL CHECK (sync_type IN ('initial', 'incremental', 'full', 'manual')),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('started', 'in_progress', 'completed', 'failed')),

  -- Stats
  threads_synced INTEGER DEFAULT 0,
  messages_synced INTEGER DEFAULT 0,
  ideas_extracted INTEGER DEFAULT 0,
  clients_mapped INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Errors
  error_message TEXT,
  error_details JSONB,

  -- Sync range
  sync_from TIMESTAMPTZ,
  sync_to TIMESTAMPTZ,

  -- History token (for incremental sync)
  history_id TEXT,
  next_page_token TEXT
);

-- Indexes for email_sync_logs
CREATE INDEX IF NOT EXISTS idx_email_sync_logs_workspace ON email_sync_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_sync_logs_connected_app ON email_sync_logs(connected_app_id);
CREATE INDEX IF NOT EXISTS idx_email_sync_logs_status ON email_sync_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_email_sync_logs_started ON email_sync_logs(started_at DESC);

-- Enable RLS
ALTER TABLE email_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_sync_logs_select ON email_sync_logs
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

CREATE POLICY email_sync_logs_insert ON email_sync_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at for connected_apps
CREATE OR REPLACE FUNCTION update_connected_apps_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_connected_apps_updated ON connected_apps;
CREATE TRIGGER tr_connected_apps_updated
  BEFORE UPDATE ON connected_apps
  FOR EACH ROW
  EXECUTE FUNCTION update_connected_apps_timestamp();

-- Update updated_at for email_threads
CREATE OR REPLACE FUNCTION update_email_threads_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_email_threads_updated ON email_threads;
CREATE TRIGGER tr_email_threads_updated
  BEFORE UPDATE ON email_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_email_threads_timestamp();

-- Update updated_at for email_messages
CREATE OR REPLACE FUNCTION update_email_messages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_email_messages_updated ON email_messages;
CREATE TRIGGER tr_email_messages_updated
  BEFORE UPDATE ON email_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_email_messages_timestamp();

-- Update updated_at for email_ideas
CREATE OR REPLACE FUNCTION update_email_ideas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_email_ideas_updated ON email_ideas;
CREATE TRIGGER tr_email_ideas_updated
  BEFORE UPDATE ON email_ideas
  FOR EACH ROW
  EXECUTE FUNCTION update_email_ideas_timestamp();

-- Update thread message count
CREATE OR REPLACE FUNCTION update_thread_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE email_threads
    SET
      message_count = message_count + 1,
      last_message_at = NEW.message_date,
      first_message_at = COALESCE(first_message_at, NEW.message_date)
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE email_threads
    SET message_count = message_count - 1
    WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_thread_message_count ON email_messages;
CREATE TRIGGER tr_update_thread_message_count
  AFTER INSERT OR DELETE ON email_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_message_count();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get client email intelligence summary
CREATE OR REPLACE FUNCTION get_client_email_intelligence(
  p_workspace_id UUID,
  p_client_id UUID
)
RETURNS TABLE (
  total_threads BIGINT,
  total_messages BIGINT,
  total_ideas BIGINT,
  pending_ideas BIGINT,
  avg_sentiment REAL,
  last_email_at TIMESTAMPTZ,
  top_topics TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT t.id)::BIGINT AS total_threads,
    COUNT(DISTINCT m.id)::BIGINT AS total_messages,
    COUNT(DISTINCT i.id)::BIGINT AS total_ideas,
    COUNT(DISTINCT CASE WHEN i.status = 'new' THEN i.id END)::BIGINT AS pending_ideas,
    AVG(t.sentiment_score)::REAL AS avg_sentiment,
    MAX(m.message_date) AS last_email_at,
    ARRAY_AGG(DISTINCT i.idea_type) FILTER (WHERE i.idea_type IS NOT NULL) AS top_topics
  FROM email_threads t
  LEFT JOIN email_messages m ON m.thread_id = t.id
  LEFT JOIN email_ideas i ON i.thread_id = t.id
  WHERE t.workspace_id = p_workspace_id
    AND t.client_id = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending action items for a workspace
CREATE OR REPLACE FUNCTION get_pending_email_actions(
  p_workspace_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  idea_id UUID,
  idea_type TEXT,
  title TEXT,
  description TEXT,
  priority TEXT,
  due_date TIMESTAMPTZ,
  client_id UUID,
  client_name TEXT,
  thread_subject TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id AS idea_id,
    i.idea_type,
    i.title,
    i.description,
    i.priority,
    i.due_date,
    i.client_id,
    c.name AS client_name,
    t.subject AS thread_subject,
    i.created_at
  FROM email_ideas i
  LEFT JOIN contacts c ON c.id = i.client_id
  LEFT JOIN email_threads t ON t.id = i.thread_id
  WHERE i.workspace_id = p_workspace_id
    AND i.status IN ('new', 'acknowledged')
    AND i.idea_type IN ('action_item', 'follow_up', 'deadline', 'decision_needed')
  ORDER BY
    CASE i.priority
      WHEN 'urgent' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 4
    END,
    i.due_date ASC NULLS LAST,
    i.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE connected_apps IS 'Tracks OAuth connections to external apps (Google, Microsoft)';
COMMENT ON TABLE email_threads IS 'Email conversation threads synced from Gmail/Outlook';
COMMENT ON TABLE email_messages IS 'Individual email messages within threads';
COMMENT ON TABLE email_ideas IS 'AI-extracted insights and action items from emails';
COMMENT ON TABLE email_sync_logs IS 'Audit log of email sync operations';

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_tables TEXT[] := ARRAY['connected_apps', 'email_threads', 'email_messages', 'email_ideas', 'email_sync_logs'];
  v_table TEXT;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = v_table) THEN
      RAISE NOTICE '✅ Table % created successfully', v_table;
    ELSE
      RAISE EXCEPTION '❌ Table % creation failed', v_table;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = v_table AND rowsecurity = true) THEN
      RAISE NOTICE '✅ RLS enabled on %', v_table;
    ELSE
      RAISE WARNING '⚠️ RLS not enabled on %', v_table;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT
  '✅ Migration 291 Complete' AS status,
  'Connected Apps & Email Intelligence tables created with RLS' AS description,
  NOW() AS completed_at;
