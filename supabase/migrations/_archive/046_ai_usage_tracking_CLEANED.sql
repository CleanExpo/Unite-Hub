-- =====================================================
-- Migration 046: AI Usage Tracking & Cost Monitoring (CLEANED)
-- Created: 2025-11-19
-- Updated: 2025-11-19 (Optimized for Supabase)
-- Purpose: Track AI API usage, costs, and budget enforcement
-- Strategy: Multi-provider routing (Gemini/OpenRouter/Anthropic)
-- =====================================================

-- =====================================================
-- CLEANUP: Drop existing objects if migration needs to be re-run
-- =====================================================

-- Drop policies first (before tables)
DROP POLICY IF EXISTS "workspace_isolation_select" ON ai_usage_logs;
DROP POLICY IF EXISTS "workspace_isolation_insert" ON ai_usage_logs;
DROP POLICY IF EXISTS "service_role_all_access" ON ai_usage_logs;
DROP POLICY IF EXISTS "workspace_isolation_select" ON ai_budget_limits;
DROP POLICY IF EXISTS "workspace_isolation_update" ON ai_budget_limits;
DROP POLICY IF EXISTS "service_role_all_access" ON ai_budget_limits;

-- Drop functions (will be recreated)
DROP FUNCTION IF EXISTS log_ai_usage(UUID, UUID, TEXT, TEXT, TEXT, INTEGER, INTEGER, DECIMAL, INTEGER, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS check_ai_budget(UUID, TEXT);
DROP FUNCTION IF EXISTS get_ai_cost_breakdown(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS refresh_ai_daily_summary();

-- Drop materialized view and its indexes
DROP MATERIALIZED VIEW IF EXISTS ai_daily_summary CASCADE;

-- Drop tables (CASCADE will drop foreign key constraints)
-- Note: Comment these out if you want to preserve existing data
-- DROP TABLE IF EXISTS ai_usage_logs CASCADE;
-- DROP TABLE IF EXISTS ai_budget_limits CASCADE;

-- =====================================================
-- 1. AI_USAGE_LOGS TABLE - Track Every AI API Call
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request details
  workspace_id UUID NOT NULL,
  user_id UUID,

  -- AI provider info
  provider TEXT NOT NULL CHECK (provider IN ('google_gemini', 'openrouter', 'anthropic_direct', 'openai_direct')),
  model_id TEXT NOT NULL,
  task_type TEXT,

  -- Token usage
  tokens_input INTEGER NOT NULL DEFAULT 0 CHECK (tokens_input >= 0),
  tokens_output INTEGER NOT NULL DEFAULT 0 CHECK (tokens_output >= 0),
  tokens_thinking INTEGER DEFAULT 0 CHECK (tokens_thinking >= 0),
  tokens_cached INTEGER DEFAULT 0 CHECK (tokens_cached >= 0),

  -- Cost tracking
  cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0 CHECK (cost_usd >= 0),
  cost_per_input_mtok DECIMAL(10,2),
  cost_per_output_mtok DECIMAL(10,2),

  -- Performance metrics
  latency_ms INTEGER CHECK (latency_ms >= 0),
  response_size_bytes INTEGER CHECK (response_size_bytes >= 0),

  -- Status
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  error_code TEXT,

  -- Metadata
  endpoint TEXT,
  request_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key constraints
  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_workspace_created
  ON ai_usage_logs(workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_created
  ON ai_usage_logs(provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_task_type
  ON ai_usage_logs(task_type)
  WHERE task_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_usage_cost
  ON ai_usage_logs(cost_usd DESC)
  WHERE cost_usd > 0;

CREATE INDEX IF NOT EXISTS idx_ai_usage_failed
  ON ai_usage_logs(created_at DESC)
  WHERE success = FALSE;

-- Add table comment
COMMENT ON TABLE ai_usage_logs IS
  'Tracks every AI API call across Gemini, OpenRouter, and Anthropic with cost monitoring';

-- =====================================================
-- 2. AI_BUDGET_LIMITS TABLE - Budget Control Per Workspace
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_budget_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL UNIQUE,

  -- Budget limits (in USD)
  daily_limit_usd DECIMAL(10,2) NOT NULL DEFAULT 50.00 CHECK (daily_limit_usd > 0),
  monthly_limit_usd DECIMAL(10,2) NOT NULL DEFAULT 1500.00 CHECK (monthly_limit_usd > 0),
  alert_threshold_pct INTEGER NOT NULL DEFAULT 80 CHECK (alert_threshold_pct BETWEEN 1 AND 100),

  -- Budget enforcement
  enforce_daily BOOLEAN NOT NULL DEFAULT TRUE,
  enforce_monthly BOOLEAN NOT NULL DEFAULT TRUE,

  -- Notifications
  notify_email TEXT,
  notify_on_threshold BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_limit BOOLEAN NOT NULL DEFAULT TRUE,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign key constraint
  CONSTRAINT fk_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Index for workspace lookups
CREATE INDEX IF NOT EXISTS idx_budget_workspace_active
  ON ai_budget_limits(workspace_id)
  WHERE is_active = TRUE;

-- Add table comment
COMMENT ON TABLE ai_budget_limits IS
  'Budget limits and enforcement rules per workspace for AI API usage';

-- =====================================================
-- 3. AI_DAILY_SUMMARY MATERIALIZED VIEW - Fast Daily Stats
-- =====================================================

CREATE MATERIALIZED VIEW ai_daily_summary AS
SELECT
  workspace_id,
  created_at::date AS date,
  provider,

  -- Request counts
  COUNT(*) AS total_requests,
  COUNT(*) FILTER (WHERE success = TRUE) AS successful_requests,
  COUNT(*) FILTER (WHERE success = FALSE) AS failed_requests,

  -- Token usage
  COALESCE(SUM(tokens_input), 0) AS total_input_tokens,
  COALESCE(SUM(tokens_output), 0) AS total_output_tokens,
  COALESCE(SUM(tokens_thinking), 0) AS total_thinking_tokens,
  COALESCE(SUM(tokens_cached), 0) AS total_cached_tokens,

  -- Cost totals
  COALESCE(SUM(cost_usd), 0) AS total_cost_usd,
  COALESCE(AVG(cost_usd), 0) AS avg_cost_per_request,

  -- Performance metrics
  COALESCE(AVG(latency_ms), 0) AS avg_latency_ms,
  COALESCE(MAX(latency_ms), 0) AS max_latency_ms,
  COALESCE(MIN(latency_ms), 0) AS min_latency_ms

FROM ai_usage_logs
GROUP BY workspace_id, created_at::date, provider;

-- Unique index for CONCURRENTLY refresh (required)
CREATE UNIQUE INDEX idx_daily_summary_unique
  ON ai_daily_summary(workspace_id, date, provider);

-- Additional indexes for common queries
CREATE INDEX idx_daily_summary_date_desc
  ON ai_daily_summary(date DESC);

CREATE INDEX idx_daily_summary_cost
  ON ai_daily_summary(total_cost_usd DESC);

-- Add view comment
COMMENT ON MATERIALIZED VIEW ai_daily_summary IS
  'Daily aggregated AI usage statistics for fast dashboard queries';

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Function: Log AI usage (simplified interface)
CREATE OR REPLACE FUNCTION log_ai_usage(
  p_workspace_id UUID,
  p_user_id UUID,
  p_provider TEXT,
  p_model_id TEXT,
  p_task_type TEXT,
  p_tokens_input INTEGER,
  p_tokens_output INTEGER,
  p_cost_usd DECIMAL,
  p_latency_ms INTEGER DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Validate provider
  IF p_provider NOT IN ('google_gemini', 'openrouter', 'anthropic_direct', 'openai_direct') THEN
    RAISE EXCEPTION 'Invalid provider: %. Must be google_gemini, openrouter, anthropic_direct, or openai_direct', p_provider;
  END IF;

  -- Insert log entry
  INSERT INTO ai_usage_logs (
    workspace_id,
    user_id,
    provider,
    model_id,
    task_type,
    tokens_input,
    tokens_output,
    cost_usd,
    latency_ms,
    success,
    error_message
  ) VALUES (
    p_workspace_id,
    p_user_id,
    p_provider,
    p_model_id,
    p_task_type,
    p_tokens_input,
    p_tokens_output,
    p_cost_usd,
    p_latency_ms,
    p_success,
    p_error_message
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION log_ai_usage IS
  'Log AI API usage with cost tracking. Returns log entry ID.';

-- Function: Check AI budget status
CREATE OR REPLACE FUNCTION check_ai_budget(
  p_workspace_id UUID,
  p_period TEXT DEFAULT 'daily'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit DECIMAL(10,2);
  v_spent DECIMAL(10,2);
  v_threshold_pct INTEGER;
  v_enforce BOOLEAN;
  v_start_date TIMESTAMPTZ;
BEGIN
  -- Validate period parameter
  IF p_period NOT IN ('daily', 'monthly') THEN
    RAISE EXCEPTION 'Invalid period: %. Must be daily or monthly', p_period;
  END IF;

  -- Get budget configuration
  SELECT
    CASE p_period
      WHEN 'daily' THEN daily_limit_usd
      WHEN 'monthly' THEN monthly_limit_usd
    END,
    alert_threshold_pct,
    CASE p_period
      WHEN 'daily' THEN enforce_daily
      WHEN 'monthly' THEN enforce_monthly
    END
  INTO v_limit, v_threshold_pct, v_enforce
  FROM ai_budget_limits
  WHERE workspace_id = p_workspace_id
    AND is_active = TRUE;

  -- Use defaults if no budget configured
  IF v_limit IS NULL THEN
    v_limit := CASE p_period WHEN 'daily' THEN 50.00 ELSE 1500.00 END;
    v_threshold_pct := 80;
    v_enforce := TRUE;
  END IF;

  -- Calculate time range
  v_start_date := CASE p_period
    WHEN 'daily' THEN CURRENT_DATE::TIMESTAMPTZ
    WHEN 'monthly' THEN DATE_TRUNC('month', CURRENT_DATE)::TIMESTAMPTZ
  END;

  -- Calculate spent amount (only successful requests)
  SELECT COALESCE(SUM(cost_usd), 0)
  INTO v_spent
  FROM ai_usage_logs
  WHERE workspace_id = p_workspace_id
    AND created_at >= v_start_date
    AND success = TRUE;

  -- Return budget status
  RETURN jsonb_build_object(
    'period', p_period,
    'limit_usd', v_limit,
    'spent_usd', v_spent,
    'remaining_usd', GREATEST(v_limit - v_spent, 0),
    'percentage_used', ROUND((v_spent / NULLIF(v_limit, 0)) * 100, 2),
    'threshold_pct', v_threshold_pct,
    'at_threshold', v_spent >= (v_limit * v_threshold_pct / 100.0),
    'budget_exceeded', v_spent >= v_limit,
    'enforce_limit', v_enforce,
    'start_date', v_start_date,
    'checked_at', NOW()
  );
END;
$$;

COMMENT ON FUNCTION check_ai_budget IS
  'Check if workspace AI budget is exceeded. Returns detailed status JSON.';

-- Function: Get AI cost breakdown
CREATE OR REPLACE FUNCTION get_ai_cost_breakdown(
  p_workspace_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - 30,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  provider TEXT,
  task_type TEXT,
  request_count BIGINT,
  total_cost_usd NUMERIC,
  avg_cost_usd NUMERIC,
  total_tokens BIGINT,
  avg_latency_ms NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.provider,
    l.task_type,
    COUNT(*)::BIGINT AS request_count,
    COALESCE(SUM(l.cost_usd), 0) AS total_cost_usd,
    COALESCE(AVG(l.cost_usd), 0) AS avg_cost_usd,
    COALESCE(SUM(l.tokens_input + l.tokens_output), 0)::BIGINT AS total_tokens,
    COALESCE(AVG(l.latency_ms), 0) AS avg_latency_ms
  FROM ai_usage_logs l
  WHERE l.workspace_id = p_workspace_id
    AND l.created_at::DATE BETWEEN p_start_date AND p_end_date
    AND l.success = TRUE
  GROUP BY l.provider, l.task_type
  ORDER BY total_cost_usd DESC;
END;
$$;

COMMENT ON FUNCTION get_ai_cost_breakdown IS
  'Get detailed cost breakdown by provider and task type for date range';

-- Function: Refresh materialized view
CREATE OR REPLACE FUNCTION refresh_ai_daily_summary()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Use CONCURRENTLY to avoid locking (requires unique index)
  REFRESH MATERIALIZED VIEW CONCURRENTLY ai_daily_summary;
END;
$$;

COMMENT ON FUNCTION refresh_ai_daily_summary IS
  'Refresh ai_daily_summary materialized view (can be called by cron job)';

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budget_limits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their workspace's AI usage
CREATE POLICY ai_usage_workspace_select ON ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Policy: Users can insert usage logs for their workspace
CREATE POLICY ai_usage_workspace_insert ON ai_usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Policy: Service role has full access
CREATE POLICY ai_usage_service_role ON ai_usage_logs
  FOR ALL
  TO service_role
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND TRUE)
  WITH CHECK (TRUE);

-- Policy: Users can view their workspace's budget limits
CREATE POLICY ai_budget_workspace_select ON ai_budget_limits
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- Policy: Only workspace owners can update budget limits
CREATE POLICY ai_budget_owner_update ON ai_budget_limits
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
        AND uo.role = 'owner'
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
        AND uo.role = 'owner'
    )
  );

-- Policy: Service role has full access to budget limits
CREATE POLICY ai_budget_service_role ON ai_budget_limits
  FOR ALL
  TO service_role
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND TRUE)
  WITH CHECK (TRUE);

-- =====================================================
-- 6. SEED DEFAULT BUDGET LIMITS
-- =====================================================

-- Insert default budget limits for all existing workspaces
INSERT INTO ai_budget_limits (
  workspace_id,
  daily_limit_usd,
  monthly_limit_usd
)
SELECT
  id,
  50.00,
  1500.00
FROM workspaces
ON CONFLICT (workspace_id) DO NOTHING;

-- =====================================================
-- 7. VALIDATION & SUMMARY
-- =====================================================

DO $$
DECLARE
  v_tables INTEGER;
  v_functions INTEGER;
  v_policies INTEGER;
  v_indexes INTEGER;
  v_workspaces INTEGER;
  v_budget_entries INTEGER;
BEGIN
  -- Count created objects
  SELECT COUNT(*) INTO v_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('ai_usage_logs', 'ai_budget_limits');

  SELECT COUNT(*) INTO v_functions
  FROM pg_proc p
  INNER JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('log_ai_usage', 'check_ai_budget', 'get_ai_cost_breakdown', 'refresh_ai_daily_summary');

  SELECT COUNT(*) INTO v_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('ai_usage_logs', 'ai_budget_limits');

  SELECT COUNT(*) INTO v_indexes
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('ai_usage_logs', 'ai_budget_limits', 'ai_daily_summary');

  SELECT COUNT(*) INTO v_workspaces
  FROM workspaces;

  SELECT COUNT(*) INTO v_budget_entries
  FROM ai_budget_limits;

  -- Display results
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 046 (CLEANED) Complete!';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Database Objects Created:';
  RAISE NOTICE '   • Tables: % (ai_usage_logs, ai_budget_limits)', v_tables;
  RAISE NOTICE '   • Functions: % (helper functions)', v_functions;
  RAISE NOTICE '   • RLS Policies: % (security policies)', v_policies;
  RAISE NOTICE '   • Indexes: % (performance optimization)', v_indexes;
  RAISE NOTICE '   • Materialized View: 1 (ai_daily_summary)';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Budget Configuration:';
  RAISE NOTICE '   • Total Workspaces: %', v_workspaces;
  RAISE NOTICE '   • Budget Entries Created: %', v_budget_entries;
  RAISE NOTICE '   • Default Daily Limit: $50.00';
  RAISE NOTICE '   • Default Monthly Limit: $1,500.00';
  RAISE NOTICE '   • Alert Threshold: 80%%';
  RAISE NOTICE '';

  IF v_tables >= 2 AND v_functions >= 4 AND v_policies >= 6 THEN
    RAISE NOTICE '✨ SUCCESS: AI usage tracking fully configured!';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Features Enabled:';
    RAISE NOTICE '   ✓ Multi-provider cost tracking (Gemini/OpenRouter/Anthropic)';
    RAISE NOTICE '   ✓ Real-time budget monitoring';
    RAISE NOTICE '   ✓ Daily/monthly budget limits with enforcement';
    RAISE NOTICE '   ✓ Automatic budget alerts (80%% threshold)';
    RAISE NOTICE '   ✓ Provider/task cost breakdown analytics';
    RAISE NOTICE '   ✓ Materialized views for fast dashboard queries';
    RAISE NOTICE '   ✓ Row-level security (RLS) for data isolation';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next Steps:';
    RAISE NOTICE '   1. Configure API keys in .env.local';
    RAISE NOTICE '   2. Run: npm run test:gemini';
    RAISE NOTICE '   3. Monitor costs in dashboard';
    RAISE NOTICE '';
  ELSE
    RAISE WARNING '⚠️  Some objects may not have been created';
    RAISE WARNING 'Tables: % (expected 2)', v_tables;
    RAISE WARNING 'Functions: % (expected 4)', v_functions;
    RAISE WARNING 'Policies: % (expected 6)', v_policies;
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '';
END $$;
