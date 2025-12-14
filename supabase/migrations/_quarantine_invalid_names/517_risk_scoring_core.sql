-- Migration 517: Anomaly Detection & Risk Scoring (Phase E28)
-- Tenant-scoped risk score tracking and anomaly detection

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS risk_events CASCADE;
DROP TABLE IF EXISTS risk_scores CASCADE;

-- Risk score category
DO $$ BEGIN
  CREATE TYPE risk_category AS ENUM (
    'security',
    'compliance',
    'operational',
    'financial',
    'reputation',
    'data_quality',
    'performance',
    'availability',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Risk severity
DO $$ BEGIN
  CREATE TYPE risk_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Risk event type
DO $$ BEGIN
  CREATE TYPE risk_event_type AS ENUM (
    'anomaly_detected',
    'threshold_exceeded',
    'pattern_change',
    'unusual_activity',
    'data_drift',
    'security_threat',
    'compliance_violation',
    'performance_degradation',
    'outage',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Risk scores table (current risk score per category)
CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category risk_category NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100), -- 0 = no risk, 100 = critical risk
  severity risk_severity NOT NULL,
  description TEXT,
  contributing_factors JSONB DEFAULT '[]'::jsonb, -- Array of risk factors
  last_event_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, category)
);

CREATE INDEX idx_risk_scores_tenant ON risk_scores(tenant_id);
CREATE INDEX idx_risk_scores_category ON risk_scores(category);
CREATE INDEX idx_risk_scores_severity ON risk_scores(severity);
CREATE INDEX idx_risk_scores_score ON risk_scores(score DESC);
CREATE INDEX idx_risk_scores_tenant_severity ON risk_scores(tenant_id, severity, score DESC);

-- Risk events table (historical risk events)
CREATE TABLE risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category risk_category NOT NULL,
  event_type risk_event_type NOT NULL,
  severity risk_severity NOT NULL,
  score_impact INTEGER, -- How much this event affected the risk score
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT, -- Source system/module that detected the risk
  source_id TEXT, -- ID of the source entity
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_risk_events_tenant ON risk_events(tenant_id, created_at DESC);
CREATE INDEX idx_risk_events_category ON risk_events(category);
CREATE INDEX idx_risk_events_event_type ON risk_events(event_type);
CREATE INDEX idx_risk_events_severity ON risk_events(severity);
CREATE INDEX idx_risk_events_resolved ON risk_events(resolved);
CREATE INDEX idx_risk_events_tenant_unresolved ON risk_events(tenant_id, resolved, detected_at DESC) WHERE resolved = FALSE;

-- RLS for risk_scores
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY risk_scores_read_own ON risk_scores
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY risk_scores_tenant_manage ON risk_scores
  FOR ALL
  USING (tenant_id = auth.uid());

-- RLS for risk_events
ALTER TABLE risk_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY risk_events_read_own ON risk_events
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY risk_events_insert_own ON risk_events
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY risk_events_update_own ON risk_events
  FOR UPDATE
  USING (tenant_id = auth.uid());

-- Drop existing functions if they exist
DO $$
BEGIN
  DROP FUNCTION IF EXISTS update_risk_score CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS record_risk_event CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS resolve_risk_event CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_risk_overview CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS calculate_severity CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Function: Calculate severity from score
CREATE OR REPLACE FUNCTION calculate_severity(p_score INTEGER)
RETURNS risk_severity AS $$
BEGIN
  IF p_score >= 75 THEN
    RETURN 'critical';
  ELSIF p_score >= 50 THEN
    RETURN 'high';
  ELSIF p_score >= 25 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Update risk score
