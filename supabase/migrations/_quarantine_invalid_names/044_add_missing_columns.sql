-- =====================================================
-- Migration 044: Add Missing Columns
-- Created: 2025-11-19
-- Purpose: Add tracking and metadata columns identified by system audit
-- =====================================================

-- =====================================================
-- 1. CAMPAIGNS TABLE - Add Missing Columns
-- =====================================================

-- Add created_by to track who created the campaign
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added campaigns.created_by column';
  ELSE
    RAISE NOTICE '⏭️  campaigns.created_by already exists';
  END IF;
END $$;

-- Add content for email body
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'content'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN content TEXT;
    RAISE NOTICE '✅ Added campaigns.content column';
  ELSE
    RAISE NOTICE '⏭️  campaigns.content already exists';
  END IF;
END $$;

-- Add subject for email subject line
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'subject'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN subject TEXT;
    RAISE NOTICE '✅ Added campaigns.subject column';
  ELSE
    RAISE NOTICE '⏭️  campaigns.subject already exists';
  END IF;
END $$;

-- Add scheduled_at for when to send campaign
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaigns' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN scheduled_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added campaigns.scheduled_at column';
  ELSE
    RAISE NOTICE '⏭️  campaigns.scheduled_at already exists';
  END IF;
END $$;

-- =====================================================
-- 2. CONTACTS TABLE - Add Missing Columns
-- =====================================================

-- Add created_by to track who created the contact
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE contacts ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added contacts.created_by column';
  ELSE
    RAISE NOTICE '⏭️  contacts.created_by already exists';
  END IF;
END $$;

-- Add last_analysis_at to track when AI last analyzed this contact
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'last_analysis_at'
  ) THEN
    ALTER TABLE contacts ADD COLUMN last_analysis_at TIMESTAMPTZ;
    RAISE NOTICE '✅ Added contacts.last_analysis_at column';
  ELSE
    RAISE NOTICE '⏭️  contacts.last_analysis_at already exists';
  END IF;
END $$;

-- Add email_count to track number of emails with this contact
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'email_count'
  ) THEN
    ALTER TABLE contacts ADD COLUMN email_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added contacts.email_count column';
  ELSE
    RAISE NOTICE '⏭️  contacts.email_count already exists';
  END IF;
END $$;

-- =====================================================
-- 3. EMAILS TABLE - Add Missing Columns
-- =====================================================

-- Add received_at to track when email was received
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'emails' AND column_name = 'received_at'
  ) THEN
    ALTER TABLE emails ADD COLUMN received_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added emails.received_at column';
  ELSE
    RAISE NOTICE '⏭️  emails.received_at already exists';
  END IF;
END $$;

-- =====================================================
-- 4. CLIENT_EMAILS TABLE - Add Missing Columns
-- =====================================================

-- Add is_active to track if email is active
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_emails' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE client_emails ADD COLUMN is_active BOOLEAN DEFAULT true;
    RAISE NOTICE '✅ Added client_emails.is_active column';
  ELSE
    RAISE NOTICE '⏭️  client_emails.is_active already exists';
  END IF;
END $$;

-- Add is_primary to mark primary email for client
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_emails' AND column_name = 'is_primary'
  ) THEN
    ALTER TABLE client_emails ADD COLUMN is_primary BOOLEAN DEFAULT false;
    RAISE NOTICE '✅ Added client_emails.is_primary column';
  ELSE
    RAISE NOTICE '⏭️  client_emails.is_primary already exists';
  END IF;
END $$;

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on campaigns.created_by for filtering by creator
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);

-- Index on campaigns.scheduled_at for querying scheduled campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_at ON campaigns(scheduled_at);

-- Index on contacts.created_by for filtering by creator
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);

-- Index on contacts.last_analysis_at for finding stale contacts
CREATE INDEX IF NOT EXISTS idx_contacts_last_analysis_at ON contacts(last_analysis_at DESC);

-- Index on contacts.email_count for engagement queries
CREATE INDEX IF NOT EXISTS idx_contacts_email_count ON contacts(email_count DESC);

