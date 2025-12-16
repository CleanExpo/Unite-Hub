-- Phase E38: Founder Observatory v1
-- Migration: 527
-- Purpose: Meta-systems lens across operational signals
-- Tables: founder_observatory_events, observatory_aggregates
-- Functions: record_observatory_event, get_observatory_summary
-- RLS: Tenant-scoped

-- =====================================================
-- 1. ENUMS (Idempotent)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE observatory_event_type AS ENUM (
    'performance_spike',
    'load_spike',
    'friction_detected',
    'decay_signal',
    'anomaly_detected',
    'system_health',
    'user_experience',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE observatory_severity AS ENUM ('info', 'low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TABLES (Idempotent - drop if exists)
-- =====================================================

DROP TABLE IF EXISTS observatory_aggregates CASCADE;
DROP TABLE IF EXISTS founder_observatory_events CASCADE;

-- Observatory Events
CREATE TABLE founder_observatory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type observatory_event_type NOT NULL,
  severity observatory_severity NOT NULL DEFAULT 'info',
  value NUMERIC,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_observatory_events_tenant ON founder_observatory_events(tenant_id);
CREATE INDEX idx_observatory_events_type_date ON founder_observatory_events(tenant_id, event_type, created_at DESC);
CREATE INDEX idx_observatory_events_severity ON founder_observatory_events(severity, created_at DESC);

-- Observatory Aggregates (hourly/daily summaries)
CREATE TABLE observatory_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type observatory_event_type NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  avg_value NUMERIC,
  max_value NUMERIC,
  min_value NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_observatory_aggregates_tenant ON observatory_aggregates(tenant_id);
CREATE INDEX idx_observatory_aggregates_period ON observatory_aggregates(tenant_id, event_type, period_start DESC);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE founder_observatory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE observatory_aggregates ENABLE ROW LEVEL SECURITY;

-- Observatory Events: Tenant-scoped
DROP POLICY IF EXISTS observatory_events_tenant_isolation ON founder_observatory_events;
CREATE POLICY observatory_events_tenant_isolation ON founder_observatory_events
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Observatory Aggregates: Tenant-scoped
DROP POLICY IF EXISTS observatory_aggregates_tenant_isolation ON observatory_aggregates;
CREATE POLICY observatory_aggregates_tenant_isolation ON observatory_aggregates
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================
-- 4. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- Record observatory event
DO $$
BEGIN
  DROP FUNCTION IF EXISTS record_observatory_event CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_observatory_event(
  p_tenant_id UUID,
  p_event_type observatory_event_type,
  p_severity observatory_severity DEFAULT 'info',
  p_value NUMERIC DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO founder_observatory_events (tenant_id, event_type, severity, value, description, metadata)
  VALUES (p_tenant_id, p_event_type, p_severity, p_value, p_description, p_metadata)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get observatory summary
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_observatory_summary CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_observatory_summary(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_start_date TIMESTAMPTZ;
BEGIN
  v_start_date := now() - (p_days || ' days')::interval;

  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'critical_events', COUNT(*) FILTER (WHERE oe.severity = 'critical'),
    'high_events', COUNT(*) FILTER (WHERE oe.severity = 'high'),
    'performance_spikes', COUNT(*) FILTER (WHERE oe.event_type = 'performance_spike'),
    'load_spikes', COUNT(*) FILTER (WHERE oe.event_type = 'load_spike'),
    'friction_detected', COUNT(*) FILTER (WHERE oe.event_type = 'friction_detected'),
    'anomalies', COUNT(*) FILTER (WHERE oe.event_type = 'anomaly_detected'),
    'avg_value', AVG(oe.value) FILTER (WHERE oe.value IS NOT NULL)
  ) INTO v_result
  FROM founder_observatory_events oe
  WHERE oe.tenant_id = p_tenant_id
    AND oe.created_at >= v_start_date;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List observatory events
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_observatory_events CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_observatory_events(
  p_tenant_id UUID,
  p_event_type observatory_event_type DEFAULT NULL,
  p_severity observatory_severity DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  event_type observatory_event_type,
  severity observatory_severity,
  value NUMERIC,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oe.id,
    oe.event_type,
    oe.severity,
    oe.value,
    oe.description,
    oe.metadata,
    oe.created_at
  FROM founder_observatory_events oe
  WHERE oe.tenant_id = p_tenant_id
    AND (p_event_type IS NULL OR oe.event_type = p_event_type)
    AND (p_severity IS NULL OR oe.severity = p_severity)
  ORDER BY oe.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. COMMENTS
-- =====================================================

COMMENT ON TABLE founder_observatory_events IS 'E38: Meta-system operational signals and events';
COMMENT ON TABLE observatory_aggregates IS 'E38: Hourly/daily aggregates of observatory events';

-- Migration complete
