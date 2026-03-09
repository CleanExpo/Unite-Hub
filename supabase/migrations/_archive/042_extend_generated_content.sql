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
