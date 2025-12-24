-- Migration 135: Global Region Scaling Engine
-- Phase 92: GRSE - Region-level execution isolation and scaling

-- ============================================================================
-- Table 1: region_scaling_state
-- Real-time region load and health metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS region_scaling_state (
  region_id UUID PRIMARY KEY REFERENCES regions(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- AI Budget (in cents)
  ai_budget_monthly INTEGER NOT NULL DEFAULT 100000,
  ai_budget_remaining INTEGER NOT NULL DEFAULT 100000,
  ai_spend_today INTEGER NOT NULL DEFAULT 0,

  -- Pressure scores (0-100)
  posting_pressure NUMERIC(5,2) NOT NULL DEFAULT 0,
  orchestration_pressure NUMERIC(5,2) NOT NULL DEFAULT 0,
  creative_pressure NUMERIC(5,2) NOT NULL DEFAULT 0,
  intel_pressure NUMERIC(5,2) NOT NULL DEFAULT 0,

  -- Health indicators
  warning_index NUMERIC(5,2) NOT NULL DEFAULT 0,
  capacity_score NUMERIC(5,2) NOT NULL DEFAULT 100,
  fatigue_score NUMERIC(5,2) NOT NULL DEFAULT 0,

  -- Utilization
  active_agencies INTEGER NOT NULL DEFAULT 0,
  active_clients INTEGER NOT NULL DEFAULT 0,
  jobs_in_queue INTEGER NOT NULL DEFAULT 0,

  -- Mode
  scaling_mode TEXT NOT NULL DEFAULT 'normal'
    CHECK (scaling_mode IN ('normal', 'cautious', 'throttled', 'frozen')),

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- Table 2: region_scaling_history
-- Archive of region pressure and budget snapshots
-- ============================================================================

CREATE TABLE IF NOT EXISTS region_scaling_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Reference
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,

  -- Snapshot data
  snapshot JSONB NOT NULL,

  -- Period
  period_type TEXT NOT NULL DEFAULT 'hourly'
    CHECK (period_type IN ('hourly', 'daily', 'weekly')),

  -- Summary
  avg_capacity NUMERIC(5,2),
  peak_pressure NUMERIC(5,2),
  budget_used INTEGER,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_region_scaling_history_region
  ON region_scaling_history(region_id);
CREATE INDEX IF NOT EXISTS idx_region_scaling_history_created
  ON region_scaling_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_region_scaling_history_period
  ON region_scaling_history(period_type);

-- ============================================================================
-- Table 3: region_budget_transactions
-- AI budget transaction log
-- ============================================================================

CREATE TABLE IF NOT EXISTS region_budget_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Reference
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE SET NULL,

  -- Transaction
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('allocation', 'spend', 'refund', 'reset')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Context
  description TEXT,
  job_type TEXT,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_region_budget_txn_region
  ON region_budget_transactions(region_id);
CREATE INDEX IF NOT EXISTS idx_region_budget_txn_created
  ON region_budget_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_region_budget_txn_type
  ON region_budget_transactions(transaction_type);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE region_scaling_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_scaling_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_budget_transactions ENABLE ROW LEVEL SECURITY;

-- Scaling state policies
CREATE POLICY "Agency owners can view their region state" ON region_scaling_state
  FOR SELECT USING (
    region_id IN (
      SELECT region_id FROM agency_licenses al
      JOIN agency_users au ON al.agency_id = au.agency_id
      WHERE au.user_id = auth.uid() AND au.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "System manages scaling state" ON region_scaling_state
  FOR ALL USING (true);

-- Scaling history policies
CREATE POLICY "Agency owners can view their region history" ON region_scaling_history
  FOR SELECT USING (
    region_id IN (
      SELECT region_id FROM agency_licenses al
      JOIN agency_users au ON al.agency_id = au.agency_id
      WHERE au.user_id = auth.uid() AND au.role IN ('owner', 'manager')
    )
  );

-- Budget transaction policies
CREATE POLICY "Agency owners can view their budget transactions" ON region_budget_transactions
  FOR SELECT USING (
    region_id IN (
      SELECT region_id FROM agency_licenses al
      JOIN agency_users au ON al.agency_id = au.agency_id
      WHERE au.user_id = auth.uid() AND au.role = 'owner'
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get region scaling summary
CREATE OR REPLACE FUNCTION get_region_scaling_summary(p_region_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_state region_scaling_state%ROWTYPE;
  v_summary JSONB;
BEGIN
  SELECT * INTO v_state FROM region_scaling_state WHERE region_id = p_region_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'region_id', p_region_id,
    'scaling_mode', v_state.scaling_mode,
    'capacity_score', v_state.capacity_score,
    'warning_index', v_state.warning_index,
    'pressures', jsonb_build_object(
      'posting', v_state.posting_pressure,
      'orchestration', v_state.orchestration_pressure,
      'creative', v_state.creative_pressure,
      'intel', v_state.intel_pressure
    ),
    'budget', jsonb_build_object(
      'monthly', v_state.ai_budget_monthly,
      'remaining', v_state.ai_budget_remaining,
      'spent_today', v_state.ai_spend_today,
      'percent_remaining', ROUND((v_state.ai_budget_remaining::numeric / NULLIF(v_state.ai_budget_monthly, 0)) * 100, 2)
    ),
    'utilization', jsonb_build_object(
      'active_agencies', v_state.active_agencies,
      'active_clients', v_state.active_clients,
      'jobs_in_queue', v_state.jobs_in_queue
    ),
    'updated_at', v_state.updated_at
  ) INTO v_summary;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql;

-- Check and decrement AI budget
CREATE OR REPLACE FUNCTION check_and_decrement_budget(
  p_region_id UUID,
  p_amount INTEGER,
  p_agency_id UUID DEFAULT NULL,
  p_job_type TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  -- Get current balance with lock
  SELECT ai_budget_remaining INTO v_remaining
  FROM region_scaling_state
  WHERE region_id = p_region_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if sufficient budget
  IF v_remaining < p_amount THEN
    RETURN false;
  END IF;

  -- Decrement budget
  UPDATE region_scaling_state
  SET
    ai_budget_remaining = ai_budget_remaining - p_amount,
    ai_spend_today = ai_spend_today + p_amount,
    updated_at = now()
  WHERE region_id = p_region_id;

  -- Log transaction
  INSERT INTO region_budget_transactions (
    region_id, agency_id, transaction_type, amount,
    balance_after, description, job_type
  ) VALUES (
    p_region_id, p_agency_id, 'spend', p_amount,
    v_remaining - p_amount, 'AI budget spend', p_job_type
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Reset daily budget spend
CREATE OR REPLACE FUNCTION reset_daily_budget_spend()
RETURNS void AS $$
BEGIN
  UPDATE region_scaling_state
  SET ai_spend_today = 0, updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Reset monthly budgets
CREATE OR REPLACE FUNCTION reset_monthly_budgets()
RETURNS void AS $$
BEGIN
  UPDATE region_scaling_state
  SET
    ai_budget_remaining = ai_budget_monthly,
    ai_spend_today = 0,
    updated_at = now();

  -- Log reset transactions
  INSERT INTO region_budget_transactions (
    region_id, transaction_type, amount, balance_after, description
  )
  SELECT
    region_id, 'reset', ai_budget_monthly, ai_budget_monthly, 'Monthly budget reset'
  FROM region_scaling_state;
END;
$$ LANGUAGE plpgsql;

-- Compute overall pressure score
CREATE OR REPLACE FUNCTION compute_region_pressure(p_region_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_state region_scaling_state%ROWTYPE;
  v_pressure NUMERIC;
BEGIN
  SELECT * INTO v_state FROM region_scaling_state WHERE region_id = p_region_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Weighted average of pressures
  v_pressure := (
    v_state.posting_pressure * 0.3 +
    v_state.orchestration_pressure * 0.25 +
    v_state.creative_pressure * 0.25 +
    v_state.intel_pressure * 0.2
  );

  RETURN ROUND(v_pressure, 2);
END;
$$ LANGUAGE plpgsql;

-- Get all regions health summary
CREATE OR REPLACE FUNCTION get_all_regions_health()
RETURNS TABLE (
  region_id UUID,
  region_name TEXT,
  scaling_mode TEXT,
  capacity_score NUMERIC,
  overall_pressure NUMERIC,
  budget_percent_remaining NUMERIC,
  warning_index NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS region_id,
    r.name AS region_name,
    rss.scaling_mode,
    rss.capacity_score,
    compute_region_pressure(r.id) AS overall_pressure,
    ROUND((rss.ai_budget_remaining::numeric / NULLIF(rss.ai_budget_monthly, 0)) * 100, 2) AS budget_percent_remaining,
    rss.warning_index
  FROM regions r
  LEFT JOIN region_scaling_state rss ON r.id = rss.region_id
  WHERE r.active = true
  ORDER BY rss.warning_index DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Initialize scaling state for existing regions
-- ============================================================================

INSERT INTO region_scaling_state (region_id)
SELECT id FROM regions WHERE active = true
ON CONFLICT (region_id) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE region_scaling_state IS 'Phase 92: Real-time region scaling metrics';
COMMENT ON TABLE region_scaling_history IS 'Phase 92: Historical scaling snapshots';
COMMENT ON TABLE region_budget_transactions IS 'Phase 92: AI budget transaction log';

COMMENT ON COLUMN region_scaling_state.scaling_mode IS 'normal | cautious | throttled | frozen';
COMMENT ON COLUMN region_scaling_state.capacity_score IS '0-100 health score';
COMMENT ON COLUMN region_scaling_state.ai_budget_monthly IS 'Monthly AI budget in cents';
