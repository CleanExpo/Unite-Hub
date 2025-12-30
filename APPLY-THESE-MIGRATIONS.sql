-- ============================================================
-- SYNTHEX.SOCIAL PRODUCTION MIGRATIONS
-- Apply these in Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Migration 1: Synthex Content Queue
-- Manages scheduled social posts and content across all tiers
-- ============================================================

CREATE TABLE IF NOT EXISTS synthex_content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Content details
  content_type TEXT NOT NULL CHECK (content_type IN ('social_post', 'blog_post', 'email', 'video', 'ad_copy')),
  platform TEXT CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'email')),
  title TEXT,
  body TEXT NOT NULL,
  media_urls TEXT[], -- Array of image/video URLs
  hashtags TEXT[],

  -- Scheduling
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'published', 'failed', 'cancelled')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Tier limits
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'professional', 'elite')),
  weekly_limit INTEGER, -- NULL for unlimited (elite)

  -- AI generation metadata
  generated_by TEXT, -- Agent name
  prompt_used TEXT,
  industry TEXT,
  brand_voice JSONB,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_synthex_content_queue_workspace ON synthex_content_queue(workspace_id);
CREATE INDEX IF NOT EXISTS idx_synthex_content_queue_status ON synthex_content_queue(status);
CREATE INDEX IF NOT EXISTS idx_synthex_content_queue_scheduled ON synthex_content_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_synthex_content_queue_tier ON synthex_content_queue(tier);

-- RLS Policies
ALTER TABLE synthex_content_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON synthex_content_queue;
CREATE POLICY "tenant_isolation" ON synthex_content_queue
FOR ALL USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_synthex_content_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_synthex_content_queue_updated_at ON synthex_content_queue;
CREATE TRIGGER trigger_synthex_content_queue_updated_at
  BEFORE UPDATE ON synthex_content_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_synthex_content_queue_updated_at();


-- ============================================================
-- Migration 2: Custom Integrations (Elite Tier Feature)
-- Allows businesses to connect custom APIs and webhooks
-- ============================================================

CREATE TABLE IF NOT EXISTS custom_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Integration details
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('webhook', 'rest_api', 'oauth', 'custom')),

  -- Configuration (stored as JSONB for flexibility)
  config JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  last_executed TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  execution_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_integrations_workspace ON custom_integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_custom_integrations_status ON custom_integrations(status);
CREATE INDEX IF NOT EXISTS idx_custom_integrations_type ON custom_integrations(type);

-- RLS Policies
ALTER TABLE custom_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON custom_integrations;
CREATE POLICY "tenant_isolation" ON custom_integrations
FOR ALL USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Only allow Elite tier workspaces to create integrations
DROP POLICY IF EXISTS "elite_tier_only" ON custom_integrations;
CREATE POLICY "elite_tier_only" ON custom_integrations
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT s.workspace_id FROM subscriptions s
    WHERE s.tier = 'elite' AND s.status = 'active'
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_custom_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_custom_integrations_updated_at ON custom_integrations;
CREATE TRIGGER trigger_custom_integrations_updated_at
  BEFORE UPDATE ON custom_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_integrations_updated_at();


-- ============================================================
-- VERIFICATION QUERIES
-- Run these after applying migrations to verify success
-- ============================================================

-- Check tables exist
SELECT 'synthex_content_queue' as table_name, COUNT(*) as row_count FROM synthex_content_queue
UNION ALL
SELECT 'custom_integrations', COUNT(*) FROM custom_integrations;

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('synthex_content_queue', 'custom_integrations');

-- Check policies exist
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('synthex_content_queue', 'custom_integrations');


-- ============================================================
-- DONE
-- ============================================================
-- After running, all Synthex.social features will be 100% functional
-- ============================================================
