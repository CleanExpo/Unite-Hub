-- Migration 195: Regional Failover Routing Engine (RFRE)
-- Phase 162: Safe failover routing away from failing infrastructure

-- Failover routing policies table
CREATE TABLE IF NOT EXISTS failover_routing_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL,
  source_region TEXT NOT NULL,
  fallback_regions JSONB NOT NULL DEFAULT '[]',
  conditions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Failover events table
CREATE TABLE IF NOT EXISTS failover_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES failover_routing_policies(id),
  source_region TEXT NOT NULL,
  target_region TEXT NOT NULL,
  reason TEXT NOT NULL,
  is_degraded_mode BOOLEAN DEFAULT false,
  compliance_preserved BOOLEAN NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.85,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_failover_policies_active ON failover_routing_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_failover_events_source ON failover_events(source_region);

-- RLS
ALTER TABLE failover_routing_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE failover_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view failover policies" ON failover_routing_policies;
CREATE POLICY "Authenticated users can view failover policies" ON failover_routing_policies
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view failover events" ON failover_events;
CREATE POLICY "Authenticated users can view failover events" ON failover_events
  FOR SELECT USING (auth.uid() IS NOT NULL);
