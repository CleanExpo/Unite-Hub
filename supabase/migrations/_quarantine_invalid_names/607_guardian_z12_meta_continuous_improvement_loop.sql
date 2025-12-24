-- Guardian Z12: Meta Continuous Improvement Loop (CIL)
-- Migration: Improvement cycles, actions, and outcome snapshots
-- Date: December 12, 2025
-- Purpose: Tenant-scoped continuous improvement cycles that operationalize Z01-Z11 meta signals
--          into tracked improvement actions and measurable meta outcomes
--          Non-breaking: meta-only, does not modify core Guardian G/H/I/X runtime behaviour

-- Table 1: guardian_meta_improvement_cycles
-- Tracks improvement cycles (e.g., Q1 2026 Guardian Maturity Initiative)
CREATE TABLE IF NOT EXISTS guardian_meta_improvement_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identification
  cycle_key TEXT NOT NULL,  -- e.g. 'Q1_2026_guardian_maturity', 'adoption_sprint_1'
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Timing
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'paused' | 'completed' | 'archived'

  -- Focus areas (subset of Z domains)
  focus_domains TEXT[] NOT NULL,  -- e.g. ['readiness', 'uplift', 'adoption', 'goals_okrs']

  -- Optional metadata (potentially sensitive - treat as redactable)
  owner TEXT NULL,

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT cycle_key_tenant_unique UNIQUE (tenant_id, cycle_key),
  CONSTRAINT period_valid CHECK (period_start <= period_end),
  CONSTRAINT status_valid CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  CONSTRAINT focus_domains_not_empty CHECK (array_length(focus_domains, 1) > 0)
);

