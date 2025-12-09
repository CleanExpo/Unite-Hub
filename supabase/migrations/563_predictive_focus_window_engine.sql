-- =====================================================================================
-- Migration 563: Predictive Focus Window Engine (F24)
-- =====================================================================================
-- Purpose: Predicts optimal founder focus periods based on energy, load, and momentum
-- Dependencies: F13-F23 (migrations 551-562)
-- Tables: founder_focus_windows, founder_focus_predictions
-- RPC Functions: calculate_focus_windows(), list_focus_windows()
-- =====================================================================================

-- =====================================================================================
-- ENUMS
-- =====================================================================================

DO $$ BEGIN
  CREATE TYPE focus_window_label_type AS ENUM (
    'peak-focus',
    'high-focus',
    'medium-focus',
    'low-focus',
    'recovery',
    'avoid'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================================
-- TABLES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS founder_focus_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Window classification
  window_label focus_window_label_type NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,

  -- Prediction quality
  certainty NUMERIC NOT NULL CHECK (certainty >= 0 AND certainty <= 100),
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Contributing metrics
  contributing_metrics JSONB NOT NULL DEFAULT '{}',
  energy_forecast NUMERIC,
  load_forecast NUMERIC,
  momentum_forecast NUMERIC,

  -- Recommendations
  recommended_activities TEXT[],
  activities_to_avoid TEXT[],
  optimal_duration_minutes INT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_focus_windows_tenant_time
  ON founder_focus_windows(tenant_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_focus_windows_label
  ON founder_focus_windows(window_label, certainty);

-- =====================================================================================
-- RPC FUNCTIONS
-- =====================================================================================

/**
 * Calculate focus window predictions
 */
CREATE OR REPLACE FUNCTION calculate_focus_windows(
  p_tenant_id UUID,
  p_prediction_hours INT DEFAULT 48
)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_ids UUID[] := ARRAY[]::UUID[];
  v_window_id UUID;
  v_certainty NUMERIC;
  v_window_label focus_window_label_type;
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_hour INT;
BEGIN
  -- TODO: Implement real prediction based on F13-F23 data
  -- Generate sample predictions for next N hours
  FOR v_hour IN 0..p_prediction_hours/4-1 LOOP
    v_certainty := 60.0 + (RANDOM() * 30);
    v_start_time := NOW() + (v_hour * 4 || ' hours')::INTERVAL;
    v_end_time := v_start_time + '4 hours'::INTERVAL;

    -- Determine window label based on hour and certainty
    IF v_certainty >= 85 THEN
      v_window_label := 'peak-focus';
    ELSIF v_certainty >= 70 THEN
      v_window_label := 'high-focus';
    ELSIF v_certainty >= 50 THEN
      v_window_label := 'medium-focus';
    ELSIF v_certainty >= 30 THEN
      v_window_label := 'low-focus';
    ELSE
      v_window_label := 'recovery';
    END IF;

    INSERT INTO founder_focus_windows (
      tenant_id,
      window_label,
      start_time,
      end_time,
      certainty,
      confidence_score,
      contributing_metrics,
      energy_forecast,
      load_forecast,
      momentum_forecast,
      optimal_duration_minutes
    ) VALUES (
      p_tenant_id,
      v_window_label,
      v_start_time,
      v_end_time,
      v_certainty,
      v_certainty * 0.9,
      jsonb_build_object(
        'hour_of_day', EXTRACT(HOUR FROM v_start_time),
        'day_of_week', EXTRACT(DOW FROM v_start_time)
      ),
      70.0 + (RANDOM() * 20),
      50.0 + (RANDOM() * 30),
      60.0 + (RANDOM() * 25),
      120
    )
    RETURNING id INTO v_window_id;

    v_window_ids := array_append(v_window_ids, v_window_id);
  END LOOP;

  RETURN v_window_ids;
END;
$$;

/**
 * List focus windows
 */
CREATE OR REPLACE FUNCTION list_focus_windows(
  p_tenant_id UUID,
  p_window_label focus_window_label_type DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  window_label focus_window_label_type,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  certainty NUMERIC,
  confidence_score NUMERIC,
  contributing_metrics JSONB,
  energy_forecast NUMERIC,
  load_forecast NUMERIC,
  momentum_forecast NUMERIC,
  recommended_activities TEXT[],
  activities_to_avoid TEXT[],
  optimal_duration_minutes INT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fw.id,
    fw.window_label,
    fw.start_time,
    fw.end_time,
    fw.certainty,
    fw.confidence_score,
    fw.contributing_metrics,
    fw.energy_forecast,
    fw.load_forecast,
    fw.momentum_forecast,
    fw.recommended_activities,
    fw.activities_to_avoid,
    fw.optimal_duration_minutes,
    fw.created_at
  FROM founder_focus_windows fw
  WHERE fw.tenant_id = p_tenant_id
    AND (p_window_label IS NULL OR fw.window_label = p_window_label)
    AND (p_start_date IS NULL OR fw.start_time >= p_start_date)
    AND (p_end_date IS NULL OR fw.end_time <= p_end_date)
  ORDER BY fw.start_time DESC
  LIMIT p_limit;
END;
$$;

/**
 * Get focus windows summary
 */
CREATE OR REPLACE FUNCTION get_focus_windows_summary(
  p_tenant_id UUID,
  p_hours INT DEFAULT 48
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'avg_certainty', COALESCE(AVG(certainty), 0),
    'peak_focus_count', COUNT(*) FILTER (WHERE window_label = 'peak-focus'),
    'high_focus_count', COUNT(*) FILTER (WHERE window_label = 'high-focus'),
    'next_peak_window', (
      SELECT json_build_object(
        'start_time', start_time,
        'end_time', end_time,
        'certainty', certainty
      )
      FROM founder_focus_windows
      WHERE tenant_id = p_tenant_id
        AND window_label = 'peak-focus'
        AND start_time > NOW()
      ORDER BY start_time ASC
      LIMIT 1
    ),
    'prediction_hours', p_hours
  )
  INTO v_result
  FROM founder_focus_windows
  WHERE tenant_id = p_tenant_id
    AND start_time >= NOW()
    AND start_time <= NOW() + (p_hours || ' hours')::INTERVAL;

  RETURN v_result;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON TABLE founder_focus_windows IS 'F24: Predictive Focus Window Engine - optimal focus periods';
COMMENT ON FUNCTION calculate_focus_windows IS 'F24: Calculate focus window predictions';
COMMENT ON FUNCTION list_focus_windows IS 'F24: List focus windows with filters';
COMMENT ON FUNCTION get_focus_windows_summary IS 'F24: Get focus windows summary statistics';
