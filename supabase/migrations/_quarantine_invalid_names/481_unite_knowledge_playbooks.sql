-- =====================================================================
-- Phase D53: Knowledge Graph + SOP/Playbook Engine
-- =====================================================================
-- Tables: unite_knowledge_nodes, unite_knowledge_edges, unite_playbooks,
--         unite_playbook_steps, unite_playbook_executions
--
-- Purpose:
-- - Organization-level knowledge graph for documentation and insights
-- - SOP/Playbook templates with step-by-step execution
-- - Execution tracking and AI-powered recommendations
--
-- Key Concepts:
-- - Nodes represent concepts, documents, or entities
-- - Edges represent relationships between nodes (e.g., "depends_on", "relates_to")
-- - Playbooks are templates with ordered steps
-- - Playbook executions track real-world usage and outcomes
-- - Uses RLS for tenant isolation
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08

-- =====================================================================
-- 1. ENUM Types
-- =====================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unite_node_type') THEN
    CREATE TYPE unite_node_type AS ENUM (
      'concept',
      'document',
      'process',
      'person',
      'tool',
      'metric',
      'insight'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unite_edge_type') THEN
    CREATE TYPE unite_edge_type AS ENUM (
      'depends_on',
      'relates_to',
      'contains',
      'owned_by',
      'uses',
      'produces',
      'influences'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unite_playbook_status') THEN
    CREATE TYPE unite_playbook_status AS ENUM (
      'draft',
      'active',
      'archived',
      'deprecated'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unite_step_type') THEN
    CREATE TYPE unite_step_type AS ENUM (
      'action',
      'decision',
      'approval',
      'notification',
      'data_entry',
      'review'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unite_execution_status') THEN
    CREATE TYPE unite_execution_status AS ENUM (
      'pending',
      'in_progress',
      'completed',
      'failed',
      'cancelled'
    );
  END IF;
END $$;

-- =====================================================================
-- 2. Knowledge Graph Tables
-- =====================================================================

CREATE TABLE IF NOT EXISTS unite_knowledge_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,

  -- Node identification
  name text NOT NULL,
  node_type unite_node_type NOT NULL,
  description text,

  -- Content
  content jsonb, -- Flexible content storage
  metadata jsonb, -- Tags, labels, custom fields

  -- Relationships
  parent_id uuid REFERENCES unite_knowledge_nodes(id) ON DELETE SET NULL,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unite_knowledge_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,

  -- Edge identification
  from_node_id uuid NOT NULL REFERENCES unite_knowledge_nodes(id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES unite_knowledge_nodes(id) ON DELETE CASCADE,
  edge_type unite_edge_type NOT NULL,

  -- Edge properties
  weight numeric DEFAULT 1.0, -- Strength of relationship
  properties jsonb, -- Custom edge properties

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 3. Playbook Tables
-- =====================================================================

CREATE TABLE IF NOT EXISTS unite_playbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,

  -- Playbook identification
  name text NOT NULL,
  description text,
  category text, -- 'onboarding', 'sales', 'support', 'marketing', etc.

  -- Playbook configuration
  status unite_playbook_status DEFAULT 'draft',
  version integer DEFAULT 1,
  tags text[],

  -- Metadata
  estimated_duration_minutes integer,
  difficulty text, -- 'easy', 'medium', 'hard'
  ai_generated boolean DEFAULT false,

  -- Audit
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unite_playbook_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id uuid NOT NULL REFERENCES unite_playbooks(id) ON DELETE CASCADE,

  -- Step identification
  step_order integer NOT NULL, -- 1, 2, 3, ...
  name text NOT NULL,
  description text,
  step_type unite_step_type NOT NULL,

  -- Step configuration
  config jsonb, -- { "assignee_role": "manager", "approval_required": true, ... }
  dependencies jsonb, -- { "requires_steps": [1, 2], "blocks_steps": [5] }

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS unite_playbook_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  playbook_id uuid NOT NULL REFERENCES unite_playbooks(id) ON DELETE CASCADE,

  -- Execution metadata
  status unite_execution_status DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,

  -- Execution context
  executed_by uuid,
  context jsonb, -- Business context, variables, etc.

  -- Results
  current_step_id uuid REFERENCES unite_playbook_steps(id),
  step_results jsonb, -- { "step_1": { "status": "completed", "notes": "..." }, ... }
  outcome text, -- 'success', 'partial', 'failed'
  ai_feedback jsonb, -- AI-generated insights on execution

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 4. Indexes
-- =====================================================================

-- Knowledge Nodes
CREATE INDEX IF NOT EXISTS idx_unite_knowledge_nodes_tenant
  ON unite_knowledge_nodes(tenant_id);

CREATE INDEX IF NOT EXISTS idx_unite_knowledge_nodes_type
  ON unite_knowledge_nodes(tenant_id, node_type);

CREATE INDEX IF NOT EXISTS idx_unite_knowledge_nodes_parent
  ON unite_knowledge_nodes(parent_id);

-- Knowledge Edges
CREATE INDEX IF NOT EXISTS idx_unite_knowledge_edges_tenant
  ON unite_knowledge_edges(tenant_id);

CREATE INDEX IF NOT EXISTS idx_unite_knowledge_edges_from
  ON unite_knowledge_edges(from_node_id);

CREATE INDEX IF NOT EXISTS idx_unite_knowledge_edges_to
  ON unite_knowledge_edges(to_node_id);

CREATE INDEX IF NOT EXISTS idx_unite_knowledge_edges_type
  ON unite_knowledge_edges(edge_type);

-- Playbooks
CREATE INDEX IF NOT EXISTS idx_unite_playbooks_tenant
  ON unite_playbooks(tenant_id);

CREATE INDEX IF NOT EXISTS idx_unite_playbooks_status
  ON unite_playbooks(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_unite_playbooks_category
  ON unite_playbooks(category);

-- Playbook Steps
CREATE INDEX IF NOT EXISTS idx_unite_playbook_steps_playbook
  ON unite_playbook_steps(playbook_id, step_order);

-- Playbook Executions
CREATE INDEX IF NOT EXISTS idx_unite_playbook_executions_tenant
  ON unite_playbook_executions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_unite_playbook_executions_playbook
  ON unite_playbook_executions(playbook_id);

CREATE INDEX IF NOT EXISTS idx_unite_playbook_executions_status
  ON unite_playbook_executions(status);

-- =====================================================================
-- 5. RLS Policies
-- =====================================================================

ALTER TABLE unite_knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_knowledge_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_playbook_executions ENABLE ROW LEVEL SECURITY;

-- Knowledge Nodes
DROP POLICY IF EXISTS "tenant_isolation" ON unite_knowledge_nodes;
CREATE POLICY "tenant_isolation" ON unite_knowledge_nodes
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Knowledge Edges
DROP POLICY IF EXISTS "tenant_isolation" ON unite_knowledge_edges;
CREATE POLICY "tenant_isolation" ON unite_knowledge_edges
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Playbooks
DROP POLICY IF EXISTS "tenant_isolation" ON unite_playbooks;
CREATE POLICY "tenant_isolation" ON unite_playbooks
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Playbook Executions
DROP POLICY IF EXISTS "tenant_isolation" ON unite_playbook_executions;
CREATE POLICY "tenant_isolation" ON unite_playbook_executions
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================================
-- 6. Helper Functions
-- =====================================================================

/**
 * Get knowledge graph neighbors for a node
 */
CREATE OR REPLACE FUNCTION unite_get_node_neighbors(
  p_node_id uuid,
  p_direction text DEFAULT 'both' -- 'outgoing' | 'incoming' | 'both'
) RETURNS TABLE(
  neighbor_id uuid,
  neighbor_name text,
  neighbor_type unite_node_type,
  edge_type unite_edge_type,
  edge_weight numeric,
  direction text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id AS neighbor_id,
    n.name AS neighbor_name,
    n.node_type AS neighbor_type,
    e.edge_type,
    e.weight AS edge_weight,
    'outgoing'::text AS direction
  FROM unite_knowledge_edges e
  JOIN unite_knowledge_nodes n ON e.to_node_id = n.id
  WHERE e.from_node_id = p_node_id
    AND (p_direction = 'both' OR p_direction = 'outgoing')

  UNION ALL

  SELECT
    n.id AS neighbor_id,
    n.name AS neighbor_name,
    n.node_type AS neighbor_type,
    e.edge_type,
    e.weight AS edge_weight,
    'incoming'::text AS direction
  FROM unite_knowledge_edges e
  JOIN unite_knowledge_nodes n ON e.from_node_id = n.id
  WHERE e.to_node_id = p_node_id
    AND (p_direction = 'both' OR p_direction = 'incoming');
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get playbook execution summary
 */
CREATE OR REPLACE FUNCTION unite_get_playbook_execution_summary(
  p_playbook_id uuid
) RETURNS TABLE(
  total_executions bigint,
  completed_executions bigint,
  failed_executions bigint,
  avg_duration_minutes numeric,
  success_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_executions,
    COUNT(*) FILTER (WHERE status = 'completed')::bigint AS completed_executions,
    COUNT(*) FILTER (WHERE status = 'failed')::bigint AS failed_executions,
    AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60)::numeric AS avg_duration_minutes,
    CASE
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE status = 'completed')::numeric / COUNT(*)::numeric) * 100
      ELSE 0
    END AS success_rate
  FROM unite_playbook_executions
  WHERE playbook_id = p_playbook_id;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get next step in playbook execution
 */
CREATE OR REPLACE FUNCTION unite_get_next_playbook_step(
  p_execution_id uuid
) RETURNS TABLE(
  step_id uuid,
  step_order integer,
  step_name text,
  step_type unite_step_type,
  step_description text,
  step_config jsonb
) AS $$
DECLARE
  v_playbook_id uuid;
  v_current_step_order integer;
BEGIN
  -- Get playbook and current step
  SELECT
    playbook_id,
    COALESCE((SELECT step_order FROM unite_playbook_steps WHERE id = e.current_step_id), 0)
  INTO v_playbook_id, v_current_step_order
  FROM unite_playbook_executions e
  WHERE e.id = p_execution_id;

  -- Return next step
  RETURN QUERY
  SELECT
    s.id AS step_id,
    s.step_order,
    s.name AS step_name,
    s.step_type,
    s.description AS step_description,
    s.config AS step_config
  FROM unite_playbook_steps s
  WHERE s.playbook_id = v_playbook_id
    AND s.step_order > v_current_step_order
  ORDER BY s.step_order ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION unite_get_node_neighbors IS 'Get neighboring nodes in knowledge graph';
COMMENT ON FUNCTION unite_get_playbook_execution_summary IS 'Get execution statistics for a playbook';
COMMENT ON FUNCTION unite_get_next_playbook_step IS 'Get next step in playbook execution';
