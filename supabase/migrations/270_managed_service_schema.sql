/**
 * Phase 3: Paid Service Automation Engine (Stripe-Triggered Managed Service Workflows)
 *
 * Tables for managing paid managed service projects:
 * - managed_service_projects: Top-level project definition
 * - managed_service_contracts: Legal/financial contracts
 * - managed_service_timelines: Project phases and milestones
 * - managed_service_tasks: Atomic tasks for orchestrator
 * - managed_service_reports: Weekly performance reports
 * - managed_service_stripe_events: Audit trail of Stripe events
 * - managed_service_notifications: Email notifications sent
 *
 * Migration Version: 270
 * Created: 2025-11-27
 */

-- ============================================================================
-- 1. Managed Service Projects Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS managed_service_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  project_name TEXT NOT NULL,

  -- Service Details
  service_type TEXT NOT NULL,  -- e.g., 'seo_management', 'content_strategy', etc.
  service_tier TEXT NOT NULL,  -- 'starter', 'professional', 'enterprise'
  monthly_hours INT NOT NULL,  -- Allocated hours per month

  -- Financial
  monthly_cost_cents INT NOT NULL,  -- In cents
  setup_cost_cents INT DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, active, paused, completed, cancelled
  start_date DATE NOT NULL,
  projected_end_date DATE,
  actual_end_date DATE,

  -- Client Info
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_website TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT service_tier_valid CHECK (service_tier IN ('starter', 'professional', 'enterprise')),
  CONSTRAINT status_valid CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled'))
);

CREATE INDEX idx_managed_service_projects_tenant_status
  ON managed_service_projects(tenant_id, status);
CREATE INDEX idx_managed_service_projects_stripe_customer
  ON managed_service_projects(stripe_customer_id);
CREATE INDEX idx_managed_service_projects_created
  ON managed_service_projects(created_at DESC);

-- ============================================================================
-- 2. Managed Service Contracts Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS managed_service_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES managed_service_projects(id) ON DELETE CASCADE,

  -- Contract Details
  contract_type TEXT NOT NULL,  -- 'service_agreement', 'sow', 'msa'
  contract_version INT DEFAULT 1,

  -- Legal/Scope
  scope_of_work TEXT NOT NULL,  -- Full text description
  deliverables JSONB NOT NULL,  -- Array of { name, description, dueDate }
  terms_and_conditions TEXT,
  success_metrics JSONB NOT NULL,  -- Array of { metric, target, measurement_method }

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, signed, executed, expired
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_hash TEXT,  -- Hash of signed document

  -- Dates
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT status_valid CHECK (status IN ('draft', 'signed', 'executed', 'expired'))
);

CREATE INDEX idx_managed_service_contracts_project_status
  ON managed_service_contracts(project_id, status);

-- ============================================================================
-- 3. Managed Service Timelines Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS managed_service_timelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES managed_service_projects(id) ON DELETE CASCADE,

  -- Phase Definition
  phase_number INT NOT NULL,
  phase_name TEXT NOT NULL,  -- e.g., 'Baseline & Discovery', 'Strategy Development', 'Execution'

  -- Timeline
  start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  actual_end_date DATE,

  -- Scope
  description TEXT NOT NULL,
  key_activities JSONB NOT NULL,  -- Array of activity descriptions
  deliverables JSONB NOT NULL,  -- Array of { name, format, dueDate }

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, in_progress, completed, delayed, blocked
  completion_percentage INT DEFAULT 0,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT status_valid CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'blocked')),
  CONSTRAINT unique_project_phase UNIQUE(project_id, phase_number)
);

CREATE INDEX idx_managed_service_timelines_project_status
  ON managed_service_timelines(project_id, status);
CREATE INDEX idx_managed_service_timelines_dates
  ON managed_service_timelines(planned_end_date, actual_end_date);

-- ============================================================================
-- 4. Managed Service Tasks Table (For Orchestrator)
-- ============================================================================

