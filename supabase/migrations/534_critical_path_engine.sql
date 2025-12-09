-- Phase E45: Founder Critical Path Engine
-- Migration: 534
-- Description: Tracks critical initiatives and dependency graph nodes for strategic planning.

-- Drop existing objects (idempotent)
DROP TABLE IF EXISTS critical_path_nodes CASCADE;
DROP TABLE IF EXISTS critical_paths CASCADE;

DO $$ BEGIN
  CREATE TYPE critical_path_status AS ENUM ('planning', 'active', 'blocked', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE critical_node_state AS ENUM ('pending', 'in_progress', 'blocked', 'done', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Critical Paths (high-level initiatives)
CREATE TABLE critical_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status critical_path_status NOT NULL DEFAULT 'planning',
  start_date DATE,
  target_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- Critical Path Nodes (dependency graph nodes)
CREATE TABLE critical_path_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_code TEXT NOT NULL,
  node_code TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  depends_on TEXT[] DEFAULT ARRAY[]::TEXT[],
  state critical_node_state NOT NULL DEFAULT 'pending',
  weight NUMERIC DEFAULT 1.0,
  assignee TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, path_code, node_code)
);

-- Enable RLS
ALTER TABLE critical_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE critical_path_nodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY critical_paths_tenant_policy ON critical_paths
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY critical_path_nodes_tenant_policy ON critical_path_nodes
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- Indexes
CREATE INDEX idx_critical_paths_tenant_code ON critical_paths (tenant_id, code);
CREATE INDEX idx_critical_paths_status ON critical_paths (tenant_id, status, created_at DESC);

CREATE INDEX idx_critical_path_nodes_tenant_path ON critical_path_nodes (tenant_id, path_code, created_at DESC);
CREATE INDEX idx_critical_path_nodes_state ON critical_path_nodes (tenant_id, state, created_at DESC);
CREATE INDEX idx_critical_path_nodes_depends ON critical_path_nodes USING GIN (depends_on);

-- Functions
DROP FUNCTION IF EXISTS record_critical_path CASCADE;
CREATE OR REPLACE FUNCTION record_critical_path(
  p_tenant_id UUID,
  p_code TEXT,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_target_date DATE DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_path_id UUID;
BEGIN
  INSERT INTO critical_paths (tenant_id, code, name, description, start_date, target_date, metadata)
  VALUES (p_tenant_id, p_code, p_name, p_description, p_start_date, p_target_date, p_metadata)
  ON CONFLICT (tenant_id, code) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      start_date = EXCLUDED.start_date,
      target_date = EXCLUDED.target_date,
      metadata = EXCLUDED.metadata,
      updated_at = now()
  RETURNING id INTO v_path_id;

  RETURN v_path_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS record_critical_node CASCADE;
CREATE OR REPLACE FUNCTION record_critical_node(
  p_tenant_id UUID,
  p_path_code TEXT,
  p_node_code TEXT,
  p_label TEXT,
  p_description TEXT DEFAULT NULL,
  p_depends_on TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_weight NUMERIC DEFAULT 1.0,
  p_assignee TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_node_id UUID;
BEGIN
  INSERT INTO critical_path_nodes (tenant_id, path_code, node_code, label, description, depends_on, weight, assignee, metadata)
  VALUES (p_tenant_id, p_path_code, p_node_code, p_label, p_description, p_depends_on, p_weight, p_assignee, p_metadata)
  ON CONFLICT (tenant_id, path_code, node_code) DO UPDATE
  SET label = EXCLUDED.label,
      description = EXCLUDED.description,
      depends_on = EXCLUDED.depends_on,
      weight = EXCLUDED.weight,
      assignee = EXCLUDED.assignee,
      metadata = EXCLUDED.metadata,
      updated_at = now()
  RETURNING id INTO v_node_id;

  RETURN v_node_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS update_node_state CASCADE;
CREATE OR REPLACE FUNCTION update_node_state(
  p_node_id UUID,
  p_state critical_node_state
)
RETURNS VOID AS $$
BEGIN
  UPDATE critical_path_nodes
  SET
    state = p_state,
    started_at = CASE WHEN p_state = 'in_progress' AND started_at IS NULL THEN now() ELSE started_at END,
    completed_at = CASE WHEN p_state = 'done' THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = p_node_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_critical_paths CASCADE;
CREATE OR REPLACE FUNCTION list_critical_paths(
  p_tenant_id UUID,
  p_status critical_path_status DEFAULT NULL
)
RETURNS SETOF critical_paths AS $$
BEGIN
  RETURN QUERY
  SELECT cp.*
  FROM critical_paths cp
  WHERE cp.tenant_id = p_tenant_id
    AND (p_status IS NULL OR cp.status = p_status)
  ORDER BY cp.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_critical_nodes CASCADE;
CREATE OR REPLACE FUNCTION list_critical_nodes(
  p_tenant_id UUID,
  p_path_code TEXT
)
RETURNS SETOF critical_path_nodes AS $$
BEGIN
  RETURN QUERY
  SELECT cpn.*
  FROM critical_path_nodes cpn
  WHERE cpn.tenant_id = p_tenant_id
    AND cpn.path_code = p_path_code
  ORDER BY cpn.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_critical_path_summary CASCADE;
CREATE OR REPLACE FUNCTION get_critical_path_summary(
  p_tenant_id UUID,
  p_path_code TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_nodes', COUNT(*),
    'pending_nodes', COUNT(*) FILTER (WHERE cpn.state = 'pending'),
    'in_progress_nodes', COUNT(*) FILTER (WHERE cpn.state = 'in_progress'),
    'blocked_nodes', COUNT(*) FILTER (WHERE cpn.state = 'blocked'),
    'done_nodes', COUNT(*) FILTER (WHERE cpn.state = 'done'),
    'total_weight', SUM(cpn.weight),
    'completed_weight', SUM(cpn.weight) FILTER (WHERE cpn.state = 'done'),
    'completion_pct', CASE
      WHEN SUM(cpn.weight) > 0 THEN (SUM(cpn.weight) FILTER (WHERE cpn.state = 'done') / SUM(cpn.weight) * 100)
      ELSE 0
    END
  ) INTO v_result
  FROM critical_path_nodes cpn
  WHERE cpn.tenant_id = p_tenant_id
    AND cpn.path_code = p_path_code;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
