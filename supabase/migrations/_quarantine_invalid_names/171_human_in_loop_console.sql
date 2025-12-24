-- Migration 171: Human-in-the-Loop Evolution Console (HILEC)
-- Phase 128: Founder cockpit for reviewing, approving, or modifying evolution tasks

-- Evolution review queue table
CREATE TABLE IF NOT EXISTS evolution_review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  task_id UUID REFERENCES evolution_tasks(id) ON DELETE CASCADE,
  review_priority TEXT NOT NULL CHECK (review_priority IN ('urgent', 'high', 'normal', 'low')) DEFAULT 'normal',
  source_trace JSONB NOT NULL,
  confidence_band JSONB NOT NULL,
  deviation_alerts JSONB DEFAULT '[]',
  reviewer_id UUID,
  review_notes TEXT,
  decision TEXT CHECK (decision IN ('approved', 'rejected', 'modified', 'deferred')),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evolution_review_queue_tenant ON evolution_review_queue(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evolution_review_queue_task ON evolution_review_queue(task_id);
CREATE INDEX IF NOT EXISTS idx_evolution_review_queue_decision ON evolution_review_queue(decision);

-- RLS
ALTER TABLE evolution_review_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view review queue" ON evolution_review_queue;
CREATE POLICY "Users can view review queue" ON evolution_review_queue
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert review queue" ON evolution_review_queue;
CREATE POLICY "Users can insert review queue" ON evolution_review_queue
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update review queue" ON evolution_review_queue;
CREATE POLICY "Users can update review queue" ON evolution_review_queue
  FOR UPDATE USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
