-- Phase E47: Runtime Integrity Sentinel
-- Migration: 536
-- Description: Monitors runtime behaviors, code paths, and system actions for integrity violations.

-- Drop existing objects (idempotent)
DROP TABLE IF EXISTS runtime_integrity_events CASCADE;

DO $$ BEGIN
  CREATE TYPE integrity_violation_type AS ENUM (
    'unexpected_state',
    'api_violation',
    'latency_spike',
    'permission_mismatch',
    'data_integrity',
    'security_breach',
    'rate_limit_exceeded',
    'resource_leak',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE integrity_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE integrity_status AS ENUM ('detected', 'investigating', 'mitigated', 'resolved', 'false_positive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Runtime Integrity Events
CREATE TABLE runtime_integrity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subsystem TEXT NOT NULL,
  violation_type integrity_violation_type NOT NULL,
  severity integrity_severity NOT NULL DEFAULT 'medium',
  status integrity_status NOT NULL DEFAULT 'detected',
  title TEXT,
  details TEXT,
  stack_trace TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE runtime_integrity_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY runtime_integrity_events_tenant_policy ON runtime_integrity_events
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- Indexes
CREATE INDEX idx_runtime_integrity_events_tenant_created ON runtime_integrity_events (tenant_id, created_at DESC);
CREATE INDEX idx_runtime_integrity_events_subsystem ON runtime_integrity_events (tenant_id, subsystem, created_at DESC);
CREATE INDEX idx_runtime_integrity_events_severity ON runtime_integrity_events (tenant_id, severity, created_at DESC);
CREATE INDEX idx_runtime_integrity_events_status ON runtime_integrity_events (tenant_id, status, created_at DESC);

-- Functions
DROP FUNCTION IF EXISTS record_integrity_event CASCADE;
CREATE OR REPLACE FUNCTION record_integrity_event(
  p_tenant_id UUID,
  p_subsystem TEXT,
  p_violation_type integrity_violation_type,
  p_severity integrity_severity,
  p_title TEXT DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_stack_trace TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO runtime_integrity_events (tenant_id, subsystem, violation_type, severity, title, details, stack_trace, metadata)
  VALUES (p_tenant_id, p_subsystem, p_violation_type, p_severity, p_title, p_details, p_stack_trace, p_metadata)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS update_integrity_event_status CASCADE;
CREATE OR REPLACE FUNCTION update_integrity_event_status(
  p_event_id UUID,
  p_status integrity_status
)
RETURNS VOID AS $$
BEGIN
  UPDATE runtime_integrity_events
  SET
    status = p_status,
    resolved_at = CASE WHEN p_status IN ('resolved', 'false_positive') THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = p_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_integrity_events CASCADE;
CREATE OR REPLACE FUNCTION list_integrity_events(
  p_tenant_id UUID,
  p_subsystem TEXT DEFAULT NULL,
  p_severity integrity_severity DEFAULT NULL,
  p_status integrity_status DEFAULT NULL,
  p_limit INTEGER DEFAULT 300
)
RETURNS SETOF runtime_integrity_events AS $$
BEGIN
  RETURN QUERY
  SELECT rie.*
  FROM runtime_integrity_events rie
  WHERE rie.tenant_id = p_tenant_id
    AND (p_subsystem IS NULL OR rie.subsystem = p_subsystem)
    AND (p_severity IS NULL OR rie.severity = p_severity)
    AND (p_status IS NULL OR rie.status = p_status)
  ORDER BY rie.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_integrity_summary CASCADE;
CREATE OR REPLACE FUNCTION get_integrity_summary(
  p_tenant_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_since TIMESTAMPTZ;
BEGIN
  v_since := now() - (p_hours || ' hours')::interval;

  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'critical_events', COUNT(*) FILTER (WHERE rie.severity = 'critical'),
    'high_events', COUNT(*) FILTER (WHERE rie.severity = 'high'),
    'unresolved_events', COUNT(*) FILTER (WHERE rie.status = 'detected'),
    'investigating_events', COUNT(*) FILTER (WHERE rie.status = 'investigating'),
    'by_subsystem', (
      SELECT jsonb_object_agg(rie_sub.subsystem, rie_sub.count)
      FROM (
        SELECT rie.subsystem, COUNT(*) as count
        FROM runtime_integrity_events rie
        WHERE rie.tenant_id = p_tenant_id
          AND rie.created_at >= v_since
        GROUP BY rie.subsystem
      ) rie_sub
    )
  ) INTO v_result
  FROM runtime_integrity_events rie
  WHERE rie.tenant_id = p_tenant_id
    AND rie.created_at >= v_since;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
