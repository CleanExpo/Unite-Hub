-- =====================================================
-- Migration: 540_autonomous_task_routing.sql
-- Phase: F02 - Autonomous Task Routing
-- Description: Normalized queue of tasks routed to agents, humans, or systems
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE task_type AS ENUM (
    'agent_run',
    'human_approval',
    'system_trigger',
    'integration_call',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_assigned_to AS ENUM (
    'agent',
    'human',
    'system'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'queued',
    'assigned',
    'in_progress',
    'completed',
    'failed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Unified Task Queue
DROP TABLE IF EXISTS unified_task_queue CASCADE;
CREATE TABLE unified_task_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_code TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_type task_type NOT NULL DEFAULT 'other',
  assigned_to task_assigned_to,
  assigned_entity TEXT,
  priority INTEGER CHECK (priority >= 0 AND priority <= 100) DEFAULT 50,
  status task_status NOT NULL DEFAULT 'queued',
  due_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, task_code)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_unified_task_queue_tenant ON unified_task_queue(tenant_id, status, priority DESC);
CREATE INDEX idx_unified_task_queue_assigned ON unified_task_queue(tenant_id, assigned_to, assigned_entity);
CREATE INDEX idx_unified_task_queue_type ON unified_task_queue(tenant_id, task_type);
CREATE INDEX idx_unified_task_queue_due ON unified_task_queue(tenant_id, due_at) WHERE due_at IS NOT NULL;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE unified_task_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS unified_task_queue_tenant_isolation ON unified_task_queue;
CREATE POLICY unified_task_queue_tenant_isolation ON unified_task_queue
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Enqueue task
DROP FUNCTION IF EXISTS enqueue_task CASCADE;
CREATE OR REPLACE FUNCTION enqueue_task(
  p_tenant_id UUID,
  p_task_code TEXT,
  p_task_title TEXT,
  p_task_type task_type DEFAULT 'other',
  p_priority INTEGER DEFAULT 50,
  p_due_at TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_task_id UUID;
BEGIN
  INSERT INTO unified_task_queue (tenant_id, task_code, task_title, task_type, priority, due_at, metadata)
  VALUES (p_tenant_id, p_task_code, p_task_title, p_task_type, p_priority, p_due_at, p_metadata)
  ON CONFLICT (tenant_id, task_code) DO UPDATE
    SET task_title = EXCLUDED.task_title,
        task_type = EXCLUDED.task_type,
        priority = EXCLUDED.priority,
        due_at = EXCLUDED.due_at,
        metadata = EXCLUDED.metadata,
        updated_at = now()
  RETURNING id INTO v_task_id;

  RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign task
DROP FUNCTION IF EXISTS assign_task CASCADE;
CREATE OR REPLACE FUNCTION assign_task(
  p_task_id UUID,
  p_assigned_to task_assigned_to,
  p_assigned_entity TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE unified_task_queue
  SET
    assigned_to = p_assigned_to,
    assigned_entity = p_assigned_entity,
    status = 'assigned',
    updated_at = now()
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update task status
DROP FUNCTION IF EXISTS update_task_status CASCADE;
CREATE OR REPLACE FUNCTION update_task_status(
  p_task_id UUID,
  p_status task_status,
  p_result JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE unified_task_queue
  SET
    status = p_status,
    result = COALESCE(p_result, result),
    started_at = CASE WHEN p_status = 'in_progress' AND started_at IS NULL THEN now() ELSE started_at END,
    completed_at = CASE WHEN p_status IN ('completed', 'failed', 'cancelled') THEN now() ELSE completed_at END,
    updated_at = now()
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List tasks
DROP FUNCTION IF EXISTS list_tasks CASCADE;
CREATE OR REPLACE FUNCTION list_tasks(
  p_tenant_id UUID,
  p_status task_status DEFAULT NULL,
  p_assigned_to task_assigned_to DEFAULT NULL,
  p_task_type task_type DEFAULT NULL,
  p_limit INTEGER DEFAULT 500
)
RETURNS SETOF unified_task_queue AS $$
BEGIN
  RETURN QUERY
  SELECT utq.*
  FROM unified_task_queue utq
  WHERE utq.tenant_id = p_tenant_id
    AND (p_status IS NULL OR utq.status = p_status)
    AND (p_assigned_to IS NULL OR utq.assigned_to = p_assigned_to)
    AND (p_task_type IS NULL OR utq.task_type = p_task_type)
  ORDER BY utq.priority DESC, utq.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get queue summary
DROP FUNCTION IF EXISTS get_queue_summary CASCADE;
CREATE OR REPLACE FUNCTION get_queue_summary(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_tasks', COUNT(*),
    'by_status', (
      SELECT jsonb_object_agg(status, count)
      FROM (
        SELECT status, COUNT(*)::integer as count
        FROM unified_task_queue
        WHERE tenant_id = p_tenant_id
        GROUP BY status
      ) status_counts
    ),
    'by_type', (
      SELECT jsonb_object_agg(task_type, count)
      FROM (
        SELECT task_type, COUNT(*)::integer as count
        FROM unified_task_queue
        WHERE tenant_id = p_tenant_id
        GROUP BY task_type
      ) type_counts
    ),
    'by_assigned_to', (
      SELECT jsonb_object_agg(assigned_to, count)
      FROM (
        SELECT assigned_to, COUNT(*)::integer as count
        FROM unified_task_queue
        WHERE tenant_id = p_tenant_id
        GROUP BY assigned_to
      ) assigned_counts
    ),
    'high_priority_count', (
      SELECT COUNT(*)
      FROM unified_task_queue
      WHERE tenant_id = p_tenant_id AND priority >= 80
    ),
    'overdue_count', (
      SELECT COUNT(*)
      FROM unified_task_queue
      WHERE tenant_id = p_tenant_id
        AND due_at < now()
        AND status NOT IN ('completed', 'failed', 'cancelled')
    )
  ) INTO v_summary
  FROM unified_task_queue
  WHERE tenant_id = p_tenant_id;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE unified_task_queue IS 'F02: Normalized queue for tasks routed to agents, humans, or systems';
COMMENT ON FUNCTION enqueue_task IS 'F02: Insert or update a task in the queue';
COMMENT ON FUNCTION assign_task IS 'F02: Assign a task to an entity';
COMMENT ON FUNCTION update_task_status IS 'F02: Update task status and record lifecycle timestamps';
COMMENT ON FUNCTION list_tasks IS 'F02: List tasks with optional filters';
COMMENT ON FUNCTION get_queue_summary IS 'F02: Get aggregated queue summary';
