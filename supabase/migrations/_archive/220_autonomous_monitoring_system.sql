-- Migration 220: Autonomous Monitoring System
-- Purpose: Complete self-contained monitoring without external dependencies
-- Created: 2025-11-25

-- ============================================================================
-- 1. SYSTEM_ERRORS Table - Store all application errors
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Error classification
  severity TEXT NOT NULL CHECK (severity IN ('FATAL', 'ERROR', 'WARNING', 'INFO')),
  priority TEXT NOT NULL CHECK (priority IN ('P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW', 'P4_TRIVIAL')),
  error_type TEXT NOT NULL,
  error_code TEXT,

  -- Error details
  message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}',

  -- Request context (if applicable)
  request_id TEXT,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID,
  route TEXT,
  method TEXT,

  -- Error state
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  -- Keep FK reference to auth.users (allowed in migrations)
resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,

  -- Metadata
  environment TEXT DEFAULT 'production',
  version TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_system_errors_created_at ON system_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_errors_severity ON system_errors(severity);
CREATE INDEX IF NOT EXISTS idx_system_errors_priority ON system_errors(priority);
CREATE INDEX IF NOT EXISTS idx_system_errors_resolved ON system_errors(resolved) WHERE NOT resolved;
CREATE INDEX IF NOT EXISTS idx_system_errors_user_id ON system_errors(user_id) WHERE user_id IS NOT NULL;

COMMENT ON TABLE system_errors IS 'Autonomous error tracking and monitoring';

-- ============================================================================
-- 2. PERFORMANCE_LOGS Table - Store performance metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Performance type
  metric_type TEXT NOT NULL CHECK (metric_type IN ('API_REQUEST', 'DATABASE_QUERY', 'AI_REQUEST', 'PAGE_LOAD')),
  operation TEXT NOT NULL,

  -- Performance metrics (milliseconds)
  duration_ms NUMERIC NOT NULL,

  -- Request context
  route TEXT,
  method TEXT,
  status_code INTEGER,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID,

  -- Additional metrics
  metadata JSONB DEFAULT '{}',

  -- Thresholds (for alerting)
  is_slow BOOLEAN GENERATED ALWAYS AS (
    CASE
      WHEN metric_type = 'API_REQUEST' AND duration_ms > 1000 THEN TRUE
      WHEN metric_type = 'DATABASE_QUERY' AND duration_ms > 500 THEN TRUE
      WHEN metric_type = 'AI_REQUEST' AND duration_ms > 10000 THEN TRUE
      WHEN metric_type = 'PAGE_LOAD' AND duration_ms > 3000 THEN TRUE
      ELSE FALSE
    END
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON performance_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_logs_metric_type ON performance_logs(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_logs_slow ON performance_logs(is_slow) WHERE is_slow = TRUE;
CREATE INDEX IF NOT EXISTS idx_performance_logs_route ON performance_logs(route) WHERE route IS NOT NULL;

COMMENT ON TABLE performance_logs IS 'Performance monitoring and tracking';

-- ============================================================================
-- 3. SYSTEM_HEALTH_CHECKS Table - Store health check results
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Health check results
  overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'critical')),
  checks JSONB NOT NULL DEFAULT '{}',

  -- Statistics
  total_checks INTEGER NOT NULL DEFAULT 0,
  passed_checks INTEGER NOT NULL DEFAULT 0,
  failed_checks INTEGER NOT NULL DEFAULT 0,
  warnings INTEGER NOT NULL DEFAULT 0,

  -- Issues
  critical_issues TEXT[] DEFAULT '{}',
  warnings_list TEXT[] DEFAULT '{}',

  -- Metadata
  environment TEXT DEFAULT 'production',
  version TEXT,
  execution_time_ms NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_system_health_checks_created_at ON system_health_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_status ON system_health_checks(overall_status);

COMMENT ON TABLE system_health_checks IS 'Automated system health check history';

-- ============================================================================
-- 4. ALERT_NOTIFICATIONS Table - Track sent alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Alert details
  alert_type TEXT NOT NULL CHECK (alert_type IN ('ERROR', 'PERFORMANCE', 'HEALTH', 'SECURITY', 'BUSINESS')),
  severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Alert recipients
  sent_to TEXT[] NOT NULL,
  send_method TEXT NOT NULL CHECK (send_method IN ('EMAIL', 'SLACK', 'SMS', 'WEBHOOK')),

  -- Alert status
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  delivery_status TEXT,
  error_message TEXT,

  -- Related data
  related_error_id UUID REFERENCES system_errors(id) ON DELETE CASCADE,
  related_health_check_id UUID REFERENCES system_health_checks(id) ON DELETE CASCADE,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_created_at ON alert_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_sent ON alert_notifications(sent);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_severity ON alert_notifications(severity);

COMMENT ON TABLE alert_notifications IS 'Alert notification tracking and delivery status';

-- ============================================================================
-- 5. UPTIME_CHECKS Table - Internal uptime monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS uptime_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Check configuration
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  expected_status INTEGER DEFAULT 200,

  -- Check results
  actual_status INTEGER,
  response_time_ms NUMERIC,
  is_up BOOLEAN GENERATED ALWAYS AS (actual_status = expected_status) STORED,

  -- Error details
  error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_uptime_checks_created_at ON uptime_checks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uptime_checks_endpoint ON uptime_checks(endpoint);
CREATE INDEX IF NOT EXISTS idx_uptime_checks_is_up ON uptime_checks(is_up);

COMMENT ON TABLE uptime_checks IS 'Internal uptime monitoring for critical endpoints';

-- ============================================================================
-- 6. Helper Functions
-- ============================================================================

