-- Phase E46: System-of-Systems Coherence Matrix
-- Migration: 535
-- Description: Tracks relationships and coherence scores between interconnected subsystems.

-- Drop existing objects (idempotent)
DROP TABLE IF EXISTS coherence_matrix_edges CASCADE;
DROP TABLE IF EXISTS coherence_matrix_nodes CASCADE;

DO $$ BEGIN
  CREATE TYPE coherence_edge_type AS ENUM ('api_dependency', 'data_flow', 'event_subscription', 'shared_resource', 'logical_coupling', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE coherence_health AS ENUM ('aligned', 'minor_drift', 'major_drift', 'critical_mismatch', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Coherence Matrix Nodes (subsystems)
CREATE TABLE coherence_matrix_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  system_code TEXT NOT NULL,
  system_name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, system_code)
);

-- Coherence Matrix Edges (relationships between subsystems)
CREATE TABLE coherence_matrix_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_system TEXT NOT NULL,
  target_system TEXT NOT NULL,
  edge_type coherence_edge_type NOT NULL DEFAULT 'other',
  coherence_score NUMERIC CHECK (coherence_score >= 0 AND coherence_score <= 100),
  drift_score NUMERIC CHECK (drift_score >= 0 AND drift_score <= 100),
  health coherence_health NOT NULL DEFAULT 'unknown',
  last_verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, source_system, target_system)
);

-- Enable RLS
ALTER TABLE coherence_matrix_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coherence_matrix_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY coherence_matrix_nodes_tenant_policy ON coherence_matrix_nodes
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY coherence_matrix_edges_tenant_policy ON coherence_matrix_edges
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- Indexes
CREATE INDEX idx_coherence_matrix_nodes_tenant ON coherence_matrix_nodes (tenant_id, system_code);
CREATE INDEX idx_coherence_matrix_edges_tenant_source ON coherence_matrix_edges (tenant_id, source_system, created_at DESC);
CREATE INDEX idx_coherence_matrix_edges_tenant_target ON coherence_matrix_edges (tenant_id, target_system, created_at DESC);
CREATE INDEX idx_coherence_matrix_edges_health ON coherence_matrix_edges (tenant_id, health, created_at DESC);

-- Functions
DROP FUNCTION IF EXISTS record_coherence_node CASCADE;
CREATE OR REPLACE FUNCTION record_coherence_node(
  p_tenant_id UUID,
  p_system_code TEXT,
  p_system_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_node_id UUID;
BEGIN
  INSERT INTO coherence_matrix_nodes (tenant_id, system_code, system_name, description, metadata)
  VALUES (p_tenant_id, p_system_code, p_system_name, p_description, p_metadata)
  ON CONFLICT (tenant_id, system_code) DO UPDATE
  SET system_name = EXCLUDED.system_name,
      description = EXCLUDED.description,
      metadata = EXCLUDED.metadata,
      updated_at = now()
  RETURNING id INTO v_node_id;

  RETURN v_node_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS record_coherence_edge CASCADE;
CREATE OR REPLACE FUNCTION record_coherence_edge(
  p_tenant_id UUID,
  p_source_system TEXT,
  p_target_system TEXT,
  p_edge_type coherence_edge_type,
  p_coherence_score NUMERIC DEFAULT NULL,
  p_drift_score NUMERIC DEFAULT NULL,
  p_health coherence_health DEFAULT 'unknown',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_edge_id UUID;
BEGIN
  INSERT INTO coherence_matrix_edges (tenant_id, source_system, target_system, edge_type, coherence_score, drift_score, health, last_verified_at, metadata)
  VALUES (p_tenant_id, p_source_system, p_target_system, p_edge_type, p_coherence_score, p_drift_score, p_health, now(), p_metadata)
  ON CONFLICT (tenant_id, source_system, target_system) DO UPDATE
  SET edge_type = EXCLUDED.edge_type,
      coherence_score = EXCLUDED.coherence_score,
      drift_score = EXCLUDED.drift_score,
      health = EXCLUDED.health,
      last_verified_at = now(),
      metadata = EXCLUDED.metadata,
      updated_at = now()
  RETURNING id INTO v_edge_id;

  RETURN v_edge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_coherence_nodes CASCADE;
CREATE OR REPLACE FUNCTION list_coherence_nodes(
  p_tenant_id UUID
)
RETURNS SETOF coherence_matrix_nodes AS $$
BEGIN
  RETURN QUERY
  SELECT cn.*
  FROM coherence_matrix_nodes cn
  WHERE cn.tenant_id = p_tenant_id
  ORDER BY cn.system_code ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_coherence_edges CASCADE;
CREATE OR REPLACE FUNCTION list_coherence_edges(
  p_tenant_id UUID,
  p_health coherence_health DEFAULT NULL,
  p_limit INTEGER DEFAULT 300
)
RETURNS SETOF coherence_matrix_edges AS $$
BEGIN
  RETURN QUERY
  SELECT ce.*
  FROM coherence_matrix_edges ce
  WHERE ce.tenant_id = p_tenant_id
    AND (p_health IS NULL OR ce.health = p_health)
  ORDER BY ce.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_coherence_summary CASCADE;
CREATE OR REPLACE FUNCTION get_coherence_summary(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_nodes', (SELECT COUNT(*) FROM coherence_matrix_nodes cn WHERE cn.tenant_id = p_tenant_id),
    'total_edges', (SELECT COUNT(*) FROM coherence_matrix_edges ce WHERE ce.tenant_id = p_tenant_id),
    'aligned_edges', (SELECT COUNT(*) FROM coherence_matrix_edges ce WHERE ce.tenant_id = p_tenant_id AND ce.health = 'aligned'),
    'critical_mismatches', (SELECT COUNT(*) FROM coherence_matrix_edges ce WHERE ce.tenant_id = p_tenant_id AND ce.health = 'critical_mismatch'),
    'avg_coherence_score', (SELECT AVG(ce.coherence_score) FROM coherence_matrix_edges ce WHERE ce.tenant_id = p_tenant_id AND ce.coherence_score IS NOT NULL),
    'avg_drift_score', (SELECT AVG(ce.drift_score) FROM coherence_matrix_edges ce WHERE ce.tenant_id = p_tenant_id AND ce.drift_score IS NOT NULL)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
