-- Z06: Meta Lifecycle & Data Hygiene
-- Status: Lifecycle policies and archival tables for Z-series meta artefacts only
-- Tables: guardian_meta_lifecycle_policies, guardian_readiness_snapshots_compact, guardian_adoption_scores_compact, guardian_coach_nudges_compact
-- RLS: Tenant-scoped isolation on all tables
-- Impact: Z-series meta tables ONLY; zero impact on G/H/I/X core Guardian data

-- Enable UUID and JSONB support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Table 1: guardian_meta_lifecycle_policies
-- Purpose: Tenant-scoped lifecycle policy configuration for Z-series meta artefacts
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- Pattern: Mutable configuration (CREATE/UPDATE/DELETE allowed for admins)
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_meta_lifecycle_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Lifecycle metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Policy identity
  policy_key TEXT NOT NULL, -- 'readiness', 'edition_fit', 'uplift', 'executive_reports', 'adoption', 'coach_nudges'
  label TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Retention configuration
  retention_days INTEGER NOT NULL CHECK (retention_days >= 7), -- Minimum 7 days safety bound
  archive_enabled BOOLEAN NOT NULL DEFAULT true,
  delete_enabled BOOLEAN NOT NULL DEFAULT false,
  min_keep_rows INTEGER NOT NULL DEFAULT 100 CHECK (min_keep_rows >= 0), -- Safety lower bound

  -- Compaction strategy
  compaction_strategy TEXT NOT NULL DEFAULT 'none' CHECK (compaction_strategy IN ('none', 'snapshot', 'aggregate')),

  -- Custom metadata
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Constraints
  CONSTRAINT policy_key_not_empty CHECK (policy_key != ''),
  CONSTRAINT label_not_empty CHECK (label != ''),
  UNIQUE(tenant_id, policy_key)
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_policies_tenant
  ON guardian_meta_lifecycle_policies(tenant_id, policy_key);

CREATE INDEX IF NOT EXISTS idx_lifecycle_policies_updated
  ON guardian_meta_lifecycle_policies(tenant_id, updated_at DESC);

