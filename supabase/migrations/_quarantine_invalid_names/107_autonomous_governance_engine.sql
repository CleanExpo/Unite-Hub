-- Migration 107: Autonomous Governance Engine
-- Required by Phase 55 - Autonomous Governance Engine (AGE)
-- AI-driven supervision of all system engines

-- Governance events table
CREATE TABLE IF NOT EXISTS governance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  engine TEXT NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'LOW',
  details JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),

  -- Severity check
  CONSTRAINT governance_events_severity_check CHECK (
    severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_governance_events_engine ON governance_events(engine);
CREATE INDEX IF NOT EXISTS idx_governance_events_severity ON governance_events(severity);
CREATE INDEX IF NOT EXISTS idx_governance_events_occurred ON governance_events(occurred_at DESC);

-- Enable RLS
ALTER TABLE governance_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies (system-wide, admin access)
CREATE POLICY governance_events_select ON governance_events
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY governance_events_insert ON governance_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE governance_events IS 'Governance oversight events (Phase 55)';

-- Governance reports table
CREATE TABLE IF NOT EXISTS governance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_period TEXT NOT NULL,
  summary JSONB NOT NULL,
  risk_score INTEGER NOT NULL DEFAULT 0,
  recommendations JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Risk score check
  CONSTRAINT governance_reports_risk_check CHECK (
    risk_score >= 0 AND risk_score <= 100
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_governance_reports_period ON governance_reports(report_period);
CREATE INDEX IF NOT EXISTS idx_governance_reports_risk ON governance_reports(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_governance_reports_generated ON governance_reports(generated_at DESC);

-- Enable RLS
ALTER TABLE governance_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY governance_reports_select ON governance_reports
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY governance_reports_insert ON governance_reports
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE governance_reports IS 'Weekly governance summary reports (Phase 55)';
