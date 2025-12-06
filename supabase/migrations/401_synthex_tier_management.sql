-- Migration 401: Synthex Tier Management
-- Phase 4 of Unite-Hub Rebuild
-- Purpose: Tier-gated features for Synthex client portal (ADR-006)
-- Date: 2025-11-29

-- ============================================================================
-- SECTION 1: Tier Limits Configuration Table
-- Defines what each tier can access
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_tier_limits (
  tier TEXT PRIMARY KEY CHECK (tier IN ('starter', 'professional', 'elite')),

  -- Contact & Campaign limits
  contacts_limit INTEGER NOT NULL,
  campaigns_limit INTEGER NOT NULL,
  emails_per_month INTEGER NOT NULL,
  drip_campaigns_limit INTEGER NOT NULL DEFAULT 1,

  -- Feature flags
  seo_reports BOOLEAN NOT NULL DEFAULT false,
  competitor_analysis BOOLEAN NOT NULL DEFAULT false,
  api_access BOOLEAN NOT NULL DEFAULT false,
  priority_support BOOLEAN NOT NULL DEFAULT false,
  white_label BOOLEAN NOT NULL DEFAULT false,
  custom_domain BOOLEAN NOT NULL DEFAULT false,

  -- AI Features
  ai_content_generation BOOLEAN NOT NULL DEFAULT true,
  ai_extended_thinking BOOLEAN NOT NULL DEFAULT false,
  ai_agent_access BOOLEAN NOT NULL DEFAULT false,

  -- Storage limits (MB)
  storage_limit_mb INTEGER NOT NULL DEFAULT 500,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default tier limits
INSERT INTO synthex_tier_limits (
  tier, contacts_limit, campaigns_limit, emails_per_month, drip_campaigns_limit,
  seo_reports, competitor_analysis, api_access, priority_support, white_label, custom_domain,
  ai_content_generation, ai_extended_thinking, ai_agent_access, storage_limit_mb
)
VALUES
  -- Starter: $29/mo
  ('starter', 500, 3, 2000, 1,
   false, false, false, false, false, false,
   true, false, false, 500),

  -- Professional: $99/mo
  ('professional', 5000, 15, 15000, 5,
   true, false, true, false, false, false,
   true, true, false, 2000),

  -- Elite: $299/mo
  ('elite', -1, -1, -1, -1,  -- -1 = unlimited
   true, true, true, true, true, true,
   true, true, true, 10000)

ON CONFLICT (tier) DO UPDATE SET
  contacts_limit = EXCLUDED.contacts_limit,
  campaigns_limit = EXCLUDED.campaigns_limit,
  emails_per_month = EXCLUDED.emails_per_month,
  drip_campaigns_limit = EXCLUDED.drip_campaigns_limit,
  seo_reports = EXCLUDED.seo_reports,
  competitor_analysis = EXCLUDED.competitor_analysis,
  api_access = EXCLUDED.api_access,
  priority_support = EXCLUDED.priority_support,
  white_label = EXCLUDED.white_label,
  custom_domain = EXCLUDED.custom_domain,
  ai_content_generation = EXCLUDED.ai_content_generation,
  ai_extended_thinking = EXCLUDED.ai_extended_thinking,
  ai_agent_access = EXCLUDED.ai_agent_access,
  storage_limit_mb = EXCLUDED.storage_limit_mb,
  updated_at = NOW();

-- ============================================================================
-- SECTION 2: Workspace Subscription Status
-- Links workspaces to their current subscription tier
-- ============================================================================

-- Add subscription fields to workspaces if not exist
DO $$
BEGIN
  -- Add current_tier column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workspaces'
    AND column_name = 'current_tier'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN current_tier TEXT DEFAULT 'starter'
      CHECK (current_tier IN ('starter', 'professional', 'elite'));
  END IF;

  -- Add subscription_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workspaces'
    AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN subscription_status TEXT DEFAULT 'active'
      CHECK (subscription_status IN ('active', 'trial', 'past_due', 'cancelled'));
  END IF;

  -- Add trial_ends_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workspaces'
    AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN trial_ends_at TIMESTAMPTZ;
  END IF;

  -- Add stripe_customer_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workspaces'
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN stripe_customer_id TEXT;
  END IF;

  -- Add stripe_subscription_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workspaces'
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

-- Create index for tier queries
DROP INDEX IF EXISTS idx_workspaces_current_tier;
CREATE INDEX IF NOT EXISTS idx_workspaces_current_tier ON workspaces(current_tier);
DROP INDEX IF EXISTS idx_workspaces_subscription_status;
CREATE INDEX IF NOT EXISTS idx_workspaces_subscription_status ON workspaces(subscription_status);

-- ============================================================================
-- SECTION 3: Tier Check Functions
-- Used for RLS policies and API route guards
-- ============================================================================

-- Check if workspace has at least the specified tier
CREATE OR REPLACE FUNCTION public.workspace_has_tier(
  workspace_id_param UUID,
  required_tier TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_tier TEXT;
  tier_order TEXT[] := ARRAY['starter', 'professional', 'elite'];
BEGIN
  -- Get workspace's current tier
  SELECT w.current_tier INTO current_tier
  FROM workspaces w
  WHERE w.id = workspace_id_param
  AND w.subscription_status IN ('active', 'trial');

  IF current_tier IS NULL THEN
    RETURN false;
  END IF;

  -- Compare tier levels
  RETURN array_position(tier_order, current_tier) >= array_position(tier_order, required_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if workspace can access a specific feature
CREATE OR REPLACE FUNCTION public.workspace_has_feature(
  workspace_id_param UUID,
  feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_tier TEXT;
  has_feature BOOLEAN;
BEGIN
  -- Get workspace's current tier
  SELECT w.current_tier INTO current_tier
  FROM workspaces w
  WHERE w.id = workspace_id_param
  AND w.subscription_status IN ('active', 'trial');

  IF current_tier IS NULL THEN
    RETURN false;
  END IF;

  -- Check feature based on tier limits
  EXECUTE format(
    'SELECT %I FROM synthex_tier_limits WHERE tier = $1',
    feature_name
  ) INTO has_feature USING current_tier;

  RETURN COALESCE(has_feature, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get workspace's limit for a resource
CREATE OR REPLACE FUNCTION public.get_workspace_limit(
  workspace_id_param UUID,
  limit_name TEXT
)
RETURNS INTEGER AS $$
DECLARE
  current_tier TEXT;
  limit_value INTEGER;
BEGIN
  -- Get workspace's current tier
  SELECT w.current_tier INTO current_tier
  FROM workspaces w
  WHERE w.id = workspace_id_param
  AND w.subscription_status IN ('active', 'trial');

  IF current_tier IS NULL THEN
    RETURN 0;
  END IF;

  -- Get limit value
  EXECUTE format(
    'SELECT %I FROM synthex_tier_limits WHERE tier = $1',
    limit_name
  ) INTO limit_value USING current_tier;

  RETURN COALESCE(limit_value, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if workspace is within a limit
CREATE OR REPLACE FUNCTION public.workspace_within_limit(
  workspace_id_param UUID,
  limit_name TEXT,
  current_count INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  max_limit INTEGER;
BEGIN
  max_limit := public.get_workspace_limit(workspace_id_param, limit_name);

  -- -1 means unlimited
  IF max_limit = -1 THEN
    RETURN true;
  END IF;

  RETURN current_count < max_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.workspace_has_tier(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_has_feature(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workspace_limit(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_within_limit(UUID, TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- SECTION 4: RLS Policies for Tier Tables
-- ============================================================================

-- Enable RLS on tier_limits (readable by all authenticated users)
ALTER TABLE synthex_tier_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tier_limits_select_authenticated" ON synthex_tier_limits;
CREATE POLICY "tier_limits_select_authenticated" ON synthex_tier_limits
  FOR SELECT TO authenticated
  USING (true);

-- Only admins can modify tier limits
DROP POLICY IF EXISTS "tier_limits_admin_all" ON synthex_tier_limits;
CREATE POLICY "tier_limits_admin_all" ON synthex_tier_limits
  FOR ALL TO authenticated
  USING (public.has_role('FOUNDER', 'ADMIN'))
  WITH CHECK (public.has_role('FOUNDER', 'ADMIN'));

-- ============================================================================
-- SECTION 5: Usage Tracking Table
-- Track resource usage per workspace for limit enforcement
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Usage period (monthly)
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Usage counts
  contacts_count INTEGER NOT NULL DEFAULT 0,
  campaigns_count INTEGER NOT NULL DEFAULT 0,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  drip_campaigns_count INTEGER NOT NULL DEFAULT 0,
  storage_used_mb INTEGER NOT NULL DEFAULT 0,

  -- AI usage (for potential future billing)
  ai_tokens_used INTEGER NOT NULL DEFAULT 0,
  ai_requests_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workspace_id, period_start)
);

DROP INDEX IF EXISTS idx_usage_tracking_workspace;
CREATE INDEX idx_usage_tracking_workspace ON synthex_usage_tracking(workspace_id);
DROP INDEX IF EXISTS idx_usage_tracking_period;
CREATE INDEX idx_usage_tracking_period ON synthex_usage_tracking(period_start, period_end);

-- Enable RLS
ALTER TABLE synthex_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can only see their own workspace's usage
DROP POLICY IF EXISTS "usage_tracking_select" ON synthex_usage_tracking;
CREATE POLICY "usage_tracking_select" ON synthex_usage_tracking
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(workspace_id));

-- ============================================================================
-- Verification Queries
-- ============================================================================
/*
-- Check tier limits
SELECT * FROM synthex_tier_limits ORDER BY
  CASE tier WHEN 'starter' THEN 1 WHEN 'professional' THEN 2 WHEN 'elite' THEN 3 END;

-- Test tier check function
SELECT public.workspace_has_tier('your-workspace-id', 'professional');

-- Test feature check
SELECT public.workspace_has_feature('your-workspace-id', 'seo_reports');
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================
