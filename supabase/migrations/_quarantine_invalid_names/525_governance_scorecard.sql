-- Phase E36: Automated Governance Scorecard
-- Migration: 525
-- Purpose: Precomputed governance health metrics
-- Tables: governance_metrics
-- Functions: record_governance_metric, get_latest_scorecard
-- RLS: Tenant-scoped

-- =====================================================
-- 1. TABLES (Idempotent - drop if exists)
-- =====================================================

DROP TABLE IF EXISTS governance_metrics CASCADE;

-- Governance Metrics
CREATE TABLE governance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_governance_metrics_tenant_metric ON governance_metrics(tenant_id, metric);
CREATE INDEX idx_governance_metrics_computed ON governance_metrics(tenant_id, computed_at DESC);

-- =====================================================
-- 2. RLS POLICIES
-- =====================================================

ALTER TABLE governance_metrics ENABLE ROW LEVEL SECURITY;

-- Governance Metrics: Tenant-scoped
DROP POLICY IF EXISTS governance_metrics_tenant_isolation ON governance_metrics;
CREATE POLICY governance_metrics_tenant_isolation ON governance_metrics
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================
-- 3. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- Record governance metric
DO $$
BEGIN
  DROP FUNCTION IF EXISTS record_governance_metric CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_governance_metric(
  p_tenant_id UUID,
  p_metric TEXT,
  p_value NUMERIC,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
BEGIN
  INSERT INTO governance_metrics (tenant_id, metric, value, metadata)
  VALUES (p_tenant_id, p_metric, p_value, p_metadata)
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get latest scorecard (most recent value for each metric)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_latest_scorecard CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_latest_scorecard(
  p_tenant_id UUID
)
RETURNS TABLE (
  metric TEXT,
  value NUMERIC,
  metadata JSONB,
  computed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (gm.metric)
    gm.metric,
    gm.value,
    gm.metadata,
    gm.computed_at
  FROM governance_metrics gm
  WHERE gm.tenant_id = p_tenant_id
  ORDER BY gm.metric, gm.computed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get metric history
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_metric_history CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_metric_history(
  p_tenant_id UUID,
  p_metric TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  value NUMERIC,
  metadata JSONB,
  computed_at TIMESTAMPTZ
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
BEGIN
  v_start_date := now() - (p_days || ' days')::interval;

  RETURN QUERY
  SELECT
    gm.value,
    gm.metadata,
    gm.computed_at
  FROM governance_metrics gm
  WHERE gm.tenant_id = p_tenant_id
    AND gm.metric = p_metric
    AND gm.computed_at >= v_start_date
  ORDER BY gm.computed_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compute governance scorecard (aggregate multiple sources)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS compute_governance_scorecard CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION compute_governance_scorecard(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_open_incidents INTEGER;
  v_unresolved_debt INTEGER;
  v_open_remediation INTEGER;
  v_security_events INTEGER;
  v_compliance_score NUMERIC;
BEGIN
  -- Count open SLA incidents (E31)
  SELECT COUNT(*) INTO v_open_incidents
  FROM sla_incidents si
  WHERE si.tenant_id = p_tenant_id
    AND si.status != 'resolved';

  -- Count unresolved operational debt (E34)
  SELECT COUNT(*) INTO v_unresolved_debt
  FROM operational_debt od
  WHERE od.tenant_id = p_tenant_id
    AND od.status != 'resolved';

  -- Count open remediation tasks (E35)
  SELECT COUNT(*) INTO v_open_remediation
  FROM remediation_tasks rt
  WHERE rt.tenant_id = p_tenant_id
    AND rt.status != 'done';

  -- Count security events last 30 days (E28: Risk Events)
  SELECT COUNT(*) INTO v_security_events
  FROM risk_events re
  WHERE re.tenant_id = p_tenant_id
    AND re.detected_at >= now() - interval '30 days'
    AND re.category = 'security';

  -- Calculate compliance score (0-100)
  v_compliance_score := GREATEST(0, 100 -
    (v_open_incidents * 5) -
    (v_unresolved_debt * 3) -
    (v_open_remediation * 2) -
    (v_security_events * 1)
  );

  SELECT jsonb_build_object(
    'open_incidents', v_open_incidents,
    'unresolved_debt', v_unresolved_debt,
    'open_remediation_tasks', v_open_remediation,
    'security_events_30d', v_security_events,
    'compliance_score', v_compliance_score,
    'computed_at', now()
  ) INTO v_result;

  -- Record each metric
  PERFORM record_governance_metric(p_tenant_id, 'open_incidents', v_open_incidents);
  PERFORM record_governance_metric(p_tenant_id, 'unresolved_debt', v_unresolved_debt);
  PERFORM record_governance_metric(p_tenant_id, 'open_remediation_tasks', v_open_remediation);
  PERFORM record_governance_metric(p_tenant_id, 'security_events_30d', v_security_events);
  PERFORM record_governance_metric(p_tenant_id, 'compliance_score', v_compliance_score);

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. COMMENTS
-- =====================================================

COMMENT ON TABLE governance_metrics IS 'E36: Precomputed governance health metrics';
COMMENT ON FUNCTION compute_governance_scorecard IS 'E36: Aggregate governance scorecard from E28-E35';

-- Migration complete
