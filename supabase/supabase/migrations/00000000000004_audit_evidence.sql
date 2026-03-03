-- Audit Evidence Storage Tables
-- Part of the Autonomous Platform Audit System

-- ============================================================================
-- Audit Evidence Table
-- Stores all audit evidence with metadata and retention policies
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN (
    'screenshot', 'video', 'log', 'metric',
    'snapshot', 'trace', 'report', 'verification'
  )),
  source TEXT NOT NULL CHECK (source IN (
    'journey_runner', 'friction_detector', 'route_auditor',
    'verifier', 'manual', 'scheduled'
  )),
  category TEXT NOT NULL CHECK (category IN (
    'pass', 'fail', 'warning', 'info', 'error', 'performance', 'security'
  )),
  content_type TEXT NOT NULL CHECK (content_type IN ('text', 'json', 'binary', 'url')),
  content TEXT, -- For small content stored inline
  size_bytes BIGINT NOT NULL DEFAULT 0,
  checksum TEXT,
  storage_path TEXT, -- For large content stored in storage bucket
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  task_id TEXT,
  journey_id TEXT,
  step_id TEXT,
  agent_id TEXT,
  verifier_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- Verification Results Table
-- Stores independent verification results
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.verification_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id TEXT NOT NULL,
  verifier_id TEXT NOT NULL,
  requesting_agent_id TEXT NOT NULL,
  verified BOOLEAN NOT NULL,
  passed_checks INT NOT NULL DEFAULT 0,
  failed_checks INT NOT NULL DEFAULT 0,
  total_checks INT NOT NULL DEFAULT 0,
  evidence JSONB DEFAULT '[]',
  failures JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Audit Runs Table
-- Tracks scheduled and manual audit runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'health_check', 'journey_run', 'route_audit',
    'friction_analysis', 'full_audit'
  )),
  status TEXT NOT NULL CHECK (status IN (
    'success', 'partial', 'failure', 'error', 'running'
  )),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  results JSONB DEFAULT '{}',
  alerts JSONB DEFAULT '[]',
  config JSONB DEFAULT '{}'
);

-- ============================================================================
-- Audit Alerts Table
-- Stores alerts generated during audits
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES public.audit_runs(id) ON DELETE CASCADE,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  type TEXT NOT NULL CHECK (type IN (
    'health_degraded', 'journey_failed', 'route_failed',
    'friction_high', 'performance_degraded', 'error'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- Audit Schedules Table
-- Stores audit schedule configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'health_check', 'journey_run', 'route_audit',
    'friction_analysis', 'full_audit'
  )),
  cron TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Friction Analysis Table
-- Stores UX friction analysis results
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.friction_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journey_id TEXT,
  source TEXT NOT NULL CHECK (source IN ('journey', 'manual', 'automated')),
  friction_score INT NOT NULL CHECK (friction_score >= 0 AND friction_score <= 100),
  total_friction_points INT NOT NULL DEFAULT 0,
  critical_count INT NOT NULL DEFAULT 0,
  high_count INT NOT NULL DEFAULT 0,
  medium_count INT NOT NULL DEFAULT 0,
  low_count INT NOT NULL DEFAULT 0,
  friction_points JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Route Audit Results Table
-- Stores API route audit results
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.route_audit_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_path TEXT NOT NULL,
  route_methods TEXT[] NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'warning', 'error')),
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  checks JSONB DEFAULT '[]',
  issues JSONB DEFAULT '[]',
  performance JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Audit evidence indexes
