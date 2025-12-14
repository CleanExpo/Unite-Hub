-- Migration 518: Governance Overview Dashboard (Phase E29)
-- Unified governance snapshot views aggregating E22-E28 data

-- Drop existing functions if they exist
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_governance_snapshot CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_governance_trends CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Function: Get governance snapshot (all governance metrics)
CREATE OR REPLACE FUNCTION get_governance_snapshot(
  p_tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_audit_stats JSONB;
  v_rate_limit_stats JSONB;
  v_policy_stats JSONB;
  v_notification_stats JSONB;
  v_retention_stats JSONB;
  v_webhook_stats JSONB;
  v_risk_overview JSONB;
BEGIN
  -- E22: Audit logs statistics
  BEGIN
    SELECT jsonb_build_object(
      'total', COUNT(*),
      'last_24h', COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours'),
      'by_category', (
        SELECT jsonb_object_agg(category, count)
        FROM (
          SELECT category::TEXT, COUNT(*) as count
          FROM audit_logs
          WHERE tenant_id = p_tenant_id
            AND created_at > now() - interval '7 days'
          GROUP BY category
          LIMIT 10
        ) t
      )
    )
    INTO v_audit_stats
    FROM audit_logs
    WHERE tenant_id = p_tenant_id;
  EXCEPTION WHEN OTHERS THEN
    v_audit_stats := '{}'::jsonb;
  END;

  -- E23: Rate limiting statistics
  BEGIN
    SELECT jsonb_build_object(
      'total_limits', COUNT(*),
      'active_limits', COUNT(*) FILTER (WHERE status = 'active'),
      'total_violations', (
        SELECT COUNT(*)
        FROM rate_limit_events
        WHERE tenant_id = p_tenant_id
          AND created_at > now() - interval '7 days'
      )
    )
    INTO v_rate_limit_stats
    FROM rate_limits
    WHERE tenant_id = p_tenant_id;
  EXCEPTION WHEN OTHERS THEN
    v_rate_limit_stats := '{}'::jsonb;
  END;

  -- E24: Policy engine statistics
  BEGIN
    SELECT get_policy_statistics(p_tenant_id)
    INTO v_policy_stats;
  EXCEPTION WHEN OTHERS THEN
    v_policy_stats := '{}'::jsonb;
  END;

  -- E25: Notifications statistics
  BEGIN
    SELECT jsonb_build_object(
      'total', COUNT(*),
      'unread', COUNT(*) FILTER (WHERE read = FALSE),
      'urgent', COUNT(*) FILTER (WHERE priority = 'urgent' AND read = FALSE)
    )
    INTO v_notification_stats
    FROM notifications
    WHERE tenant_id = p_tenant_id
      AND created_at > now() - interval '7 days';
  EXCEPTION WHEN OTHERS THEN
    v_notification_stats := '{}'::jsonb;
  END;

  -- E26: Data retention statistics
  BEGIN
    SELECT get_retention_statistics(p_tenant_id)
    INTO v_retention_stats;
  EXCEPTION WHEN OTHERS THEN
    v_retention_stats := '{}'::jsonb;
  END;

  -- E27: Webhook statistics
  BEGIN
    SELECT get_webhook_statistics(p_tenant_id)
    INTO v_webhook_stats;
  EXCEPTION WHEN OTHERS THEN
    v_webhook_stats := '{}'::jsonb;
  END;

  -- E28: Risk overview
  BEGIN
    SELECT get_risk_overview(p_tenant_id)
    INTO v_risk_overview;
  EXCEPTION WHEN OTHERS THEN
    v_risk_overview := '{}'::jsonb;
  END;

  -- Return unified snapshot
  RETURN jsonb_build_object(
    'tenant_id', p_tenant_id,
    'generated_at', now(),
    'audit_logs', COALESCE(v_audit_stats, '{}'::jsonb),
    'rate_limiting', COALESCE(v_rate_limit_stats, '{}'::jsonb),
    'policies', COALESCE(v_policy_stats, '{}'::jsonb),
    'notifications', COALESCE(v_notification_stats, '{}'::jsonb),
    'data_retention', COALESCE(v_retention_stats, '{}'::jsonb),
    'webhooks', COALESCE(v_webhook_stats, '{}'::jsonb),
    'risk_scoring', COALESCE(v_risk_overview, '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get governance trends (7-day trends)
CREATE OR REPLACE FUNCTION get_governance_trends(
  p_tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_audit_trend JSONB;
  v_policy_trend JSONB;
  v_risk_trend JSONB;
BEGIN
  -- Audit logs trend (last 7 days)
  BEGIN
    SELECT jsonb_agg(day_data ORDER BY day)
    INTO v_audit_trend
    FROM (
      SELECT
        date_trunc('day', created_at) as day,
        COUNT(*) as count
      FROM audit_logs
      WHERE tenant_id = p_tenant_id
        AND created_at > now() - interval '7 days'
      GROUP BY date_trunc('day', created_at)
    ) t;
  EXCEPTION WHEN OTHERS THEN
    v_audit_trend := '[]'::jsonb;
  END;

  -- Policy triggers trend (last 7 days)
  BEGIN
    SELECT jsonb_agg(day_data ORDER BY day)
    INTO v_policy_trend
    FROM (
      SELECT
        date_trunc('day', created_at) as day,
        COUNT(*) as count
      FROM policy_triggers
      WHERE tenant_id = p_tenant_id
        AND created_at > now() - interval '7 days'
      GROUP BY date_trunc('day', created_at)
    ) t;
  EXCEPTION WHEN OTHERS THEN
    v_policy_trend := '[]'::jsonb;
  END;

  -- Risk events trend (last 7 days)
  BEGIN
    SELECT jsonb_agg(day_data ORDER BY day)
    INTO v_risk_trend
    FROM (
      SELECT
        date_trunc('day', detected_at) as day,
        COUNT(*) as count
      FROM risk_events
      WHERE tenant_id = p_tenant_id
        AND detected_at > now() - interval '7 days'
      GROUP BY date_trunc('day', detected_at)
    ) t;
  EXCEPTION WHEN OTHERS THEN
    v_risk_trend := '[]'::jsonb;
  END;

  RETURN jsonb_build_object(
    'audit_logs', COALESCE(v_audit_trend, '[]'::jsonb),
    'policy_triggers', COALESCE(v_policy_trend, '[]'::jsonb),
    'risk_events', COALESCE(v_risk_trend, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_governance_snapshot TO authenticated;
GRANT EXECUTE ON FUNCTION get_governance_trends TO authenticated;

COMMENT ON FUNCTION get_governance_snapshot(UUID) IS 'Returns unified governance snapshot aggregating E22-E28 metrics for a tenant';
COMMENT ON FUNCTION get_governance_trends(UUID) IS 'Returns 7-day governance trends for audit logs, policy triggers, and risk events';
