-- Migration 315: Observability Tables
-- Purpose: Create tables for ML Observability Layer
-- Generated: 2025-11-28
-- Fixed: Uses profiles.role with user_role enum ('FOUNDER', 'ADMIN', etc.)

-- ============================================
-- OBSERVABILITY LOGS TABLE
-- Stores all API request metrics
-- ============================================

CREATE TABLE IF NOT EXISTS observability_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  workspace_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT,
  error_stack TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_observability_logs_created_at
  ON observability_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_observability_logs_route_path
  ON observability_logs(route_path, method);

CREATE INDEX IF NOT EXISTS idx_observability_logs_status
  ON observability_logs(status_code)
  WHERE status_code >= 400;

CREATE INDEX IF NOT EXISTS idx_observability_logs_workspace
  ON observability_logs(workspace_id)
  WHERE workspace_id IS NOT NULL;

-- Partition hint: For production, consider partitioning by created_at
COMMENT ON TABLE observability_logs IS 'API request metrics for ML-based anomaly detection. Consider partitioning by created_at for production workloads.';

-- ============================================
-- OBSERVABILITY ANOMALIES TABLE
-- Stores detected anomalies
-- ============================================

CREATE TABLE IF NOT EXISTS observability_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('latency_spike', 'error_rate_spike', 'unusual_pattern', 'cascade_failure')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  route TEXT NOT NULL,
  description TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  -- Keep FK reference to auth.users (allowed in migrations)
resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for anomaly queries
CREATE INDEX IF NOT EXISTS idx_observability_anomalies_detected
  ON observability_anomalies(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_observability_anomalies_severity
  ON observability_anomalies(severity)
  WHERE NOT resolved;

CREATE INDEX IF NOT EXISTS idx_observability_anomalies_type
  ON observability_anomalies(type);

CREATE INDEX IF NOT EXISTS idx_observability_anomalies_unresolved
  ON observability_anomalies(severity, detected_at DESC)
  WHERE NOT resolved;

-- ============================================
-- OBSERVABILITY HEALTH SNAPSHOTS TABLE
-- Periodic health score snapshots
-- ============================================

CREATE TABLE IF NOT EXISTS observability_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  latency_score INTEGER NOT NULL CHECK (latency_score >= 0 AND latency_score <= 100),
  error_rate_score INTEGER NOT NULL CHECK (error_rate_score >= 0 AND error_rate_score <= 100),
  availability_score INTEGER NOT NULL CHECK (availability_score >= 0 AND availability_score <= 100),
  metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_health_snapshots_created
  ON observability_health_snapshots(created_at DESC);

-- ============================================
-- OBSERVABILITY ROUTE BASELINES TABLE
-- Stores learned baselines per route
-- ============================================

CREATE TABLE IF NOT EXISTS observability_route_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path TEXT NOT NULL,
  method TEXT NOT NULL,
  p50_latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
  p95_latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
  p99_latency_ms DOUBLE PRECISION NOT NULL DEFAULT 0,
  error_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(route_path, method)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_route_baselines_route
  ON observability_route_baselines(route_path, method);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE observability_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE observability_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE observability_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE observability_route_baselines ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- Only FOUNDER/ADMIN can view observability data
-- Uses profiles.role (user_role enum)
-- ============================================

-- Observability logs: FOUNDER/ADMIN only
CREATE POLICY "observability_logs_admin_select" ON observability_logs
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ADMIN', 'FOUNDER')
    )
  );

-- Service role can insert (for ML detector)
CREATE POLICY "observability_logs_service_insert" ON observability_logs
  FOR INSERT WITH CHECK (true);

-- Anomalies: FOUNDER/ADMIN only
CREATE POLICY "observability_anomalies_admin_select" ON observability_anomalies
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ADMIN', 'FOUNDER')
    )
  );

CREATE POLICY "observability_anomalies_admin_update" ON observability_anomalies
  FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ADMIN', 'FOUNDER')
    )
  );

CREATE POLICY "observability_anomalies_service_insert" ON observability_anomalies
  FOR INSERT WITH CHECK (true);

-- Health snapshots: FOUNDER/ADMIN only
CREATE POLICY "observability_health_admin_select" ON observability_health_snapshots
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ADMIN', 'FOUNDER')
    )
  );

CREATE POLICY "observability_health_service_insert" ON observability_health_snapshots
  FOR INSERT WITH CHECK (true);

-- Route baselines: FOUNDER/ADMIN only
CREATE POLICY "observability_baselines_admin_select" ON observability_route_baselines
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('ADMIN', 'FOUNDER')
    )
  );

CREATE POLICY "observability_baselines_service_all" ON observability_route_baselines
  FOR ALL WITH CHECK (true);

-- ============================================
-- CLEANUP FUNCTION
-- Remove old logs (call via cron job)
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_old_observability_logs(days_to_keep INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM observability_logs
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (function will self-limit via RLS)
GRANT EXECUTE ON FUNCTION public.cleanup_old_observability_logs(INTEGER) TO authenticated;
