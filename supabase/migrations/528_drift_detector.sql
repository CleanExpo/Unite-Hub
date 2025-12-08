-- Phase E39: Autonomous Drift Detector
-- Migration: 528
-- Purpose: Detect configuration, behavioral, and schema drift
-- Tables: drift_events, drift_baselines
-- Functions: record_drift_event, get_drift_summary
-- RLS: Tenant-scoped

-- =====================================================
-- 1. ENUMS (Idempotent)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE drift_type AS ENUM (
    'configuration',
    'behavioral',
    'schema',
    'performance',
    'security',
    'compliance',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE drift_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE drift_status AS ENUM ('detected', 'acknowledged', 'resolved', 'ignored');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TABLES (Idempotent - drop if exists)
-- =====================================================

DROP TABLE IF EXISTS drift_baselines CASCADE;
DROP TABLE IF EXISTS drift_events CASCADE;

-- Drift Events
CREATE TABLE drift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drift_type drift_type NOT NULL,
  severity drift_severity NOT NULL,
  status drift_status NOT NULL DEFAULT 'detected',
  title TEXT NOT NULL,
  description TEXT,
  expected_value TEXT,
  actual_value TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drift_events_tenant ON drift_events(tenant_id);
CREATE INDEX idx_drift_events_type_status ON drift_events(tenant_id, drift_type, status);
CREATE INDEX idx_drift_events_severity ON drift_events(severity, detected_at DESC);

-- Drift Baselines (expected state snapshots)
CREATE TABLE drift_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  baseline_type TEXT NOT NULL,
  baseline_value JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drift_baselines_tenant ON drift_baselines(tenant_id);
CREATE INDEX idx_drift_baselines_type ON drift_baselines(tenant_id, baseline_type, is_active);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE drift_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE drift_baselines ENABLE ROW LEVEL SECURITY;

-- Drift Events: Tenant-scoped
DROP POLICY IF EXISTS drift_events_tenant_isolation ON drift_events;
CREATE POLICY drift_events_tenant_isolation ON drift_events
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Drift Baselines: Tenant-scoped
DROP POLICY IF EXISTS drift_baselines_tenant_isolation ON drift_baselines;
CREATE POLICY drift_baselines_tenant_isolation ON drift_baselines
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================
-- 4. TRIGGERS (updated_at)
-- =====================================================

DROP TRIGGER IF EXISTS set_updated_at_drift_events ON drift_events;
CREATE TRIGGER set_updated_at_drift_events BEFORE UPDATE ON drift_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_drift_baselines ON drift_baselines;
CREATE TRIGGER set_updated_at_drift_baselines BEFORE UPDATE ON drift_baselines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- Record drift event
DO $$
BEGIN
  DROP FUNCTION IF EXISTS record_drift_event CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_drift_event(
  p_tenant_id UUID,
  p_drift_type drift_type,
  p_severity drift_severity,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_expected_value TEXT DEFAULT NULL,
  p_actual_value TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO drift_events (
    tenant_id, drift_type, severity, title, description,
    expected_value, actual_value, metadata
  )
  VALUES (
    p_tenant_id, p_drift_type, p_severity, p_title, p_description,
    p_expected_value, p_actual_value, p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update drift status
DO $$
BEGIN
  DROP FUNCTION IF EXISTS update_drift_status CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION update_drift_status(
  p_event_id UUID,
  p_status drift_status
)
RETURNS VOID AS $$
BEGIN
  UPDATE drift_events
  SET
    status = p_status,
    acknowledged_at = CASE WHEN p_status = 'acknowledged' AND acknowledged_at IS NULL THEN now() ELSE acknowledged_at END,
    resolved_at = CASE WHEN p_status = 'resolved' THEN now() ELSE resolved_at END
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get drift summary
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_drift_summary CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_drift_summary(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'detected', COUNT(*) FILTER (WHERE de.status = 'detected'),
    'acknowledged', COUNT(*) FILTER (WHERE de.status = 'acknowledged'),
    'resolved', COUNT(*) FILTER (WHERE de.status = 'resolved'),
    'critical', COUNT(*) FILTER (WHERE de.severity = 'critical'),
    'high', COUNT(*) FILTER (WHERE de.severity = 'high'),
    'configuration_drift', COUNT(*) FILTER (WHERE de.drift_type = 'configuration'),
    'behavioral_drift', COUNT(*) FILTER (WHERE de.drift_type = 'behavioral'),
    'schema_drift', COUNT(*) FILTER (WHERE de.drift_type = 'schema')
  ) INTO v_result
  FROM drift_events de
  WHERE de.tenant_id = p_tenant_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List drift events
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_drift_events CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_drift_events(
  p_tenant_id UUID,
  p_drift_type drift_type DEFAULT NULL,
  p_status drift_status DEFAULT NULL,
  p_severity drift_severity DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  drift_type drift_type,
  severity drift_severity,
  status drift_status,
  title TEXT,
  description TEXT,
  expected_value TEXT,
  actual_value TEXT,
  detected_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.drift_type,
    de.severity,
    de.status,
    de.title,
    de.description,
    de.expected_value,
    de.actual_value,
    de.detected_at,
    de.resolved_at
  FROM drift_events de
  WHERE de.tenant_id = p_tenant_id
    AND (p_drift_type IS NULL OR de.drift_type = p_drift_type)
    AND (p_status IS NULL OR de.status = p_status)
    AND (p_severity IS NULL OR de.severity = p_severity)
  ORDER BY de.detected_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE drift_events IS 'E39: Detected drift in configuration, behavior, or schema';
COMMENT ON TABLE drift_baselines IS 'E39: Expected state baselines for drift detection';

-- Migration complete
