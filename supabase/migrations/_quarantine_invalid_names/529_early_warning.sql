-- Phase E40: Critical Systems Early-Warning Engine
-- Migration: 529
-- Purpose: Early warning signals from system telemetry
-- Tables: early_warning_events, warning_thresholds
-- Functions: record_warning_event, get_warning_summary
-- RLS: Tenant-scoped

-- =====================================================
-- 1. ENUMS (Idempotent)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE warning_signal_type AS ENUM (
    'resource_exhaustion',
    'capacity_threshold',
    'error_rate_spike',
    'latency_degradation',
    'security_anomaly',
    'compliance_breach',
    'data_quality',
    'system_degradation',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE warning_risk_level AS ENUM ('info', 'watch', 'alert', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE warning_status AS ENUM ('active', 'acknowledged', 'mitigated', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TABLES (Idempotent - drop if exists)
-- =====================================================

DROP TABLE IF EXISTS warning_thresholds CASCADE;
DROP TABLE IF EXISTS early_warning_events CASCADE;

-- Early Warning Events
CREATE TABLE early_warning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type warning_signal_type NOT NULL,
  risk_level warning_risk_level NOT NULL,
  status warning_status NOT NULL DEFAULT 'active',
  title TEXT NOT NULL,
  details TEXT,
  threshold_value NUMERIC,
  actual_value NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_early_warning_tenant ON early_warning_events(tenant_id);
CREATE INDEX idx_early_warning_risk ON early_warning_events(tenant_id, risk_level, status);
CREATE INDEX idx_early_warning_detected ON early_warning_events(detected_at DESC);

-- Warning Thresholds (configurable alert thresholds)
CREATE TABLE warning_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type warning_signal_type NOT NULL,
  threshold_value NUMERIC NOT NULL,
  threshold_condition TEXT NOT NULL, -- 'greater_than', 'less_than', 'equals'
  risk_level warning_risk_level NOT NULL DEFAULT 'watch',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_warning_thresholds_tenant ON warning_thresholds(tenant_id);
CREATE INDEX idx_warning_thresholds_signal ON warning_thresholds(tenant_id, signal_type, is_active);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE early_warning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE warning_thresholds ENABLE ROW LEVEL SECURITY;

-- Early Warning Events: Tenant-scoped
DROP POLICY IF EXISTS early_warning_tenant_isolation ON early_warning_events;
CREATE POLICY early_warning_tenant_isolation ON early_warning_events
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Warning Thresholds: Tenant-scoped
DROP POLICY IF EXISTS warning_thresholds_tenant_isolation ON warning_thresholds;
CREATE POLICY warning_thresholds_tenant_isolation ON warning_thresholds
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================
-- 4. TRIGGERS (updated_at)
-- =====================================================

DROP TRIGGER IF EXISTS set_updated_at_early_warning ON early_warning_events;
CREATE TRIGGER set_updated_at_early_warning BEFORE UPDATE ON early_warning_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_warning_thresholds ON warning_thresholds;
CREATE TRIGGER set_updated_at_warning_thresholds BEFORE UPDATE ON warning_thresholds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- Record warning event
DO $$
BEGIN
  DROP FUNCTION IF EXISTS record_warning_event CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_warning_event(
  p_tenant_id UUID,
  p_signal_type warning_signal_type,
  p_risk_level warning_risk_level,
  p_title TEXT,
  p_details TEXT DEFAULT NULL,
  p_threshold_value NUMERIC DEFAULT NULL,
  p_actual_value NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO early_warning_events (
    tenant_id, signal_type, risk_level, title, details,
    threshold_value, actual_value, metadata
  )
  VALUES (
    p_tenant_id, p_signal_type, p_risk_level, p_title, p_details,
    p_threshold_value, p_actual_value, p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update warning status
DO $$
BEGIN
  DROP FUNCTION IF EXISTS update_warning_status CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION update_warning_status(
  p_event_id UUID,
  p_status warning_status
)
RETURNS VOID AS $$
BEGIN
  UPDATE early_warning_events
  SET
    status = p_status,
    acknowledged_at = CASE WHEN p_status = 'acknowledged' AND acknowledged_at IS NULL THEN now() ELSE acknowledged_at END,
    resolved_at = CASE WHEN p_status = 'resolved' THEN now() ELSE resolved_at END
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get warning summary
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_warning_summary CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_warning_summary(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_warnings', COUNT(*),
    'active', COUNT(*) FILTER (WHERE ew.status = 'active'),
    'acknowledged', COUNT(*) FILTER (WHERE ew.status = 'acknowledged'),
    'critical', COUNT(*) FILTER (WHERE ew.risk_level = 'critical' AND ew.status = 'active'),
    'alert', COUNT(*) FILTER (WHERE ew.risk_level = 'alert' AND ew.status = 'active'),
    'watch', COUNT(*) FILTER (WHERE ew.risk_level = 'watch' AND ew.status = 'active'),
    'resource_warnings', COUNT(*) FILTER (WHERE ew.signal_type = 'resource_exhaustion'),
    'security_warnings', COUNT(*) FILTER (WHERE ew.signal_type = 'security_anomaly')
  ) INTO v_result
  FROM early_warning_events ew
  WHERE ew.tenant_id = p_tenant_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List warning events
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_warning_events CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_warning_events(
  p_tenant_id UUID,
  p_signal_type warning_signal_type DEFAULT NULL,
  p_risk_level warning_risk_level DEFAULT NULL,
  p_status warning_status DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  signal_type warning_signal_type,
  risk_level warning_risk_level,
  status warning_status,
  title TEXT,
  details TEXT,
  threshold_value NUMERIC,
  actual_value NUMERIC,
  detected_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ew.id,
    ew.signal_type,
    ew.risk_level,
    ew.status,
    ew.title,
    ew.details,
    ew.threshold_value,
    ew.actual_value,
    ew.detected_at,
    ew.resolved_at
  FROM early_warning_events ew
  WHERE ew.tenant_id = p_tenant_id
    AND (p_signal_type IS NULL OR ew.signal_type = p_signal_type)
    AND (p_risk_level IS NULL OR ew.risk_level = p_risk_level)
    AND (p_status IS NULL OR ew.status = p_status)
  ORDER BY ew.detected_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE early_warning_events IS 'E40: Early warning signals from system telemetry';
COMMENT ON TABLE warning_thresholds IS 'E40: Configurable alert thresholds';

-- Migration complete
