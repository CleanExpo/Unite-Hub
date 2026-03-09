-- Migration 198: Engine-Level Circuit Breaker Framework (CBF)
-- Phase 165: Overload protection with automatic circuit breaking

-- Engine circuits table
CREATE TABLE IF NOT EXISTS engine_circuits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engine_name TEXT NOT NULL UNIQUE,
  circuit_state TEXT NOT NULL CHECK (circuit_state IN ('closed', 'open', 'half_open')) DEFAULT 'closed',
  failure_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  threshold_failures INTEGER NOT NULL DEFAULT 5,
  recovery_timeout_ms INTEGER NOT NULL DEFAULT 30000,
  last_failure_at TIMESTAMPTZ,
  last_state_change TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Circuit state transitions table
CREATE TABLE IF NOT EXISTS circuit_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circuit_id UUID REFERENCES engine_circuits(id) ON DELETE CASCADE,
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  reason TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.9,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_engine_circuits_state ON engine_circuits(circuit_state);
CREATE INDEX IF NOT EXISTS idx_circuit_transitions_circuit ON circuit_transitions(circuit_id);

-- RLS
ALTER TABLE engine_circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_transitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view engine circuits" ON engine_circuits;
CREATE POLICY "Authenticated users can view engine circuits" ON engine_circuits
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view circuit transitions" ON circuit_transitions;
CREATE POLICY "Authenticated users can view circuit transitions" ON circuit_transitions
  FOR SELECT USING (auth.uid() IS NOT NULL);
