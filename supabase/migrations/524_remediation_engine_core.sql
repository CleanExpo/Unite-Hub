-- Phase E35: Task Remediation Engine v1
-- Migration: 524
-- Purpose: System-generated or founder-created remediation tasks
-- Tables: remediation_tasks, remediation_links
-- Functions: list_remediation_tasks, create_remediation_task, link_remediation_task
-- RLS: All tables tenant-scoped

-- =====================================================
-- 1. ENUMS (Idempotent)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE remediation_source AS ENUM ('incident', 'debt', 'policy', 'system', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE remediation_status AS ENUM ('open', 'in_progress', 'blocked', 'done');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE remediation_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TABLES (Idempotent - drop if exists)
-- =====================================================

DROP TABLE IF EXISTS remediation_links CASCADE;
DROP TABLE IF EXISTS remediation_tasks CASCADE;

-- Remediation Tasks
CREATE TABLE remediation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source remediation_source NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status remediation_status NOT NULL DEFAULT 'open',
  priority remediation_priority NOT NULL DEFAULT 'medium',
  suggested_due TIMESTAMPTZ,
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_remediation_tasks_tenant ON remediation_tasks(tenant_id);
CREATE INDEX idx_remediation_tasks_status_priority ON remediation_tasks(tenant_id, status, priority);
CREATE INDEX idx_remediation_tasks_source ON remediation_tasks(source);
CREATE INDEX idx_remediation_tasks_due ON remediation_tasks(suggested_due);

-- Remediation Links (connects tasks to source entities)
CREATE TABLE remediation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES remediation_tasks(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_remediation_links_task ON remediation_links(task_id);
CREATE INDEX idx_remediation_links_entity ON remediation_links(entity_type, entity_id);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE remediation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_links ENABLE ROW LEVEL SECURITY;

-- Remediation Tasks: Tenant-scoped
DROP POLICY IF EXISTS remediation_tasks_tenant_isolation ON remediation_tasks;
CREATE POLICY remediation_tasks_tenant_isolation ON remediation_tasks
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Remediation Links: Via task tenant_id
DROP POLICY IF EXISTS remediation_links_tenant_isolation ON remediation_links;
CREATE POLICY remediation_links_tenant_isolation ON remediation_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM remediation_tasks rt
      WHERE rt.id = remediation_links.task_id
        AND rt.tenant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM remediation_tasks rt
      WHERE rt.id = remediation_links.task_id
        AND rt.tenant_id = auth.uid()
    )
  );

-- =====================================================
-- 4. TRIGGERS (updated_at)
-- =====================================================

DROP TRIGGER IF EXISTS set_updated_at_remediation_tasks ON remediation_tasks;
CREATE TRIGGER set_updated_at_remediation_tasks BEFORE UPDATE ON remediation_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- List remediation tasks
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_remediation_tasks CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_remediation_tasks(
  p_tenant_id UUID,
  p_status remediation_status DEFAULT NULL,
  p_source remediation_source DEFAULT NULL,
  p_priority remediation_priority DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source remediation_source,
  title TEXT,
  description TEXT,
  status remediation_status,
  priority remediation_priority,
  suggested_due TIMESTAMPTZ,
  assigned_to TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rt.id,
    rt.source,
    rt.title,
    rt.description,
    rt.status,
    rt.priority,
    rt.suggested_due,
    rt.assigned_to,
    rt.created_at,
    rt.updated_at,
    rt.completed_at
  FROM remediation_tasks rt
  WHERE rt.tenant_id = p_tenant_id
    AND (p_status IS NULL OR rt.status = p_status)
    AND (p_source IS NULL OR rt.source = p_source)
    AND (p_priority IS NULL OR rt.priority = p_priority)
  ORDER BY rt.priority DESC, rt.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create remediation task
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_remediation_task CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION create_remediation_task(
  p_tenant_id UUID,
  p_source remediation_source,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_priority remediation_priority DEFAULT 'medium',
  p_suggested_due TIMESTAMPTZ DEFAULT NULL,
  p_assigned_to TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_task_id UUID;
BEGIN
  INSERT INTO remediation_tasks (tenant_id, source, title, description, priority, suggested_due, assigned_to)
  VALUES (p_tenant_id, p_source, p_title, p_description, p_priority, p_suggested_due, p_assigned_to)
  RETURNING id INTO v_task_id;

  RETURN v_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update task status
DO $$
BEGIN
  DROP FUNCTION IF EXISTS update_remediation_status CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION update_remediation_status(
  p_task_id UUID,
  p_status remediation_status
)
RETURNS VOID AS $$
BEGIN
  UPDATE remediation_tasks
  SET
    status = p_status,
    completed_at = CASE WHEN p_status = 'done' THEN now() ELSE completed_at END
  WHERE id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Link task to entity
DO $$
BEGIN
  DROP FUNCTION IF EXISTS link_remediation_task CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION link_remediation_task(
  p_task_id UUID,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_link_id UUID;
BEGIN
  INSERT INTO remediation_links (task_id, entity_type, entity_id, metadata)
  VALUES (p_task_id, p_entity_type, p_entity_id, p_metadata)
  RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get remediation summary
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_remediation_summary CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_remediation_summary(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_tasks', COUNT(*),
    'open', COUNT(*) FILTER (WHERE rt.status = 'open'),
    'in_progress', COUNT(*) FILTER (WHERE rt.status = 'in_progress'),
    'blocked', COUNT(*) FILTER (WHERE rt.status = 'blocked'),
    'done', COUNT(*) FILTER (WHERE rt.status = 'done'),
    'critical', COUNT(*) FILTER (WHERE rt.priority = 'critical'),
    'high', COUNT(*) FILTER (WHERE rt.priority = 'high'),
    'overdue', (
      SELECT COUNT(*) FROM remediation_tasks rt_sub
      WHERE rt_sub.tenant_id = p_tenant_id
        AND rt_sub.suggested_due < now()
        AND rt_sub.status != 'done'
    )
  ) INTO v_result
  FROM remediation_tasks rt
  WHERE rt.tenant_id = p_tenant_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE remediation_tasks IS 'E35: System-generated remediation tasks';
COMMENT ON TABLE remediation_links IS 'E35: Links remediation tasks to source entities';

-- Migration complete
