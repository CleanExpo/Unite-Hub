-- Migration 199: Resilient Queue Federation (RQF)
-- Phase 166: Redundant federated queues for critical workflows

-- Federated queues table
CREATE TABLE IF NOT EXISTS federated_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name TEXT NOT NULL,
  federation_group TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  is_primary BOOLEAN DEFAULT false,
  health_status TEXT NOT NULL CHECK (health_status IN ('healthy', 'degraded', 'offline')) DEFAULT 'healthy',
  ordering_guaranteed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Queue federation logs table
CREATE TABLE IF NOT EXISTS queue_federation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  federation_group TEXT NOT NULL,
  source_queue TEXT NOT NULL,
  target_queue TEXT NOT NULL,
  reason TEXT NOT NULL,
  items_routed INTEGER NOT NULL DEFAULT 0,
  ordering_preserved BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_federated_queues_group ON federated_queues(federation_group);
CREATE INDEX IF NOT EXISTS idx_federated_queues_health ON federated_queues(health_status);
CREATE INDEX IF NOT EXISTS idx_queue_federation_logs_group ON queue_federation_logs(federation_group);

-- RLS
ALTER TABLE federated_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_federation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view federated queues" ON federated_queues;
CREATE POLICY "Authenticated users can view federated queues" ON federated_queues
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view queue federation logs" ON queue_federation_logs;
CREATE POLICY "Authenticated users can view queue federation logs" ON queue_federation_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);
