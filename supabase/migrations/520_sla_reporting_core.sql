-- Phase E31: SLA & Uptime Reporting
-- Migration: 520
-- Purpose: Service Level Agreements and uptime tracking
-- Tables: sla_definitions, uptime_checks, sla_incidents, sla_reports
-- Functions: create_sla, record_uptime_check, create_sla_incident, get_sla_summary
-- RLS: All tables tenant-scoped

-- =====================================================
-- 1. ENUMS (Idempotent)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE sla_target_type AS ENUM ('uptime', 'response_time', 'resolution_time', 'availability', 'performance', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE uptime_check_status AS ENUM ('up', 'down', 'degraded', 'maintenance');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sla_incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE sla_incident_status AS ENUM ('open', 'investigating', 'identified', 'monitoring', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TABLES (Idempotent - drop if exists)
-- =====================================================

-- Drop tables if they exist (reverse dependency order)
DROP TABLE IF EXISTS sla_reports CASCADE;
DROP TABLE IF EXISTS sla_incidents CASCADE;
DROP TABLE IF EXISTS uptime_checks CASCADE;
DROP TABLE IF EXISTS sla_definitions CASCADE;

-- SLA Definitions
CREATE TABLE sla_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_type sla_target_type NOT NULL,
  target_value NUMERIC NOT NULL, -- e.g., 99.9 for 99.9% uptime, 500 for 500ms response time
  target_unit TEXT, -- e.g., 'percent', 'ms', 'hours'
  measurement_period_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sla_definitions_tenant ON sla_definitions(tenant_id);
CREATE INDEX idx_sla_definitions_active ON sla_definitions(is_active);
CREATE INDEX idx_sla_definitions_target_type ON sla_definitions(target_type);

-- Uptime Checks
CREATE TABLE uptime_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sla_id UUID REFERENCES sla_definitions(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  status uptime_check_status NOT NULL,
  response_time_ms INTEGER,
  check_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_uptime_checks_tenant ON uptime_checks(tenant_id);
CREATE INDEX idx_uptime_checks_sla ON uptime_checks(sla_id);
CREATE INDEX idx_uptime_checks_service ON uptime_checks(service_name);
CREATE INDEX idx_uptime_checks_status ON uptime_checks(status);
CREATE INDEX idx_uptime_checks_timestamp ON uptime_checks(check_timestamp);

-- SLA Incidents
CREATE TABLE sla_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sla_id UUID NOT NULL REFERENCES sla_definitions(id) ON DELETE CASCADE,
  severity sla_incident_severity NOT NULL,
  status sla_incident_status NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  description TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  impact_description TEXT,
  root_cause TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sla_incidents_tenant ON sla_incidents(tenant_id);
CREATE INDEX idx_sla_incidents_sla ON sla_incidents(sla_id);
CREATE INDEX idx_sla_incidents_status ON sla_incidents(status);
CREATE INDEX idx_sla_incidents_severity ON sla_incidents(severity);
CREATE INDEX idx_sla_incidents_started ON sla_incidents(started_at);

-- SLA Reports (pre-computed monthly/quarterly reports)
CREATE TABLE sla_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sla_id UUID NOT NULL REFERENCES sla_definitions(id) ON DELETE CASCADE,
  report_period_start TIMESTAMPTZ NOT NULL,
  report_period_end TIMESTAMPTZ NOT NULL,
  total_checks INTEGER NOT NULL DEFAULT 0,
  successful_checks INTEGER NOT NULL DEFAULT 0,
  failed_checks INTEGER NOT NULL DEFAULT 0,
  uptime_percent NUMERIC(5,2),
  avg_response_time_ms INTEGER,
  total_downtime_minutes INTEGER DEFAULT 0,
  total_incidents INTEGER DEFAULT 0,
  sla_met BOOLEAN NOT NULL DEFAULT TRUE,
  summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sla_reports_tenant ON sla_reports(tenant_id);
CREATE INDEX idx_sla_reports_sla ON sla_reports(sla_id);
CREATE INDEX idx_sla_reports_period ON sla_reports(report_period_start, report_period_end);
CREATE INDEX idx_sla_reports_met ON sla_reports(sla_met);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE sla_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_reports ENABLE ROW LEVEL SECURITY;

-- SLA Definitions: Tenant-scoped
DROP POLICY IF EXISTS sla_definitions_tenant_isolation ON sla_definitions;
CREATE POLICY sla_definitions_tenant_isolation ON sla_definitions
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Uptime Checks: Tenant-scoped
DROP POLICY IF EXISTS uptime_checks_tenant_isolation ON uptime_checks;
CREATE POLICY uptime_checks_tenant_isolation ON uptime_checks
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- SLA Incidents: Tenant-scoped
DROP POLICY IF EXISTS sla_incidents_tenant_isolation ON sla_incidents;
CREATE POLICY sla_incidents_tenant_isolation ON sla_incidents
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- SLA Reports: Tenant-scoped
DROP POLICY IF EXISTS sla_reports_tenant_isolation ON sla_reports;
CREATE POLICY sla_reports_tenant_isolation ON sla_reports
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================
-- 4. TRIGGERS (updated_at)
-- =====================================================

DROP TRIGGER IF EXISTS set_updated_at_sla_definitions ON sla_definitions;
CREATE TRIGGER set_updated_at_sla_definitions BEFORE UPDATE ON sla_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_sla_incidents ON sla_incidents;
CREATE TRIGGER set_updated_at_sla_incidents BEFORE UPDATE ON sla_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- Create SLA definition
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_sla_definition CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION create_sla_definition(
  p_tenant_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_target_type sla_target_type,
  p_target_value NUMERIC,
  p_target_unit TEXT DEFAULT NULL,
  p_measurement_period_days INTEGER DEFAULT 30,
  p_is_active BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  v_sla_id UUID;
BEGIN
  INSERT INTO sla_definitions (tenant_id, name, description, target_type, target_value, target_unit, measurement_period_days, is_active)
  VALUES (p_tenant_id, p_name, p_description, p_target_type, p_target_value, p_target_unit, p_measurement_period_days, p_is_active)
  RETURNING id INTO v_sla_id;

  RETURN v_sla_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record uptime check
DO $$
BEGIN
  DROP FUNCTION IF EXISTS record_uptime_check CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_uptime_check(
  p_tenant_id UUID,
  p_sla_id UUID,
  p_service_name TEXT,
  p_status uptime_check_status,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_check_id UUID;
BEGIN
  INSERT INTO uptime_checks (tenant_id, sla_id, service_name, status, response_time_ms, metadata)
  VALUES (p_tenant_id, p_sla_id, p_service_name, p_status, p_response_time_ms, p_metadata)
  RETURNING id INTO v_check_id;

  RETURN v_check_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create SLA incident
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_sla_incident CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION create_sla_incident(
  p_tenant_id UUID,
  p_sla_id UUID,
  p_severity sla_incident_severity,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_impact_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_incident_id UUID;
BEGIN
  INSERT INTO sla_incidents (tenant_id, sla_id, severity, status, title, description, impact_description)
  VALUES (p_tenant_id, p_sla_id, p_severity, 'open', p_title, p_description, p_impact_description)
  RETURNING id INTO v_incident_id;

  RETURN v_incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update incident status
DO $$
BEGIN
  DROP FUNCTION IF EXISTS update_sla_incident_status CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION update_sla_incident_status(
  p_incident_id UUID,
  p_status sla_incident_status,
  p_root_cause TEXT DEFAULT NULL,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE sla_incidents
  SET
    status = p_status,
    resolved_at = CASE WHEN p_status = 'resolved' THEN now() ELSE resolved_at END,
    root_cause = COALESCE(p_root_cause, root_cause),
    resolution_notes = COALESCE(p_resolution_notes, resolution_notes)
  WHERE id = p_incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get SLA summary (real-time calculation)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_sla_summary CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_sla_summary(
  p_tenant_id UUID,
  p_sla_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_start_date TIMESTAMPTZ;
BEGIN
  v_start_date := now() - (p_days || ' days')::interval;

  SELECT jsonb_build_object(
    'sla_id', p_sla_id,
    'period_days', p_days,
    'total_checks', COUNT(uc.id),
    'up_checks', COUNT(*) FILTER (WHERE uc.status = 'up'),
    'down_checks', COUNT(*) FILTER (WHERE uc.status = 'down'),
    'degraded_checks', COUNT(*) FILTER (WHERE uc.status = 'degraded'),
    'uptime_percent',
      CASE
        WHEN COUNT(uc.id) > 0 THEN
          ROUND((COUNT(*) FILTER (WHERE uc.status = 'up') * 100.0) / COUNT(uc.id), 2)
        ELSE 0
      END,
    'avg_response_time_ms',
      ROUND(AVG(uc.response_time_ms) FILTER (WHERE uc.response_time_ms IS NOT NULL)),
    'total_incidents', (
      SELECT COUNT(*) FROM sla_incidents si_sub1
      WHERE si_sub1.tenant_id = p_tenant_id AND si_sub1.sla_id = p_sla_id AND si_sub1.started_at >= v_start_date
    ),
    'open_incidents', (
      SELECT COUNT(*) FROM sla_incidents si_sub2
      WHERE si_sub2.tenant_id = p_tenant_id AND si_sub2.sla_id = p_sla_id AND si_sub2.status != 'resolved' AND si_sub2.started_at >= v_start_date
    ),
    'critical_incidents', (
      SELECT COUNT(*) FROM sla_incidents si_sub3
      WHERE si_sub3.tenant_id = p_tenant_id AND si_sub3.sla_id = p_sla_id AND si_sub3.severity = 'critical' AND si_sub3.started_at >= v_start_date
    )
  ) INTO v_result
  FROM uptime_checks uc
  WHERE uc.tenant_id = p_tenant_id
    AND uc.sla_id = p_sla_id
    AND uc.check_timestamp >= v_start_date;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List SLA definitions
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_sla_definitions CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_sla_definitions(
  p_tenant_id UUID,
  p_is_active BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  target_type sla_target_type,
  target_value NUMERIC,
  target_unit TEXT,
  measurement_period_days INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sd.id,
    sd.name,
    sd.description,
    sd.target_type,
    sd.target_value,
    sd.target_unit,
    sd.measurement_period_days,
    sd.is_active,
    sd.created_at,
    sd.updated_at
  FROM sla_definitions sd
  WHERE sd.tenant_id = p_tenant_id
    AND (p_is_active IS NULL OR sd.is_active = p_is_active)
  ORDER BY sd.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List SLA incidents
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_sla_incidents CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_sla_incidents(
  p_tenant_id UUID,
  p_sla_id UUID DEFAULT NULL,
  p_status sla_incident_status DEFAULT NULL,
  p_severity sla_incident_severity DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  sla_id UUID,
  sla_name TEXT,
  severity sla_incident_severity,
  status sla_incident_status,
  title TEXT,
  description TEXT,
  started_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    si.id,
    si.sla_id,
    sd.name AS sla_name,
    si.severity,
    si.status,
    si.title,
    si.description,
    si.started_at,
    si.resolved_at,
    si.created_at
  FROM sla_incidents si
  INNER JOIN sla_definitions sd ON sd.id = si.sla_id
  WHERE si.tenant_id = p_tenant_id
    AND (p_sla_id IS NULL OR si.sla_id = p_sla_id)
    AND (p_status IS NULL OR si.status = p_status)
    AND (p_severity IS NULL OR si.severity = p_severity)
  ORDER BY si.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get uptime overview for tenant
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_uptime_overview CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_uptime_overview(
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
    'period_days', p_days,
    'total_checks', COUNT(uc.id),
    'up_checks', COUNT(*) FILTER (WHERE uc.status = 'up'),
    'down_checks', COUNT(*) FILTER (WHERE uc.status = 'down'),
    'overall_uptime_percent',
      CASE
        WHEN COUNT(uc.id) > 0 THEN
          ROUND((COUNT(*) FILTER (WHERE uc.status = 'up') * 100.0) / COUNT(uc.id), 2)
        ELSE 0
      END,
    'avg_response_time_ms',
      ROUND(AVG(uc.response_time_ms) FILTER (WHERE uc.response_time_ms IS NOT NULL)),
    'total_slas', (SELECT COUNT(*) FROM sla_definitions sd2 WHERE sd2.tenant_id = p_tenant_id AND sd2.is_active = TRUE),
    'total_incidents', (SELECT COUNT(*) FROM sla_incidents si2 WHERE si2.tenant_id = p_tenant_id AND si2.started_at >= v_start_date),
    'open_incidents', (SELECT COUNT(*) FROM sla_incidents si3 WHERE si3.tenant_id = p_tenant_id AND si3.status != 'resolved' AND si3.started_at >= v_start_date)
  ) INTO v_result
  FROM uptime_checks uc
  WHERE uc.tenant_id = p_tenant_id
    AND uc.check_timestamp >= v_start_date;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE sla_definitions IS 'E31: Service Level Agreement definitions';
COMMENT ON TABLE uptime_checks IS 'E31: Uptime and health check records';
COMMENT ON TABLE sla_incidents IS 'E31: SLA violation incidents';
COMMENT ON TABLE sla_reports IS 'E31: Pre-computed SLA compliance reports';

-- Migration complete