CREATE TABLE IF NOT EXISTS managed_service_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES managed_service_projects(id) ON DELETE CASCADE,
  timeline_id UUID REFERENCES managed_service_timelines(id) ON DELETE SET NULL,

  -- Task Details
  task_name TEXT NOT NULL,
  task_type TEXT NOT NULL,  -- 'analysis', 'optimization', 'content_creation', 'monitoring', 'reporting'

  -- Execution
  assigned_agent_id TEXT,  -- Agent responsible
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, assigned, in_progress, completed, blocked, failed
  priority TEXT NOT NULL DEFAULT 'normal',  -- low, normal, high, critical

  -- Timing
  due_date DATE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Details
  description TEXT NOT NULL,
  required_inputs JSONB DEFAULT '{}'::jsonb,  -- What data/context needed
  expected_outputs JSONB DEFAULT '{}'::jsonb,  -- What should be produced

  -- Results
  output_data JSONB,
  execution_notes TEXT,
  error_message TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT task_type_valid CHECK (task_type IN ('analysis', 'optimization', 'content_creation', 'monitoring', 'reporting')),
  CONSTRAINT status_valid CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'blocked', 'failed')),
  CONSTRAINT priority_valid CHECK (priority IN ('low', 'normal', 'high', 'critical'))
);

CREATE INDEX idx_managed_service_tasks_project_status
  ON managed_service_tasks(project_id, status);
CREATE INDEX idx_managed_service_tasks_agent
  ON managed_service_tasks(assigned_agent_id);
CREATE INDEX idx_managed_service_tasks_due_date
  ON managed_service_tasks(due_date);
CREATE INDEX idx_managed_service_tasks_timeline
  ON managed_service_tasks(timeline_id);

-- ============================================================================
-- 5. Managed Service Reports Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS managed_service_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES managed_service_projects(id) ON DELETE CASCADE,

  -- Report Details
  report_number INT NOT NULL,  -- Week 1, Week 2, etc.
  report_type TEXT NOT NULL DEFAULT 'weekly',  -- weekly, monthly, milestone, final

  -- Period
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  -- Performance Metrics
  hours_utilized INT DEFAULT 0,  -- Hours used this period
  hours_remaining INT DEFAULT 0,  -- Hours still available

  -- Content Summary
  executive_summary TEXT,
  highlights JSONB NOT NULL,  -- Array of key achievements

  -- Metrics & Data
  kpi_tracking JSONB NOT NULL,  -- { metricName: value, targetValue, trend }
  traffic_data JSONB,  -- GA4 data if applicable
  rank_data JSONB,  -- Ranking improvements if applicable

  -- Recommendations
  recommendations JSONB NOT NULL,  -- Array of next steps
  blockers JSONB,  -- Any obstacles

  -- Status
  status TEXT NOT NULL DEFAULT 'draft',  -- draft, sent, reviewed
  sent_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT report_type_valid CHECK (report_type IN ('weekly', 'monthly', 'milestone', 'final')),
  CONSTRAINT status_valid CHECK (status IN ('draft', 'sent', 'reviewed'))
);

CREATE INDEX idx_managed_service_reports_project_period
  ON managed_service_reports(project_id, period_start_date DESC);
CREATE INDEX idx_managed_service_reports_status
  ON managed_service_reports(status);

-- ============================================================================
-- 6. Managed Service Stripe Events Table (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS managed_service_stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES managed_service_projects(id) ON DELETE CASCADE,

  -- Stripe Event
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,  -- 'customer.created', 'invoice.paid', 'invoice.payment_failed', etc.

  -- Status
  processed BOOLEAN DEFAULT false,
  processing_error TEXT,

  -- Event Data
  event_data JSONB NOT NULL,  -- Full Stripe event object

  -- Metadata
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT unique_stripe_event UNIQUE(stripe_event_id)
);

CREATE INDEX idx_managed_service_stripe_events_project
  ON managed_service_stripe_events(project_id);
CREATE INDEX idx_managed_service_stripe_events_type
  ON managed_service_stripe_events(event_type, processed);
CREATE INDEX idx_managed_service_stripe_events_received
  ON managed_service_stripe_events(received_at DESC);