CREATE INDEX IF NOT EXISTS idx_audit_evidence_type ON public.audit_evidence(type);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_source ON public.audit_evidence(source);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_category ON public.audit_evidence(category);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_task_id ON public.audit_evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_journey_id ON public.audit_evidence(journey_id);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_created_at ON public.audit_evidence(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_expires_at ON public.audit_evidence(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_tags ON public.audit_evidence USING GIN(tags);

-- Verification results indexes
CREATE INDEX IF NOT EXISTS idx_verification_results_task_id ON public.verification_results(task_id);
CREATE INDEX IF NOT EXISTS idx_verification_results_verifier_id ON public.verification_results(verifier_id);
CREATE INDEX IF NOT EXISTS idx_verification_results_created_at ON public.verification_results(created_at DESC);

-- Audit runs indexes
CREATE INDEX IF NOT EXISTS idx_audit_runs_schedule_id ON public.audit_runs(schedule_id);
CREATE INDEX IF NOT EXISTS idx_audit_runs_type ON public.audit_runs(type);
CREATE INDEX IF NOT EXISTS idx_audit_runs_status ON public.audit_runs(status);
CREATE INDEX IF NOT EXISTS idx_audit_runs_started_at ON public.audit_runs(started_at DESC);

-- Audit alerts indexes
CREATE INDEX IF NOT EXISTS idx_audit_alerts_run_id ON public.audit_alerts(run_id);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_severity ON public.audit_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_acknowledged ON public.audit_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_audit_alerts_triggered_at ON public.audit_alerts(triggered_at DESC);

-- Audit schedules indexes
CREATE INDEX IF NOT EXISTS idx_audit_schedules_type ON public.audit_schedules(type);
CREATE INDEX IF NOT EXISTS idx_audit_schedules_enabled ON public.audit_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_audit_schedules_next_run ON public.audit_schedules(next_run);

-- Friction analysis indexes
CREATE INDEX IF NOT EXISTS idx_friction_analyses_journey_id ON public.friction_analyses(journey_id);
CREATE INDEX IF NOT EXISTS idx_friction_analyses_friction_score ON public.friction_analyses(friction_score DESC);
CREATE INDEX IF NOT EXISTS idx_friction_analyses_created_at ON public.friction_analyses(created_at DESC);

-- Route audit results indexes
CREATE INDEX IF NOT EXISTS idx_route_audit_results_route_path ON public.route_audit_results(route_path);
CREATE INDEX IF NOT EXISTS idx_route_audit_results_status ON public.route_audit_results(status);
CREATE INDEX IF NOT EXISTS idx_route_audit_results_score ON public.route_audit_results(score);
CREATE INDEX IF NOT EXISTS idx_route_audit_results_created_at ON public.route_audit_results(created_at DESC);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_audit_schedules_updated_at
  BEFORE UPDATE ON public.audit_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Retention Policy Function
-- Deletes expired evidence automatically
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_evidence()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.audit_evidence
  WHERE expires_at IS NOT NULL
    AND expires_at < NOW()
    AND is_archived = FALSE;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Storage Bucket for Large Evidence
-- Note: Run this in Supabase dashboard or via storage API
-- ============================================================================

-- Create bucket for audit evidence (run via Supabase dashboard):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('audit-evidence', 'audit-evidence', false);

-- ============================================================================
-- RLS Policies (Optional - for authenticated access)
-- ============================================================================

-- Enable RLS on all audit tables
ALTER TABLE public.audit_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friction_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_audit_results ENABLE ROW LEVEL SECURITY;

-- Service role can do anything (for backend operations)
CREATE POLICY "Service role has full access to audit_evidence"
  ON public.audit_evidence
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role has full access to verification_results"
  ON public.verification_results
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role has full access to audit_runs"
  ON public.audit_runs
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role has full access to audit_alerts"
  ON public.audit_alerts
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role has full access to audit_schedules"
  ON public.audit_schedules
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role has full access to friction_analyses"
  ON public.friction_analyses
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role has full access to route_audit_results"
  ON public.route_audit_results
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.audit_evidence IS 'Stores all audit evidence with metadata and retention policies';
COMMENT ON TABLE public.verification_results IS 'Stores independent verification results for tasks';
COMMENT ON TABLE public.audit_runs IS 'Tracks scheduled and manual audit runs';
COMMENT ON TABLE public.audit_alerts IS 'Stores alerts generated during audits';
COMMENT ON TABLE public.audit_schedules IS 'Stores audit schedule configurations';
COMMENT ON TABLE public.friction_analyses IS 'Stores UX friction analysis results';
COMMENT ON TABLE public.route_audit_results IS 'Stores API route audit results';