CREATE INDEX IF NOT EXISTS idx_improvement_cycles_tenant_created ON guardian_meta_improvement_cycles(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_improvement_cycles_tenant_status ON guardian_meta_improvement_cycles(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_improvement_cycles_tenant_period ON guardian_meta_improvement_cycles(tenant_id, period_start, period_end);

-- Table 2: guardian_meta_improvement_actions
-- Tracks specific improvement actions within cycles
CREATE TABLE IF NOT EXISTS guardian_meta_improvement_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES guardian_meta_improvement_cycles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identification
  action_key TEXT NOT NULL,  -- e.g. 'raise_readiness_core_to_75', 'increase_adoption_rate'
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Priority and status
  priority TEXT NOT NULL DEFAULT 'medium',  -- 'low' | 'medium' | 'high' | 'critical'
  status TEXT NOT NULL DEFAULT 'planned',  -- 'planned' | 'in_progress' | 'blocked' | 'done' | 'cancelled'

  -- Timing
  due_date DATE NULL,

  -- Meta-safe evidence and references (no secrets, no raw logs)
  evidence_links JSONB NOT NULL DEFAULT '[]'::jsonb,  -- array of {title, type, ref} objects pointing to meta sources

  -- Linkage to Z09 (Playbooks) and Z08 (Goals/KPIs)
  related_playbook_keys TEXT[] NOT NULL DEFAULT '{}'::text[],  -- keys of recommended playbooks from Z09
  related_goal_kpi_keys TEXT[] NOT NULL DEFAULT '{}'::text[],  -- keys of related OKRs/KPIs from Z08

  -- Expected outcome (meta-only: which scores/dimensions should move and targets)
  expected_impact JSONB NOT NULL DEFAULT '{}'::jsonb,  -- e.g. { readiness: {delta: 5, target: 75}, adoption: {delta: 10} }

  -- Optional notes (treat as sensitive - redactable in exports)
  notes TEXT NULL,

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT action_key_cycle_unique UNIQUE (cycle_id, action_key),
  CONSTRAINT priority_valid CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT status_valid CHECK (status IN ('planned', 'in_progress', 'blocked', 'done', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_improvement_actions_cycle_status ON guardian_meta_improvement_actions(cycle_id, status);
CREATE INDEX IF NOT EXISTS idx_improvement_actions_tenant_cycle ON guardian_meta_improvement_actions(tenant_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_improvement_actions_tenant_due_date ON guardian_meta_improvement_actions(tenant_id, due_date);

-- Table 3: guardian_meta_improvement_outcomes
-- Snapshots of meta signals at cycle milestones (baseline, mid-cycle, end-cycle)
CREATE TABLE IF NOT EXISTS guardian_meta_improvement_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES guardian_meta_improvement_cycles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Snapshot timing
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  label TEXT NOT NULL,  -- e.g. 'baseline', 'mid_cycle', 'end_cycle'

  -- Meta-only snapshot (no PII, no raw logs)
  -- Compact structure: { readiness: {...}, adoption: {...}, editions: {...}, ... }
  metrics JSONB NOT NULL,

  -- Derived summary (key deltas vs previous outcome, if available)
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,  -- e.g. { readiness_delta: +5, adoption_delta: +8, kpi_on_track_pct: 60 }

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_improvement_outcomes_cycle_captured ON guardian_meta_improvement_outcomes(cycle_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_improvement_outcomes_tenant_cycle ON guardian_meta_improvement_outcomes(tenant_id, cycle_id);

-- Row Level Security: guardian_meta_improvement_cycles
ALTER TABLE guardian_meta_improvement_cycles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_improvement_cycles" ON guardian_meta_improvement_cycles;
CREATE POLICY "tenant_isolation_improvement_cycles" ON guardian_meta_improvement_cycles
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Row Level Security: guardian_meta_improvement_actions
ALTER TABLE guardian_meta_improvement_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_improvement_actions" ON guardian_meta_improvement_actions;
CREATE POLICY "tenant_isolation_improvement_actions" ON guardian_meta_improvement_actions
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Row Level Security: guardian_meta_improvement_outcomes
ALTER TABLE guardian_meta_improvement_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_improvement_outcomes" ON guardian_meta_improvement_outcomes;
CREATE POLICY "tenant_isolation_improvement_outcomes" ON guardian_meta_improvement_outcomes
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Table comments
COMMENT ON TABLE guardian_meta_improvement_cycles IS
  'Tenant-scoped continuous improvement cycles that operationalize Z01-Z11 meta signals into tracked improvement actions and measurable outcomes. Non-breaking: meta-only, does not modify core Guardian runtime behaviour.';

COMMENT ON COLUMN guardian_meta_improvement_cycles.cycle_key IS
  'Unique identifier for cycle within tenant (e.g., Q1_2026_guardian_maturity). Used for deterministic lookup and external references.';

COMMENT ON COLUMN guardian_meta_improvement_cycles.focus_domains IS
  'Subset of Z-series domains covered by this cycle: readiness, uplift, editions, executive, adoption, lifecycle, integrations, goals_okrs, playbooks, governance, or exports.';

COMMENT ON COLUMN guardian_meta_improvement_cycles.owner IS
  'Optional: person or team leading the cycle. Treated as sensitive metadata; may be redacted in exports unless allowed by Z10 governance policy.';

COMMENT ON TABLE guardian_meta_improvement_actions IS
  'Actions planned or executed within an improvement cycle. Each action references related Z09 playbooks and Z08 KPIs/goals. Links to outcomes via cycle_id and captured via expected_impact snapshot.';

COMMENT ON COLUMN guardian_meta_improvement_actions.related_playbook_keys IS
  'Array of Z09 playbook keys (e.g., "adoption_rollout_phase_1") relevant to this action. Used for cross-referencing and importing playbook guidance.';

COMMENT ON COLUMN guardian_meta_improvement_actions.related_goal_kpi_keys IS
  'Array of Z08 goal/KPI keys (e.g., "adoption_rate_target_60pct") that this action is expected to influence. Used for outcome measurement.';

COMMENT ON COLUMN guardian_meta_improvement_actions.expected_impact IS
  'Meta-only expected outcome: {readiness: {delta: 5, target: 75}, adoption: {delta: 10, target: 60}, ...}. No raw logs or PII; only aggregate/trend expectations.';

COMMENT ON COLUMN guardian_meta_improvement_actions.notes IS
  'Optional free-text notes (treated as sensitive). May be redacted in exports unless Z10 external_sharing_policy explicitly allows and flag is set.';

COMMENT ON TABLE guardian_meta_improvement_outcomes IS
  'Snapshots of Z-series meta metrics at cycle milestones (baseline, mid_cycle, end_cycle). Used to measure cycle effectiveness and drive recommendations for next cycle.';

COMMENT ON COLUMN guardian_meta_improvement_outcomes.metrics IS
  'Meta-only compact snapshot: {readiness: {score: 68, status: ready, capabilities: {...}}, adoption: {...}, editions: {...}, ...}. No PII, no raw logs.';

COMMENT ON COLUMN guardian_meta_improvement_outcomes.summary IS
  'Derived summary with key deltas vs previous outcome, e.g., {readiness_delta: +5, adoption_delta: +8, kpi_on_track_pct: 60}. Automatically computed on capture.';