CREATE OR REPLACE FUNCTION update_risk_score(
  p_tenant_id UUID,
  p_category risk_category,
  p_score INTEGER,
  p_description TEXT DEFAULT NULL,
  p_contributing_factors JSONB DEFAULT '[]'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_score_id UUID;
  v_severity risk_severity;
BEGIN
  -- Validate score range
  IF p_score < 0 OR p_score > 100 THEN
    RAISE EXCEPTION 'Score must be between 0 and 100';
  END IF;

  -- Calculate severity
  v_severity := calculate_severity(p_score);

  -- Upsert risk score
  INSERT INTO risk_scores (
    tenant_id,
    category,
    score,
    severity,
    description,
    contributing_factors,
    last_event_at,
    metadata
  ) VALUES (
    p_tenant_id,
    p_category,
    p_score,
    v_severity,
    p_description,
    p_contributing_factors,
    now(),
    p_metadata
  )
  ON CONFLICT (tenant_id, category)
  DO UPDATE SET
    score = EXCLUDED.score,
    severity = EXCLUDED.severity,
    description = EXCLUDED.description,
    contributing_factors = EXCLUDED.contributing_factors,
    last_event_at = now(),
    metadata = EXCLUDED.metadata,
    updated_at = now()
  RETURNING id INTO v_score_id;

  RETURN v_score_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record risk event
CREATE OR REPLACE FUNCTION record_risk_event(
  p_tenant_id UUID,
  p_category risk_category,
  p_event_type risk_event_type,
  p_severity risk_severity,
  p_title TEXT,
  p_description TEXT,
  p_score_impact INTEGER DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_source_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_current_score INTEGER;
  v_new_score INTEGER;
BEGIN
  -- Record event
  INSERT INTO risk_events (
    tenant_id,
    category,
    event_type,
    severity,
    score_impact,
    title,
    description,
    source,
    source_id,
    metadata
  ) VALUES (
    p_tenant_id,
    p_category,
    p_event_type,
    p_severity,
    p_score_impact,
    p_title,
    p_description,
    p_source,
    p_source_id,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  -- Update risk score if score_impact provided
  IF p_score_impact IS NOT NULL THEN
    -- Get current score
    SELECT score INTO v_current_score
    FROM risk_scores
    WHERE tenant_id = p_tenant_id
      AND category = p_category;

    -- Calculate new score
    v_new_score := COALESCE(v_current_score, 0) + p_score_impact;
    v_new_score := GREATEST(0, LEAST(100, v_new_score)); -- Clamp to 0-100

    -- Update score
    PERFORM update_risk_score(
      p_tenant_id,
      p_category,
      v_new_score,
      p_description
    );
  END IF;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Resolve risk event
CREATE OR REPLACE FUNCTION resolve_risk_event(
  p_event_id UUID,
  p_tenant_id UUID,
  p_resolved_by UUID,
  p_resolution_notes TEXT DEFAULT NULL,
  p_score_reduction INTEGER DEFAULT 0
) RETURNS void AS $$
DECLARE
  v_event RECORD;
  v_current_score INTEGER;
  v_new_score INTEGER;
BEGIN
  -- Get event details
  SELECT * INTO v_event
  FROM risk_events
  WHERE id = p_event_id
    AND tenant_id = p_tenant_id;

  IF v_event IS NULL THEN
    RAISE EXCEPTION 'Risk event not found';
  END IF;

  -- Update event
  UPDATE risk_events
  SET resolved = TRUE,
      resolved_at = now(),
      resolved_by = p_resolved_by,
      resolution_notes = p_resolution_notes
  WHERE id = p_event_id;

  -- Reduce risk score if specified
  IF p_score_reduction > 0 THEN
    SELECT score INTO v_current_score
    FROM risk_scores
    WHERE tenant_id = p_tenant_id
      AND category = v_event.category;

    IF v_current_score IS NOT NULL THEN
      v_new_score := GREATEST(0, v_current_score - p_score_reduction);

      PERFORM update_risk_score(
        p_tenant_id,
        v_event.category,
        v_new_score
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get risk overview
CREATE OR REPLACE FUNCTION get_risk_overview(
  p_tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_total_events INTEGER;
  v_unresolved_events INTEGER;
  v_critical_events INTEGER;
  v_high_events INTEGER;
  v_by_category JSONB;
  v_by_severity JSONB;
  v_avg_score NUMERIC;
  v_max_score INTEGER;
BEGIN
  -- Count events
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE resolved = FALSE),
    COUNT(*) FILTER (WHERE resolved = FALSE AND severity = 'critical'),
    COUNT(*) FILTER (WHERE resolved = FALSE AND severity = 'high')
  INTO v_total_events, v_unresolved_events, v_critical_events, v_high_events
  FROM risk_events
  WHERE tenant_id = p_tenant_id;

  -- Count by category
  SELECT jsonb_object_agg(category, count)
  INTO v_by_category
  FROM (
    SELECT category::TEXT, COUNT(*) as count
    FROM risk_events
    WHERE tenant_id = p_tenant_id
      AND resolved = FALSE
    GROUP BY category
  ) t;

  -- Count by severity
  SELECT jsonb_object_agg(severity, count)
  INTO v_by_severity
  FROM (
    SELECT severity::TEXT, COUNT(*) as count
    FROM risk_events
    WHERE tenant_id = p_tenant_id
      AND resolved = FALSE
    GROUP BY severity
  ) t;

  -- Calculate score metrics
  SELECT
    ROUND(AVG(score), 2),
    MAX(score)
  INTO v_avg_score, v_max_score
  FROM risk_scores
  WHERE tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'total_events', COALESCE(v_total_events, 0),
    'unresolved_events', COALESCE(v_unresolved_events, 0),
    'critical_events', COALESCE(v_critical_events, 0),
    'high_events', COALESCE(v_high_events, 0),
    'by_category', COALESCE(v_by_category, '{}'::jsonb),
    'by_severity', COALESCE(v_by_severity, '{}'::jsonb),
    'avg_score', COALESCE(v_avg_score, 0),
    'max_score', COALESCE(v_max_score, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_severity TO authenticated;
GRANT EXECUTE ON FUNCTION update_risk_score TO authenticated;
GRANT EXECUTE ON FUNCTION record_risk_event TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_risk_event TO authenticated;
GRANT EXECUTE ON FUNCTION get_risk_overview TO authenticated;

-- Trigger to update risk_scores.updated_at
CREATE OR REPLACE FUNCTION update_risk_score_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER risk_score_updated_at
  BEFORE UPDATE ON risk_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_score_timestamp();

-- Function: Cleanup old resolved risk events
CREATE OR REPLACE FUNCTION cleanup_old_risk_events() RETURNS void AS $$
BEGIN
  -- Delete resolved events older than 180 days
  DELETE FROM risk_events
  WHERE resolved = TRUE
    AND resolved_at < now() - interval '180 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE risk_scores IS 'Tenant-scoped risk scores by category. Scores range from 0 (no risk) to 100 (critical risk).';
COMMENT ON TABLE risk_events IS 'Historical risk events with resolution tracking. Used for anomaly detection and risk analysis.';
COMMENT ON FUNCTION cleanup_old_risk_events() IS 'Run periodically via cron to delete resolved risk events >180 days old. Call: SELECT cleanup_old_risk_events();';
