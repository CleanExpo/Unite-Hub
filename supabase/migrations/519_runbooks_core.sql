-- Phase E30: Runbook & Playbook Center
-- Migration: 519
-- Purpose: Reusable playbooks for incident response, compliance workflows, onboarding
-- Tables: runbooks, runbook_steps, runbook_assignments
-- Functions: list_runbooks, create_runbook, create_runbook_step, assign_runbook, execute_runbook_step, get_runbook_status
-- RLS: All tables tenant-scoped

-- =====================================================
-- 1. ENUMS (Idempotent)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE runbook_category AS ENUM (
    'incident_response',
    'compliance',
    'onboarding',
    'maintenance',
    'security',
    'backup_recovery',
    'deployment',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE runbook_step_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE runbook_assignment_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TABLES
-- =====================================================

-- Runbook templates (reusable playbooks)
CREATE TABLE IF NOT EXISTS runbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category runbook_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_template BOOLEAN NOT NULL DEFAULT TRUE,
  estimated_duration_minutes INTEGER,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_runbooks_tenant ON runbooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_runbooks_category ON runbooks(category);
CREATE INDEX IF NOT EXISTS idx_runbooks_created_by ON runbooks(created_by);

-- Individual steps within a runbook
CREATE TABLE IF NOT EXISTS runbook_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  runbook_id UUID NOT NULL REFERENCES runbooks(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  action_type TEXT, -- 'manual', 'automated', 'approval', 'notification'
  estimated_minutes INTEGER,
  dependencies UUID[], -- Array of step IDs that must complete first
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(runbook_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_runbook_steps_runbook ON runbook_steps(runbook_id);
CREATE INDEX IF NOT EXISTS idx_runbook_steps_order ON runbook_steps(runbook_id, step_order);

-- Runbook assignments (instances of runbook execution)
CREATE TABLE IF NOT EXISTS runbook_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  runbook_id UUID NOT NULL REFERENCES runbooks(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status runbook_assignment_status NOT NULL DEFAULT 'draft',
  context JSONB DEFAULT '{}'::jsonb, -- Contextual data for this execution
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_runbook_assignments_tenant ON runbook_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_runbook_assignments_runbook ON runbook_assignments(runbook_id);
CREATE INDEX IF NOT EXISTS idx_runbook_assignments_assigned_to ON runbook_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_runbook_assignments_status ON runbook_assignments(status);

-- Step execution tracking
CREATE TABLE IF NOT EXISTS runbook_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES runbook_assignments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES runbook_steps(id) ON DELETE CASCADE,
  status runbook_step_status NOT NULL DEFAULT 'pending',
  executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_runbook_step_executions_assignment ON runbook_step_executions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_runbook_step_executions_step ON runbook_step_executions(step_id);
CREATE INDEX IF NOT EXISTS idx_runbook_step_executions_status ON runbook_step_executions(status);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE runbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE runbook_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE runbook_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE runbook_step_executions ENABLE ROW LEVEL SECURITY;

-- Runbooks: Tenant-scoped
DROP POLICY IF EXISTS runbooks_tenant_isolation ON runbooks;
CREATE POLICY runbooks_tenant_isolation ON runbooks
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Runbook steps: Via runbook tenant_id
DROP POLICY IF EXISTS runbook_steps_tenant_isolation ON runbook_steps;
CREATE POLICY runbook_steps_tenant_isolation ON runbook_steps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM runbooks WHERE runbooks.id = runbook_steps.runbook_id AND runbooks.tenant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM runbooks WHERE runbooks.id = runbook_steps.runbook_id AND runbooks.tenant_id = auth.uid()
    )
  );

-- Runbook assignments: Tenant-scoped
DROP POLICY IF EXISTS runbook_assignments_tenant_isolation ON runbook_assignments;
CREATE POLICY runbook_assignments_tenant_isolation ON runbook_assignments
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Step executions: Via assignment tenant_id
DROP POLICY IF EXISTS runbook_step_executions_tenant_isolation ON runbook_step_executions;
CREATE POLICY runbook_step_executions_tenant_isolation ON runbook_step_executions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM runbook_assignments WHERE runbook_assignments.id = runbook_step_executions.assignment_id AND runbook_assignments.tenant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM runbook_assignments WHERE runbook_assignments.id = runbook_step_executions.assignment_id AND runbook_assignments.tenant_id = auth.uid()
    )
  );

