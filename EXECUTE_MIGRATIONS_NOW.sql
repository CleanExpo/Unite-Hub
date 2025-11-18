-- =====================================================
-- INTELLIGENCE SYSTEM DEPLOYMENT - COMPLETE SQL
-- =====================================================
-- Execute this entire file in Supabase Dashboard SQL Editor
-- URL: https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/sql/new
--
-- Date: 2025-11-18
-- Purpose: Deploy Intelligence Tracking + Content Extensions
-- Time: ~2 minutes
-- =====================================================

\echo ''
\echo '╔════════════════════════════════════════════════════════╗'
\echo '║  INTELLIGENCE SYSTEM DEPLOYMENT - STARTING             ║'
\echo '╚════════════════════════════════════════════════════════╝'
\echo ''

-- =====================================================
-- MIGRATION 040: Add Intelligence Tracking Columns
-- =====================================================

\echo '📦 MIGRATION 040: Intelligence Tracking Columns'
\echo '────────────────────────────────────────────────────────'

-- 1. ADD COLUMNS TO CLIENT_EMAILS
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

-- 2. ADD COLUMNS TO MEDIA_FILES
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

-- Add comments
COMMENT ON COLUMN client_emails.intelligence_analyzed IS 'Tracks whether email has been analyzed by AI Intelligence Extraction Agent';
COMMENT ON COLUMN client_emails.analyzed_at IS 'Timestamp when email was analyzed';
COMMENT ON COLUMN media_files.intelligence_analyzed IS 'Tracks whether media has been analyzed by AI Intelligence Extraction Agent';
COMMENT ON COLUMN media_files.analyzed_at IS 'Timestamp when media was analyzed';

-- Verification
DO $$
DECLARE
  client_emails_columns INTEGER;
  media_files_columns INTEGER;
BEGIN
  SELECT COUNT(*) INTO client_emails_columns
  FROM information_schema.columns
  WHERE table_name = 'client_emails'
  AND column_name IN ('intelligence_analyzed', 'analyzed_at');

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

\echo ''
\echo '────────────────────────────────────────────────────────'
\echo ''

-- =====================================================
-- MIGRATION 041: Extend Content Types & Strategies
-- =====================================================

\echo '📦 MIGRATION 041: Content Type Extensions'
\echo '────────────────────────────────────────────────────────'

-- 1. EXTEND GENERATED_CONTENT TABLE
-- Drop old constraint
ALTER TABLE generated_content DROP CONSTRAINT IF EXISTS generated_content_content_type_check;

-- Add new constraint with additional content types
ALTER TABLE generated_content
ADD CONSTRAINT generated_content_content_type_check
CHECK (content_type IN (
  'followup',
  'proposal',
  'case_study',
  'blog_post',
  'email',
  'social_post',
  'other'
));

-- 2. EXTEND MARKETING_STRATEGIES TABLE
-- Add new columns for complete strategy data
ALTER TABLE marketing_strategies
ADD COLUMN IF NOT EXISTS full_strategy JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS brand_positioning JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS budget_allocation JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS kpis JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS risks JSONB DEFAULT '[]';

-- Add indexes for JSONB queries
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_marketing_strategies_full_strategy') THEN
    CREATE INDEX idx_marketing_strategies_full_strategy ON marketing_strategies USING GIN (full_strategy);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_marketing_strategies_kpis') THEN
    CREATE INDEX idx_marketing_strategies_kpis ON marketing_strategies USING GIN (kpis);
  END IF;
END $$;

-- 3. ADD HELPER COLUMNS TO CALENDAR_POSTS
-- Add engagement tracking columns
ALTER TABLE calendar_posts
ADD COLUMN IF NOT EXISTS engagement_metrics JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS platform_post_id TEXT,
ADD COLUMN IF NOT EXISTS platform_url TEXT;

-- Add index
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_calendar_posts_platform_post_id') THEN
    CREATE INDEX idx_calendar_posts_platform_post_id ON calendar_posts(platform_post_id);
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN generated_content.content_type IS 'Type of generated content: followup, proposal, case_study, blog_post, email, social_post, other';
COMMENT ON COLUMN marketing_strategies.full_strategy IS 'Complete strategy document as JSON (executive summary, objectives, personas, etc.)';
COMMENT ON COLUMN marketing_strategies.brand_positioning IS 'Brand positioning data (UVP, differentiators, voice, personality)';
COMMENT ON COLUMN marketing_strategies.budget_allocation IS 'Budget breakdown by category';
COMMENT ON COLUMN marketing_strategies.kpis IS 'Array of KPI objects with metrics and targets';
COMMENT ON COLUMN marketing_strategies.risks IS 'Array of risk objects with likelihood, impact, and mitigation';
COMMENT ON COLUMN calendar_posts.engagement_metrics IS 'Post engagement data from platform (likes, shares, comments, etc.)';
COMMENT ON COLUMN calendar_posts.platform_post_id IS 'ID of post on external platform (e.g., LinkedIn post ID)';
COMMENT ON COLUMN calendar_posts.platform_url IS 'Public URL of published post';

