-- =====================================================================
-- Phase D48: Auto-Optimizer Engine (Autonomous Health & Suggestions)
-- =====================================================================
-- Tables: synthex_optimizer_runs, synthex_optimizer_actions
--
-- Purpose:
-- - Autonomous system health monitoring and optimization
-- - AI-powered recommendations for performance, cost, and quality improvements
-- - Track optimization runs with metrics snapshots
-- - Generate actionable tasks with priority and estimated time
--
-- Key Concepts:
-- - Optimizer runs analyze specific scopes (business, campaign, delivery, etc.)
-- - Each run produces a snapshot of current metrics
-- - AI generates prioritized actions based on opportunities and issues
-- - Actions can be applied manually or (future) automatically
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08

-- =====================================================================
-- 1. ENUMs
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE synthex_optimizer_run_status AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE synthex_optimizer_action_priority AS ENUM ('critical', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE synthex_optimizer_action_status AS ENUM ('open', 'in_progress', 'applied', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE synthex_optimizer_action_category AS ENUM ('performance', 'cost', 'quality', 'engagement', 'delivery', 'compliance', 'strategy');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- 2. Optimizer Runs Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS synthex_optimizer_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid, -- Optional: specific business to optimize

  -- Run configuration
  scope text NOT NULL, -- 'business' | 'campaign' | 'delivery' | 'content' | 'audience' | 'full'
  status synthex_optimizer_run_status NOT NULL DEFAULT 'pending',

  -- Metrics snapshot (before optimization)
  metrics_snapshot jsonb, -- { "campaigns_active": 5, "avg_engagement": 12.5, "cost_per_action": 2.3, ... }

  -- AI summary
  ai_summary jsonb, -- { "health_score": 78, "key_issues": [...], "opportunities": [...] }

  -- Timestamps
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,

  -- Error handling
  error_message text
);

-- =====================================================================
-- 3. Optimizer Actions Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS synthex_optimizer_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  optimizer_run_id uuid NOT NULL REFERENCES synthex_optimizer_runs(id) ON DELETE CASCADE,

  -- Action classification
  category synthex_optimizer_action_category NOT NULL,
  priority synthex_optimizer_action_priority NOT NULL DEFAULT 'medium',

  -- Action details
  title text NOT NULL,
  recommendation text NOT NULL, -- What to do
  target_entity text, -- Entity to optimize (e.g., "campaign:uuid", "content:uuid")

  -- Effort estimate
  eta_minutes integer, -- Estimated time to apply action

  -- AI rationale
  ai_rationale jsonb, -- { "reasoning": "...", "expected_impact": "...", "risks": "..." }

  -- Status
  status synthex_optimizer_action_status NOT NULL DEFAULT 'open',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  applied_at timestamptz
);

-- =====================================================================
-- 4. Indexes
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_synthex_optimizer_runs_tenant ON synthex_optimizer_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_optimizer_runs_business ON synthex_optimizer_runs(tenant_id, business_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_optimizer_runs_status ON synthex_optimizer_runs(status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_optimizer_actions_tenant ON synthex_optimizer_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_optimizer_actions_run ON synthex_optimizer_actions(optimizer_run_id, status);
CREATE INDEX IF NOT EXISTS idx_synthex_optimizer_actions_priority ON synthex_optimizer_actions(priority, status, created_at DESC);

-- =====================================================================
-- 5. Row Level Security (RLS)
-- =====================================================================

ALTER TABLE synthex_optimizer_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_optimizer_actions ENABLE ROW LEVEL SECURITY;

-- Optimizer Runs Policies
CREATE POLICY synthex_optimizer_runs_tenant_isolation ON synthex_optimizer_runs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Optimizer Actions Policies
CREATE POLICY synthex_optimizer_actions_tenant_isolation ON synthex_optimizer_actions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================================
-- 6. Helper Function: Get Optimizer Summary
-- =====================================================================

CREATE OR REPLACE FUNCTION synthex_get_optimizer_summary(
  p_tenant_id uuid,
  p_days integer DEFAULT 30
) RETURNS TABLE(
  total_runs integer,
  completed_runs integer,
  total_actions integer,
  critical_actions integer,
  applied_actions integer,
  avg_health_score numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT r.id)::integer AS total_runs,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'completed')::integer AS completed_runs,
    COUNT(a.id)::integer AS total_actions,
    COUNT(a.id) FILTER (WHERE a.priority = 'critical' AND a.status = 'open')::integer AS critical_actions,
    COUNT(a.id) FILTER (WHERE a.status = 'applied')::integer AS applied_actions,
    AVG((r.ai_summary->>'health_score')::numeric)::numeric AS avg_health_score
  FROM synthex_optimizer_runs r
  LEFT JOIN synthex_optimizer_actions a ON a.optimizer_run_id = r.id
  WHERE r.tenant_id = p_tenant_id
    AND r.started_at >= NOW() - (p_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql STABLE;
