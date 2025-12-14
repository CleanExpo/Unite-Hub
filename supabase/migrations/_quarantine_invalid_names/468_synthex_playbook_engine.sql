-- =============================================================================
-- D39: Auto-Pilot Playbook Engine (APPE v1)
-- Phase: Synthex Autonomous Growth Stack
-- Prefix: synthex_appe_*
-- =============================================================================
-- SQL Pre-Flight Checklist:
-- ✅ Dependencies with IF NOT EXISTS
-- ✅ ENUMs with DO blocks and pg_type checks
-- ✅ Unique prefix: synthex_appe_*
-- ✅ Column naming to avoid type conflicts
-- ✅ RLS with current_setting('app.tenant_id', true)::uuid
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENUM Types (with existence checks)
-- -----------------------------------------------------------------------------

-- Playbook status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_appe_playbook_status') THEN
    CREATE TYPE synthex_appe_playbook_status AS ENUM (
      'draft',
      'active',
      'paused',
      'archived'
    );
  END IF;
END $$;

-- Step type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_appe_step_type') THEN
    CREATE TYPE synthex_appe_step_type AS ENUM (
      'trigger',
      'condition',
      'action',
      'delay',
      'branch',
      'loop',
      'parallel',
      'webhook',
      'ai_decision'
    );
  END IF;
END $$;

-- Action category
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_appe_action_category') THEN
    CREATE TYPE synthex_appe_action_category AS ENUM (
      'email',
      'sms',
      'notification',
      'crm_update',
      'tag_add',
      'tag_remove',
      'score_update',
      'webhook_call',
      'ai_generate',
      'segment_add',
      'segment_remove',
      'campaign_trigger',
      'custom'
    );
  END IF;
END $$;

-- Execution status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_appe_execution_status') THEN
    CREATE TYPE synthex_appe_execution_status AS ENUM (
      'queued',
      'running',
      'paused',
      'completed',
      'failed',
      'cancelled',
      'timeout'
    );
  END IF;
END $$;

-- Trigger type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_appe_trigger_type') THEN
    CREATE TYPE synthex_appe_trigger_type AS ENUM (
      'manual',
      'scheduled',
      'event_based',
      'condition_met',
      'api_call',
      'webhook_received',
      'segment_entry',
      'segment_exit'
    );
  END IF;
END $$;

-- Log level
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_appe_log_level') THEN
    CREATE TYPE synthex_appe_log_level AS ENUM (
      'debug',
      'info',
      'warn',
      'error',
      'fatal'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Main Tables
-- -----------------------------------------------------------------------------

-- Playbooks (template definitions)
CREATE TABLE IF NOT EXISTS synthex_appe_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identification
  playbook_key VARCHAR(100) NOT NULL,
  playbook_name VARCHAR(255) NOT NULL,
  playbook_description TEXT,

  -- Status and version
  playbook_status synthex_appe_playbook_status DEFAULT 'draft',
  version_number INTEGER DEFAULT 1,
  is_template BOOLEAN DEFAULT FALSE,
  template_source_id UUID REFERENCES synthex_appe_playbooks(id),

  -- Trigger configuration
  trigger_type synthex_appe_trigger_type DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}',

  -- Scheduling
  schedule_cron VARCHAR(100),
  schedule_timezone VARCHAR(50) DEFAULT 'UTC',
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,

  -- Execution settings
  max_concurrent_executions INTEGER DEFAULT 10,
  execution_timeout_seconds INTEGER DEFAULT 3600,
  retry_on_failure BOOLEAN DEFAULT TRUE,
  max_retries INTEGER DEFAULT 3,

  -- AI settings
  ai_enabled BOOLEAN DEFAULT TRUE,
  ai_decision_model VARCHAR(100) DEFAULT 'claude-sonnet-4-5-20250514',
  ai_confidence_threshold DECIMAL(3,2) DEFAULT 0.7,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  category VARCHAR(100),
  priority INTEGER DEFAULT 5,

  -- Stats
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  avg_execution_time_ms INTEGER,

  -- Ownership
  created_by UUID,
  updated_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(tenant_id, playbook_key)
);