-- =====================================================
-- 4. TRIGGERS (updated_at)
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_runbooks ON runbooks;
CREATE TRIGGER set_updated_at_runbooks BEFORE UPDATE ON runbooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_runbook_steps ON runbook_steps;
CREATE TRIGGER set_updated_at_runbook_steps BEFORE UPDATE ON runbook_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_runbook_assignments ON runbook_assignments;
CREATE TRIGGER set_updated_at_runbook_assignments BEFORE UPDATE ON runbook_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_runbook_step_executions ON runbook_step_executions;
CREATE TRIGGER set_updated_at_runbook_step_executions BEFORE UPDATE ON runbook_step_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- List runbooks for tenant
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_runbooks CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_runbooks(
  p_tenant_id UUID,
  p_category runbook_category DEFAULT NULL,
  p_is_template BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  category runbook_category,
  title TEXT,
  description TEXT,
  created_by UUID,
  is_template BOOLEAN,
  estimated_duration_minutes INTEGER,
  tags TEXT[],
  step_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.category,
    r.title,
    r.description,
    r.created_by,
    r.is_template,
    r.estimated_duration_minutes,
    r.tags,
    COUNT(rs.id) AS step_count,
    r.created_at,
    r.updated_at
  FROM runbooks r
  LEFT JOIN runbook_steps rs ON rs.runbook_id = r.id
  WHERE r.tenant_id = p_tenant_id
    AND (p_category IS NULL OR r.category = p_category)
    AND (p_is_template IS NULL OR r.is_template = p_is_template)
  GROUP BY r.id
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create runbook
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_runbook CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION create_runbook(
  p_tenant_id UUID,
  p_category runbook_category,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_is_template BOOLEAN DEFAULT TRUE,
  p_estimated_duration_minutes INTEGER DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_runbook_id UUID;
BEGIN
  INSERT INTO runbooks (tenant_id, category, title, description, created_by, is_template, estimated_duration_minutes, tags)
  VALUES (p_tenant_id, p_category, p_title, p_description, COALESCE(p_created_by, p_tenant_id), p_is_template, p_estimated_duration_minutes, p_tags)
  RETURNING id INTO v_runbook_id;

  RETURN v_runbook_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create runbook step
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_runbook_step CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION create_runbook_step(
  p_runbook_id UUID,
  p_step_order INTEGER,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_action_type TEXT DEFAULT 'manual',
  p_estimated_minutes INTEGER DEFAULT NULL,
  p_dependencies UUID[] DEFAULT NULL,
  p_config JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_step_id UUID;
BEGIN
  INSERT INTO runbook_steps (runbook_id, step_order, title, description, action_type, estimated_minutes, dependencies, config)
  VALUES (p_runbook_id, p_step_order, p_title, p_description, p_action_type, p_estimated_minutes, p_dependencies, p_config)
  RETURNING id INTO v_step_id;

  RETURN v_step_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Assign runbook
DO $$
BEGIN
  DROP FUNCTION IF EXISTS assign_runbook CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION assign_runbook(
  p_tenant_id UUID,
  p_runbook_id UUID,
  p_assigned_to UUID,
  p_assigned_by UUID,
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_assignment_id UUID;
BEGIN
  INSERT INTO runbook_assignments (tenant_id, runbook_id, assigned_to, assigned_by, status, context)
  VALUES (p_tenant_id, p_runbook_id, p_assigned_to, p_assigned_by, 'draft', p_context)
  RETURNING id INTO v_assignment_id;

  -- Initialize step executions for all steps
  INSERT INTO runbook_step_executions (assignment_id, step_id, status)
  SELECT v_assignment_id, rs.id, 'pending'
  FROM runbook_steps rs
  WHERE rs.runbook_id = p_runbook_id
  ORDER BY rs.step_order;

  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update runbook assignment status
DO $$
BEGIN
  DROP FUNCTION IF EXISTS update_assignment_status CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION update_assignment_status(
  p_assignment_id UUID,
  p_status runbook_assignment_status
)
RETURNS VOID AS $$
BEGIN
  UPDATE runbook_assignments
  SET
    status = p_status,
    started_at = CASE WHEN p_status = 'active' AND started_at IS NULL THEN now() ELSE started_at END,
    completed_at = CASE WHEN p_status IN ('completed', 'cancelled') THEN now() ELSE completed_at END
  WHERE id = p_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute runbook step
DO $$
BEGIN
  DROP FUNCTION IF EXISTS execute_runbook_step CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION execute_runbook_step(
  p_execution_id UUID,
  p_status runbook_step_status,
  p_executed_by UUID,
  p_notes TEXT DEFAULT NULL,
  p_result JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  UPDATE runbook_step_executions
  SET
    status = p_status,
    executed_by = p_executed_by,
    started_at = CASE WHEN p_status = 'in_progress' AND started_at IS NULL THEN now() ELSE started_at END,
    completed_at = CASE WHEN p_status IN ('completed', 'skipped', 'failed') THEN now() ELSE completed_at END,
    notes = COALESCE(p_notes, notes),
    result = p_result
  WHERE id = p_execution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get runbook status (assignment with progress)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_runbook_status CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_runbook_status(p_assignment_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'assignment_id', ra.id,
    'runbook_id', ra.runbook_id,
    'runbook_title', r.title,
    'assigned_to', ra.assigned_to,
    'assigned_by', ra.assigned_by,
    'status', ra.status,
    'started_at', ra.started_at,
    'completed_at', ra.completed_at,
    'total_steps', COUNT(rse.id),
    'pending_steps', COUNT(*) FILTER (WHERE rse.status = 'pending'),
    'in_progress_steps', COUNT(*) FILTER (WHERE rse.status = 'in_progress'),
    'completed_steps', COUNT(*) FILTER (WHERE rse.status = 'completed'),
    'skipped_steps', COUNT(*) FILTER (WHERE rse.status = 'skipped'),
    'failed_steps', COUNT(*) FILTER (WHERE rse.status = 'failed'),
    'progress_percent',
      CASE
        WHEN COUNT(rse.id) > 0 THEN
          ROUND((COUNT(*) FILTER (WHERE rse.status IN ('completed', 'skipped')) * 100.0) / COUNT(rse.id))
        ELSE 0
      END
  ) INTO v_result
  FROM runbook_assignments ra
  INNER JOIN runbooks r ON r.id = ra.runbook_id
  LEFT JOIN runbook_step_executions rse ON rse.assignment_id = ra.id
  WHERE ra.id = p_assignment_id
  GROUP BY ra.id, r.title, ra.assigned_to, ra.assigned_by, ra.status, ra.started_at, ra.completed_at;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List runbook assignments
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_runbook_assignments CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_runbook_assignments(
  p_tenant_id UUID,
  p_status runbook_assignment_status DEFAULT NULL,
  p_assigned_to UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  runbook_id UUID,
  runbook_title TEXT,
  assigned_to UUID,
  assigned_by UUID,
  status runbook_assignment_status,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ra.id,
    ra.runbook_id,
    r.title AS runbook_title,
    ra.assigned_to,
    ra.assigned_by,
    ra.status,
    ra.started_at,
    ra.completed_at,
    ra.created_at
  FROM runbook_assignments ra
  INNER JOIN runbooks r ON r.id = ra.runbook_id
  WHERE ra.tenant_id = p_tenant_id
    AND (p_status IS NULL OR ra.status = p_status)
    AND (p_assigned_to IS NULL OR ra.assigned_to = p_assigned_to)
  ORDER BY ra.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE runbooks IS 'E30: Runbook templates for reusable playbooks';
COMMENT ON TABLE runbook_steps IS 'E30: Individual steps within runbooks';
COMMENT ON TABLE runbook_assignments IS 'E30: Runbook execution instances';
COMMENT ON TABLE runbook_step_executions IS 'E30: Step-level execution tracking';

-- Migration complete
