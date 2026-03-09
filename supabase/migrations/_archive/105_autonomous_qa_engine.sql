-- Migration 105: Autonomous QA Engine
-- Required by Phase 53 - Autonomous QA Engine (A-QAE)
-- Automated testing and verification system

-- QA runs table
CREATE TABLE IF NOT EXISTS qa_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  summary JSONB DEFAULT '{}'::jsonb,

  -- Run type check
  CONSTRAINT qa_runs_type_check CHECK (
    run_type IN ('daily', 'hourly', 'on_push', 'manual', 'stress_test')
  ),

  -- Status check
  CONSTRAINT qa_runs_status_check CHECK (
    status IN ('pending', 'running', 'passed', 'failed', 'partial')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qa_runs_type ON qa_runs(run_type);
CREATE INDEX IF NOT EXISTS idx_qa_runs_status ON qa_runs(status);
CREATE INDEX IF NOT EXISTS idx_qa_runs_started ON qa_runs(started_at DESC);

-- Enable RLS (global system table, admin only)
ALTER TABLE qa_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY qa_runs_select ON qa_runs
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

CREATE POLICY qa_runs_insert ON qa_runs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY qa_runs_update ON qa_runs
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

-- Comment
COMMENT ON TABLE qa_runs IS 'QA test run records (Phase 53)';

-- QA failures table
CREATE TABLE IF NOT EXISTS qa_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qa_run_id UUID NOT NULL,
  component TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Severity check
  CONSTRAINT qa_failures_severity_check CHECK (
    severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),

  -- Foreign key
  CONSTRAINT qa_failures_run_fk
    FOREIGN KEY (qa_run_id) REFERENCES qa_runs(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qa_failures_run ON qa_failures(qa_run_id);
CREATE INDEX IF NOT EXISTS idx_qa_failures_severity ON qa_failures(severity);
CREATE INDEX IF NOT EXISTS idx_qa_failures_component ON qa_failures(component);
CREATE INDEX IF NOT EXISTS idx_qa_failures_created ON qa_failures(created_at DESC);

-- Enable RLS
ALTER TABLE qa_failures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY qa_failures_select ON qa_failures
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

CREATE POLICY qa_failures_insert ON qa_failures
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE qa_failures IS 'QA test failures with details (Phase 53)';