-- RLS Policy: Tenant isolation
ALTER TABLE guardian_meta_lifecycle_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lifecycle_policies_tenant_select" ON guardian_meta_lifecycle_policies;
CREATE POLICY "lifecycle_policies_tenant_select" ON guardian_meta_lifecycle_policies
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "lifecycle_policies_tenant_insert" ON guardian_meta_lifecycle_policies;
CREATE POLICY "lifecycle_policies_tenant_insert" ON guardian_meta_lifecycle_policies
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "lifecycle_policies_tenant_update" ON guardian_meta_lifecycle_policies;
CREATE POLICY "lifecycle_policies_tenant_update" ON guardian_meta_lifecycle_policies
FOR UPDATE USING (tenant_id = get_current_workspace_id()) WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "lifecycle_policies_tenant_delete" ON guardian_meta_lifecycle_policies;
CREATE POLICY "lifecycle_policies_tenant_delete" ON guardian_meta_lifecycle_policies
FOR DELETE USING (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Table 2: guardian_readiness_snapshots_compact
-- Purpose: Compacted readiness score summaries (Z01 archival)
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- Pattern: Write-only from lifecycle jobs, not source-of-truth
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_readiness_snapshots_compact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Period for aggregation
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Aggregated metrics (no PII)
  overall_score_avg NUMERIC NOT NULL CHECK (overall_score_avg >= 0 AND overall_score_avg <= 100),
  overall_score_min NUMERIC NOT NULL CHECK (overall_score_min >= 0 AND overall_score_min <= 100),
  overall_score_max NUMERIC NOT NULL CHECK (overall_score_max >= 0 AND overall_score_max <= 100),

  -- Aggregated capabilities summary (e.g., { 'rules_engine': 80, 'simulation': 45, ... })
  capabilities_summary JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_readiness_compact_tenant_period
  ON guardian_readiness_snapshots_compact(tenant_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_readiness_compact_created
  ON guardian_readiness_snapshots_compact(tenant_id, created_at DESC);

ALTER TABLE guardian_readiness_snapshots_compact ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "readiness_compact_select" ON guardian_readiness_snapshots_compact;
CREATE POLICY "readiness_compact_select" ON guardian_readiness_snapshots_compact
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "readiness_compact_insert" ON guardian_readiness_snapshots_compact;
CREATE POLICY "readiness_compact_insert" ON guardian_readiness_snapshots_compact
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Table 3: guardian_adoption_scores_compact
-- Purpose: Compacted adoption score summaries (Z05 archival)
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- Pattern: Write-only from lifecycle jobs, not source-of-truth
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_adoption_scores_compact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Period for aggregation
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Dimension & subdimension
  dimension TEXT NOT NULL,
  sub_dimension TEXT NOT NULL,

  -- Aggregated metrics (no PII)
  score_avg NUMERIC NOT NULL CHECK (score_avg >= 0 AND score_avg <= 100),
  score_min NUMERIC NOT NULL CHECK (score_min >= 0 AND score_min <= 100),
  score_max NUMERIC NOT NULL CHECK (score_max >= 0 AND score_max <= 100),
  status_mode TEXT NOT NULL, -- Most common status: 'inactive', 'light', 'regular', 'power'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_adoption_compact_tenant_period
  ON guardian_adoption_scores_compact(tenant_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_adoption_compact_dimension
  ON guardian_adoption_scores_compact(tenant_id, dimension, sub_dimension);

ALTER TABLE guardian_adoption_scores_compact ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "adoption_compact_select" ON guardian_adoption_scores_compact;
CREATE POLICY "adoption_compact_select" ON guardian_adoption_scores_compact
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "adoption_compact_insert" ON guardian_adoption_scores_compact;
CREATE POLICY "adoption_compact_insert" ON guardian_adoption_scores_compact
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Table 4: guardian_coach_nudges_compact
-- Purpose: Compacted nudge usage summaries (Z05 archival)
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- Pattern: Write-only from lifecycle jobs, not source-of-truth
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_coach_nudges_compact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Period for aggregation
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Nudge identity
  nudge_key TEXT NOT NULL,

  -- Aggregated nudge lifecycle counters (no PII)
  shown_count INTEGER NOT NULL DEFAULT 0 CHECK (shown_count >= 0),
  dismissed_count INTEGER NOT NULL DEFAULT 0 CHECK (dismissed_count >= 0),
  completed_count INTEGER NOT NULL DEFAULT 0 CHECK (completed_count >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_coach_compact_tenant_period
  ON guardian_coach_nudges_compact(tenant_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_coach_compact_nudge
  ON guardian_coach_nudges_compact(tenant_id, nudge_key);

ALTER TABLE guardian_coach_nudges_compact ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_compact_select" ON guardian_coach_nudges_compact;
CREATE POLICY "coach_compact_select" ON guardian_coach_nudges_compact
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "coach_compact_insert" ON guardian_coach_nudges_compact;
CREATE POLICY "coach_compact_insert" ON guardian_coach_nudges_compact
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Summary
-- ============================================================================
-- Z06 creates four tenant-scoped, RLS-protected tables:
-- 1. guardian_meta_lifecycle_policies — Configuration for lifecycle policies
-- 2. guardian_readiness_snapshots_compact — Aggregated readiness summaries
-- 3. guardian_adoption_scores_compact — Aggregated adoption summaries
-- 4. guardian_coach_nudges_compact — Aggregated nudge usage summaries
--
-- All tables are write-only from lifecycle jobs and do not affect:
-- - G-series (alert rules, events, playbooks, risk scores)
-- - H-series (incidents, correlations)
-- - I-series (simulations, QA coverage, drills)
-- - X-series (network, anomalies, recommendations)
-- - Z01-Z05 source tables (not deleted by default, only compacted)
--
-- Lifecycle policies are tenant-scoped, reversible, and configurable.
-- No silent destructive defaults; deletion requires explicit enablement.
