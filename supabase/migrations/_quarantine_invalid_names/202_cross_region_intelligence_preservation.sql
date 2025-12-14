-- Migration 202: Cross-Region Intelligence Preservation Engine (CIPE)
-- Phase 169: Intelligence snapshots for resilience

-- Intelligence snapshots table
CREATE TABLE IF NOT EXISTS intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  snapshot_type TEXT NOT NULL,
  source_region TEXT NOT NULL,
  target_regions JSONB NOT NULL DEFAULT '[]',
  manifest JSONB NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  is_encrypted BOOLEAN DEFAULT true,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Snapshot restore logs table
CREATE TABLE IF NOT EXISTS snapshot_restore_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id UUID REFERENCES intelligence_snapshots(id) ON DELETE CASCADE,
  restored_by UUID NOT NULL,
  target_region TEXT NOT NULL,
  is_reversible BOOLEAN NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_tenant ON intelligence_snapshots(tenant_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_snapshots_status ON intelligence_snapshots(status);
CREATE INDEX IF NOT EXISTS idx_snapshot_restore_logs_snapshot ON snapshot_restore_logs(snapshot_id);

-- RLS
ALTER TABLE intelligence_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshot_restore_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their snapshots" ON intelligence_snapshots;
CREATE POLICY "Users can view their snapshots" ON intelligence_snapshots
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view their restore logs" ON snapshot_restore_logs;
CREATE POLICY "Users can view their restore logs" ON snapshot_restore_logs
  FOR SELECT USING (
    snapshot_id IN (SELECT id FROM intelligence_snapshots WHERE tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );
