-- Migration 200: Social Drip Campaign System
-- Purpose: Enhanced campaign system with visual builder, A/B testing, and multi-channel support
-- Extends: 008_drip_campaigns.sql, 154_campaign_channels.sql
-- Created: 2026-01-27

-- ============================================================================
-- 1. ENHANCED CAMPAIGN TABLE (extends drip_campaigns)
-- ============================================================================

-- Add new columns to drip_campaigns for visual builder and A/B testing
ALTER TABLE drip_campaigns
  ADD COLUMN IF NOT EXISTS campaign_type TEXT CHECK (campaign_type IN ('linear', 'branching', 'ab_test')) DEFAULT 'linear',
  ADD COLUMN IF NOT EXISTS canvas_data JSONB DEFAULT '{"nodes": [], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 1}}',
  ADD COLUMN IF NOT EXISTS ab_test_config JSONB, -- {enabled: boolean, variants: [], winner_metric: 'open_rate' | 'click_rate' | 'conversion_rate'}
  ADD COLUMN IF NOT EXISTS ab_test_winner_id UUID REFERENCES campaign_steps(id),
  ADD COLUMN IF NOT EXISTS ab_test_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS goal_metric TEXT CHECK (goal_metric IN ('open_rate', 'click_rate', 'reply_rate', 'conversion_rate', 'engagement_score')),
  ADD COLUMN IF NOT EXISTS goal_target DECIMAL(5,2), -- Target percentage (e.g., 25.00 for 25%)
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_campaign_id UUID REFERENCES drip_campaigns(id) ON DELETE SET NULL;

-- Index for A/B testing and versioning
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_ab_test ON drip_campaigns(ab_test_winner_id) WHERE ab_test_config IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_version ON drip_campaigns(parent_campaign_id, version);
CREATE INDEX IF NOT EXISTS idx_drip_campaigns_type ON drip_campaigns(campaign_type);

COMMENT ON COLUMN drip_campaigns.canvas_data IS 'Visual campaign builder node/edge data for ReactFlow';
COMMENT ON COLUMN drip_campaigns.ab_test_config IS 'A/B test configuration with variants and winner criteria';
COMMENT ON COLUMN drip_campaigns.version IS 'Campaign version number for revision history';

-- ============================================================================
-- 2. ENHANCED CAMPAIGN STEPS (extends campaign_steps)
-- ============================================================================

-- Add visual builder and multi-channel columns to campaign_steps
ALTER TABLE campaign_steps
  ADD COLUMN IF NOT EXISTS node_id TEXT, -- Visual builder node ID
  ADD COLUMN IF NOT EXISTS node_type TEXT CHECK (node_type IN ('trigger', 'email', 'wait', 'condition', 'split', 'action', 'exit')) DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS node_position JSONB DEFAULT '{"x": 0, "y": 0}',
  ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES campaign_channels(id),
  ADD COLUMN IF NOT EXISTS channel_config JSONB, -- Channel-specific configuration (social post, SMS, webhook, etc.)
  ADD COLUMN IF NOT EXISTS variant_group TEXT, -- For A/B testing (e.g., 'variant_a', 'variant_b')
  ADD COLUMN IF NOT EXISTS variant_percentage INTEGER CHECK (variant_percentage >= 0 AND variant_percentage <= 100), -- Traffic split percentage
  ADD COLUMN IF NOT EXISTS parent_split_id UUID REFERENCES campaign_steps(id), -- Parent split node for A/B test variants
  ADD COLUMN IF NOT EXISTS conditional_branches JSONB, -- [{condition: {}, target_step_id: ''}, ...]
  ADD COLUMN IF NOT EXISTS wait_config JSONB, -- {type: 'duration'|'until_event', value: 24, unit: 'hours', event_type: 'email_open'}
  ADD COLUMN IF NOT EXISTS action_config JSONB; -- For action nodes: {type: 'tag'|'score'|'webhook'|'update_field', config: {}}

-- Indexes for visual builder queries
CREATE INDEX IF NOT EXISTS idx_campaign_steps_node_id ON campaign_steps(node_id);
CREATE INDEX IF NOT EXISTS idx_campaign_steps_node_type ON campaign_steps(node_type);
CREATE INDEX IF NOT EXISTS idx_campaign_steps_variant_group ON campaign_steps(variant_group) WHERE variant_group IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_steps_parent_split ON campaign_steps(parent_split_id) WHERE parent_split_id IS NOT NULL;

COMMENT ON COLUMN campaign_steps.node_id IS 'Unique identifier for visual builder node (e.g., node_abc123)';
COMMENT ON COLUMN campaign_steps.channel_id IS 'Reference to campaign_channels for multi-channel campaigns';
COMMENT ON COLUMN campaign_steps.conditional_branches IS 'Array of conditional branches with target step IDs';
COMMENT ON COLUMN campaign_steps.variant_group IS 'A/B test variant identifier (variant_a, variant_b, etc.)';

