/**
 * Guardian Z02: Guided Uplift Planner & Adoption Playbooks
 *
 * Adds tenant-scoped uplift plans and tasks derived from readiness gaps (Z01)
 * and network recommendations (X06). Advisory-only; never modifies configuration.
 */

-- ============================================================================
-- guardian_tenant_uplift_plans
-- ============================================================================
-- Per-tenant uplift plans for guided adoption

CREATE TABLE IF NOT EXISTS guardian_tenant_uplift_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  target_overall_score NUMERIC CHECK (target_overall_score IS NULL OR (target_overall_score >= 0 AND target_overall_score <= 100)),
  target_overall_status TEXT CHECK (target_overall_status IS NULL OR target_overall_status IN ('baseline', 'operational', 'mature', 'network_intelligent')),
  readiness_snapshot_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT plan_status_valid CHECK (status IN ('draft', 'active', 'completed', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_uplift_plans_tenant_created
  ON guardian_tenant_uplift_plans(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uplift_plans_tenant_status
  ON guardian_tenant_uplift_plans(tenant_id, status);

-- ============================================================================
-- guardian_tenant_uplift_tasks
-- ============================================================================
-- Individual tasks within an uplift plan

CREATE TABLE IF NOT EXISTS guardian_tenant_uplift_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES guardian_tenant_uplift_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  capability_key TEXT,
  recommendation_id UUID,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  effort_estimate TEXT,
  due_date DATE,
  owner TEXT,
  hints JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT task_priority_valid CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT task_status_valid CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
  CONSTRAINT task_category_valid CHECK (category IN ('core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance', 'other')),
  CONSTRAINT task_effort_valid CHECK (effort_estimate IS NULL OR effort_estimate IN ('XS', 'S', 'M', 'L', 'XL'))
);

CREATE INDEX IF NOT EXISTS idx_uplift_tasks_tenant_plan
  ON guardian_tenant_uplift_tasks(tenant_id, plan_id);
CREATE INDEX IF NOT EXISTS idx_uplift_tasks_tenant_status
  ON guardian_tenant_uplift_tasks(tenant_id, status, priority DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE guardian_tenant_uplift_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_tenant_uplift_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uplift_plans_tenant_isolation" ON guardian_tenant_uplift_plans
FOR ALL USING (tenant_id = get_current_workspace_id());

CREATE POLICY "uplift_tasks_tenant_isolation" ON guardian_tenant_uplift_tasks
FOR ALL USING (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Documentation
-- ============================================================================

COMMENT ON TABLE guardian_tenant_uplift_plans IS
  'Per-tenant uplift plans for guided Guardian adoption. Advisory-only; never modifies runtime config.';

COMMENT ON TABLE guardian_tenant_uplift_tasks IS
  'Individual tasks within uplift plans, derived from readiness gaps and network recommendations. Advisory-only.';

COMMENT ON COLUMN guardian_tenant_uplift_tasks.capability_key IS
  'Optional reference to guardian_capability_manifest.key for traceability.';

COMMENT ON COLUMN guardian_tenant_uplift_tasks.recommendation_id IS
  'Optional reference to guardian_network_recommendations.id for traceability.';

COMMENT ON COLUMN guardian_tenant_uplift_tasks.hints IS
  'Structured hints or checklists for task completion. No PII. May include AI-generated content.';
