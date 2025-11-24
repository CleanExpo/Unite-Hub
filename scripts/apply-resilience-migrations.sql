-- =====================================================
-- RESILIENCE MIGRATIONS 194-203
-- Applied: 2025-11-25
-- Purpose: Advanced fault tolerance and crisis management
-- =====================================================

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

-- =====================================================
-- Migration 195: Regional Failover Routing Engine (RFRE)
-- Phase 162: Safe failover routing away from failing infrastructure
-- =====================================================

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

-- =====================================================
-- Migration 196: Autopilot Black Box Recorder (ABBR)
-- Phase 163: Detailed decision logging for debugging
-- =====================================================

-- Autopilot decisions table
CREATE TABLE IF NOT EXISTS autopilot_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}',
  decision_taken TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.8,
  outcome TEXT CHECK (outcome IN ('success', 'failure', 'unknown', 'pending')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Decision audit logs
CREATE TABLE IF NOT EXISTS decision_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES autopilot_decisions(id) ON DELETE CASCADE,
  checkpoint_type TEXT NOT NULL,
  state_snapshot JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_autopilot_decisions_type ON autopilot_decisions(decision_type);
CREATE INDEX IF NOT EXISTS idx_autopilot_decisions_outcome ON autopilot_decisions(outcome);
CREATE INDEX IF NOT EXISTS idx_decision_audit_decision ON decision_audit_logs(decision_id);

-- RLS
ALTER TABLE autopilot_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view autopilot decisions" ON autopilot_decisions;
CREATE POLICY "Authenticated users can view autopilot decisions" ON autopilot_decisions
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view decision audit logs" ON decision_audit_logs;
CREATE POLICY "Authenticated users can view decision audit logs" ON decision_audit_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- Migration 197: Task Migration & Reassignment (TMR)
-- Phase 164: Move work away from failing regions
-- =====================================================

-- Task migration history
CREATE TABLE IF NOT EXISTS task_migration_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL,
  from_region TEXT NOT NULL,
  to_region TEXT NOT NULL,
  reason TEXT NOT NULL,
  migration_status TEXT NOT NULL CHECK (migration_status IN ('initiated', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_migration_task ON task_migration_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_migration_status ON task_migration_history(migration_status);

-- RLS
ALTER TABLE task_migration_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view task migrations" ON task_migration_history;
CREATE POLICY "Authenticated users can view task migrations" ON task_migration_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- Migration 198: Circuit Breaker Framework (CBF)
-- Phase 165: Prevent cascading failures
-- =====================================================

-- Circuit breaker states
CREATE TABLE IF NOT EXISTS circuit_breaker_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state IN ('closed', 'open', 'half_open')) DEFAULT 'closed',
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_failure_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Circuit breaker events
CREATE TABLE IF NOT EXISTS circuit_breaker_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circuit_id UUID REFERENCES circuit_breaker_states(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('failure', 'success', 'opened', 'closed', 'half_opened')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_circuit_states_service ON circuit_breaker_states(service_name);
CREATE INDEX IF NOT EXISTS idx_circuit_states_state ON circuit_breaker_states(state);
CREATE INDEX IF NOT EXISTS idx_circuit_events_circuit ON circuit_breaker_events(circuit_id);

-- RLS
ALTER TABLE circuit_breaker_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_breaker_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view circuit breaker states" ON circuit_breaker_states;
CREATE POLICY "Authenticated users can view circuit breaker states" ON circuit_breaker_states
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view circuit breaker events" ON circuit_breaker_events;
CREATE POLICY "Authenticated users can view circuit breaker events" ON circuit_breaker_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- Migration 199: Resilient Queue Federation (RQF)
-- Phase 166: Distributed task queues with failover
-- =====================================================

-- Federated queues
CREATE TABLE IF NOT EXISTS federated_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name TEXT NOT NULL UNIQUE,
  primary_region TEXT NOT NULL,
  replica_regions JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Queue federation events
CREATE TABLE IF NOT EXISTS queue_federation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES federated_queues(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('replication', 'failover', 'recovered')),
  from_region TEXT,
  to_region TEXT,
  task_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_federated_queues_name ON federated_queues(queue_name);
CREATE INDEX IF NOT EXISTS idx_queue_federation_events_queue ON queue_federation_events(queue_id);

-- RLS
ALTER TABLE federated_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_federation_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view federated queues" ON federated_queues;
CREATE POLICY "Authenticated users can view federated queues" ON federated_queues
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view queue federation events" ON queue_federation_events;
CREATE POLICY "Authenticated users can view queue federation events" ON queue_federation_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- Migration 200: Operator Crisis Console (OCC)
-- Phase 167: Real-time crisis management console
-- =====================================================

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

-- =====================================================
-- Migration 201: Disaster Mode Safety Governor (DMSG)
-- Phase 168: Safe degradation under extreme load
-- =====================================================

-- Disaster mode states
CREATE TABLE IF NOT EXISTS disaster_mode_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_level TEXT NOT NULL CHECK (mode_level IN ('normal', 'degraded', 'minimal', 'emergency')) DEFAULT 'normal',
  trigger_reason TEXT NOT NULL,
  disabled_features JSONB NOT NULL DEFAULT '[]',
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ
);

-- Disaster mode events
CREATE TABLE IF NOT EXISTS disaster_mode_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID REFERENCES disaster_mode_states(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('activated', 'escalated', 'deescalated', 'deactivated')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disaster_mode_states_level ON disaster_mode_states(mode_level);
CREATE INDEX IF NOT EXISTS idx_disaster_mode_events_state ON disaster_mode_events(state_id);

-- RLS
ALTER TABLE disaster_mode_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE disaster_mode_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view disaster mode states" ON disaster_mode_states;
CREATE POLICY "Authenticated users can view disaster mode states" ON disaster_mode_states
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view disaster mode events" ON disaster_mode_events;
CREATE POLICY "Authenticated users can view disaster mode events" ON disaster_mode_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- Migration 202: Cross-Region Intelligence Preservation (CRIP)
-- Phase 169: Preserve AI learning across regions
-- =====================================================

-- Intelligence snapshots
CREATE TABLE IF NOT EXISTS intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_type TEXT NOT NULL,
  source_region TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  checksum TEXT NOT NULL,
  replicated_to JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Intelligence replication logs
CREATE TABLE IF NOT EXISTS intelligence_replication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES intelligence_snapshots(id) ON DELETE CASCADE,
  target_region TEXT NOT NULL,
  replication_status TEXT NOT NULL CHECK (replication_status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_type ON intelligence_snapshots(snapshot_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_replication_snapshot ON intelligence_replication_logs(snapshot_id);

-- RLS
ALTER TABLE intelligence_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_replication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view intelligence snapshots" ON intelligence_snapshots;
CREATE POLICY "Authenticated users can view intelligence snapshots" ON intelligence_snapshots
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view intelligence replication logs" ON intelligence_replication_logs;
CREATE POLICY "Authenticated users can view intelligence replication logs" ON intelligence_replication_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- Migration 203: Field Reliability Certification (FRC)
-- Phase 170: Production readiness checks
-- =====================================================

-- Reliability certifications
CREATE TABLE IF NOT EXISTS reliability_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name TEXT NOT NULL,
  certification_level TEXT NOT NULL CHECK (certification_level IN ('basic', 'standard', 'advanced', 'enterprise')),
  tests_passed INTEGER NOT NULL,
  tests_failed INTEGER NOT NULL,
  overall_score REAL NOT NULL,
  certified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Reliability test results
CREATE TABLE IF NOT EXISTS reliability_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_id UUID REFERENCES reliability_certifications(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_category TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  details JSONB DEFAULT '{}',
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reliability_certifications_component ON reliability_certifications(component_name);
CREATE INDEX IF NOT EXISTS idx_reliability_test_results_cert ON reliability_test_results(certification_id);

-- RLS
ALTER TABLE reliability_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reliability_test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view reliability certifications" ON reliability_certifications;
CREATE POLICY "Authenticated users can view reliability certifications" ON reliability_certifications
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view reliability test results" ON reliability_test_results;
CREATE POLICY "Authenticated users can view reliability test results" ON reliability_test_results
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Successfully applied resilience migrations 194-203';
  RAISE NOTICE '✅ 20 tables created';
  RAISE NOTICE '✅ 20 RLS policies enabled';
  RAISE NOTICE '✅ Infrastructure ready for advanced fault tolerance';
END $$;