-- ============================================================================
-- 3. CAMPAIGN WORKFLOW STATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_workflow_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES campaign_enrollments(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Current State
  current_node_id TEXT NOT NULL,
  current_step_id UUID REFERENCES campaign_steps(id),
  workflow_status TEXT NOT NULL CHECK (workflow_status IN ('running', 'waiting', 'paused', 'completed', 'failed', 'exited')) DEFAULT 'running',

  -- Execution Context
  execution_path JSONB DEFAULT '[]', -- Array of node IDs visited
  workflow_variables JSONB DEFAULT '{}', -- Runtime variables for conditional logic
  wait_until TIMESTAMPTZ, -- For wait nodes
  wait_for_event TEXT, -- For event-based waits (email_open, reply, etc.)
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- A/B Test Assignment
  assigned_variant TEXT, -- Which variant this enrollment is assigned to
  variant_assigned_at TIMESTAMPTZ,

  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_executed_at TIMESTAMPTZ,
  next_execution_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_workflow_state_enrollment UNIQUE(enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_states_enrollment ON campaign_workflow_states(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_campaign ON campaign_workflow_states(campaign_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_status ON campaign_workflow_states(workflow_status);
CREATE INDEX IF NOT EXISTS idx_workflow_states_next_execution ON campaign_workflow_states(next_execution_at) WHERE workflow_status = 'waiting';
CREATE INDEX IF NOT EXISTS idx_workflow_states_wait_event ON campaign_workflow_states(wait_for_event) WHERE wait_for_event IS NOT NULL;

COMMENT ON TABLE campaign_workflow_states IS 'Tracks real-time execution state for each enrolled contact in workflow';
COMMENT ON COLUMN campaign_workflow_states.execution_path IS 'Array of node IDs showing the path taken through the workflow';
COMMENT ON COLUMN campaign_workflow_states.workflow_variables IS 'Runtime variables for conditional logic evaluation';

-- ============================================================================
-- 4. A/B TEST RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_ab_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  variant_group TEXT NOT NULL,
  variant_step_id UUID NOT NULL REFERENCES campaign_steps(id) ON DELETE CASCADE,

  -- Metrics
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_replied INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_unsubscribed INTEGER DEFAULT 0,
  total_bounced INTEGER DEFAULT 0,

  -- Rates (calculated)
  delivery_rate DECIMAL(5,2),
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  reply_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  engagement_score DECIMAL(5,2), -- Composite score

  -- Statistical Significance
  confidence_level DECIMAL(5,2), -- 0-100% confidence that this variant is better
  p_value DECIMAL(10,8),
  is_statistically_significant BOOLEAN DEFAULT FALSE,
  is_winner BOOLEAN DEFAULT FALSE,

  -- Timestamps
  test_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  test_ended_at TIMESTAMPTZ,
  winner_declared_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_campaign_variant UNIQUE(campaign_id, variant_group)
);

CREATE INDEX IF NOT EXISTS idx_ab_test_results_campaign ON campaign_ab_test_results(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_variant ON campaign_ab_test_results(variant_group);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_winner ON campaign_ab_test_results(is_winner) WHERE is_winner = TRUE;

COMMENT ON TABLE campaign_ab_test_results IS 'Aggregated metrics and statistical analysis for A/B test variants';
COMMENT ON COLUMN campaign_ab_test_results.engagement_score IS 'Composite score: (open_rate * 0.3 + click_rate * 0.4 + reply_rate * 0.3)';
COMMENT ON COLUMN campaign_ab_test_results.confidence_level IS 'Statistical confidence that this variant outperforms others';

-- ============================================================================
-- 5. CAMPAIGN EVENTS (for webhook/action triggers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES campaign_enrollments(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,

  -- Event Details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'email_sent', 'email_delivered', 'email_opened', 'email_clicked', 'email_replied', 'email_bounced',
    'sms_sent', 'sms_delivered', 'sms_replied',
    'social_posted', 'social_engaged',
    'webhook_triggered', 'webhook_succeeded', 'webhook_failed',
    'tag_added', 'tag_removed',
    'score_updated',
    'condition_evaluated',
    'wait_started', 'wait_completed',
    'variant_assigned',
    'enrollment_started', 'enrollment_completed', 'enrollment_exited'
  )),
  event_source TEXT, -- 'system', 'email_provider', 'webhook', 'manual'

  -- Event Context
  step_id UUID REFERENCES campaign_steps(id),
  node_id TEXT,
  event_data JSONB DEFAULT '{}', -- Flexible event-specific data

  -- Metadata
  user_agent TEXT,
  ip_address INET,
  device_type TEXT,
  location_data JSONB, -- {city, country, timezone}

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT idx_campaign_events_unique UNIQUE(enrollment_id, step_id, event_type, created_at)
);

CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign ON campaign_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_enrollment ON campaign_events(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_contact ON campaign_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_type ON campaign_events(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_events_created ON campaign_events(created_at DESC);

COMMENT ON TABLE campaign_events IS 'Comprehensive event log for all campaign interactions and state changes';
COMMENT ON COLUMN campaign_events.event_data IS 'Flexible JSONB field for event-specific data (email ID, webhook response, etc.)';

-- ============================================================================
-- 6. CAMPAIGN VERSIONS (for revision history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,

  -- Snapshot Data
  campaign_snapshot JSONB NOT NULL, -- Full campaign state at this version
  steps_snapshot JSONB NOT NULL, -- All steps at this version
  canvas_snapshot JSONB, -- Visual builder state

  -- Version Metadata
  change_description TEXT,
  change_type TEXT CHECK (change_type IN ('draft', 'published', 'archived', 'ab_test_started', 'ab_test_completed')),
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_campaign_version UNIQUE(campaign_id, version)
);

CREATE INDEX IF NOT EXISTS idx_campaign_versions_campaign ON campaign_versions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_versions_version ON campaign_versions(version DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_versions_created ON campaign_versions(created_at DESC);

COMMENT ON TABLE campaign_versions IS 'Version history for campaigns to enable rollback and audit trail';
COMMENT ON COLUMN campaign_versions.campaign_snapshot IS 'Full JSON snapshot of campaign at this version';

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE campaign_workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_versions ENABLE ROW LEVEL SECURITY;

-- Workflow States Policies
CREATE POLICY workflow_states_view_policy ON campaign_workflow_states
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaign_enrollments ce
      JOIN drip_campaigns dc ON ce.campaign_id = dc.id
      JOIN user_profiles up ON up.workspace_id = dc.workspace_id
      WHERE ce.id = campaign_workflow_states.enrollment_id
      AND up.id = auth.uid()
    )
  );

CREATE POLICY workflow_states_service_policy ON campaign_workflow_states
  FOR ALL TO service_role
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true)
  WITH CHECK (true);

-- A/B Test Results Policies
CREATE POLICY ab_test_results_view_policy ON campaign_ab_test_results
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drip_campaigns dc
      JOIN user_profiles up ON up.workspace_id = dc.workspace_id
      WHERE dc.id = campaign_ab_test_results.campaign_id
      AND up.id = auth.uid()
    )
  );

CREATE POLICY ab_test_results_service_policy ON campaign_ab_test_results
  FOR ALL TO service_role
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true)
  WITH CHECK (true);