-- ============================================================================
-- 7. Managed Service Notifications Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS managed_service_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES managed_service_projects(id) ON DELETE CASCADE,

  -- Email Details
  recipient_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,  -- 'report_sent', 'milestone_reached', 'alert', 'onboarding'
  subject TEXT NOT NULL,

  -- Content
  email_body_html TEXT NOT NULL,
  email_body_text TEXT,

  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',  -- pending, sent, bounced, complained
  sent_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  provider TEXT,  -- sendgrid, resend, gmail_smtp
  message_id TEXT,  -- Provider message ID for tracking

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT status_valid CHECK (status IN ('pending', 'sent', 'bounced', 'complained'))
);

CREATE INDEX idx_managed_service_notifications_project_type
  ON managed_service_notifications(project_id, notification_type);
CREATE INDEX idx_managed_service_notifications_status
  ON managed_service_notifications(status);
CREATE INDEX idx_managed_service_notifications_scheduled
  ON managed_service_notifications(scheduled_for) WHERE status = 'pending';

-- ============================================================================
-- 8. Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE managed_service_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_service_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_service_timelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_service_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_service_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_service_stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_service_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. RLS Policies - Tenant Isolation
-- ============================================================================

-- Founders can view/manage their own projects
CREATE POLICY "founders_manage_projects" ON managed_service_projects
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
      AND user_organizations.org_id = managed_service_projects.tenant_id
      AND user_organizations.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
      AND user_organizations.org_id = managed_service_projects.tenant_id
      AND user_organizations.role = 'owner'
    )
  );

-- System (orchestrator) can read/write all for processing
CREATE POLICY "system_manage_contracts" ON managed_service_contracts
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "system_manage_timelines" ON managed_service_timelines
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "system_manage_tasks" ON managed_service_tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "system_manage_reports" ON managed_service_reports
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "system_manage_stripe_events" ON managed_service_stripe_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "system_manage_notifications" ON managed_service_notifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 10. Helper Functions
-- ============================================================================

/**
 * Get active projects for a tenant
 */
CREATE OR REPLACE FUNCTION get_active_projects(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  project_name TEXT,
  service_type TEXT,
  status TEXT,
  start_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    managed_service_projects.id,
    managed_service_projects.project_name,
    managed_service_projects.service_type,
    managed_service_projects.status,
    managed_service_projects.start_date
  FROM managed_service_projects
  WHERE managed_service_projects.tenant_id = p_tenant_id
  AND managed_service_projects.status = 'active'
  ORDER BY managed_service_projects.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get pending tasks for orchestrator
 */
CREATE OR REPLACE FUNCTION get_pending_tasks(p_project_id UUID)
RETURNS TABLE (
  id UUID,
  task_name TEXT,
  task_type TEXT,
  status TEXT,
  due_date DATE,
  priority TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    managed_service_tasks.id,
    managed_service_tasks.task_name,
    managed_service_tasks.task_type,
    managed_service_tasks.status,
    managed_service_tasks.due_date,
    managed_service_tasks.priority
  FROM managed_service_tasks
  WHERE managed_service_tasks.project_id = p_project_id
  AND managed_service_tasks.status IN ('pending', 'assigned', 'blocked')
  ORDER BY managed_service_tasks.priority DESC, managed_service_tasks.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Mark task as completed and log update
 */
CREATE OR REPLACE FUNCTION complete_managed_task(
  p_task_id UUID,
  p_output_data JSONB,
  p_notes TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE managed_service_tasks
  SET
    status = 'completed',
    completed_at = NOW(),
    output_data = p_output_data,
    execution_notes = p_notes,
    updated_at = NOW()
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 11. Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_managed_service_projects_status_active
  ON managed_service_projects(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_managed_service_tasks_status_pending
  ON managed_service_tasks(status) WHERE status IN ('pending', 'assigned', 'blocked');
CREATE INDEX IF NOT EXISTS idx_managed_service_notifications_pending
  ON managed_service_notifications(status) WHERE status = 'pending';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  INSERT INTO public.migration_log (version, name, status, completed_at)
  VALUES (270, 'managed_service_schema', 'success', NOW())
  ON CONFLICT DO NOTHING;
END;
$$;
