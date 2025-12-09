-- =====================================================
-- Migration: 539_founder_daily_ops_graph.sql
-- Phase: F01 - Founder Daily Ops Graph
-- Description: Graph representation of founder's daily operational surface
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE ops_node_category AS ENUM (
    'inbox',
    'decision',
    'review',
    'approval',
    'monitor',
    'action',
    'meeting',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ops_node_state AS ENUM (
    'active',
    'pending',
    'completed',
    'blocked',
    'deferred'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Streams: High-level operational streams
DROP TABLE IF EXISTS founder_ops_streams CASCADE;
CREATE TABLE founder_ops_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_code TEXT NOT NULL,
  stream_name TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, stream_code)
);

-- Nodes: Granular operational nodes within streams
DROP TABLE IF EXISTS founder_ops_nodes CASCADE;
CREATE TABLE founder_ops_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_code TEXT NOT NULL,
  node_code TEXT NOT NULL,
  label TEXT NOT NULL,
  category ops_node_category NOT NULL DEFAULT 'other',
  state ops_node_state NOT NULL DEFAULT 'active',
  importance INTEGER CHECK (importance >= 0 AND importance <= 100),
  last_activity_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, stream_code, node_code)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_founder_ops_streams_tenant ON founder_ops_streams(tenant_id, stream_code);