-- Campaign Events Policies
CREATE POLICY campaign_events_view_policy ON campaign_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drip_campaigns dc
      JOIN user_profiles up ON up.workspace_id = dc.workspace_id
      WHERE dc.id = campaign_events.campaign_id
      AND up.id = auth.uid()
    )
  );

CREATE POLICY campaign_events_service_policy ON campaign_events
  FOR ALL TO service_role
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true)
  WITH CHECK (true);

-- Campaign Versions Policies
CREATE POLICY campaign_versions_view_policy ON campaign_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM drip_campaigns dc
      JOIN user_profiles up ON up.workspace_id = dc.workspace_id
      WHERE dc.id = campaign_versions.campaign_id
      AND up.id = auth.uid()
    )
  );

CREATE POLICY campaign_versions_service_policy ON campaign_versions
  FOR ALL TO service_role
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true)
  WITH CHECK (true);

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate A/B test metrics
CREATE OR REPLACE FUNCTION calculate_ab_test_metrics(
  p_campaign_id UUID
)
RETURNS TABLE (
  variant_group TEXT,
  open_rate DECIMAL,
  click_rate DECIMAL,
  conversion_rate DECIMAL,
  engagement_score DECIMAL,
  sample_size INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH variant_stats AS (
    SELECT
      ws.assigned_variant,
      COUNT(DISTINCT ws.enrollment_id) as total_enrolled,
      COUNT(DISTINCT CASE WHEN ce.event_type = 'email_opened' THEN ce.enrollment_id END) as opened,
      COUNT(DISTINCT CASE WHEN ce.event_type = 'email_clicked' THEN ce.enrollment_id END) as clicked,
      COUNT(DISTINCT CASE WHEN ce.event_type = 'email_replied' THEN ce.enrollment_id END) as converted
    FROM campaign_workflow_states ws
    LEFT JOIN campaign_events ce ON ce.enrollment_id = ws.enrollment_id
    WHERE ws.campaign_id = p_campaign_id
    AND ws.assigned_variant IS NOT NULL
    GROUP BY ws.assigned_variant
  )
  SELECT
    vs.assigned_variant,
    ROUND((vs.opened::DECIMAL / NULLIF(vs.total_enrolled, 0)) * 100, 2) as open_rate,
    ROUND((vs.clicked::DECIMAL / NULLIF(vs.total_enrolled, 0)) * 100, 2) as click_rate,
    ROUND((vs.converted::DECIMAL / NULLIF(vs.total_enrolled, 0)) * 100, 2) as conversion_rate,
    ROUND(
      ((vs.opened::DECIMAL / NULLIF(vs.total_enrolled, 0)) * 0.3 +
       (vs.clicked::DECIMAL / NULLIF(vs.total_enrolled, 0)) * 0.4 +
       (vs.converted::DECIMAL / NULLIF(vs.total_enrolled, 0)) * 0.3) * 100,
      2
    ) as engagement_score,
    vs.total_enrolled as sample_size
  FROM variant_stats vs;
END;
$$;

-- Function to get next execution batch
CREATE OR REPLACE FUNCTION get_next_workflow_executions(
  p_batch_size INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  enrollment_id UUID,
  campaign_id UUID,
  contact_id UUID,
  current_step_id UUID,
  next_execution_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ws.id,
    ws.enrollment_id,
    ws.campaign_id,
    ws.contact_id,
    ws.current_step_id,
    ws.next_execution_at
  FROM campaign_workflow_states ws
  WHERE ws.workflow_status = 'waiting'
  AND ws.next_execution_at <= NOW()
  ORDER BY ws.next_execution_at ASC
  LIMIT p_batch_size
  FOR UPDATE SKIP LOCKED; -- Prevent race conditions in distributed execution
END;
$$;

-- Function to create campaign version snapshot
CREATE OR REPLACE FUNCTION create_campaign_version_snapshot(
  p_campaign_id UUID,
  p_change_description TEXT DEFAULT NULL,
  p_change_type TEXT DEFAULT 'draft'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_version INTEGER;
  v_version_id UUID;
  v_campaign_snapshot JSONB;
  v_steps_snapshot JSONB;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version), 0) + 1
  INTO v_version
  FROM campaign_versions
  WHERE campaign_id = p_campaign_id;

  -- Create campaign snapshot
  SELECT row_to_json(dc.*)::JSONB
  INTO v_campaign_snapshot
  FROM drip_campaigns dc
  WHERE dc.id = p_campaign_id;

  -- Create steps snapshot
  SELECT COALESCE(json_agg(row_to_json(cs.*))::JSONB, '[]'::JSONB)
  INTO v_steps_snapshot
  FROM campaign_steps cs
  WHERE cs.campaign_id = p_campaign_id;

  -- Insert version record
  INSERT INTO campaign_versions (
    campaign_id,
    version,
    campaign_snapshot,
    steps_snapshot,
    canvas_snapshot,
    change_description,
    change_type,
    created_by
  )
  VALUES (
    p_campaign_id,
    v_version,
    v_campaign_snapshot,
    v_steps_snapshot,
    v_campaign_snapshot->'canvas_data',
    p_change_description,
    p_change_type,
    auth.uid()
  )
  RETURNING id INTO v_version_id;

  -- Update campaign version number
  UPDATE drip_campaigns
  SET version = v_version
  WHERE id = p_campaign_id;

  RETURN v_version_id;
END;
$$;

-- ============================================================================
-- 9. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamps
CREATE TRIGGER update_workflow_states_updated_at BEFORE UPDATE ON campaign_workflow_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_test_results_updated_at BEFORE UPDATE ON campaign_ab_test_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create workflow state on enrollment
CREATE OR REPLACE FUNCTION create_workflow_state_on_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_first_step campaign_steps%ROWTYPE;
BEGIN
  -- Get first step of campaign
  SELECT * INTO v_first_step
  FROM campaign_steps
  WHERE campaign_id = NEW.campaign_id
  ORDER BY step_number ASC
  LIMIT 1;

  -- Create workflow state
  INSERT INTO campaign_workflow_states (
    enrollment_id,
    campaign_id,
    contact_id,
    current_node_id,
    current_step_id,
    workflow_status,
    next_execution_at
  )
  VALUES (
    NEW.id,
    NEW.campaign_id,
    NEW.contact_id,
    v_first_step.node_id,
    v_first_step.id,
    'running',
    NOW()
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_workflow_state
  AFTER INSERT ON campaign_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION create_workflow_state_on_enrollment();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE drip_campaigns IS 'Enhanced campaign system with visual builder and A/B testing support';
COMMENT ON TABLE campaign_workflow_states IS 'Real-time workflow execution state for each contact enrollment';
COMMENT ON TABLE campaign_ab_test_results IS 'A/B test metrics and statistical analysis';
COMMENT ON TABLE campaign_events IS 'Comprehensive event log for all campaign interactions';
COMMENT ON TABLE campaign_versions IS 'Version history for campaigns with rollback support';
