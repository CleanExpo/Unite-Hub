-- Migration 200: Operator Crisis Console (OCC)
-- Phase 167: Real-time crisis management console

-- Crisis incidents table
CREATE TABLE IF NOT EXISTS crisis_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_domains JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('active', 'mitigating', 'resolved', 'postmortem')) DEFAULT 'active',
  description TEXT NOT NULL,
  remediation_steps JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Crisis recovery logs table
CREATE TABLE IF NOT EXISTS crisis_recovery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES crisis_incidents(id) ON DELETE CASCADE,
  action_taken TEXT NOT NULL,
  executed_by UUID NOT NULL,
  assumptions TEXT,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crisis_incidents_status ON crisis_incidents(status);
CREATE INDEX IF NOT EXISTS idx_crisis_incidents_severity ON crisis_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_crisis_recovery_incident ON crisis_recovery_logs(incident_id);

-- RLS
ALTER TABLE crisis_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE crisis_recovery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view crisis incidents" ON crisis_incidents;
CREATE POLICY "Authenticated users can view crisis incidents" ON crisis_incidents
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view crisis recovery logs" ON crisis_recovery_logs;
CREATE POLICY "Authenticated users can view crisis recovery logs" ON crisis_recovery_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);
