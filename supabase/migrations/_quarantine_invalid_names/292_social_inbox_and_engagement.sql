-- Migration: Social Inbox and Engagement Tables
-- Description: Tables for social accounts, messages, mentions, and AI triage labels.
-- Created: 2025-11-28

-- ============================================================================
-- SOCIAL ACCOUNTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'reddit', 'x')),
  external_account_id TEXT NOT NULL,
  handle TEXT,
  display_name TEXT,
  profile_image_url TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_iv TEXT,
  token_auth_tag TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disconnected', 'error')),
  last_sync_at TIMESTAMPTZ,
  sync_cursor TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, provider, external_account_id)
);

-- ============================================================================
-- SOCIAL THREADS (Conversations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  external_thread_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('comment', 'dm', 'mention', 'reply', 'review')),
  subject TEXT,
  snippet TEXT,
  participant_handles TEXT[],
  participant_ids TEXT[],
  message_count INTEGER DEFAULT 0,
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived', 'spam')),
  assigned_to UUID REFERENCES auth.users(id),
  labels TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(social_account_id, external_thread_id)
);

-- ============================================================================
-- SOCIAL MESSAGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES social_threads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  external_message_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('comment', 'dm', 'mention', 'reply', 'review')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  author_handle TEXT,
  author_id TEXT,
  author_name TEXT,
  author_profile_image TEXT,
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'audio', 'mixed')),
  attachments JSONB DEFAULT '[]',
  parent_message_id UUID REFERENCES social_messages(id),
  -- AI Triage Fields
  sentiment NUMERIC(4,3) CHECK (sentiment >= -1 AND sentiment <= 1),
  sentiment_label TEXT CHECK (sentiment_label IN ('positive', 'neutral', 'negative', 'mixed')),
  spam_score NUMERIC(4,3) CHECK (spam_score >= 0 AND spam_score <= 1),
  importance_score NUMERIC(4,3) CHECK (importance_score >= 0 AND importance_score <= 1),
  intent_labels TEXT[],
  triage_status TEXT DEFAULT 'pending' CHECK (triage_status IN ('pending', 'triaged', 'requires_attention', 'auto_replied', 'manually_handled')),
  triage_notes TEXT,
  triaged_at TIMESTAMPTZ,
  -- Status
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived', 'spam')),
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  -- Timestamps
  sent_at TIMESTAMPTZ NOT NULL,
  read_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(social_account_id, external_message_id)
);

-- ============================================================================
-- SOCIAL ACTIONS (Reply, Like, Hide, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_message_id UUID NOT NULL REFERENCES social_messages(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('reply', 'like', 'hide', 'delete', 'flag', 'unflag', 'archive', 'assign', 'label')),
  payload_json JSONB DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model TEXT,
  ai_confidence NUMERIC(4,3),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  performed_by_user_id UUID REFERENCES auth.users(id),
  external_action_id TEXT,
  error_message TEXT,
  performed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SOCIAL REPLY TEMPLATES
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_text TEXT NOT NULL,
  variables TEXT[],
  providers TEXT[],
  channel_types TEXT[],
  sentiment_triggers TEXT[],
  intent_triggers TEXT[],
  is_ai_template BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  success_rate NUMERIC(5,2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SOCIAL SYNC LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  messages_synced INTEGER DEFAULT 0,
  threads_synced INTEGER DEFAULT 0,
  messages_triaged INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  sync_cursor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Social Accounts
CREATE INDEX IF NOT EXISTS idx_social_accounts_workspace ON social_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_provider ON social_accounts(workspace_id, provider);
CREATE INDEX IF NOT EXISTS idx_social_accounts_status ON social_accounts(workspace_id, status);

-- Social Threads
CREATE INDEX IF NOT EXISTS idx_social_threads_account ON social_threads(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_threads_workspace ON social_threads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_threads_status ON social_threads(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_social_threads_last_message ON social_threads(social_account_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_threads_assigned ON social_threads(assigned_to) WHERE assigned_to IS NOT NULL;

-- Social Messages
CREATE INDEX IF NOT EXISTS idx_social_messages_thread ON social_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_account ON social_messages(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_workspace ON social_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_messages_status ON social_messages(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_social_messages_triage ON social_messages(workspace_id, triage_status);
CREATE INDEX IF NOT EXISTS idx_social_messages_importance ON social_messages(workspace_id, importance_score DESC) WHERE importance_score > 0.5;
CREATE INDEX IF NOT EXISTS idx_social_messages_sentiment ON social_messages(workspace_id, sentiment_label);
CREATE INDEX IF NOT EXISTS idx_social_messages_sent_at ON social_messages(social_account_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_messages_flagged ON social_messages(workspace_id, is_flagged) WHERE is_flagged = TRUE;

-- Social Actions
CREATE INDEX IF NOT EXISTS idx_social_actions_message ON social_actions(social_message_id);
CREATE INDEX IF NOT EXISTS idx_social_actions_workspace ON social_actions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_actions_approval ON social_actions(approval_status) WHERE approval_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_social_actions_performed ON social_actions(performed_at DESC) WHERE performed_at IS NOT NULL;

-- Social Sync Logs
CREATE INDEX IF NOT EXISTS idx_social_sync_logs_account ON social_sync_logs(social_account_id);
CREATE INDEX IF NOT EXISTS idx_social_sync_logs_status ON social_sync_logs(status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_reply_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_sync_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "social_accounts_workspace_isolation" ON social_accounts;
  DROP POLICY IF EXISTS "social_threads_workspace_isolation" ON social_threads;
  DROP POLICY IF EXISTS "social_messages_workspace_isolation" ON social_messages;
  DROP POLICY IF EXISTS "social_actions_workspace_isolation" ON social_actions;
  DROP POLICY IF EXISTS "social_reply_templates_workspace_isolation" ON social_reply_templates;
  DROP POLICY IF EXISTS "social_sync_logs_workspace_isolation" ON social_sync_logs;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- RLS Policies
CREATE POLICY "social_accounts_workspace_isolation" ON social_accounts
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "social_threads_workspace_isolation" ON social_threads
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "social_messages_workspace_isolation" ON social_messages
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "social_actions_workspace_isolation" ON social_actions
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "social_reply_templates_workspace_isolation" ON social_reply_templates
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "social_sync_logs_workspace_isolation" ON social_sync_logs
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update thread message count
CREATE OR REPLACE FUNCTION update_thread_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE social_threads
    SET message_count = message_count + 1,
        last_message_at = NEW.sent_at,
        updated_at = NOW()
    WHERE id = NEW.thread_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE social_threads
    SET message_count = message_count - 1,
        updated_at = NOW()
    WHERE id = OLD.thread_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_thread_message_count ON social_messages;
CREATE TRIGGER trigger_update_thread_message_count
  AFTER INSERT OR DELETE ON social_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_message_count();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_social_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_social_accounts_updated_at ON social_accounts;
CREATE TRIGGER trigger_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

DROP TRIGGER IF EXISTS trigger_social_threads_updated_at ON social_threads;
CREATE TRIGGER trigger_social_threads_updated_at
  BEFORE UPDATE ON social_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

DROP TRIGGER IF EXISTS trigger_social_messages_updated_at ON social_messages;
CREATE TRIGGER trigger_social_messages_updated_at
  BEFORE UPDATE ON social_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();

DROP TRIGGER IF EXISTS trigger_social_reply_templates_updated_at ON social_reply_templates;
CREATE TRIGGER trigger_social_reply_templates_updated_at
  BEFORE UPDATE ON social_reply_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_social_updated_at();
