/**
 * Migration 228: Global Predictive Safety & Early-Warning System
 *
 * Enables predictive safety forecasting, early-warning detection, and real-time
 * intervention to prevent dangerous system states and cascade failures.
 *
 * Tables:
 * - safety_events: Real-time safety events with intervention actions
 * - safety_predictions: Forecast unsafe states and required actions
 * - safety_ledger: Auditable log of all safety actions and outcomes
 *
 * Functions:
 * - create_safety_event(): Record safety event occurrence
 * - record_safety_prediction(): Log predicted unsafe state
 * - update_safety_status(): Update event resolution status
 * - archive_safety_action(): Record intervention in ledger
 */

-- ============================================================================
-- SAFETY_EVENTS - Real-time safety event tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS safety_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'cascade_risk', 'agent_deadlock', 'memory_corruption', 'uncertainty_spike',
    'orchestration_collapse', 'autonomy_overdrive', 'feedback_loop',
    'resource_exhaustion', 'contradiction_cluster', 'unknown_anomaly'
  )),

  -- Severity and risk levels
  severity INT NOT NULL CHECK (severity >= 1 AND severity <= 5),
  risk_level INT NOT NULL DEFAULT 50 CHECK (risk_level >= 0 AND risk_level <= 100),

  -- Event source and details
  source TEXT NOT NULL, -- Agent, module, or system component that triggered event
  details JSONB DEFAULT '{}'::JSONB,

  -- Detection and timing
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Intervention response
  intervention TEXT, -- 'block', 'throttle', 'pause', 'halt', 'require_approval', 'none'
  intervention_executed BOOLEAN DEFAULT FALSE,
  intervention_at TIMESTAMP WITH TIME ZONE,

  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safety_events_workspace ON safety_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_severity ON safety_events(severity DESC);
CREATE INDEX IF NOT EXISTS idx_safety_events_risk_level ON safety_events(risk_level DESC);
CREATE INDEX IF NOT EXISTS idx_safety_events_type ON safety_events(event_type);
CREATE INDEX IF NOT EXISTS idx_safety_events_resolved ON safety_events(resolved);
CREATE INDEX IF NOT EXISTS idx_safety_events_detected_at ON safety_events(detected_at DESC);

-- ============================================================================
-- SAFETY_PREDICTIONS - Forecast unsafe states
-- ============================================================================

CREATE TABLE IF NOT EXISTS safety_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Prediction details
  prediction_type TEXT NOT NULL CHECK (prediction_type IN (
    'cascade_failure', 'agent_failure', 'memory_corruption', 'deadlock',
    'orchestration_collapse', 'autonomy_overreach', 'uncertainty_accumulation',
    'resource_constraint', 'unknown'
  )),

  -- Probability and confidence
  probability INT NOT NULL CHECK (probability >= 0 AND probability <= 100),
  confidence INT NOT NULL CHECK (confidence >= 0 AND confidence <= 100),

  -- Forecast details
  time_window_minutes INT NOT NULL DEFAULT 30,
  affected_agents TEXT[] DEFAULT '{}',
  affected_systems TEXT[] DEFAULT '{}',

  -- Risk factors
  contributing_factors JSONB DEFAULT '{}'::JSONB,
  primary_risk_factor TEXT,
  secondary_risk_factors TEXT[] DEFAULT '{}',

  -- Recommended action
  recommended_action TEXT NOT NULL, -- 'block', 'throttle', 'pause', 'halt', 'validate', 'monitor'
  action_priority TEXT DEFAULT 'medium' CHECK (action_priority IN ('low', 'medium', 'high', 'critical')),

  -- Forecast lifecycle
  predicted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  materialized BOOLEAN DEFAULT FALSE, -- Did the prediction come true?
  materialized_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safety_predictions_workspace ON safety_predictions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_safety_predictions_probability ON safety_predictions(probability DESC);
