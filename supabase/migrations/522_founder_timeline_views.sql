-- Phase E33: Founder Timeline Replay
-- Migration: 522
-- Purpose: Unified timeline of governance events from E22-E32
-- Views: None (function-based for flexibility)
-- Functions: get_founder_timeline, get_timeline_stats
-- RLS: Enforced via function SECURITY DEFINER with tenant_id filtering

-- =====================================================
-- 1. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- Get founder timeline (unified governance events)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_founder_timeline CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_founder_timeline(
  p_tenant_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_event_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  event_id TEXT,
  event_type TEXT,
  event_category TEXT,
  event_title TEXT,
  event_description TEXT,
  event_severity TEXT,
  event_timestamp TIMESTAMPTZ,
  event_metadata JSONB
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
BEGIN
  v_start_date := COALESCE(p_start_date, now() - interval '30 days');
  v_end_date := COALESCE(p_end_date, now());

  RETURN QUERY
  -- E22: Audit Logs
  SELECT
    'audit_' || al.id::text AS event_id,
    'audit_log' AS event_type,
    al.category::text AS event_category,
    al.action AS event_title,
    al.details AS event_description,
    NULL::text AS event_severity,
    al.created_at AS event_timestamp,
    jsonb_build_object(
      'user_id', al.user_id,
      'resource_type', al.resource_type,
      'resource_id', al.resource_id
    ) AS event_metadata
  FROM audit_logs al
  WHERE al.tenant_id = p_tenant_id
    AND al.created_at BETWEEN v_start_date AND v_end_date
    AND (p_event_types IS NULL OR 'audit_log' = ANY(p_event_types))

  UNION ALL

  -- E26: Data Retention Jobs
  SELECT
    'retention_job_' || drj.id::text AS event_id,
    'data_retention_job' AS event_type,
    drj.category::text AS event_category,
    'Data deletion job: ' || drj.category::text AS event_title,
    'Deleted ' || drj.records_deleted || ' records' AS event_description,
    CASE WHEN drj.status = 'failed' THEN 'high' ELSE 'low' END AS event_severity,
    drj.executed_at AS event_timestamp,
    jsonb_build_object(
      'status', drj.status,
      'records_deleted', drj.records_deleted
    ) AS event_metadata
  FROM data_deletion_jobs drj
  WHERE drj.tenant_id = p_tenant_id
    AND drj.executed_at BETWEEN v_start_date AND v_end_date
    AND (p_event_types IS NULL OR 'data_retention_job' = ANY(p_event_types))

  UNION ALL

  -- E27: Webhook Events (only failed/critical)
  SELECT
    'webhook_' || we.id::text AS event_id,
    'webhook_event' AS event_type,
    we.event_type::text AS event_category,
    'Webhook delivery: ' || we.event_type::text AS event_title,
    'Status: ' || we.status::text AS event_description,
    CASE WHEN we.status = 'failed' THEN 'medium' ELSE 'low' END AS event_severity,
    we.created_at AS event_timestamp,
    jsonb_build_object(
      'status', we.status,
      'attempt_count', we.attempt_count,
      'endpoint_id', we.endpoint_id
    ) AS event_metadata
  FROM webhook_events we
  INNER JOIN webhook_endpoints wep ON wep.id = we.endpoint_id
  WHERE wep.tenant_id = p_tenant_id
    AND we.created_at BETWEEN v_start_date AND v_end_date
    AND (p_event_types IS NULL OR 'webhook_event' = ANY(p_event_types))

  UNION ALL

  -- E28: Risk Events
  SELECT
    'risk_' || re.id::text AS event_id,
    'risk_event' AS event_type,
    re.category::text AS event_category,
    re.title AS event_title,
    re.description AS event_description,
    re.severity::text AS event_severity,
    re.detected_at AS event_timestamp,
    jsonb_build_object(
      'score', re.score,
      'resolved', re.resolved
    ) AS event_metadata
  FROM risk_events re
  WHERE re.tenant_id = p_tenant_id
    AND re.detected_at BETWEEN v_start_date AND v_end_date
    AND (p_event_types IS NULL OR 'risk_event' = ANY(p_event_types))

  UNION ALL

  -- E30: Runbook Assignments
  SELECT
    'runbook_' || ra.id::text AS event_id,
    'runbook_assignment' AS event_type,
    ra.status::text AS event_category,
    'Runbook: ' || r.title AS event_title,
    'Status: ' || ra.status::text AS event_description,
    CASE WHEN ra.status = 'cancelled' THEN 'medium' ELSE 'low' END AS event_severity,
    ra.created_at AS event_timestamp,
    jsonb_build_object(
      'runbook_id', ra.runbook_id,
      'assigned_to', ra.assigned_to,
      'status', ra.status
    ) AS event_metadata
  FROM runbook_assignments ra
  INNER JOIN runbooks r ON r.id = ra.runbook_id
  WHERE ra.tenant_id = p_tenant_id
    AND ra.created_at BETWEEN v_start_date AND v_end_date
    AND (p_event_types IS NULL OR 'runbook_assignment' = ANY(p_event_types))

  UNION ALL

  -- E31: SLA Incidents
  SELECT
    'sla_' || si.id::text AS event_id,
    'sla_incident' AS event_type,
    si.severity::text AS event_category,
    si.title AS event_title,
    si.description AS event_description,
    si.severity::text AS event_severity,
    si.started_at AS event_timestamp,
    jsonb_build_object(
      'sla_id', si.sla_id,
      'status', si.status,
      'resolved_at', si.resolved_at
    ) AS event_metadata
  FROM sla_incidents si
  WHERE si.tenant_id = p_tenant_id
    AND si.started_at BETWEEN v_start_date AND v_end_date
    AND (p_event_types IS NULL OR 'sla_incident' = ANY(p_event_types))

  UNION ALL

  -- E32: Evidence Packs
  SELECT
    'evidence_' || ep.id::text AS event_id,
    'evidence_pack' AS event_type,
    ep.status::text AS event_category,
    'Evidence Pack: ' || ep.name AS event_title,
    'Purpose: ' || COALESCE(ep.purpose, 'N/A') AS event_description,
    CASE WHEN ep.status = 'approved' THEN 'low' ELSE 'medium' END AS event_severity,
    ep.created_at AS event_timestamp,
    jsonb_build_object(
      'purpose', ep.purpose,
      'status', ep.status,
      'export_format', ep.export_format
    ) AS event_metadata
  FROM evidence_packs ep
  WHERE ep.tenant_id = p_tenant_id
    AND ep.created_at BETWEEN v_start_date AND v_end_date
    AND (p_event_types IS NULL OR 'evidence_pack' = ANY(p_event_types))

  ORDER BY event_timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get timeline statistics
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_timeline_stats CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_timeline_stats(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  v_start_date := now() - (p_days || ' days')::interval;

  SELECT jsonb_build_object(
    'period_days', p_days,
    'total_events', (
      SELECT COUNT(*) FROM (
        SELECT 1 FROM audit_logs al WHERE al.tenant_id = p_tenant_id AND al.created_at >= v_start_date
        UNION ALL
        SELECT 1 FROM data_deletion_jobs drj WHERE drj.tenant_id = p_tenant_id AND drj.executed_at >= v_start_date
        UNION ALL
        SELECT 1 FROM risk_events re WHERE re.tenant_id = p_tenant_id AND re.detected_at >= v_start_date
        UNION ALL
        SELECT 1 FROM runbook_assignments ra WHERE ra.tenant_id = p_tenant_id AND ra.created_at >= v_start_date
        UNION ALL
        SELECT 1 FROM sla_incidents si WHERE si.tenant_id = p_tenant_id AND si.started_at >= v_start_date
        UNION ALL
        SELECT 1 FROM evidence_packs ep WHERE ep.tenant_id = p_tenant_id AND ep.created_at >= v_start_date
      ) AS all_events
    ),
    'audit_logs', (SELECT COUNT(*) FROM audit_logs al2 WHERE al2.tenant_id = p_tenant_id AND al2.created_at >= v_start_date),
    'retention_jobs', (SELECT COUNT(*) FROM data_deletion_jobs drj2 WHERE drj2.tenant_id = p_tenant_id AND drj2.executed_at >= v_start_date),
    'risk_events', (SELECT COUNT(*) FROM risk_events re2 WHERE re2.tenant_id = p_tenant_id AND re2.detected_at >= v_start_date),
    'runbook_assignments', (SELECT COUNT(*) FROM runbook_assignments ra2 WHERE ra2.tenant_id = p_tenant_id AND ra2.created_at >= v_start_date),
    'sla_incidents', (SELECT COUNT(*) FROM sla_incidents si2 WHERE si2.tenant_id = p_tenant_id AND si2.started_at >= v_start_date),
    'evidence_packs', (SELECT COUNT(*) FROM evidence_packs ep2 WHERE ep2.tenant_id = p_tenant_id AND ep2.created_at >= v_start_date),
    'critical_events', (
      SELECT COUNT(*) FROM risk_events re3 WHERE re3.tenant_id = p_tenant_id AND re3.detected_at >= v_start_date AND re3.severity = 'critical'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. COMMENTS
-- =====================================================

COMMENT ON FUNCTION get_founder_timeline IS 'E33: Unified governance timeline across E22-E32';
COMMENT ON FUNCTION get_timeline_stats IS 'E33: Timeline statistics and event counts';

-- Migration complete
