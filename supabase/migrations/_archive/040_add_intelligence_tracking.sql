-- =====================================================
-- Migration 040: Add Intelligence Tracking Columns
-- =====================================================
-- Purpose: Add intelligence_analyzed tracking to client_emails and media_files
-- Date: 2025-11-18
-- Version: 1.0.0
-- Dependencies: Requires existing client_emails and media_files tables

-- =====================================================
-- 1. ADD COLUMNS TO CLIENT_EMAILS
-- =====================================================

-- Add intelligence_analyzed tracking
ALTER TABLE client_emails
ADD COLUMN IF NOT EXISTS intelligence_analyzed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

-- Add index for performance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_client_emails_intelligence_analyzed') THEN
    CREATE INDEX idx_client_emails_intelligence_analyzed ON client_emails(intelligence_analyzed);
  END IF;
END $$;

-- Add composite index for common queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_client_emails_workspace_analyzed') THEN
    CREATE INDEX idx_client_emails_workspace_analyzed ON client_emails(workspace_id, intelligence_analyzed);
  END IF;
END $$;

-- =====================================================
-- 2. ADD COLUMNS TO MEDIA_FILES
-- =====================================================

-- Add intelligence_analyzed tracking
ALTER TABLE media_files
ADD COLUMN IF NOT EXISTS intelligence_analyzed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ;

-- Add index for performance
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_media_files_intelligence_analyzed') THEN
    CREATE INDEX idx_media_files_intelligence_analyzed ON media_files(intelligence_analyzed);
  END IF;
END $$;

-- Add composite index for common queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_media_files_workspace_analyzed') THEN
    CREATE INDEX idx_media_files_workspace_analyzed ON media_files(workspace_id, intelligence_analyzed);
  END IF;
END $$;

-- =====================================================
-- 3. VERIFICATION
-- =====================================================

DO $$
DECLARE
  client_emails_columns INTEGER;
  media_files_columns INTEGER;
BEGIN
  -- Count new columns in client_emails
  SELECT COUNT(*) INTO client_emails_columns
  FROM information_schema.columns
  WHERE table_name = 'client_emails'
  AND column_name IN ('intelligence_analyzed', 'analyzed_at');

  -- Count new columns in media_files
  SELECT COUNT(*) INTO media_files_columns
  FROM information_schema.columns
  WHERE table_name = 'media_files'
  AND column_name IN ('intelligence_analyzed', 'analyzed_at');

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 040 Complete!';
  RAISE NOTICE '📊 client_emails: Added % columns', client_emails_columns;
  RAISE NOTICE '📊 media_files: Added % columns', media_files_columns;
  RAISE NOTICE '';

  IF client_emails_columns = 2 AND media_files_columns = 2 THEN
    RAISE NOTICE '✨ SUCCESS: Intelligence tracking enabled!';
  ELSE
    RAISE WARNING '⚠️  Some columns may already exist. Check table schemas.';
  END IF;
END $$;

-- =====================================================
-- 4. COMMENTS
-- =====================================================

COMMENT ON COLUMN client_emails.intelligence_analyzed IS 'Tracks whether email has been analyzed by AI Intelligence Extraction Agent';
COMMENT ON COLUMN client_emails.analyzed_at IS 'Timestamp when email was analyzed';
COMMENT ON COLUMN media_files.intelligence_analyzed IS 'Tracks whether media has been analyzed by AI Intelligence Extraction Agent';
COMMENT ON COLUMN media_files.analyzed_at IS 'Timestamp when media was analyzed';