-- Playbook steps (individual actions within a playbook)
CREATE TABLE IF NOT EXISTS synthex_appe_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES synthex_appe_playbooks(id) ON DELETE CASCADE,

  -- Ordering
  step_order INTEGER NOT NULL,
  step_key VARCHAR(100) NOT NULL,
  step_name VARCHAR(255) NOT NULL,
  step_description TEXT,

  -- Type and action
  step_type synthex_appe_step_type NOT NULL,
  action_category synthex_appe_action_category,

  -- Configuration
  step_config JSONB DEFAULT '{}',
  input_mapping JSONB DEFAULT '{}',
  output_mapping JSONB DEFAULT '{}',

  -- Conditions
  condition_expression TEXT,
  condition_config JSONB DEFAULT '{}',

  -- Branching
  next_step_id UUID REFERENCES synthex_appe_steps(id),
  on_success_step_id UUID REFERENCES synthex_appe_steps(id),
  on_failure_step_id UUID REFERENCES synthex_appe_steps(id),
  branch_config JSONB DEFAULT '{}',

  -- Delays
  delay_seconds INTEGER,
  delay_until TIMESTAMPTZ,

  -- AI decision
  ai_prompt_template TEXT,
  ai_decision_options JSONB DEFAULT '[]',

  -- Error handling
  is_required BOOLEAN DEFAULT TRUE,
  skip_on_error BOOLEAN DEFAULT FALSE,
  retry_count INTEGER DEFAULT 0,
  retry_delay_seconds INTEGER DEFAULT 60,

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(playbook_id, step_key)
);

-- Playbook executions (running instances)
CREATE TABLE IF NOT EXISTS synthex_appe_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES synthex_appe_playbooks(id) ON DELETE CASCADE,

  -- Execution context
  execution_key VARCHAR(100) NOT NULL,
  execution_status synthex_appe_execution_status DEFAULT 'queued',

  -- Trigger info
  triggered_by synthex_appe_trigger_type NOT NULL,
  trigger_data JSONB DEFAULT '{}',

  -- Target context
  target_entity_type VARCHAR(100),
  target_entity_id UUID,
  target_context JSONB DEFAULT '{}',

  -- Progress
  current_step_id UUID REFERENCES synthex_appe_steps(id),
  current_step_order INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  completed_steps INTEGER DEFAULT 0,
  skipped_steps INTEGER DEFAULT 0,
  failed_steps INTEGER DEFAULT 0,

  -- Execution data
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  step_results JSONB DEFAULT '{}',

  -- AI decisions made
  ai_decisions JSONB DEFAULT '[]',

  -- Error tracking
  error_message TEXT,
  error_details JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  execution_time_ms INTEGER,

  -- Cancellation
  cancelled_by UUID,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Parent execution (for sub-playbooks)
  parent_execution_id UUID REFERENCES synthex_appe_executions(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id, execution_key)
);

-- Execution logs (detailed step-by-step logging)
CREATE TABLE IF NOT EXISTS synthex_appe_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  execution_id UUID NOT NULL REFERENCES synthex_appe_executions(id) ON DELETE CASCADE,
  step_id UUID REFERENCES synthex_appe_steps(id),

  -- Log info
  log_level synthex_appe_log_level DEFAULT 'info',
  log_message TEXT NOT NULL,
  log_details JSONB DEFAULT '{}',

  -- Step execution info
  step_status VARCHAR(50),
  step_input JSONB DEFAULT '{}',
  step_output JSONB DEFAULT '{}',
  step_error TEXT,

  -- AI decision info
  ai_prompt TEXT,
  ai_response TEXT,
  ai_confidence DECIMAL(3,2),
  ai_decision VARCHAR(255),
  ai_tokens_used INTEGER,

  -- Timing
  step_started_at TIMESTAMPTZ,
  step_completed_at TIMESTAMPTZ,
  step_duration_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playbook templates (marketplace/library)
CREATE TABLE IF NOT EXISTS synthex_appe_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template info
  template_key VARCHAR(100) UNIQUE NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  template_description TEXT,

  -- Categorization
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Content
  playbook_definition JSONB NOT NULL,
  required_integrations TEXT[] DEFAULT ARRAY[]::TEXT[],
  required_fields JSONB DEFAULT '[]',

  -- Metadata
  author VARCHAR(255),
  version VARCHAR(20) DEFAULT '1.0.0',
  is_official BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,

  -- Stats
  usage_count INTEGER DEFAULT 0,
  rating_avg DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playbook schedules (for scheduled triggers)
CREATE TABLE IF NOT EXISTS synthex_appe_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES synthex_appe_playbooks(id) ON DELETE CASCADE,

  -- Schedule configuration
  schedule_name VARCHAR(255) NOT NULL,
  cron_expression VARCHAR(100) NOT NULL,
  timezone VARCHAR(50) DEFAULT 'UTC',

  -- Execution window
  start_date DATE,
  end_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Tracking
  last_triggered_at TIMESTAMPTZ,
  next_trigger_at TIMESTAMPTZ,
  total_triggers INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playbook variables (shared variables across steps)