CREATE INDEX IF NOT EXISTS idx_safety_predictions_confidence ON safety_predictions(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_safety_predictions_type ON safety_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_safety_predictions_expires ON safety_predictions(expires_at);
CREATE INDEX IF NOT EXISTS idx_safety_predictions_materialized ON safety_predictions(materialized);

-- ============================================================================
-- SAFETY_LEDGER - Auditable action log
-- ============================================================================

CREATE TABLE IF NOT EXISTS safety_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Action details
  action TEXT NOT NULL, -- 'block_agent', 'pause_workflow', 'halt_autonomy', 'require_approval', 'throttle', 'override'
  trigger_event UUID REFERENCES safety_events(id) ON DELETE SET NULL,
  trigger_prediction UUID REFERENCES safety_predictions(id) ON DELETE SET NULL,

  -- Impact measurement
  risk_before INT NOT NULL CHECK (risk_before >= 0 AND risk_before <= 100),
  risk_after INT NOT NULL CHECK (risk_after >= 0 AND risk_after <= 100),
  risk_reduction INT GENERATED ALWAYS AS (risk_before - risk_after) STORED,

  uncertainty_before INT CHECK (uncertainty_before >= 0 AND uncertainty_before <= 100),
  uncertainty_after INT CHECK (uncertainty_after >= 0 AND uncertainty_after <= 100),
  uncertainty_reduction INT GENERATED ALWAYS AS (uncertainty_before - uncertainty_after) STORED,

  -- Action metadata
  affected_agents TEXT[] DEFAULT '{}',
  affected_systems TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Execution and outcome
  executed BOOLEAN DEFAULT TRUE,
  execution_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  outcome TEXT, -- 'success', 'partial', 'failed', 'pending'
  outcome_notes TEXT,

  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_safety_ledger_workspace ON safety_ledger(workspace_id);
CREATE INDEX IF NOT EXISTS idx_safety_ledger_action ON safety_ledger(action);
CREATE INDEX IF NOT EXISTS idx_safety_ledger_timestamp ON safety_ledger(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_safety_ledger_risk_reduction ON safety_ledger(risk_reduction DESC);
CREATE INDEX IF NOT EXISTS idx_safety_ledger_trigger_event ON safety_ledger(trigger_event);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE safety_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_ledger ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to safety_events"
  ON safety_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to safety_predictions"
  ON safety_predictions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role has full access to safety_ledger"
  ON safety_ledger FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Founder has SELECT-scoped access (read-only)
CREATE POLICY "Founder can view safety_events"
  ON safety_events FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Founder can view safety_predictions"
  ON safety_predictions FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Founder can view safety_ledger"
  ON safety_ledger FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_safety_event(
  p_workspace_id UUID,
  p_event_type TEXT,
  p_severity INT,
  p_risk_level INT,
  p_source TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO safety_events (
    workspace_id, event_type, severity, risk_level, source, details
  ) VALUES (
    p_workspace_id, p_event_type, p_severity, p_risk_level, p_source, COALESCE(p_details, '{}'::JSONB)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_safety_prediction(
  p_workspace_id UUID,
  p_prediction_type TEXT,
  p_probability INT,
  p_confidence INT,
  p_affected_agents TEXT[],
  p_recommended_action TEXT,
  p_action_priority TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  v_prediction_id UUID;
BEGIN
  INSERT INTO safety_predictions (
    workspace_id, prediction_type, probability, confidence,
    affected_agents, recommended_action, action_priority,
    expires_at
  ) VALUES (
    p_workspace_id, p_prediction_type, p_probability, p_confidence,
    p_affected_agents, p_recommended_action, p_action_priority,
    now() + INTERVAL '30 minutes'
  )
  RETURNING id INTO v_prediction_id;

  RETURN v_prediction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_safety_event_status(
  p_event_id UUID,
  p_intervention TEXT DEFAULT NULL,
  p_resolved BOOLEAN DEFAULT NULL,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE safety_events
  SET
    intervention = COALESCE(p_intervention, intervention),
    resolved = COALESCE(p_resolved, resolved),
    resolution_notes = COALESCE(p_resolution_notes, resolution_notes),
    updated_at = now()
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION archive_safety_action(
  p_workspace_id UUID,
  p_action TEXT,
  p_trigger_event UUID,
  p_risk_before INT,
  p_risk_after INT,
  p_uncertainty_before INT DEFAULT NULL,
  p_uncertainty_after INT DEFAULT NULL,
  p_affected_agents TEXT[] DEFAULT '{}',
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_ledger_id UUID;
BEGIN
  INSERT INTO safety_ledger (
    workspace_id, action, trigger_event, risk_before, risk_after,
    uncertainty_before, uncertainty_after, affected_agents, metadata
  ) VALUES (
    p_workspace_id, p_action, p_trigger_event, p_risk_before, p_risk_after,
    p_uncertainty_before, p_uncertainty_after, p_affected_agents, COALESCE(p_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_ledger_id;

  RETURN v_ledger_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_safety_status(p_workspace_id UUID)
RETURNS TABLE (
  active_events INT,
  high_risk_events INT,
  pending_predictions INT,
  expired_predictions INT,
  recent_interventions INT,
  avg_risk_reduction NUMERIC,
  status_summary TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM safety_events WHERE workspace_id = p_workspace_id AND NOT resolved)::INT,
    (SELECT COUNT(*) FROM safety_events WHERE workspace_id = p_workspace_id AND NOT resolved AND risk_level >= 70)::INT,
    (SELECT COUNT(*) FROM safety_predictions WHERE workspace_id = p_workspace_id AND NOT materialized AND expires_at > now())::INT,
    (SELECT COUNT(*) FROM safety_predictions WHERE workspace_id = p_workspace_id AND expires_at <= now() AND NOT materialized)::INT,
    (SELECT COUNT(*) FROM safety_ledger WHERE workspace_id = p_workspace_id AND execution_timestamp > now() - INTERVAL '24 hours')::INT,
    (SELECT AVG(risk_reduction) FROM safety_ledger WHERE workspace_id = p_workspace_id)::NUMERIC,
    CASE
      WHEN (SELECT COUNT(*) FROM safety_events WHERE workspace_id = p_workspace_id AND NOT resolved AND risk_level >= 80) > 0 THEN 'CRITICAL'
      WHEN (SELECT COUNT(*) FROM safety_events WHERE workspace_id = p_workspace_id AND NOT resolved AND risk_level >= 70) > 0 THEN 'HIGH_RISK'
      WHEN (SELECT COUNT(*) FROM safety_predictions WHERE workspace_id = p_workspace_id AND probability >= 70) > 0 THEN 'WARN'
      ELSE 'HEALTHY'
    END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_safety_event TO authenticated;
GRANT EXECUTE ON FUNCTION record_safety_prediction TO authenticated;
GRANT EXECUTE ON FUNCTION update_safety_event_status TO authenticated;
GRANT EXECUTE ON FUNCTION archive_safety_action TO authenticated;
GRANT EXECUTE ON FUNCTION get_safety_status TO authenticated;