-- Function to log errors
CREATE OR REPLACE FUNCTION log_system_error(
  p_severity TEXT,
  p_priority TEXT,
  p_error_type TEXT,
  p_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::JSONB,
  p_user_id UUID DEFAULT NULL,
  p_workspace_id UUID DEFAULT NULL,
  p_route TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO system_errors (
    severity,
    priority,
    error_type,
    message,
    stack_trace,
    context,
    user_id,
    workspace_id,
    route
  ) VALUES (
    p_severity,
    p_priority,
    p_error_type,
    p_message,
    p_stack_trace,
    p_context,
    p_user_id,
    p_workspace_id,
    p_route
  ) RETURNING id INTO v_error_id;

  RETURN v_error_id;
END;
$$;

-- Function to log performance metrics
CREATE OR REPLACE FUNCTION log_performance(
  p_metric_type TEXT,
  p_operation TEXT,
  p_duration_ms NUMERIC,
  p_route TEXT DEFAULT NULL,
  p_method TEXT DEFAULT NULL,
  p_status_code INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO performance_logs (
    metric_type,
    operation,
    duration_ms,
    route,
    method,
    status_code,
    metadata
  ) VALUES (
    p_metric_type,
    p_operation,
    p_duration_ms,
    p_route,
    p_method,
    p_status_code,
    p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_stats(
  p_hours INTEGER DEFAULT 24
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'by_severity', jsonb_object_agg(severity, severity_count),
    'by_priority', jsonb_object_agg(priority, priority_count),
    'unresolved', SUM(CASE WHEN NOT resolved THEN 1 ELSE 0 END),
    'time_range_hours', p_hours
  ) INTO v_stats
  FROM (
    SELECT
      severity,
      priority,
      resolved,
      COUNT(*) OVER (PARTITION BY severity) as severity_count,
      COUNT(*) OVER (PARTITION BY priority) as priority_count
    FROM system_errors
    WHERE created_at > NOW() - (p_hours || ' hours')::INTERVAL
  ) subq;

  RETURN COALESCE(v_stats, '{}'::JSONB);
END;
$$;

-- Function to check system health
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_critical_errors INTEGER;
  v_high_errors INTEGER;
  v_slow_queries INTEGER;
  v_uptime_failures INTEGER;
  v_status TEXT;
  v_health JSONB;
BEGIN
  -- Count critical/high priority errors in last hour
  SELECT COUNT(*) INTO v_critical_errors
  FROM system_errors
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND priority = 'P0_CRITICAL'
    AND NOT resolved;

  SELECT COUNT(*) INTO v_high_errors
  FROM system_errors
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND priority = 'P1_HIGH'
    AND NOT resolved;

  -- Count slow queries in last hour
  SELECT COUNT(*) INTO v_slow_queries
  FROM performance_logs
  WHERE created_at > NOW() - INTERVAL '1 hour'
    AND is_slow = TRUE;

  -- Count uptime failures in last 5 minutes
  SELECT COUNT(*) INTO v_uptime_failures
  FROM uptime_checks
  WHERE created_at > NOW() - INTERVAL '5 minutes'
    AND NOT is_up;

  -- Determine overall status
  IF v_critical_errors > 0 OR v_uptime_failures > 5 THEN
    v_status := 'critical';
  ELSIF v_high_errors > 5 OR v_slow_queries > 20 OR v_uptime_failures > 0 THEN
    v_status := 'degraded';
  ELSE
    v_status := 'healthy';
  END IF;

  -- Build health object
  v_health := jsonb_build_object(
    'status', v_status,
    'timestamp', NOW(),
    'metrics', jsonb_build_object(
      'critical_errors', v_critical_errors,
      'high_priority_errors', v_high_errors,
      'slow_queries', v_slow_queries,
      'uptime_failures', v_uptime_failures
    )
  );

  RETURN v_health;
END;
$$;

-- ============================================================================
-- 7. Automated Cleanup (Keep last 30 days)
-- ============================================================================

-- Function to cleanup old logs
CREATE OR REPLACE FUNCTION cleanup_monitoring_logs()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted INTEGER := 0;
  v_count INTEGER;
BEGIN
  -- Cleanup old performance logs (keep 30 days)
  DELETE FROM performance_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted + v_count;

  -- Cleanup old health checks (keep 30 days)
  DELETE FROM system_health_checks
  WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted + v_count;

  -- Cleanup old uptime checks (keep 7 days)
  DELETE FROM uptime_checks
  WHERE created_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted + v_count;

  -- Cleanup old resolved errors (keep 90 days)
  DELETE FROM system_errors
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND resolved = TRUE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted + v_count;

  -- Cleanup old sent alerts (keep 30 days)
  DELETE FROM alert_notifications
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND sent = TRUE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_deleted := v_deleted + v_count;

  RETURN v_deleted;
END;
$$;

-- ============================================================================
-- 8. Enable RLS
-- ============================================================================

ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE uptime_checks ENABLE ROW LEVEL SECURITY;

-- Service role can manage all monitoring data
CREATE POLICY "Service role can manage system_errors"
  ON system_errors FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage performance_logs"
  ON performance_logs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage system_health_checks"
  ON system_health_checks FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage alert_notifications"
  ON alert_notifications FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage uptime_checks"
  ON uptime_checks FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Autonomous Monitoring System installed successfully';
  RAISE NOTICE '   📊 Tables created: system_errors, performance_logs, system_health_checks, alert_notifications, uptime_checks';
  RAISE NOTICE '   🔧 Helper functions created';
  RAISE NOTICE '   🔒 RLS policies enabled';
  RAISE NOTICE '   🧹 Automated cleanup configured (30-day retention)';
END $$;