CREATE TABLE IF NOT EXISTS synthex_appe_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  playbook_id UUID REFERENCES synthex_appe_playbooks(id) ON DELETE CASCADE,

  -- Variable definition
  variable_key VARCHAR(100) NOT NULL,
  variable_name VARCHAR(255) NOT NULL,
  variable_type VARCHAR(50) NOT NULL, -- string, number, boolean, object, array
  default_value JSONB,

  -- Validation
  is_required BOOLEAN DEFAULT FALSE,
  validation_rules JSONB DEFAULT '{}',

  -- Scope
  scope VARCHAR(50) DEFAULT 'playbook', -- playbook, execution, global

  -- Metadata
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id, playbook_id, variable_key)
);

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------

-- Playbooks indexes
CREATE INDEX IF NOT EXISTS idx_synthex_appe_playbooks_tenant ON synthex_appe_playbooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_playbooks_status ON synthex_appe_playbooks(playbook_status);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_playbooks_trigger ON synthex_appe_playbooks(trigger_type);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_playbooks_category ON synthex_appe_playbooks(category);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_playbooks_next_run ON synthex_appe_playbooks(next_run_at) WHERE playbook_status = 'active';
CREATE INDEX IF NOT EXISTS idx_synthex_appe_playbooks_tags ON synthex_appe_playbooks USING GIN(tags);

-- Steps indexes
CREATE INDEX IF NOT EXISTS idx_synthex_appe_steps_playbook ON synthex_appe_steps(playbook_id);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_steps_type ON synthex_appe_steps(step_type);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_steps_order ON synthex_appe_steps(playbook_id, step_order);

-- Executions indexes
CREATE INDEX IF NOT EXISTS idx_synthex_appe_executions_tenant ON synthex_appe_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_executions_playbook ON synthex_appe_executions(playbook_id);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_executions_status ON synthex_appe_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_executions_target ON synthex_appe_executions(target_entity_type, target_entity_id);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_executions_created ON synthex_appe_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_executions_running ON synthex_appe_executions(tenant_id) WHERE execution_status IN ('queued', 'running');