CREATE INDEX idx_founder_ops_nodes_tenant ON founder_ops_nodes(tenant_id, stream_code);
CREATE INDEX idx_founder_ops_nodes_state ON founder_ops_nodes(tenant_id, state);
CREATE INDEX idx_founder_ops_nodes_category ON founder_ops_nodes(tenant_id, category);
CREATE INDEX idx_founder_ops_nodes_importance ON founder_ops_nodes(tenant_id, importance DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE founder_ops_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_ops_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS founder_ops_streams_tenant_isolation ON founder_ops_streams;
CREATE POLICY founder_ops_streams_tenant_isolation ON founder_ops_streams
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS founder_ops_nodes_tenant_isolation ON founder_ops_nodes;
CREATE POLICY founder_ops_nodes_tenant_isolation ON founder_ops_nodes
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record stream
DROP FUNCTION IF EXISTS record_ops_stream CASCADE;
CREATE OR REPLACE FUNCTION record_ops_stream(
  p_tenant_id UUID,
  p_stream_code TEXT,
  p_stream_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_stream_id UUID;
BEGIN
  INSERT INTO founder_ops_streams (tenant_id, stream_code, stream_name, description, metadata)
  VALUES (p_tenant_id, p_stream_code, p_stream_name, p_description, p_metadata)
  ON CONFLICT (tenant_id, stream_code) DO UPDATE
    SET stream_name = EXCLUDED.stream_name,
        description = EXCLUDED.description,
        metadata = EXCLUDED.metadata,
        updated_at = now()
  RETURNING id INTO v_stream_id;

  RETURN v_stream_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record node
DROP FUNCTION IF EXISTS record_ops_node CASCADE;
CREATE OR REPLACE FUNCTION record_ops_node(
  p_tenant_id UUID,
  p_stream_code TEXT,
  p_node_code TEXT,
  p_label TEXT,
  p_category ops_node_category DEFAULT 'other',
  p_state ops_node_state DEFAULT 'active',
  p_importance INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_node_id UUID;
BEGIN
  INSERT INTO founder_ops_nodes (tenant_id, stream_code, node_code, label, category, state, importance, last_activity_at, metadata)
  VALUES (p_tenant_id, p_stream_code, p_node_code, p_label, p_category, p_state, p_importance, now(), p_metadata)
  ON CONFLICT (tenant_id, stream_code, node_code) DO UPDATE
    SET label = EXCLUDED.label,
        category = EXCLUDED.category,
        state = EXCLUDED.state,
        importance = EXCLUDED.importance,
        last_activity_at = now(),
        metadata = EXCLUDED.metadata,
        updated_at = now()
  RETURNING id INTO v_node_id;

  RETURN v_node_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List streams
DROP FUNCTION IF EXISTS list_ops_streams CASCADE;
CREATE OR REPLACE FUNCTION list_ops_streams(
  p_tenant_id UUID
)
RETURNS TABLE(
  id UUID,
  stream_code TEXT,
  stream_name TEXT,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fos.id,
    fos.stream_code,
    fos.stream_name,
    fos.description,
    fos.metadata,
    fos.created_at,
    fos.updated_at
  FROM founder_ops_streams fos
  WHERE fos.tenant_id = p_tenant_id
  ORDER BY fos.stream_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List nodes
DROP FUNCTION IF EXISTS list_ops_nodes CASCADE;
CREATE OR REPLACE FUNCTION list_ops_nodes(
  p_tenant_id UUID,
  p_stream_code TEXT DEFAULT NULL,
  p_state ops_node_state DEFAULT NULL,
  p_category ops_node_category DEFAULT NULL,
  p_limit INTEGER DEFAULT 500
)
RETURNS TABLE(
  id UUID,
  stream_code TEXT,
  node_code TEXT,
  label TEXT,
  category ops_node_category,
  state ops_node_state,
  importance INTEGER,
  last_activity_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fon.id,
    fon.stream_code,
    fon.node_code,
    fon.label,
    fon.category,
    fon.state,
    fon.importance,
    fon.last_activity_at,
    fon.metadata,
    fon.created_at,
    fon.updated_at
  FROM founder_ops_nodes fon
  WHERE fon.tenant_id = p_tenant_id
    AND (p_stream_code IS NULL OR fon.stream_code = p_stream_code)
    AND (p_state IS NULL OR fon.state = p_state)
    AND (p_category IS NULL OR fon.category = p_category)
  ORDER BY fon.importance DESC NULLS LAST, fon.last_activity_at DESC NULLS LAST
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get ops summary
DROP FUNCTION IF EXISTS get_ops_summary CASCADE;
CREATE OR REPLACE FUNCTION get_ops_summary(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_streams', (SELECT COUNT(*) FROM founder_ops_streams WHERE tenant_id = p_tenant_id),
    'total_nodes', (SELECT COUNT(*) FROM founder_ops_nodes WHERE tenant_id = p_tenant_id),
    'by_state', (
      SELECT jsonb_object_agg(state, count)
      FROM (
        SELECT state, COUNT(*)::integer as count
        FROM founder_ops_nodes
        WHERE tenant_id = p_tenant_id
        GROUP BY state
      ) state_counts
    ),
    'by_category', (
      SELECT jsonb_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*)::integer as count
        FROM founder_ops_nodes
        WHERE tenant_id = p_tenant_id
        GROUP BY category
      ) category_counts
    ),
    'high_importance_count', (
      SELECT COUNT(*)
      FROM founder_ops_nodes
      WHERE tenant_id = p_tenant_id AND importance >= 80
    ),
    'active_nodes', (
      SELECT COUNT(*)
      FROM founder_ops_nodes
      WHERE tenant_id = p_tenant_id AND state = 'active'
    )
  ) INTO v_summary;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE founder_ops_streams IS 'F01: High-level operational streams for founder daily graph';
COMMENT ON TABLE founder_ops_nodes IS 'F01: Granular operational nodes within streams';
COMMENT ON FUNCTION record_ops_stream IS 'F01: Insert or update an ops stream';
COMMENT ON FUNCTION record_ops_node IS 'F01: Insert or update an ops node';
COMMENT ON FUNCTION list_ops_streams IS 'F01: List all streams for a tenant';
COMMENT ON FUNCTION list_ops_nodes IS 'F01: List nodes with optional filters';
COMMENT ON FUNCTION get_ops_summary IS 'F01: Get aggregated ops summary';
