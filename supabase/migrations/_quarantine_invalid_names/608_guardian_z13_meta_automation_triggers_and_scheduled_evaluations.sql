-- Guardian Z13: Meta Automation Triggers & Scheduled Evaluations
-- Migration: Automation schedules, triggers, and execution logs
-- Date: December 12, 2025
-- Purpose: Tenant-scoped automation that recomputes Z-series meta metrics (KPIs, stack readiness, knowledge hub, outcomes, exports)
--          without modifying core Guardian G/H/I/X runtime behaviour
-- Non-Breaking: meta-only automation; does not change alerting, incidents, QA, network, rules, simulations

-- Table 1: guardian_meta_automation_schedules
-- Tracks scheduled meta evaluation tasks (e.g., daily KPI evals, weekly stack readiness)
CREATE TABLE IF NOT EXISTS guardian_meta_automation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identification
  schedule_key TEXT NOT NULL,  -- e.g. 'weekly_kpi_eval', 'daily_stack_readiness'
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timing configuration
  cadence TEXT NOT NULL,  -- 'hourly' | 'daily' | 'weekly' | 'monthly'
  timezone TEXT NOT NULL DEFAULT 'UTC',  -- tenant preference (e.g. 'America/New_York')
  run_at_hour INTEGER NOT NULL DEFAULT 9,  -- 0-23
  run_at_minute INTEGER NOT NULL DEFAULT 0,  -- 0-59
  day_of_week INTEGER NULL,  -- 0-6 for weekly schedules (0 = Sunday)
  day_of_month INTEGER NULL,  -- 1-28/31 for monthly schedules

  -- Task configuration
  task_types TEXT[] NOT NULL,  -- e.g. ['kpi_eval','stack_readiness','knowledge_hub','improvement_outcome','export_bundle']
  config JSONB NOT NULL DEFAULT '{}'::jsonb,  -- meta-only config per task type

  -- Execution tracking
  last_run_at TIMESTAMPTZ NULL,
  next_run_at TIMESTAMPTZ NULL,

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT cadence_valid CHECK (cadence IN ('hourly', 'daily', 'weekly', 'monthly')),
  CONSTRAINT task_types_not_empty CHECK (array_length(task_types, 1) > 0),
  CONSTRAINT day_of_week_valid CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
  CONSTRAINT day_of_month_valid CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31))
);

CREATE INDEX IF NOT EXISTS idx_automation_schedules_tenant_active ON guardian_meta_automation_schedules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_automation_schedules_tenant_next_run ON guardian_meta_automation_schedules(tenant_id, is_active, next_run_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_schedules_tenant_key ON guardian_meta_automation_schedules(tenant_id, schedule_key);

-- Table 2: guardian_meta_automation_triggers
-- Tracks conditional meta triggers (e.g., fire action when readiness drops below threshold)
CREATE TABLE IF NOT EXISTS guardian_meta_automation_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identification
  trigger_key TEXT NOT NULL,  -- e.g. 'low_readiness_alert', 'high_adoption_trigger'
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Trigger configuration
  source_domain TEXT NOT NULL,  -- 'readiness'|'adoption'|'editions'|'uplift'|'goals_okrs'|'governance'|'stack'
  metric_key TEXT NOT NULL,  -- e.g. 'readiness_overall_score', 'kpi_on_track_percent', 'stack_overall_status'
  comparator TEXT NOT NULL,  -- 'lt'|'lte'|'gt'|'gte'|'eq'|'neq'
  threshold JSONB NOT NULL,  -- number (45) or string ('limited'), depending on metric_key

  -- Actions to fire (array of task configs)
  actions JSONB NOT NULL,  -- [{ taskType: 'stack_readiness', ... }, ...]

  -- Cooldown to prevent trigger spam
  cooldown_hours INTEGER NOT NULL DEFAULT 24,
  last_fired_at TIMESTAMPTZ NULL,

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT comparator_valid CHECK (comparator IN ('lt', 'lte', 'gt', 'gte', 'eq', 'neq')),
  CONSTRAINT source_domain_valid CHECK (source_domain IN ('readiness', 'adoption', 'editions', 'uplift', 'goals_okrs', 'governance', 'stack'))
);

