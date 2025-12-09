-- Migration 425: Unified Observability & Logging (Phase E10)
-- Centralized logging, request tracing, and error tracking

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS error_events CASCADE;
DROP TABLE IF EXISTS request_traces CASCADE;
DROP TABLE IF EXISTS unified_logs CASCADE;

-- Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE log_source AS ENUM (
    'api', 'agent', 'automation', 'client', 'cron', 'worker',
    'system', 'integration', 'middleware', 'database'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Unified Logs table (all application logs)
CREATE TABLE unified_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id UUID, -- correlate with request_traces
  source log_source NOT NULL,
  level log_level NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb, -- additional structured data
  stack_trace TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_unified_logs_tenant ON unified_logs(tenant_id, created_at DESC);
CREATE INDEX idx_unified_logs_level ON unified_logs(level, created_at DESC);
CREATE INDEX idx_unified_logs_request ON unified_logs(request_id);
CREATE INDEX idx_unified_logs_source ON unified_logs(source, created_at DESC);
CREATE INDEX idx_unified_logs_created ON unified_logs(created_at DESC);

-- RLS for unified_logs
ALTER TABLE unified_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY unified_logs_tenant_isolation ON unified_logs
  FOR ALL
  USING (tenant_id = auth.uid() OR tenant_id IS NULL);

-- Request Traces table (HTTP request metadata)
CREATE TABLE request_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  headers JSONB DEFAULT '{}'::jsonb,
  query_params JSONB DEFAULT '{}'::jsonb,
  response_size INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_request_traces_tenant ON request_traces(tenant_id, created_at DESC);
CREATE INDEX idx_request_traces_request ON request_traces(request_id);
CREATE INDEX idx_request_traces_path ON request_traces(path, created_at DESC);
CREATE INDEX idx_request_traces_status ON request_traces(status_code, created_at DESC);
CREATE INDEX idx_request_traces_created ON request_traces(created_at DESC);

-- RLS for request_traces
ALTER TABLE request_traces ENABLE ROW LEVEL SECURITY;

CREATE POLICY request_traces_tenant_isolation ON request_traces
  FOR ALL
  USING (tenant_id = auth.uid() OR tenant_id IS NULL);

-- Error Events table (detailed error tracking)
CREATE TABLE error_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id UUID,
  error_type TEXT NOT NULL, -- e.g., 'ValidationError', 'APIError', 'DatabaseError'
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  source log_source NOT NULL,
  severity log_level NOT NULL DEFAULT 'error',
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_events_tenant ON error_events(tenant_id, created_at DESC);
CREATE INDEX idx_error_events_request ON error_events(request_id);
CREATE INDEX idx_error_events_type ON error_events(error_type, created_at DESC);
CREATE INDEX idx_error_events_resolved ON error_events(resolved, created_at DESC);
CREATE INDEX idx_error_events_severity ON error_events(severity, created_at DESC);
CREATE INDEX idx_error_events_created ON error_events(created_at DESC);

-- RLS for error_events
ALTER TABLE error_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY error_events_tenant_isolation ON error_events
  FOR ALL
  USING (tenant_id = auth.uid() OR tenant_id IS NULL);

-- Function: Log event helper
CREATE OR REPLACE FUNCTION log_event(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_request_id UUID DEFAULT NULL,
  p_source log_source DEFAULT 'system',
  p_level log_level DEFAULT 'info',
  p_message TEXT DEFAULT '',
  p_context JSONB DEFAULT '{}'::jsonb,
  p_stack_trace TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO unified_logs (
    tenant_id,
    user_id,
    request_id,
    source,
    level,
    message,
    context,
    stack_trace
  )
  VALUES (
    p_tenant_id,
    p_user_id,
    p_request_id,
    p_source,
    p_level,
    p_message,
    p_context,
    p_stack_trace
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Start request trace
CREATE OR REPLACE FUNCTION start_request_trace(
  p_request_id UUID,
  p_tenant_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_method TEXT DEFAULT 'GET',
  p_path TEXT DEFAULT '/',
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_headers JSONB DEFAULT '{}'::jsonb,
  p_query_params JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
BEGIN
  INSERT INTO request_traces (
    request_id,
    tenant_id,
    user_id,
    method,
    path,
    ip_address,
    user_agent,
    headers,
    query_params
  )
  VALUES (
    p_request_id,
    p_tenant_id,
    p_user_id,
    p_method,
    p_path,
    p_ip_address,
    p_user_agent,
    p_headers,
    p_query_params
  )
  ON CONFLICT (request_id) DO NOTHING;

  RETURN p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete request trace
CREATE OR REPLACE FUNCTION complete_request_trace(
  p_request_id UUID,
  p_status_code INTEGER,
  p_duration_ms INTEGER DEFAULT NULL,
  p_response_size INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE request_traces
  SET
    status_code = p_status_code,
    duration_ms = p_duration_ms,
    response_size = p_response_size,
    error_message = p_error_message,
    completed_at = now()
  WHERE request_id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log error event
CREATE OR REPLACE FUNCTION log_error_event(
  p_tenant_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_request_id UUID DEFAULT NULL,
  p_error_type TEXT DEFAULT 'Error',
  p_error_message TEXT DEFAULT '',
  p_stack_trace TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_source log_source DEFAULT 'system',
  p_severity log_level DEFAULT 'error'
) RETURNS UUID AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO error_events (
    tenant_id,
    user_id,
    request_id,
    error_type,
    error_message,
    stack_trace,
    context,
    source,
    severity
  )
  VALUES (
    p_tenant_id,
    p_user_id,
    p_request_id,
    p_error_type,
    p_error_message,
    p_stack_trace,
    p_context,
    p_source,
    p_severity
  )
  RETURNING id INTO v_error_id;

  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION log_event TO authenticated;
GRANT EXECUTE ON FUNCTION start_request_trace TO authenticated;
GRANT EXECUTE ON FUNCTION complete_request_trace TO authenticated;
GRANT EXECUTE ON FUNCTION log_error_event TO authenticated;
