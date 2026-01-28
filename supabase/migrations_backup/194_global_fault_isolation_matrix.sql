-- Migration 194: Global Fault Isolation Matrix (GFIM)
-- Phase 161: Automatic detection and isolation of failing components

-- Fault domains table
CREATE TABLE IF NOT EXISTS fault_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_type TEXT NOT NULL CHECK (domain_type IN ('tenant', 'region', 'engine', 'provider')),
  domain_identifier TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'isolated', 'recovering')) DEFAULT 'healthy',
  isolation_reason TEXT,
  isolated_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fault isolation events table
CREATE TABLE IF NOT EXISTS fault_isolation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fault_domain_id UUID REFERENCES fault_domains(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('detected', 'isolated', 'recovering', 'recovered')),
  cause TEXT NOT NULL,
  scope JSONB NOT NULL DEFAULT '{}',
  cascading_risk JSONB DEFAULT '{}',
  confidence REAL NOT NULL DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fault_domains_status ON fault_domains(status);
CREATE INDEX IF NOT EXISTS idx_fault_domains_type ON fault_domains(domain_type);
CREATE INDEX IF NOT EXISTS idx_fault_events_domain ON fault_isolation_events(fault_domain_id);

-- RLS
ALTER TABLE fault_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE fault_isolation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view fault domains" ON fault_domains;
CREATE POLICY "Authenticated users can view fault domains" ON fault_domains
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view fault events" ON fault_isolation_events;
CREATE POLICY "Authenticated users can view fault events" ON fault_isolation_events
  FOR SELECT USING (auth.uid() IS NOT NULL);