CREATE INDEX IF NOT EXISTS idx_automation_triggers_tenant_active ON guardian_meta_automation_triggers(tenant_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_automation_triggers_tenant_key ON guardian_meta_automation_triggers(tenant_id, trigger_key);

-- Table 3: guardian_meta_automation_executions
-- Logs of automation runs (schedules and triggers)
CREATE TABLE IF NOT EXISTS guardian_meta_automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ NULL,

  -- Execution status
  status TEXT NOT NULL DEFAULT 'running',  -- 'running'|'completed'|'failed'

  -- Source (schedule or trigger)
  schedule_id UUID NULL REFERENCES guardian_meta_automation_schedules(id) ON DELETE SET NULL,
  trigger_id UUID NULL REFERENCES guardian_meta_automation_triggers(id) ON DELETE SET NULL,

  -- Task execution details
  task_types TEXT[] NOT NULL,  -- tasks that ran
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,  -- PII-free summaries: {kpi_eval: {ids: [...]}, stack_readiness: {status: 'ready'}, ...}
  error_message TEXT NULL,  -- if status='failed'

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT status_valid CHECK (status IN ('running', 'completed', 'failed')),
  CONSTRAINT source_required CHECK ((schedule_id IS NOT NULL) OR (trigger_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_tenant_started ON guardian_meta_automation_executions(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_executions_schedule ON guardian_meta_automation_executions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_trigger ON guardian_meta_automation_executions(trigger_id);

-- Row Level Security: guardian_meta_automation_schedules
ALTER TABLE guardian_meta_automation_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_automation_schedules" ON guardian_meta_automation_schedules;
CREATE POLICY "tenant_isolation_automation_schedules" ON guardian_meta_automation_schedules
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Row Level Security: guardian_meta_automation_triggers
ALTER TABLE guardian_meta_automation_triggers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_automation_triggers" ON guardian_meta_automation_triggers;
CREATE POLICY "tenant_isolation_automation_triggers" ON guardian_meta_automation_triggers
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Row Level Security: guardian_meta_automation_executions
ALTER TABLE guardian_meta_automation_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_automation_executions" ON guardian_meta_automation_executions;
CREATE POLICY "tenant_isolation_automation_executions" ON guardian_meta_automation_executions
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Table comments
COMMENT ON TABLE guardian_meta_automation_schedules IS
  'Tenant-scoped automation schedules for recurring meta evaluation tasks (KPI eval, stack readiness, etc.). Non-breaking: operates only on Z-series meta tables, does not modify core Guardian runtime.';

COMMENT ON COLUMN guardian_meta_automation_schedules.schedule_key IS
  'Unique identifier for schedule within tenant (e.g., weekly_kpi_eval). Used for deterministic lookup.';

COMMENT ON COLUMN guardian_meta_automation_schedules.cadence IS
  'Schedule frequency: hourly, daily, weekly, or monthly. Determines next_run_at computation.';

COMMENT ON COLUMN guardian_meta_automation_schedules.timezone IS
  'Timezone label for schedule interpretation (e.g., America/New_York, Europe/London). Used to compute next_run_at; stored as reference, actual computation in UTC.';

COMMENT ON COLUMN guardian_meta_automation_schedules.task_types IS
  'Array of task types to run: kpi_eval, stack_readiness, knowledge_hub, improvement_outcome, export_bundle. All are meta-only, non-breaking.';

COMMENT ON COLUMN guardian_meta_automation_schedules.config IS
  'Meta-only configuration per task: {kpi_eval: {period: "quarter", ...}, stack_readiness: {}, ...}. No secrets or PII.';

COMMENT ON TABLE guardian_meta_automation_triggers IS
  'Conditional automation triggers that fire when a Z-series metric meets a threshold (e.g., readiness < 50). Non-breaking: only executes meta tasks.';

COMMENT ON COLUMN guardian_meta_automation_triggers.metric_key IS
  'Meta metric to evaluate: readiness_overall_score, adoption_core_score, kpi_on_track_percent, stack_overall_status, etc. Only meta signals, no raw logs.';

COMMENT ON COLUMN guardian_meta_automation_triggers.comparator IS
  'Comparison operator: lt, lte, gt, gte, eq, neq. Numeric metrics use numeric operators; string metrics (e.g., stack_overall_status) use eq/neq.';

COMMENT ON COLUMN guardian_meta_automation_triggers.actions IS
  'Array of meta actions to execute when trigger fires: [{taskType: "stack_readiness", config: {...}}, ...]. All meta-only, non-breaking.';

COMMENT ON COLUMN guardian_meta_automation_triggers.cooldown_hours IS
  'Prevents trigger spam: trigger will not fire again until cooldown_hours have passed since last_fired_at.';

COMMENT ON TABLE guardian_meta_automation_executions IS
  'Logs of automation runs. Records status, tasks executed, and PII-free summaries. Used for audit and execution history.';

COMMENT ON COLUMN guardian_meta_automation_executions.summary IS
  'PII-free summary of execution: {kpi_eval: {ids: ["uuid1", ...], count: 3, status: "completed"}, stack_readiness: {status: "ready"}, ...}. No sensitive data.';
