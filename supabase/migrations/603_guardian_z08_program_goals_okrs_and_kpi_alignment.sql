-- Guardian Z08: Program Goals, OKRs & KPI Alignment
-- ===================================================
-- Adds tenant-scoped program goal definitions, OKR tracking, and KPI alignment
-- with Z-series meta artefacts (readiness, adoption, uplift, editions, reports, lifecycle)
--
-- CRITICAL DESIGN CONSTRAINTS:
-- 1. Goals/OKRs/KPIs are ADVISORY ONLY; do not affect Guardian runtime behavior
-- 2. Goals are strategic overlays on Z-series meta artefacts, not core Guardian data
-- 3. KPI source paths support flexible JSONB mapping to Z01-Z07 metrics
-- 4. RLS enforces strict tenant isolation; no cross-tenant data leakage possible
-- 5. Parent-child relationships use CASCADE delete for clean teardown
-- 6. No modifications to core G/H/I/X tables or Guardian runtime behavior

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table 1: guardian_program_goals
-- Purpose: High-level strategic objectives (analogous to OKR Objectives)
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- Pattern: Mutable configuration (CREATE/UPDATE/DELETE allowed for admins)
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_program_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Goal identity
  goal_key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Timeframe
  timeframe_start DATE NOT NULL,
  timeframe_end DATE NOT NULL,

  -- Ownership
  owner TEXT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active',

  -- Categorization
  category TEXT NOT NULL DEFAULT 'governance',

  -- Custom metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT goal_key_unique UNIQUE (tenant_id, goal_key),
  CONSTRAINT status_valid CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  CONSTRAINT category_valid CHECK (category IN ('governance', 'security_posture', 'operations', 'compliance', 'adoption')),
  CONSTRAINT timeframe_valid CHECK (timeframe_end >= timeframe_start)
);

