# Intelligence System Database Deployment Guide

**Generated**: 2025-11-18
**Status**: Ready for Manual Execution
**Database**: Supabase (Project: lksfwktwtmyznckodsau)

---

## Executive Summary

This guide provides SQL migrations to enable the **Client Intelligence System** in Unite-Hub. The system processes emails and call recordings to extract actionable marketing intelligence.

### What Gets Installed

1. **Intelligence Tracking Columns** (Migration 040)
   - Adds `intelligence_analyzed` and `analyzed_at` to `client_emails`
   - Adds `intelligence_analyzed` and `analyzed_at` to `media_files`
   - Creates performance indexes

2. **Content Type Extensions** (Migration 041)
   - Extends `generated_content` to support: blog_post, email, social_post, other
   - Adds JSONB columns to `marketing_strategies` for complete strategy storage
   - Adds engagement tracking to `calendar_posts`

### Prerequisites

✅ Migration 039 v3 (Autonomous Intelligence System) must be applied first
✅ Tables exist: `client_emails`, `media_files`, `generated_content`, `marketing_strategies`, `calendar_posts`
✅ You have access to Supabase Dashboard SQL Editor

---

## Migration 040: Intelligence Tracking Columns

### Purpose
Enables the **Continuous Intelligence Update Agent** to track which emails and media files have been processed by AI.

### Execution Steps

1. Open Supabase Dashboard SQL Editor:
   ```
   https://supabase.com/dashboard/project/lksfwktwtmyznckodsau/sql/new
   ```

2. Copy the SQL below and paste into the editor

3. Click "Run" button

4. Verify you see: ✅ Migration 040 Complete!

### SQL to Execute

```sql
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
```

### Expected Output

```
NOTICE:
NOTICE:  ✅ Migration 040 Complete!
NOTICE:  📊 client_emails: Added 2 columns
NOTICE:  📊 media_files: Added 2 columns
NOTICE:
NOTICE:  ✨ SUCCESS: Intelligence tracking enabled!
```

---

## Migration 041: Extend Content Types & Strategies

### Purpose
Extends existing tables to support:
- Additional content types (blog posts, emails, social posts)
- Complete marketing strategy storage (JSONB)
- Engagement metrics for published content

### Execution Steps

1. Same Supabase Dashboard SQL Editor (keep it open from Migration 040)

2. Copy the SQL below into a **new query tab**

3. Click "Run" button

4. Verify you see: ✅ Migration 041 Complete!

### SQL to Execute

```sql
-- =====================================================
-- Migration 041: Extend Generated Content & Marketing Strategies
-- =====================================================
-- Purpose: Add support for new content types and strategy fields
-- Date: 2025-11-18
-- Version: 1.0.0
-- Dependencies: Requires existing generated_content and marketing_strategies tables

-- =====================================================
-- 1. EXTEND GENERATED_CONTENT TABLE
-- =====================================================

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

-- =====================================================
-- 2. EXTEND MARKETING_STRATEGIES TABLE
-- =====================================================

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

-- =====================================================
-- 3. ADD HELPER COLUMNS TO CALENDAR_POSTS
-- =====================================================

-- Add engagement tracking columns (for future use)
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

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

DO $$
DECLARE
  generated_content_types TEXT[];
  marketing_strategies_columns INTEGER;
  calendar_posts_columns INTEGER;
BEGIN
  -- Get allowed content types
  SELECT enumvals::text[] INTO generated_content_types
  FROM (
    SELECT ARRAY(
      SELECT unnest(string_to_array(
        regexp_replace(
          pg_get_constraintdef(oid),
          '.*CHECK \(\(content_type\)::[^=]+ = ANY \(ARRAY\[(.*)\]\)\)',
          '\1'
        ),
        ', '
      ))
    ) as enumvals
    FROM pg_constraint
    WHERE conname = 'generated_content_content_type_check'
  ) sub;

  -- Count new columns in marketing_strategies
  SELECT COUNT(*) INTO marketing_strategies_columns
  FROM information_schema.columns
  WHERE table_name = 'marketing_strategies'
  AND column_name IN ('full_strategy', 'brand_positioning', 'budget_allocation', 'kpis', 'risks');

  -- Count new columns in calendar_posts
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

-- =====================================================
-- 5. COMMENTS
-- =====================================================

COMMENT ON COLUMN generated_content.content_type IS 'Type of generated content: followup, proposal, case_study, blog_post, email, social_post, other';

COMMENT ON COLUMN marketing_strategies.full_strategy IS 'Complete strategy document as JSON (executive summary, objectives, personas, etc.)';
COMMENT ON COLUMN marketing_strategies.brand_positioning IS 'Brand positioning data (UVP, differentiators, voice, personality)';
COMMENT ON COLUMN marketing_strategies.budget_allocation IS 'Budget breakdown by category';
COMMENT ON COLUMN marketing_strategies.kpis IS 'Array of KPI objects with metrics and targets';
COMMENT ON COLUMN marketing_strategies.risks IS 'Array of risk objects with likelihood, impact, and mitigation';

COMMENT ON COLUMN calendar_posts.engagement_metrics IS 'Post engagement data from platform (likes, shares, comments, etc.)';
COMMENT ON COLUMN calendar_posts.platform_post_id IS 'ID of post on external platform (e.g., LinkedIn post ID)';
COMMENT ON COLUMN calendar_posts.platform_url IS 'Public URL of published post';
```

### Expected Output

```
NOTICE:
NOTICE:  ✅ Migration 041 Complete!
NOTICE:  📊 generated_content: Extended content types constraint
NOTICE:  📊 marketing_strategies: Added 5 columns
NOTICE:  📊 calendar_posts: Added 3 columns
NOTICE:
NOTICE:  ✨ SUCCESS: All extensions applied!
```

