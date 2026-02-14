-- Migration 197: Task Migration & Reassignment Layer (TMARL)
-- Phase 164: Safe task migration between queues and regions

-- Task migrations table
CREATE TABLE IF NOT EXISTS task_migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  original_queue TEXT NOT NULL,
  original_region TEXT NOT NULL,
  target_queue TEXT NOT NULL,
  target_region TEXT NOT NULL,
  migration_reason TEXT NOT NULL,
  is_idempotent BOOLEAN NOT NULL,
  original_context JSONB NOT NULL,
  new_context JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'migrated', 'failed', 'reverted')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_migrations_tenant ON task_migrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_task_migrations_status ON task_migrations(status);

-- RLS
ALTER TABLE task_migrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their task migrations" ON task_migrations;
CREATE POLICY "Users can view their task migrations" ON task_migrations
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