CREATE INDEX IF NOT EXISTS idx_program_goals_tenant_created
  ON guardian_program_goals(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_program_goals_tenant_status
  ON guardian_program_goals(tenant_id, status);

-- RLS Policies for guardian_program_goals
ALTER TABLE guardian_program_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_goals_tenant_select" ON guardian_program_goals;
CREATE POLICY "program_goals_tenant_select" ON guardian_program_goals
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "program_goals_tenant_insert" ON guardian_program_goals;
CREATE POLICY "program_goals_tenant_insert" ON guardian_program_goals
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "program_goals_tenant_update" ON guardian_program_goals;
CREATE POLICY "program_goals_tenant_update" ON guardian_program_goals
FOR UPDATE USING (tenant_id = get_current_workspace_id()) WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "program_goals_tenant_delete" ON guardian_program_goals;
CREATE POLICY "program_goals_tenant_delete" ON guardian_program_goals
FOR DELETE USING (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Table 2: guardian_program_okrs
-- Purpose: Measurable outcomes under each goal (analogous to OKR Key Results)
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- Pattern: Mutable configuration, child of guardian_program_goals
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_program_okrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES guardian_program_goals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- OKR identity
  objective TEXT NOT NULL,
  objective_key TEXT NOT NULL,

  -- Status & weighting
  status TEXT NOT NULL DEFAULT 'active',
  weight NUMERIC NOT NULL DEFAULT 1.0,

  -- Custom metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT okr_status_valid CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  CONSTRAINT okr_weight_valid CHECK (weight >= 0 AND weight <= 10)
);

CREATE INDEX IF NOT EXISTS idx_program_okrs_tenant_goal
  ON guardian_program_okrs(tenant_id, goal_id);

CREATE INDEX IF NOT EXISTS idx_program_okrs_goal_created
  ON guardian_program_okrs(goal_id, created_at DESC);

-- RLS Policies for guardian_program_okrs
ALTER TABLE guardian_program_okrs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_okrs_tenant_select" ON guardian_program_okrs;
CREATE POLICY "program_okrs_tenant_select" ON guardian_program_okrs
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "program_okrs_tenant_insert" ON guardian_program_okrs;
CREATE POLICY "program_okrs_tenant_insert" ON guardian_program_okrs
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "program_okrs_tenant_update" ON guardian_program_okrs;
CREATE POLICY "program_okrs_tenant_update" ON guardian_program_okrs
FOR UPDATE USING (tenant_id = get_current_workspace_id()) WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "program_okrs_tenant_delete" ON guardian_program_okrs;
CREATE POLICY "program_okrs_tenant_delete" ON guardian_program_okrs
FOR DELETE USING (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Table 3: guardian_program_kpis
-- Purpose: KPI definitions tied to Z-series metrics via flexible source_path
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- Pattern: Mutable configuration, child of guardian_program_okrs
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_program_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  okr_id UUID NOT NULL REFERENCES guardian_program_okrs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- KPI identity
  kpi_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Target configuration
  target_value NUMERIC NOT NULL,
  target_direction TEXT NOT NULL,
  unit TEXT NOT NULL,

  -- Z-series metric mapping (flexible JSONB source path)
  source_metric TEXT NOT NULL,
  source_path JSONB NOT NULL,

  -- Custom metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT kpi_direction_valid CHECK (target_direction IN ('increase', 'decrease', 'maintain')),
  CONSTRAINT kpi_source_valid CHECK (
    source_path ? 'domain' AND
    (source_path->>'domain') IN ('readiness', 'editions', 'uplift', 'adoption', 'executive', 'lifecycle')
  )
);

CREATE INDEX IF NOT EXISTS idx_program_kpis_tenant_okr
  ON guardian_program_kpis(tenant_id, okr_id);

CREATE INDEX IF NOT EXISTS idx_program_kpis_okr_created
  ON guardian_program_kpis(okr_id, created_at DESC);

-- RLS Policies for guardian_program_kpis
ALTER TABLE guardian_program_kpis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_kpis_tenant_select" ON guardian_program_kpis;
CREATE POLICY "program_kpis_tenant_select" ON guardian_program_kpis
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "program_kpis_tenant_insert" ON guardian_program_kpis;
CREATE POLICY "program_kpis_tenant_insert" ON guardian_program_kpis
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "program_kpis_tenant_update" ON guardian_program_kpis;
CREATE POLICY "program_kpis_tenant_update" ON guardian_program_kpis
FOR UPDATE USING (tenant_id = get_current_workspace_id()) WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "program_kpis_tenant_delete" ON guardian_program_kpis;
CREATE POLICY "program_kpis_tenant_delete" ON guardian_program_kpis
FOR DELETE USING (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Table 4: guardian_program_kpi_snapshots
-- Purpose: Periodic KPI evaluation results (append-only audit trail)
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- Pattern: Write-only from evaluation service, read for trend analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_program_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kpi_id UUID NOT NULL REFERENCES guardian_program_kpis(id) ON DELETE CASCADE,

  -- Period for evaluation
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Evaluation results
  current_value NUMERIC NOT NULL,
  target_value NUMERIC NOT NULL,
  target_direction TEXT NOT NULL,
  unit TEXT NOT NULL,

  -- Status classification
  status TEXT NOT NULL,
  delta NUMERIC NULL,

  -- Custom metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT snapshot_status_valid CHECK (status IN ('behind', 'on_track', 'ahead'))
);

CREATE INDEX IF NOT EXISTS idx_program_kpi_snapshots_tenant_kpi_period
  ON guardian_program_kpi_snapshots(tenant_id, kpi_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_program_kpi_snapshots_tenant_computed
  ON guardian_program_kpi_snapshots(tenant_id, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_program_kpi_snapshots_kpi_computed
  ON guardian_program_kpi_snapshots(kpi_id, computed_at DESC);

-- RLS Policies for guardian_program_kpi_snapshots
ALTER TABLE guardian_program_kpi_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "program_kpi_snapshots_tenant_select" ON guardian_program_kpi_snapshots;
CREATE POLICY "program_kpi_snapshots_tenant_select" ON guardian_program_kpi_snapshots
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "program_kpi_snapshots_tenant_insert" ON guardian_program_kpi_snapshots;
CREATE POLICY "program_kpi_snapshots_tenant_insert" ON guardian_program_kpi_snapshots
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Comments and documentation
-- ============================================================================

COMMENT ON TABLE guardian_program_goals IS
  'Tenant-scoped program goals (strategic objectives). Advisory-only; does not affect Guardian runtime behavior.';

COMMENT ON TABLE guardian_program_okrs IS
  'Measurable outcomes under each program goal. Children of guardian_program_goals with CASCADE delete.';

COMMENT ON TABLE guardian_program_kpis IS
  'KPI definitions mapped to Z-series metrics (readiness, adoption, uplift, editions, executive, lifecycle). source_path is flexible JSONB for domain-specific parameters.';

COMMENT ON TABLE guardian_program_kpi_snapshots IS
  'Append-only audit trail of KPI evaluations. Enables trend analysis and historical reporting without mutating KPI definitions.';

COMMENT ON COLUMN guardian_program_goals.goal_key IS
  'Unique identifier per tenant (e.g., "increase_readiness", "adoption_ramp"). Must be unique within tenant.';

COMMENT ON COLUMN guardian_program_goals.timeframe_start IS
  'Start of goal period (e.g., Q1 2025). Must not be after timeframe_end.';

COMMENT ON COLUMN guardian_program_goals.status IS
  'draft (not yet active), active (in progress), paused (suspended), completed (achieved), archived (obsolete).';

COMMENT ON COLUMN guardian_program_okrs.objective_key IS
  'Identifier for OKR within goal (e.g., "readiness_80"). Optional uniqueness constraint per goal.';

COMMENT ON COLUMN guardian_program_okrs.weight IS
  'Relative weighting for OKR aggregation (0-10 scale). Default 1.0.';

COMMENT ON COLUMN guardian_program_kpis.source_path IS
  'JSONB with at minimum { "domain": "readiness"|"adoption"|"uplift"|"editions"|"executive"|"lifecycle", "metric": string }. Extensible per domain.';

COMMENT ON COLUMN guardian_program_kpis.target_direction IS
  'Indicator direction: increase (higher is better), decrease (lower is better), maintain (target value ±10%).';

COMMENT ON COLUMN guardian_program_kpi_snapshots.status IS
  'Classification: behind (below tolerance), on_track (within 10% of target), ahead (above or below target per direction).';

COMMENT ON COLUMN guardian_program_kpi_snapshots.delta IS
  'Change from previous snapshot''s current_value. NULL if no prior snapshot.';

-- ============================================================================
-- Migration Summary
-- ============================================================================
-- Tables: 4 (guardian_program_goals, guardian_program_okrs, guardian_program_kpis, guardian_program_kpi_snapshots)
-- Indexes: 9 (optimized for tenant, goal, okr, kpi lookup and time-based queries)
-- RLS Policies: 12 (full tenant isolation on all tables)
--
-- Design Notes:
-- 1. guardian_program_goals: Tenant-scoped strategic objectives
--    - goal_key: unique identifier (e.g., 'Q1_2025_readiness_ramp')
--    - timeframe: start/end dates for planning horizon
--    - category: governance, security_posture, operations, compliance, adoption
--    - status: draft, active, paused, completed, archived
--
-- 2. guardian_program_okrs: Measurable outcomes under each goal
--    - objective_key: identifier within goal (e.g., 'readiness_to_80')
--    - weight: relative importance for aggregation
--    - CASCADE delete ties to goals
--
-- 3. guardian_program_kpis: KPI definitions with Z-series metric mapping
--    - source_path JSONB: flexible mapping to Z01-Z07 metrics
--    - target_value/direction: success criteria (increase/decrease/maintain)
--    - unit: measurement unit (score, count, ratio, percentage, etc.)
--    - CASCADE delete ties to OKRs
--
-- 4. guardian_program_kpi_snapshots: Append-only evaluation history
--    - period_start/end: evaluation period
--    - computed_at: timestamp of evaluation
--    - status: behind/on_track/ahead classification
--    - delta: trend vs previous snapshot
--
-- 5. RLS on all tables ensures tenant_id = get_current_workspace_id()
--    - Cross-tenant goal/KPI access impossible
--    - Goals/OKRs/KPIs only visible to their own tenant
--
-- 6. No modifications to G/H/I/X core tables (alerts, incidents, rules, network, etc.)
--    - Z08 is meta-only; reads from Z01-Z07 and stores program overlays