---

## Verification Script

After running both migrations, execute this script to verify everything is configured correctly:

### SQL to Execute

```sql
-- =====================================================
-- Test Intelligence System Schema
-- =====================================================
-- This script verifies all tables and columns exist

\echo ''
\echo '🔍 VERIFYING CLIENT INTELLIGENCE SYSTEM SCHEMA'
\echo '=============================================='
\echo ''

-- Check 1: Verify all required tables exist
\echo '📊 Check 1: Verifying tables...'
SELECT
  'email_intelligence' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_intelligence') THEN '✅' ELSE '❌' END as exists
UNION ALL
SELECT 'dynamic_questionnaires', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dynamic_questionnaires') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'questionnaire_responses', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questionnaire_responses') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'autonomous_tasks', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'autonomous_tasks') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'marketing_strategies', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'marketing_strategies') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'knowledge_graph_nodes', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_graph_nodes') THEN '✅' ELSE '❌' END
UNION ALL
SELECT 'knowledge_graph_edges', CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_graph_edges') THEN '✅' ELSE '❌' END;

\echo ''
\echo '📊 Check 2: Verifying intelligence tracking columns...'
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
\echo '📊 Check 3: Verifying marketing strategy extensions...'
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
\echo '📊 Check 4: Verifying RLS is enabled...'
SELECT
  tablename,
  CASE WHEN rowsecurity = true THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'email_intelligence',
  'dynamic_questionnaires',
  'questionnaire_responses',
  'autonomous_tasks',
  'marketing_strategies',
  'knowledge_graph_nodes',
  'knowledge_graph_edges'
)
ORDER BY tablename;

\echo ''
\echo '📊 Check 5: Counting indexes...'
SELECT
  COUNT(*) as total_indexes,
  CASE
    WHEN COUNT(*) >= 15 THEN '✅ Good performance coverage'
    ELSE '⚠️  Consider adding more indexes'
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
AND (
  indexname LIKE 'idx_%intelligence%'
  OR indexname LIKE 'idx_%questionnaire%'
  OR indexname LIKE 'idx_%task%'
  OR indexname LIKE 'idx_%strateg%'
  OR indexname LIKE 'idx_%knowledge%'
  OR indexname LIKE 'idx_%calendar%'
);

\echo ''
\echo '✅ SCHEMA VERIFICATION COMPLETE'
\echo ''
```

### Expected Output

All checks should show ✅:

```
📊 Check 1: Verifying tables...
table_name              | exists
-----------------------+--------
email_intelligence     | ✅
dynamic_questionnaires | ✅
questionnaire_responses| ✅
autonomous_tasks       | ✅
marketing_strategies   | ✅
knowledge_graph_nodes  | ✅
knowledge_graph_edges  | ✅

📊 Check 2: Verifying intelligence tracking columns...
column_name                          | exists
-----------------------------------+--------
client_emails.intelligence_analyzed | ✅
client_emails.analyzed_at           | ✅
media_files.intelligence_analyzed   | ✅
media_files.analyzed_at             | ✅

📊 Check 3: Verifying marketing strategy extensions...
column_name       | exists
-----------------+--------
full_strategy    | ✅
brand_positioning| ✅
budget_allocation| ✅
kpis             | ✅
risks            | ✅

📊 Check 4: Verifying RLS is enabled...
tablename              | rls_status
----------------------+-------------
email_intelligence    | ✅ Enabled
dynamic_questionnaires| ✅ Enabled
... (all tables)

📊 Check 5: Counting indexes...
total_indexes | status
-------------+---------------------------
18           | ✅ Good performance coverage
```

---

## Troubleshooting

### Issue: "relation does not exist"

**Cause**: Migration 039 v3 hasn't been applied yet

**Solution**: Apply migration 039_autonomous_intelligence_system_v3.sql first (located in `/d/Unite-Hub/supabase/migrations/`)

### Issue: "column already exists"

**Cause**: Migrations have been partially applied before

**Solution**: This is safe - migrations use `IF NOT EXISTS` clauses. Verify using the verification script above.

### Issue: Tables show ❌ in verification

**Cause**: Core intelligence tables don't exist

**Solution**:
1. Check if migration 039_v3 exists: `ls supabase/migrations/ | grep 039`
2. Apply it via Dashboard SQL Editor
3. Re-run verifications

---

## Next Steps

After successful deployment:

1. ✅ **Verify Schema** - Run verification script (see above)

2. 📚 **Review Implementation Guide** - See [CLIENT-INTELLIGENCE-SYSTEM-IMPLEMENTATION-GUIDE.md](.claude/agents/CLIENT-INTELLIGENCE-SYSTEM-IMPLEMENTATION-GUIDE.md)

3. 🔧 **Implement APIs** - Start with Week 2-3 tasks:
   - Email Integration Agent API
   - Media Transcription Agent API
   - AI Intelligence Extraction Agent API

4. 🧪 **Test with Sample Data** - Insert test emails and media files to verify tracking columns

5. 🚀 **Deploy Agents** - Configure and deploy Claude agents as Docker containers

---

## Support

For issues or questions:
- Check implementation guide: `.claude/agents/CLIENT-INTELLIGENCE-SYSTEM-IMPLEMENTATION-GUIDE.md`
- Review agent specifications: `.claude/agents/*-AGENT.md` (11 agent specs available)
- Check database schema: `COMPLETE_DATABASE_SCHEMA.sql`

---

**Deployment Status**: ⏳ Awaiting Manual Execution
**Last Updated**: 2025-11-18
**Version**: 1.0.0