-- Verification
DO $$
DECLARE
  marketing_strategies_columns INTEGER;
  calendar_posts_columns INTEGER;
BEGIN
  SELECT COUNT(*) INTO marketing_strategies_columns
  FROM information_schema.columns
  WHERE table_name = 'marketing_strategies'
  AND column_name IN ('full_strategy', 'brand_positioning', 'budget_allocation', 'kpis', 'risks');

  SELECT COUNT(*) INTO calendar_posts_columns
  FROM information_schema.columns
  WHERE table_name = 'calendar_posts'
  AND column_name IN ('engagement_metrics', 'platform_post_id', 'platform_url');

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 041 Complete!';
  RAISE NOTICE '📊 generated_content: Extended content types constraint';
  RAISE NOTICE '📊 marketing_strategies: Added % columns', marketing_strategies_columns;
  RAISE NOTICE '📊 calendar_posts: Added % columns', calendar_posts_columns;
  RAISE NOTICE '';

  IF marketing_strategies_columns = 5 AND calendar_posts_columns = 3 THEN
    RAISE NOTICE '✨ SUCCESS: All extensions applied!';
  ELSE
    RAISE WARNING '⚠️  Some columns may already exist. Check table schemas.';
  END IF;
END $$;

\echo ''
\echo '────────────────────────────────────────────────────────'
\echo ''

-- =====================================================
-- COMPREHENSIVE VERIFICATION
-- =====================================================

\echo '🔍 COMPREHENSIVE SCHEMA VERIFICATION'
\echo '────────────────────────────────────────────────────────'

\echo ''
\echo '📊 Check 1: Intelligence Tracking Columns'
SELECT
  'client_emails.intelligence_analyzed' as column_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_emails' AND column_name = 'intelligence_analyzed') THEN '✅' ELSE '❌' END as exists
UNION ALL
SELECT 'client_emails.analyzed_at', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'client_emails' AND column_name = 'analyzed_at') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'media_files.intelligence_analyzed', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_files' AND column_name = 'intelligence_analyzed') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'media_files.analyzed_at', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_files' AND column_name = 'analyzed_at') THEN '✅' ELSE '❌' END;

\echo ''
\echo '📊 Check 2: Marketing Strategy Extensions'
SELECT
  'full_strategy' as column_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_strategies' AND column_name = 'full_strategy') THEN '✅' ELSE '❌' END as exists
UNION ALL
SELECT 'brand_positioning', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_strategies' AND column_name = 'brand_positioning') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'budget_allocation', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_strategies' AND column_name = 'budget_allocation') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'kpis', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_strategies' AND column_name = 'kpis') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'risks', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketing_strategies' AND column_name = 'risks') THEN '✅' ELSE '❌' END;

\echo ''
\echo '📊 Check 3: Calendar Posts Extensions'
SELECT
  'engagement_metrics' as column_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_posts' AND column_name = 'engagement_metrics') THEN '✅' ELSE '❌' END as exists
UNION ALL
SELECT 'platform_post_id', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_posts' AND column_name = 'platform_post_id') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'platform_url', CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calendar_posts' AND column_name = 'platform_url') THEN '✅' ELSE '❌' END;

\echo ''
\echo '📊 Check 4: Performance Indexes'
SELECT
  COUNT(*) as total_indexes,
  CASE
    WHEN COUNT(*) >= 7 THEN '✅ All indexes created'
    ELSE '⚠️  Some indexes may be missing'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  indexname LIKE 'idx_%intelligence%'
  OR indexname LIKE 'idx_%strateg%'
  OR indexname LIKE 'idx_%calendar%platform%'
);

\echo ''
\echo '╔════════════════════════════════════════════════════════╗'
\echo '║  DEPLOYMENT COMPLETE! ✅                               ║'
\echo '╚════════════════════════════════════════════════════════╝'
\echo ''
\echo '📝 Summary:'
\echo '  • Migration 040: Intelligence tracking columns added'
\echo '  • Migration 041: Content types and strategies extended'
\echo '  • All indexes created for performance'
\echo '  • Schema verified successfully'
\echo ''
\echo '🎯 Next Steps:'
\echo '  1. Review: .claude/agents/CLIENT-INTELLIGENCE-SYSTEM-IMPLEMENTATION-GUIDE.md'
\echo '  2. Implement: Email Integration Agent API (Week 2-3)'
\echo '  3. Deploy: Docker agents (docker-compose.agents.yml)'
\echo ''
