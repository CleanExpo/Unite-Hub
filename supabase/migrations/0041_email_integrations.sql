-- Migration: Email Integrations (Multi-Account Support)
-- Date: 2025-11-15
-- Description: Add email_integrations table to support multiple Gmail/Outlook accounts per workspace
-- NOTE: Renamed to 0041_* to avoid duplicate migration version "004".

-- Email Integrations table (supports multiple accounts per workspace)
CREATE TABLE IF NOT EXISTS email_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Provider info
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook', 'smtp')) DEFAULT 'gmail',
  email_address TEXT NOT NULL, -- actual email (e.g., john@company.com)
  account_label TEXT, -- user-defined label (e.g., "Personal", "Work", "Sales")

  -- Account settings
  is_primary BOOLEAN NOT NULL DEFAULT FALSE, -- primary account for sending
  sync_enabled BOOLEAN NOT NULL DEFAULT TRUE, -- enable/disable sync for this account
  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- soft delete flag

  -- OAuth tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,

  -- Sync metadata
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_history_id TEXT, -- for incremental sync
  sync_error TEXT, -- last sync error message

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one account per email per workspace
  UNIQUE(workspace_id, provider, email_address)
);
-- Ensure expected columns exist when table already exists (safe re-apply on legacy schemas).
ALTER TABLE IF EXISTS public.email_integrations
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE IF EXISTS public.email_integrations
  ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE IF EXISTS public.email_integrations
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
-- Sent Emails table (for tracking sent emails with open/click tracking)
CREATE TABLE IF NOT EXISTS sent_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  integration_id UUID REFERENCES email_integrations(id) ON DELETE SET NULL, -- which account sent it

  -- Email details
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,

  -- Tracking
  opens INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  first_open_at TIMESTAMP WITH TIME ZONE,
  first_click_at TIMESTAMP WITH TIME ZONE,

  -- Gmail metadata
  gmail_message_id TEXT,
  gmail_thread_id TEXT,

  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Email Opens tracking
CREATE TABLE IF NOT EXISTS email_opens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sent_email_id UUID NOT NULL REFERENCES sent_emails(id) ON DELETE CASCADE,

  -- Tracking metadata
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,

  -- Timestamp
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Email Clicks tracking
CREATE TABLE IF NOT EXISTS email_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sent_email_id UUID NOT NULL REFERENCES sent_emails(id) ON DELETE CASCADE,

  -- Click details
  link_url TEXT NOT NULL,

  -- Tracking metadata
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,

  -- Timestamp
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_integrations_workspace_id ON email_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_integrations_org_id ON email_integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_email_integrations_provider ON email_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_email_integrations_email_address ON email_integrations(email_address);
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'email_integrations'
      AND column_name = 'is_primary'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_email_integrations_is_primary ON email_integrations(is_primary)';
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'email_integrations'
      AND column_name = 'sync_enabled'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_email_integrations_sync_enabled ON email_integrations(sync_enabled)';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_sent_emails_workspace_id ON sent_emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_contact_id ON sent_emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_integration_id ON sent_emails(integration_id);
CREATE INDEX IF NOT EXISTS idx_sent_emails_sent_at ON sent_emails(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_opens_sent_email_id ON email_opens(sent_email_id);
CREATE INDEX IF NOT EXISTS idx_email_opens_opened_at ON email_opens(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_clicks_sent_email_id ON email_clicks(sent_email_id);
CREATE INDEX IF NOT EXISTS idx_email_clicks_clicked_at ON email_clicks(clicked_at DESC);
-- Triggers to automatically update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'update_email_integrations_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'email_integrations'
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE $trg$
      CREATE TRIGGER update_email_integrations_updated_at BEFORE UPDATE ON email_integrations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    $trg$;
  END IF;
END $$;
-- Function to ensure only one primary account per workspace
CREATE OR REPLACE FUNCTION ensure_single_primary_integration()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this integration as primary, unset all other primaries in the same workspace
  IF NEW.is_primary = TRUE THEN
    UPDATE email_integrations
    SET is_primary = FALSE
    WHERE workspace_id = NEW.workspace_id
      AND id != NEW.id
      AND is_primary = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Trigger to enforce single primary account
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'enforce_single_primary_integration'
      AND n.nspname = 'public'
      AND c.relname = 'email_integrations'
      AND NOT t.tgisinternal
  ) THEN
    EXECUTE $trg$
      CREATE TRIGGER enforce_single_primary_integration
        BEFORE INSERT OR UPDATE OF is_primary ON email_integrations
        FOR EACH ROW
        EXECUTE FUNCTION ensure_single_primary_integration();
    $trg$;
  END IF;
END $$;
-- Enable Row Level Security (RLS)
ALTER TABLE email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sent_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_clicks ENABLE ROW LEVEL SECURITY;
-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_integrations'
      AND policyname = 'Users can view email integrations'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view email integrations" ON email_integrations
        FOR SELECT USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_integrations'
      AND policyname = 'Service role can manage email integrations'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can manage email integrations" ON email_integrations
        FOR ALL USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sent_emails'
      AND policyname = 'Users can view sent emails'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view sent emails" ON sent_emails
        FOR SELECT USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sent_emails'
      AND policyname = 'Service role can manage sent emails'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can manage sent emails" ON sent_emails
        FOR ALL USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_opens'
      AND policyname = 'Users can view email opens'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view email opens" ON email_opens
        FOR SELECT USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_opens'
      AND policyname = 'Service role can manage email opens'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can manage email opens" ON email_opens
        FOR ALL USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_clicks'
      AND policyname = 'Users can view email clicks'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view email clicks" ON email_clicks
        FOR SELECT USING (true);
    $policy$;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_clicks'
      AND policyname = 'Service role can manage email clicks'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Service role can manage email clicks" ON email_clicks
        FOR ALL USING (true);
    $policy$;
  END IF;
END $$;
