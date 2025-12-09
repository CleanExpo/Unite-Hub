-- Phase E37: Founder Heatmap Dashboard
-- Migration: 526
-- Purpose: Temporal heatmaps of governance activity
-- Tables: founder_heatmap
-- Functions: record_heatmap_event, get_heatmap_data, compute_daily_heatmap
-- RLS: Tenant-scoped

-- =====================================================
-- 1. ENUMS (Idempotent)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE heatmap_event_type AS ENUM (
    'audit_log',
    'sla_incident',
    'risk_event',
    'debt_created',
    'remediation_task',
    'security_alert',
    'compliance_violation',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TABLES (Idempotent - drop if exists)
-- =====================================================

DROP TABLE IF EXISTS founder_heatmap CASCADE;

-- Founder Heatmap
CREATE TABLE founder_heatmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type heatmap_event_type NOT NULL,
  event_date DATE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_founder_heatmap_tenant_type_date ON founder_heatmap(tenant_id, event_type, event_date);
CREATE INDEX idx_founder_heatmap_computed ON founder_heatmap(tenant_id, computed_at DESC);
CREATE UNIQUE INDEX idx_founder_heatmap_unique ON founder_heatmap(tenant_id, event_type, event_date);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE founder_heatmap ENABLE ROW LEVEL SECURITY;

-- Founder Heatmap: Tenant-scoped
DROP POLICY IF EXISTS founder_heatmap_tenant_isolation ON founder_heatmap;
CREATE POLICY founder_heatmap_tenant_isolation ON founder_heatmap
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================
-- 4. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- Record heatmap event (upsert)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS record_heatmap_event CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_heatmap_event(
  p_tenant_id UUID,
  p_event_type heatmap_event_type,
  p_event_date DATE,
  p_count INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_heatmap_id UUID;
BEGIN
  INSERT INTO founder_heatmap (tenant_id, event_type, event_date, count, metadata)
  VALUES (p_tenant_id, p_event_type, p_event_date, p_count, p_metadata)
  ON CONFLICT (tenant_id, event_type, event_date)
  DO UPDATE SET
    count = founder_heatmap.count + EXCLUDED.count,
    metadata = EXCLUDED.metadata,
    computed_at = now()
  RETURNING id INTO v_heatmap_id;

  RETURN v_heatmap_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get heatmap data
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_heatmap_data CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_heatmap_data(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_event_types heatmap_event_type[] DEFAULT NULL
)
RETURNS TABLE (
  event_type heatmap_event_type,
  event_date DATE,
  count INTEGER,
  metadata JSONB,
  computed_at TIMESTAMPTZ
) AS $$
DECLARE
  v_start_date DATE;
  v_end_date DATE;
BEGIN
  v_start_date := COALESCE(p_start_date, CURRENT_DATE - interval '90 days');
  v_end_date := COALESCE(p_end_date, CURRENT_DATE);

  RETURN QUERY
  SELECT
    fh.event_type,
    fh.event_date,
    fh.count,
    fh.metadata,
    fh.computed_at
  FROM founder_heatmap fh
  WHERE fh.tenant_id = p_tenant_id
    AND fh.event_date BETWEEN v_start_date AND v_end_date
    AND (p_event_types IS NULL OR fh.event_type = ANY(p_event_types))
  ORDER BY fh.event_type, fh.event_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compute daily heatmap (aggregate from source tables)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS compute_daily_heatmap CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION compute_daily_heatmap(
  p_tenant_id UUID,
  p_target_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_audit_count INTEGER;
  v_incident_count INTEGER;
  v_risk_count INTEGER;
  v_debt_count INTEGER;
  v_remediation_count INTEGER;
BEGIN
  -- Count audit logs for date (E22)
  SELECT COUNT(*) INTO v_audit_count
  FROM audit_logs al
  WHERE al.tenant_id = p_tenant_id
    AND al.created_at::date = p_target_date;

  -- Count SLA incidents for date (E31)
  SELECT COUNT(*) INTO v_incident_count
  FROM sla_incidents si
  WHERE si.tenant_id = p_tenant_id
    AND si.started_at::date = p_target_date;

  -- Count risk events for date (E28)
  SELECT COUNT(*) INTO v_risk_count
  FROM risk_events re
  WHERE re.tenant_id = p_tenant_id
    AND re.detected_at::date = p_target_date;

  -- Count operational debt created for date (E34)
  SELECT COUNT(*) INTO v_debt_count
  FROM operational_debt od
  WHERE od.tenant_id = p_tenant_id
    AND od.created_at::date = p_target_date;

  -- Count remediation tasks created for date (E35)
  SELECT COUNT(*) INTO v_remediation_count
  FROM remediation_tasks rt
  WHERE rt.tenant_id = p_tenant_id
    AND rt.created_at::date = p_target_date;

  -- Record in heatmap
  IF v_audit_count > 0 THEN
    PERFORM record_heatmap_event(p_tenant_id, 'audit_log', p_target_date, v_audit_count);
  END IF;

  IF v_incident_count > 0 THEN
    PERFORM record_heatmap_event(p_tenant_id, 'sla_incident', p_target_date, v_incident_count);
  END IF;

  IF v_risk_count > 0 THEN
    PERFORM record_heatmap_event(p_tenant_id, 'risk_event', p_target_date, v_risk_count);
  END IF;

  IF v_debt_count > 0 THEN
    PERFORM record_heatmap_event(p_tenant_id, 'debt_created', p_target_date, v_debt_count);
  END IF;

  IF v_remediation_count > 0 THEN
    PERFORM record_heatmap_event(p_tenant_id, 'remediation_task', p_target_date, v_remediation_count);
  END IF;

  SELECT jsonb_build_object(
    'date', p_target_date,
    'audit_logs', v_audit_count,
    'sla_incidents', v_incident_count,
    'risk_events', v_risk_count,
    'debt_created', v_debt_count,
    'remediation_tasks', v_remediation_count,
    'total_events', v_audit_count + v_incident_count + v_risk_count + v_debt_count + v_remediation_count
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compute heatmap for date range
DO $$
BEGIN
  DROP FUNCTION IF EXISTS compute_heatmap_range CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION compute_heatmap_range(
  p_tenant_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - 30,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
DECLARE
  v_current_date DATE;
  v_result JSONB := '[]'::jsonb;
  v_daily_result JSONB;
BEGIN
  v_current_date := p_start_date;

  WHILE v_current_date <= p_end_date LOOP
    v_daily_result := compute_daily_heatmap(p_tenant_id, v_current_date);
    v_result := v_result || jsonb_build_array(v_daily_result);
    v_current_date := v_current_date + interval '1 day';
  END LOOP;

  RETURN jsonb_build_object(
    'start_date', p_start_date,
    'end_date', p_end_date,
    'days', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. COMMENTS
-- =====================================================

COMMENT ON TABLE founder_heatmap IS 'E37: Temporal heatmap of governance events';
COMMENT ON FUNCTION compute_daily_heatmap IS 'E37: Aggregate daily governance activity from E22-E35';

-- Migration complete
