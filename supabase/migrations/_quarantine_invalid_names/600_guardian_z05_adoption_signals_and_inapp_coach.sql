-- Z05: Adoption Signals & In-App Coach
-- Status: Adoption scoring and in-app nudges for tenant guidance
-- Tables: guardian_adoption_scores, guardian_inapp_coach_nudges
-- RLS: Tenant-scoped isolation on both tables

-- Enable UUID and JSONB support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Table 1: guardian_adoption_scores
-- Purpose: Store adoption scores by dimension/subdimension for each tenant
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- Pattern: Append-only snapshots, one per computed_at timestamp
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_adoption_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Computation metadata
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Dimension & SubDimension keys
  dimension TEXT NOT NULL, -- 'core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance', 'meta'
  sub_dimension TEXT NOT NULL, -- 'rules_usage', 'simulation_runs', 'network_console', etc.

  -- Score & Status
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100), -- 0..100
  status TEXT NOT NULL, -- 'inactive', 'light', 'regular', 'power'

  -- Aggregated signals (no PII, only counts and flags)
  signals JSONB NOT NULL DEFAULT '{}', -- { metricKey: { value, window_days }, ... }

  -- Trace back to source data (keys/IDs only, no raw payloads)
  derived_from JSONB NOT NULL DEFAULT '{}', -- { readiness_snapshot_id, uplift_plan_id, recommendation_id, ... }

  -- Custom metadata
  metadata JSONB NOT NULL DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT dimension_valid CHECK (dimension IN ('core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance', 'meta')),
  CONSTRAINT sub_dimension_valid CHECK (sub_dimension != ''),
  CONSTRAINT status_valid CHECK (status IN ('inactive', 'light', 'regular', 'power'))
);

CREATE INDEX IF NOT EXISTS idx_adoption_scores_tenant_computed
  ON guardian_adoption_scores(tenant_id, computed_at DESC, dimension);

CREATE INDEX IF NOT EXISTS idx_adoption_scores_tenant_status
  ON guardian_adoption_scores(tenant_id, status, computed_at DESC);

CREATE INDEX IF NOT EXISTS idx_adoption_scores_tenant_dimension
  ON guardian_adoption_scores(tenant_id, dimension, sub_dimension);

-- RLS Policy: Tenant isolation
ALTER TABLE guardian_adoption_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "adoption_scores_tenant_select" ON guardian_adoption_scores;
CREATE POLICY "adoption_scores_tenant_select" ON guardian_adoption_scores
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "adoption_scores_tenant_insert" ON guardian_adoption_scores;
CREATE POLICY "adoption_scores_tenant_insert" ON guardian_adoption_scores
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "adoption_scores_tenant_update" ON guardian_adoption_scores;
CREATE POLICY "adoption_scores_tenant_update" ON guardian_adoption_scores
FOR UPDATE USING (tenant_id = get_current_workspace_id()) WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "adoption_scores_tenant_delete" ON guardian_adoption_scores;
CREATE POLICY "adoption_scores_tenant_delete" ON guardian_adoption_scores
FOR DELETE USING (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Table 2: guardian_inapp_coach_nudges
-- Purpose: Store in-app nudges and coaching hints for tenant admins
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- Pattern: Mutable, status-tracked (pending → shown → dismissed/completed)
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_inapp_coach_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Lifecycle metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Nudge identity
  nudge_key TEXT NOT NULL, -- stable key, e.g., 'run_first_simulation', 'enable_network_intelligence'
  title TEXT NOT NULL, -- attention-grabbing title
  body TEXT NOT NULL, -- friendly, actionable guidance (2-3 sentences)

  -- Classification
  category TEXT NOT NULL, -- 'onboarding', 'activation', 'expansion', 'habit', 'health'
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'tip', 'important'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high'

  -- Status lifecycle
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'shown', 'dismissed', 'completed'

  -- Context: dimension, subdimension, relevant entities
  context JSONB NOT NULL DEFAULT '{}', -- { dimension, sub_dimension, reason, linkTargets }

  -- References to related Guardian objects (optional, for tracing)
  related_capability_key TEXT NULL, -- guardian_capability_manifest.key
  related_uplift_task_id UUID NULL, -- guardian_tenant_uplift_tasks.id
  related_recommendation_id UUID NULL, -- guardian_network_recommendations.id

  -- Expiry for auto-dismissal of stale nudges
  expiry_at TIMESTAMPTZ NULL,

  -- Metadata: AI-refined copy, tags, etc.
  metadata JSONB NOT NULL DEFAULT '{}', -- { ai_title, ai_body, ai_micro_tips, tags }

  CONSTRAINT category_valid CHECK (category IN ('onboarding', 'activation', 'expansion', 'habit', 'health')),
  CONSTRAINT severity_valid CHECK (severity IN ('info', 'tip', 'important')),
  CONSTRAINT priority_valid CHECK (priority IN ('low', 'medium', 'high')),
  CONSTRAINT status_valid CHECK (status IN ('pending', 'shown', 'dismissed', 'completed')),
  CONSTRAINT nudge_key_not_empty CHECK (nudge_key != '')
);

CREATE INDEX IF NOT EXISTS idx_inapp_nudges_tenant_status
  ON guardian_inapp_coach_nudges(tenant_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inapp_nudges_tenant_key
  ON guardian_inapp_coach_nudges(tenant_id, nudge_key);

CREATE INDEX IF NOT EXISTS idx_inapp_nudges_tenant_category
  ON guardian_inapp_coach_nudges(tenant_id, category);

CREATE INDEX IF NOT EXISTS idx_inapp_nudges_expiry
  ON guardian_inapp_coach_nudges(tenant_id, expiry_at)
  WHERE expiry_at IS NOT NULL;

-- RLS Policy: Tenant isolation
ALTER TABLE guardian_inapp_coach_nudges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inapp_nudges_tenant_select" ON guardian_inapp_coach_nudges;
CREATE POLICY "inapp_nudges_tenant_select" ON guardian_inapp_coach_nudges
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "inapp_nudges_tenant_insert" ON guardian_inapp_coach_nudges;
CREATE POLICY "inapp_nudges_tenant_insert" ON guardian_inapp_coach_nudges
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "inapp_nudges_tenant_update" ON guardian_inapp_coach_nudges;
CREATE POLICY "inapp_nudges_tenant_update" ON guardian_inapp_coach_nudges
FOR UPDATE USING (tenant_id = get_current_workspace_id()) WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "inapp_nudges_tenant_delete" ON guardian_inapp_coach_nudges;
CREATE POLICY "inapp_nudges_tenant_delete" ON guardian_inapp_coach_nudges
FOR DELETE USING (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Summary
-- ============================================================================
-- Z05 creates two tenant-scoped, RLS-protected tables:
-- 1. guardian_adoption_scores — Append-only snapshots of adoption by dimension
-- 2. guardian_inapp_coach_nudges — In-app coaching hints with status tracking
--
-- Both support advisory-only observation (no runtime impact on Guardian)
-- Scores link to readiness/uplift/edition/recommendation artefacts
-- Nudges are non-blocking UI suggestions, never enforcement
-- All data is PII-free, aggregated metrics only