-- Execution logs indexes
CREATE INDEX IF NOT EXISTS idx_synthex_appe_logs_execution ON synthex_appe_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_logs_step ON synthex_appe_execution_logs(step_id);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_logs_level ON synthex_appe_execution_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_logs_created ON synthex_appe_execution_logs(created_at DESC);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_synthex_appe_templates_category ON synthex_appe_templates(category);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_templates_public ON synthex_appe_templates(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_synthex_appe_templates_tags ON synthex_appe_templates USING GIN(tags);

-- Schedules indexes
CREATE INDEX IF NOT EXISTS idx_synthex_appe_schedules_playbook ON synthex_appe_schedules(playbook_id);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_schedules_next ON synthex_appe_schedules(next_trigger_at) WHERE is_active = TRUE;

-- Variables indexes
CREATE INDEX IF NOT EXISTS idx_synthex_appe_variables_playbook ON synthex_appe_variables(playbook_id);
CREATE INDEX IF NOT EXISTS idx_synthex_appe_variables_scope ON synthex_appe_variables(scope);

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE synthex_appe_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_appe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_appe_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_appe_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_appe_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_appe_variables ENABLE ROW LEVEL SECURITY;

-- Playbooks policy
DROP POLICY IF EXISTS synthex_appe_playbooks_tenant_isolation ON synthex_appe_playbooks;
CREATE POLICY synthex_appe_playbooks_tenant_isolation ON synthex_appe_playbooks
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Steps policy
DROP POLICY IF EXISTS synthex_appe_steps_tenant_isolation ON synthex_appe_steps;
CREATE POLICY synthex_appe_steps_tenant_isolation ON synthex_appe_steps
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Executions policy
DROP POLICY IF EXISTS synthex_appe_executions_tenant_isolation ON synthex_appe_executions;
CREATE POLICY synthex_appe_executions_tenant_isolation ON synthex_appe_executions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Execution logs policy
DROP POLICY IF EXISTS synthex_appe_execution_logs_tenant_isolation ON synthex_appe_execution_logs;
CREATE POLICY synthex_appe_execution_logs_tenant_isolation ON synthex_appe_execution_logs
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Schedules policy
DROP POLICY IF EXISTS synthex_appe_schedules_tenant_isolation ON synthex_appe_schedules;
CREATE POLICY synthex_appe_schedules_tenant_isolation ON synthex_appe_schedules
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Variables policy
DROP POLICY IF EXISTS synthex_appe_variables_tenant_isolation ON synthex_appe_variables;
CREATE POLICY synthex_appe_variables_tenant_isolation ON synthex_appe_variables
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- 5. Helper Functions
-- -----------------------------------------------------------------------------

-- Get playbook with steps
CREATE OR REPLACE FUNCTION synthex_appe_get_playbook_with_steps(p_playbook_id UUID)
RETURNS TABLE (
  playbook JSONB,
  steps JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(p.*) AS playbook,
    COALESCE(
      jsonb_agg(to_jsonb(s.*) ORDER BY s.step_order) FILTER (WHERE s.id IS NOT NULL),
      '[]'::jsonb
    ) AS steps
  FROM synthex_appe_playbooks p
  LEFT JOIN synthex_appe_steps s ON s.playbook_id = p.id
  WHERE p.id = p_playbook_id
  GROUP BY p.id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get execution with logs
CREATE OR REPLACE FUNCTION synthex_appe_get_execution_with_logs(p_execution_id UUID)
RETURNS TABLE (
  execution JSONB,
  logs JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(e.*) AS execution,
    COALESCE(
      jsonb_agg(to_jsonb(l.*) ORDER BY l.created_at) FILTER (WHERE l.id IS NOT NULL),
      '[]'::jsonb
    ) AS logs
  FROM synthex_appe_executions e
  LEFT JOIN synthex_appe_execution_logs l ON l.execution_id = e.id
  WHERE e.id = p_execution_id
  GROUP BY e.id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get playbook stats
CREATE OR REPLACE FUNCTION synthex_appe_get_playbook_stats(p_tenant_id UUID)
RETURNS TABLE (
  total_playbooks BIGINT,
  active_playbooks BIGINT,
  total_executions BIGINT,
  running_executions BIGINT,
  completed_today BIGINT,
  failed_today BIGINT,
  avg_execution_time_ms NUMERIC,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id) AS total_playbooks,
    COUNT(DISTINCT p.id) FILTER (WHERE p.playbook_status = 'active') AS active_playbooks,
    COUNT(DISTINCT e.id) AS total_executions,
    COUNT(DISTINCT e.id) FILTER (WHERE e.execution_status IN ('queued', 'running')) AS running_executions,
    COUNT(DISTINCT e.id) FILTER (WHERE e.execution_status = 'completed' AND e.completed_at >= CURRENT_DATE) AS completed_today,
    COUNT(DISTINCT e.id) FILTER (WHERE e.execution_status = 'failed' AND e.completed_at >= CURRENT_DATE) AS failed_today,
    COALESCE(AVG(e.execution_time_ms) FILTER (WHERE e.execution_status = 'completed'), 0) AS avg_execution_time_ms,
    CASE
      WHEN COUNT(e.id) FILTER (WHERE e.execution_status IN ('completed', 'failed')) > 0
      THEN (COUNT(e.id) FILTER (WHERE e.execution_status = 'completed')::NUMERIC /
            NULLIF(COUNT(e.id) FILTER (WHERE e.execution_status IN ('completed', 'failed')), 0)) * 100
      ELSE 0
    END AS success_rate
  FROM synthex_appe_playbooks p
  LEFT JOIN synthex_appe_executions e ON e.playbook_id = p.id
  WHERE p.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Find due scheduled playbooks
CREATE OR REPLACE FUNCTION synthex_appe_get_due_playbooks()
RETURNS TABLE (
  playbook_id UUID,
  tenant_id UUID,
  playbook_name VARCHAR,
  trigger_config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS playbook_id,
    p.tenant_id,
    p.playbook_name,
    p.trigger_config
  FROM synthex_appe_playbooks p
  WHERE p.playbook_status = 'active'
    AND p.trigger_type = 'scheduled'
    AND p.next_run_at <= NOW()
  ORDER BY p.next_run_at;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update playbook stats
CREATE OR REPLACE FUNCTION synthex_appe_update_playbook_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.execution_status IN ('completed', 'failed') AND OLD.execution_status NOT IN ('completed', 'failed') THEN
    UPDATE synthex_appe_playbooks
    SET
      total_executions = total_executions + 1,
      successful_executions = successful_executions + CASE WHEN NEW.execution_status = 'completed' THEN 1 ELSE 0 END,
      failed_executions = failed_executions + CASE WHEN NEW.execution_status = 'failed' THEN 1 ELSE 0 END,
      last_run_at = NOW(),
      avg_execution_time_ms = COALESCE(
        (avg_execution_time_ms * total_executions + COALESCE(NEW.execution_time_ms, 0)) / NULLIF(total_executions + 1, 0),
        NEW.execution_time_ms
      ),
      updated_at = NOW()
    WHERE id = NEW.playbook_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stats update
DROP TRIGGER IF EXISTS trg_synthex_appe_update_stats ON synthex_appe_executions;
CREATE TRIGGER trg_synthex_appe_update_stats
  AFTER UPDATE ON synthex_appe_executions
  FOR EACH ROW
  EXECUTE FUNCTION synthex_appe_update_playbook_stats();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION synthex_appe_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_appe_playbooks_updated ON synthex_appe_playbooks;
CREATE TRIGGER trg_synthex_appe_playbooks_updated
  BEFORE UPDATE ON synthex_appe_playbooks
  FOR EACH ROW
  EXECUTE FUNCTION synthex_appe_update_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_appe_steps_updated ON synthex_appe_steps;
CREATE TRIGGER trg_synthex_appe_steps_updated
  BEFORE UPDATE ON synthex_appe_steps
  FOR EACH ROW
  EXECUTE FUNCTION synthex_appe_update_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_appe_executions_updated ON synthex_appe_executions;
CREATE TRIGGER trg_synthex_appe_executions_updated
  BEFORE UPDATE ON synthex_appe_executions
  FOR EACH ROW
  EXECUTE FUNCTION synthex_appe_update_timestamp();

-- -----------------------------------------------------------------------------
-- 6. Seed Official Templates
-- -----------------------------------------------------------------------------

INSERT INTO synthex_appe_templates (
  template_key,
  template_name,
  template_description,
  category,
  subcategory,
  tags,
  playbook_definition,
  required_integrations,
  required_fields,
  author,
  is_official,
  is_public
) VALUES
(
  'welcome-sequence',
  'Welcome Email Sequence',
  'Automated welcome sequence for new subscribers with 3 emails over 7 days',
  'email',
  'onboarding',
  ARRAY['welcome', 'onboarding', 'email'],
  '{
    "steps": [
      {"type": "trigger", "config": {"event": "subscriber_created"}},
      {"type": "action", "category": "email", "config": {"template": "welcome_1"}},
      {"type": "delay", "config": {"days": 2}},
      {"type": "action", "category": "email", "config": {"template": "welcome_2"}},
      {"type": "delay", "config": {"days": 3}},
      {"type": "action", "category": "email", "config": {"template": "welcome_3"}}
    ]
  }'::jsonb,
  ARRAY['email'],
  '[{"key": "subscriber_email", "type": "string", "required": true}]'::jsonb,
  'Synthex',
  TRUE,
  TRUE
),
(
  'lead-scoring-automation',
  'Lead Score Update Automation',
  'Automatically update lead scores based on engagement signals',
  'crm',
  'scoring',
  ARRAY['lead', 'scoring', 'automation'],
  '{
    "steps": [
      {"type": "trigger", "config": {"event": "engagement_recorded"}},
      {"type": "condition", "config": {"expression": "engagement_type == ''email_open''"}},
      {"type": "ai_decision", "config": {"prompt": "Score this engagement"}},
      {"type": "action", "category": "score_update", "config": {"adjustment": "ai_decision"}}
    ]
  }'::jsonb,
  ARRAY['crm'],
  '[{"key": "contact_id", "type": "uuid", "required": true}]'::jsonb,
  'Synthex',
  TRUE,
  TRUE
),
(
  'abandoned-cart-recovery',
  'Abandoned Cart Recovery',
  'Win back customers who abandoned their cart with personalized follow-ups',
  'ecommerce',
  'recovery',
  ARRAY['cart', 'recovery', 'ecommerce'],
  '{
    "steps": [
      {"type": "trigger", "config": {"event": "cart_abandoned", "delay_minutes": 60}},
      {"type": "ai_decision", "config": {"prompt": "Personalize recovery message"}},
      {"type": "action", "category": "email", "config": {"template": "cart_reminder_1"}},
      {"type": "delay", "config": {"hours": 24}},
      {"type": "condition", "config": {"expression": "cart_status == ''abandoned''"}},
      {"type": "action", "category": "email", "config": {"template": "cart_reminder_2_discount"}}
    ]
  }'::jsonb,
  ARRAY['email', 'ecommerce'],
  '[{"key": "cart_id", "type": "uuid", "required": true}, {"key": "customer_email", "type": "string", "required": true}]'::jsonb,
  'Synthex',
  TRUE,
  TRUE
)
ON CONFLICT (template_key) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Migration complete
-- -----------------------------------------------------------------------------
