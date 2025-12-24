-- Phase F16: Autonomous Founder Stability Guard (AFSG)
-- Migration: 554
-- Anomaly detection, alerting, and autonomous interventions

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Alert type classification
DO $$ BEGIN
  CREATE TYPE stability_alert_type AS ENUM (
    'decline',          -- Score declining rapidly
    'burnout_risk',     -- High burnout indicators
    'overload',         -- Sustained high cognitive load
    'conflict',         -- Conflicting signals across systems
    'instability',      -- High volatility in metrics
    'pattern_break',    -- Deviation from established patterns
    'recovery_failure', -- Recovery protocols not effective
    'forecast_alarm'    -- Critical forecast prediction
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Alert severity
DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM (
    'info',      -- Informational, no action needed
    'warning',   -- Monitor closely
    'critical'   -- Immediate intervention required
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Alert status
DO $$ BEGIN
  CREATE TYPE alert_status AS ENUM (
    'active',       -- Currently active
    'acknowledged', -- Seen by user
    'resolved',     -- Issue resolved
    'dismissed'     -- User dismissed alert
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Main stability alerts table
DROP TABLE IF EXISTS founder_stability_alerts CASCADE;
CREATE TABLE founder_stability_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type stability_alert_type NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'warning',
  status alert_status NOT NULL DEFAULT 'active',

  -- Alert details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity_score NUMERIC CHECK (severity_score >= 0 AND severity_score <= 100) NOT NULL,

  -- Detection details
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  detection_method TEXT, -- 'threshold', 'anomaly', 'pattern', 'forecast'
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Triggering data
  trigger_source TEXT, -- 'F09', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15'
  trigger_data JSONB DEFAULT '{}'::jsonb,

  -- Recommended interventions
  recommended_interventions TEXT[],
  urgency_level TEXT, -- 'low', 'moderate', 'high', 'critical'

  -- Auto-intervention
  auto_intervention_enabled BOOLEAN DEFAULT false,
  auto_intervention_taken TEXT,
  auto_intervention_result JSONB,

  -- Resolution tracking
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  time_to_resolve_hours NUMERIC,

  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Alert history for pattern analysis
DROP TABLE IF EXISTS founder_stability_alert_history CASCADE;
CREATE TABLE founder_stability_alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES founder_stability_alerts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'acknowledged', 'escalated', 'resolved', 'dismissed'
  event_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_alerts_tenant;
CREATE INDEX idx_alerts_tenant
  ON founder_stability_alerts (tenant_id, detected_at DESC);

DROP INDEX IF EXISTS idx_alerts_status;
CREATE INDEX idx_alerts_status
  ON founder_stability_alerts (tenant_id, status);

DROP INDEX IF EXISTS idx_alerts_severity;
CREATE INDEX idx_alerts_severity
  ON founder_stability_alerts (tenant_id, severity, detected_at DESC);

DROP INDEX IF EXISTS idx_alerts_type;
CREATE INDEX idx_alerts_type
  ON founder_stability_alerts (tenant_id, alert_type);

DROP INDEX IF EXISTS idx_alert_history_alert;
CREATE INDEX idx_alert_history_alert
  ON founder_stability_alert_history (alert_id, created_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE founder_stability_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_stability_alert_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS founder_stability_alerts_tenant_isolation ON founder_stability_alerts;
CREATE POLICY founder_stability_alerts_tenant_isolation ON founder_stability_alerts
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS founder_stability_alert_history_tenant_isolation ON founder_stability_alert_history;
CREATE POLICY founder_stability_alert_history_tenant_isolation ON founder_stability_alert_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM founder_stability_alerts
      WHERE id = alert_id AND tenant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM founder_stability_alerts
      WHERE id = alert_id AND tenant_id = auth.uid()
    )
  );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- 1. Detect stability anomalies
DROP FUNCTION IF EXISTS detect_stability_anomalies CASCADE;
CREATE OR REPLACE FUNCTION detect_stability_anomalies(
  p_tenant_id UUID
)
RETURNS TABLE (
  alert_type stability_alert_type,
  severity alert_severity,
  title TEXT,
  description TEXT,
  severity_score NUMERIC,
  detection_method TEXT,
  confidence_score NUMERIC,
  trigger_source TEXT,
  trigger_data JSONB,
  recommended_interventions TEXT[],
  urgency_level TEXT
) AS $$
DECLARE
  v_current_health NUMERIC;
  v_health_trend TEXT;
  v_forecast_category TEXT;
  v_cognitive_load NUMERIC;
  v_energy_avg NUMERIC;
  v_recovery_state TEXT;
  v_volatility NUMERIC;
  v_decline_days INTEGER;
  v_alerts JSONB DEFAULT '[]'::jsonb;
BEGIN
  -- Get current health metrics
  SELECT health_score, consecutive_decline_days
  INTO v_current_health, v_decline_days
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get health trend
  SELECT score_trend
  INTO v_health_trend
  FROM get_health_summary(p_tenant_id, 7);

  -- Get forecast
  SELECT forecast_category
  INTO v_forecast_category
  FROM founder_trend_forecast
  WHERE tenant_id = p_tenant_id AND forecast_window = '7d'
  ORDER BY forecast_generated_at DESC
  LIMIT 1;

  -- Get cognitive load
  SELECT current_avg_load
  INTO v_cognitive_load
  FROM get_current_cognitive_load(p_tenant_id, 60);

  -- Get energy average
  SELECT avg_energy
  INTO v_energy_avg
  FROM get_energy_summary(p_tenant_id, 7);

  -- Get recovery state
  SELECT current_state
  INTO v_recovery_state
  FROM get_recovery_summary(p_tenant_id, 7);

  -- Get volatility
  SELECT avg_volatility
  INTO v_volatility
  FROM get_health_summary(p_tenant_id, 7);

  -- ALERT 1: Critical health decline
  IF v_current_health IS NOT NULL AND v_current_health < 40 THEN
    RETURN QUERY SELECT
      'decline'::stability_alert_type,
      'critical'::alert_severity,
      'Critical Health Decline Detected'::TEXT,
      format('Health score has dropped to %s, indicating critical state requiring immediate attention', v_current_health::INTEGER),
      100.0::NUMERIC,
      'threshold'::TEXT,
      95.0::NUMERIC,
      'F14'::TEXT,
      jsonb_build_object('health_score', v_current_health, 'threshold', 40),
      ARRAY['Stop all non-essential work', 'Initiate emergency recovery protocols', 'Seek professional support'],
      'critical'::TEXT;
  END IF;

  -- ALERT 2: Sustained decline trend
  IF v_decline_days >= 5 THEN
    RETURN QUERY SELECT
      'decline'::stability_alert_type,
      'critical'::alert_severity,
      'Sustained Decline Trend'::TEXT,
      format('Health score declining for %s consecutive days', v_decline_days),
      LEAST(100, v_decline_days * 15)::NUMERIC,
      'pattern'::TEXT,
      90.0::NUMERIC,
      'F14'::TEXT,
      jsonb_build_object('consecutive_decline_days', v_decline_days),
      ARRAY['Investigate root causes', 'Implement corrective actions', 'Increase monitoring frequency'],
      'high'::TEXT;
  END IF;

  -- ALERT 3: Burnout risk (high load + low energy + low recovery)
  IF v_cognitive_load > 80 AND v_energy_avg < 40 AND v_recovery_state IN ('overload', 'fatigued') THEN
    RETURN QUERY SELECT
      'burnout_risk'::stability_alert_type,
      'critical'::alert_severity,
      'High Burnout Risk Detected'::TEXT,
      format('Cognitive load at %s%%, energy at %s%%, recovery state: %s',
        v_cognitive_load::INTEGER, v_energy_avg::INTEGER, v_recovery_state),
      90.0::NUMERIC,
      'pattern'::TEXT,
      95.0::NUMERIC,
      'F09,F10,F12'::TEXT,
      jsonb_build_object(
        'cognitive_load', v_cognitive_load,
        'energy', v_energy_avg,
        'recovery_state', v_recovery_state
      ),
      ARRAY['Take immediate break', 'Reduce workload 50%', 'Implement daily recovery routines'],
      'critical'::TEXT;
  END IF;

  -- ALERT 4: High volatility (instability)
  IF v_volatility > 25 THEN
    RETURN QUERY SELECT
      'instability'::stability_alert_type,
      'warning'::alert_severity,
      'High Score Volatility Detected'::TEXT,
      format('Health score volatility at %s, indicating unstable conditions', v_volatility::INTEGER),
      LEAST(100, v_volatility * 3)::NUMERIC,
      'anomaly'::TEXT,
      85.0::NUMERIC,
      'F14'::TEXT,
      jsonb_build_object('volatility', v_volatility, 'threshold', 25),
      ARRAY['Establish consistent routines', 'Reduce unpredictable stressors', 'Monitor daily'],
      'moderate'::TEXT;
  END IF;

  -- ALERT 5: Critical forecast prediction
  IF v_forecast_category = 'critical' THEN
    RETURN QUERY SELECT
      'forecast_alarm'::stability_alert_type,
      'critical'::alert_severity,
      'Critical Forecast Prediction'::TEXT,
      'Trend analysis predicts critical health decline in near future',
      95.0::NUMERIC,
      'forecast'::TEXT,
      80.0::NUMERIC,
      'F15'::TEXT,
      jsonb_build_object('forecast_category', v_forecast_category),
      ARRAY['Preventive action required now', 'Review and adjust current workload', 'Implement proactive recovery'],
      'critical'::TEXT;
  END IF;

  -- ALERT 6: Overload (sustained high cognitive load)
  IF v_cognitive_load > 85 THEN
    RETURN QUERY SELECT
      'overload'::stability_alert_type,
      'warning'::alert_severity,
      'Cognitive Overload Detected'::TEXT,
      format('Cognitive load at %s%%, exceeding sustainable threshold', v_cognitive_load::INTEGER),
      v_cognitive_load::NUMERIC,
      'threshold'::TEXT,
      90.0::NUMERIC,
      'F09'::TEXT,
      jsonb_build_object('cognitive_load', v_cognitive_load, 'threshold', 85),
      ARRAY['Reduce task count', 'Delegate where possible', 'Block recovery time'],
      'high'::TEXT;
  END IF;

  -- ALERT 7: Recovery failure (recovery state not improving)
  WITH recovery_history AS (
    SELECT current_state, created_at
    FROM founder_recovery_state
    WHERE tenant_id = p_tenant_id
      AND created_at >= now() - INTERVAL '5 days'
    ORDER BY created_at DESC
    LIMIT 5
  )
  SELECT 1 FROM recovery_history
  WHERE current_state IN ('overload', 'fatigued', 'critical')
  GROUP BY 1
  HAVING COUNT(*) >= 5
  LIMIT 1
  INTO v_recovery_state;

  IF v_recovery_state IS NOT NULL THEN
    RETURN QUERY SELECT
      'recovery_failure'::stability_alert_type,
      'critical'::alert_severity,
      'Recovery Protocols Failing'::TEXT,
      'Recovery state not improving despite protocols - immediate escalation needed',
      90.0::NUMERIC,
      'pattern'::TEXT,
      85.0::NUMERIC,
      'F12'::TEXT,
      jsonb_build_object('days_without_improvement', 5),
      ARRAY['Escalate to professional support', 'Review and revise recovery protocols', 'Consider medical consultation'],
      'critical'::TEXT;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Record stability alert
DROP FUNCTION IF EXISTS record_stability_alert CASCADE;
CREATE OR REPLACE FUNCTION record_stability_alert(
  p_tenant_id UUID,
  p_alert_type stability_alert_type,
  p_severity alert_severity,
  p_title TEXT,
  p_description TEXT,
  p_severity_score NUMERIC,
  p_detection_method TEXT DEFAULT NULL,
  p_confidence_score NUMERIC DEFAULT NULL,
  p_trigger_source TEXT DEFAULT NULL,
  p_trigger_data JSONB DEFAULT '{}'::jsonb,
  p_recommended_interventions TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_urgency_level TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Insert alert
  INSERT INTO founder_stability_alerts (
    tenant_id,
    alert_type,
    severity,
    title,
    description,
    severity_score,
    detection_method,
    confidence_score,
    trigger_source,
    trigger_data,
    recommended_interventions,
    urgency_level
  ) VALUES (
    p_tenant_id,
    p_alert_type,
    p_severity,
    p_title,
    p_description,
    p_severity_score,
    p_detection_method,
    p_confidence_score,
    p_trigger_source,
    p_trigger_data,
    p_recommended_interventions,
    p_urgency_level
  )
  RETURNING id INTO v_id;

  -- Record history event
  INSERT INTO founder_stability_alert_history (alert_id, event_type, event_data)
  VALUES (v_id, 'created', jsonb_build_object('created_at', now()));

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. List stability alerts
DROP FUNCTION IF EXISTS list_stability_alerts CASCADE;
CREATE OR REPLACE FUNCTION list_stability_alerts(
  p_tenant_id UUID,
  p_status alert_status DEFAULT NULL,
  p_severity alert_severity DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  alert_type stability_alert_type,
  severity alert_severity,
  status alert_status,
  title TEXT,
  description TEXT,
  severity_score NUMERIC,
  detection_method TEXT,
  confidence_score NUMERIC,
  trigger_source TEXT,
  recommended_interventions TEXT[],
  urgency_level TEXT,
  detected_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  time_to_resolve_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.alert_type,
    sa.severity,
    sa.status,
    sa.title,
    sa.description,
    sa.severity_score,
    sa.detection_method,
    sa.confidence_score,
    sa.trigger_source,
    sa.recommended_interventions,
    sa.urgency_level,
    sa.detected_at,
    sa.resolved_at,
    sa.time_to_resolve_hours
  FROM founder_stability_alerts sa
  WHERE sa.tenant_id = p_tenant_id
    AND (p_status IS NULL OR sa.status = p_status)
    AND (p_severity IS NULL OR sa.severity = p_severity)
  ORDER BY sa.detected_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get alert summary
DROP FUNCTION IF EXISTS get_alert_summary CASCADE;
CREATE OR REPLACE FUNCTION get_alert_summary(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_alerts INTEGER,
  active_alerts INTEGER,
  critical_alerts INTEGER,
  by_type JSONB,
  by_severity JSONB,
  avg_resolution_hours NUMERIC,
  unresolved_critical_count INTEGER
) AS $$
DECLARE
  v_total INTEGER;
  v_active INTEGER;
  v_critical INTEGER;
  v_by_type JSONB;
  v_by_severity JSONB;
  v_avg_resolution NUMERIC;
  v_unresolved_critical INTEGER;
BEGIN
  -- Total alerts
  SELECT COUNT(*)
  INTO v_total
  FROM founder_stability_alerts
  WHERE tenant_id = p_tenant_id
    AND detected_at >= now() - (p_days || ' days')::INTERVAL;

  -- Active alerts
  SELECT COUNT(*)
  INTO v_active
  FROM founder_stability_alerts
  WHERE tenant_id = p_tenant_id AND status = 'active';

  -- Critical alerts (all time)
  SELECT COUNT(*)
  INTO v_critical
  FROM founder_stability_alerts
  WHERE tenant_id = p_tenant_id
    AND severity = 'critical'
    AND detected_at >= now() - (p_days || ' days')::INTERVAL;

  -- By type
  SELECT jsonb_object_agg(alert_type::TEXT, count)
  INTO v_by_type
  FROM (
    SELECT alert_type, COUNT(*)::INTEGER as count
    FROM founder_stability_alerts
    WHERE tenant_id = p_tenant_id
      AND detected_at >= now() - (p_days || ' days')::INTERVAL
    GROUP BY alert_type
  ) counts;

  -- By severity
  SELECT jsonb_object_agg(severity::TEXT, count)
  INTO v_by_severity
  FROM (
    SELECT severity, COUNT(*)::INTEGER as count
    FROM founder_stability_alerts
    WHERE tenant_id = p_tenant_id
      AND detected_at >= now() - (p_days || ' days')::INTERVAL
    GROUP BY severity
  ) counts;

  -- Avg resolution time
  SELECT AVG(time_to_resolve_hours)
  INTO v_avg_resolution
  FROM founder_stability_alerts
  WHERE tenant_id = p_tenant_id
    AND status = 'resolved'
    AND detected_at >= now() - (p_days || ' days')::INTERVAL;

  -- Unresolved critical
  SELECT COUNT(*)
  INTO v_unresolved_critical
  FROM founder_stability_alerts
  WHERE tenant_id = p_tenant_id
    AND severity = 'critical'
    AND status IN ('active', 'acknowledged');

  RETURN QUERY SELECT
    v_total,
    v_active,
    v_critical,
    v_by_type,
    v_by_severity,
    v_avg_resolution,
    v_unresolved_critical;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update alert status
DROP FUNCTION IF EXISTS update_alert_status CASCADE;
CREATE OR REPLACE FUNCTION update_alert_status(
  p_alert_id UUID,
  p_new_status alert_status,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_detected_at TIMESTAMPTZ;
  v_time_to_resolve NUMERIC;
BEGIN
  -- Get detected time
  SELECT detected_at INTO v_detected_at
  FROM founder_stability_alerts
  WHERE id = p_alert_id;

  -- Calculate resolution time if resolving
  IF p_new_status = 'resolved' THEN
    v_time_to_resolve := EXTRACT(EPOCH FROM (now() - v_detected_at)) / 3600;
  END IF;

  -- Update alert
  UPDATE founder_stability_alerts
  SET
    status = p_new_status,
    resolved_at = CASE WHEN p_new_status = 'resolved' THEN now() ELSE NULL END,
    resolution_notes = p_resolution_notes,
    time_to_resolve_hours = v_time_to_resolve,
    updated_at = now()
  WHERE id = p_alert_id;

  -- Record history
  INSERT INTO founder_stability_alert_history (alert_id, event_type, event_data)
  VALUES (
    p_alert_id,
    p_new_status::TEXT,
    jsonb_build_object('timestamp', now(), 'notes', p_resolution_notes)
  );

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE founder_stability_alerts IS 'F16: Autonomous Founder Stability Guard - anomaly detection and alerting';
COMMENT ON FUNCTION detect_stability_anomalies IS 'F16: Detect stability anomalies across F09-F15 data';
COMMENT ON FUNCTION record_stability_alert IS 'F16: Record new stability alert';
COMMENT ON FUNCTION list_stability_alerts IS 'F16: List stability alerts with filters';
COMMENT ON FUNCTION get_alert_summary IS 'F16: Get aggregated alert summary';
COMMENT ON FUNCTION update_alert_status IS 'F16: Update alert status (acknowledge/resolve/dismiss)';