-- Index on emails.received_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at DESC);

-- Index on client_emails.is_active for filtering active emails
CREATE INDEX IF NOT EXISTS idx_client_emails_is_active ON client_emails(is_active);

-- Index on client_emails.is_primary for finding primary emails
CREATE INDEX IF NOT EXISTS idx_client_emails_is_primary ON client_emails(is_primary);

-- =====================================================
-- 6. COLUMN COMMENTS (Documentation)
-- =====================================================

COMMENT ON COLUMN campaigns.created_by IS 'User who created this campaign (references auth.users)';
COMMENT ON COLUMN campaigns.content IS 'Email body content for the campaign';
COMMENT ON COLUMN campaigns.subject IS 'Email subject line for the campaign';
COMMENT ON COLUMN campaigns.scheduled_at IS 'Timestamp when campaign is scheduled to be sent';

COMMENT ON COLUMN contacts.created_by IS 'User who created this contact (references auth.users)';
COMMENT ON COLUMN contacts.last_analysis_at IS 'Timestamp of last AI analysis on this contact';
COMMENT ON COLUMN contacts.email_count IS 'Total number of emails exchanged with this contact';

COMMENT ON COLUMN emails.received_at IS 'Timestamp when email was received';

COMMENT ON COLUMN client_emails.is_active IS 'Whether this email is currently active';
COMMENT ON COLUMN client_emails.is_primary IS 'Whether this is the primary email for this contact';

-- =====================================================
-- 7. VERIFICATION
-- =====================================================

DO $$
DECLARE
  campaigns_cols INTEGER;
  contacts_cols INTEGER;
  emails_cols INTEGER;
  client_emails_cols INTEGER;
  total_indexes INTEGER;
BEGIN
  -- Count new columns in campaigns
  SELECT COUNT(*) INTO campaigns_cols
  FROM information_schema.columns
  WHERE table_name = 'campaigns'
    AND column_name IN ('created_by', 'content', 'subject', 'scheduled_at');

  -- Count new columns in contacts
  SELECT COUNT(*) INTO contacts_cols
  FROM information_schema.columns
  WHERE table_name = 'contacts'
    AND column_name IN ('created_by', 'last_analysis_at', 'email_count');

  -- Count new columns in emails
  SELECT COUNT(*) INTO emails_cols
  FROM information_schema.columns
  WHERE table_name = 'emails'
    AND column_name = 'received_at';

  -- Count new columns in client_emails
  SELECT COUNT(*) INTO client_emails_cols
  FROM information_schema.columns
  WHERE table_name = 'client_emails'
    AND column_name IN ('is_active', 'is_primary');

  -- Count indexes created
  SELECT COUNT(*) INTO total_indexes
  FROM pg_indexes
  WHERE indexname IN (
    'idx_campaigns_created_by',
    'idx_campaigns_scheduled_at',
    'idx_contacts_created_by',
    'idx_contacts_last_analysis_at',
    'idx_contacts_email_count',
    'idx_emails_received_at',
    'idx_client_emails_is_active',
    'idx_client_emails_is_primary'
  );

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 044 Complete!';
  RAISE NOTICE '📊 campaigns: % of 4 columns added', campaigns_cols;
  RAISE NOTICE '📊 contacts: % of 3 columns added', contacts_cols;
  RAISE NOTICE '📊 emails: % of 1 columns added', emails_cols;
  RAISE NOTICE '📊 client_emails: % of 2 columns added', client_emails_cols;
  RAISE NOTICE '📊 Performance indexes created: %', total_indexes;
  RAISE NOTICE '';

  IF campaigns_cols = 4 AND contacts_cols = 3 AND emails_cols = 1 AND client_emails_cols = 2 AND total_indexes >= 8 THEN
    RAISE NOTICE '✨ SUCCESS: All missing columns and indexes created!';
  ELSE
    RAISE WARNING '⚠️  Some columns or indexes may be missing. Review output above.';
  END IF;
END $$;
