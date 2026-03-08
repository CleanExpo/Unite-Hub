-- Migration 137: Global Intelligence Mesh
-- Phase 94: GIM - Unified intelligence graph across all engines

-- ============================================================================
-- Table 1: intelligence_nodes
-- Atomic or composite intelligence units
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Node type
  node_type TEXT NOT NULL CHECK (node_type IN (
    'signal', 'region', 'tenant', 'engine', 'composite',
    'early_warning', 'performance', 'compliance', 'creative', 'scaling'
  )),

  -- Source reference
  source_table TEXT,
  source_id UUID,

  -- Scope
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES agencies(id) ON DELETE SET NULL,

  -- Metrics
  weight FLOAT NOT NULL DEFAULT 1.0,
  confidence FLOAT NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),

  -- Labels and tags
  label TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Data payload
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_nodes_type
  ON intelligence_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_intelligence_nodes_region
  ON intelligence_nodes(region_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_nodes_tenant
  ON intelligence_nodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_nodes_source
  ON intelligence_nodes(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_nodes_created
  ON intelligence_nodes(created_at DESC);

-- ============================================================================
-- Table 2: intelligence_edges
-- Graph edges linking nodes
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Nodes
  from_node_id UUID NOT NULL REFERENCES intelligence_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES intelligence_nodes(id) ON DELETE CASCADE,

  -- Relationship
  relationship TEXT NOT NULL CHECK (relationship IN (
    'influences', 'conflicts', 'reinforces', 'depends_on', 'aggregates',
    'causes', 'correlates', 'precedes', 'follows'
  )),

  -- Metrics
  strength FLOAT NOT NULL CHECK (strength >= 0 AND strength <= 1),
  confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),

  -- Direction
  is_bidirectional BOOLEAN NOT NULL DEFAULT false,

  -- Data
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_intelligence_edges_from
  ON intelligence_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_edges_to
  ON intelligence_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_edges_relationship
  ON intelligence_edges(relationship);

-- ============================================================================
-- Table 3: intelligence_mesh_snapshots
-- Periodic snapshots of mesh state
-- ============================================================================

CREATE TABLE IF NOT EXISTS intelligence_mesh_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Snapshot type
  snapshot_type TEXT NOT NULL DEFAULT 'daily' CHECK (snapshot_type IN ('hourly', 'daily', 'weekly')),

  -- Aggregated data
  snapshot JSONB NOT NULL,

  -- Metrics
  node_count INTEGER,
  edge_count INTEGER,
  avg_confidence FLOAT,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Index
CREATE INDEX IF NOT EXISTS idx_mesh_snapshots_created
  ON intelligence_mesh_snapshots(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mesh_snapshots_type
  ON intelligence_mesh_snapshots(snapshot_type);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE intelligence_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_mesh_snapshots ENABLE ROW LEVEL SECURITY;

-- Nodes: Agency members can see nodes for their tenant
CREATE POLICY "Agency members can view their nodes" ON intelligence_nodes
  FOR SELECT USING (
    tenant_id IS NULL OR
    tenant_id IN (
      SELECT agency_id FROM agency_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admin manages all nodes" ON intelligence_nodes
  FOR ALL USING (true);

-- Edges: Same as nodes
CREATE POLICY "Agency members can view edges for their nodes" ON intelligence_edges
  FOR SELECT USING (
    from_node_id IN (
      SELECT id FROM intelligence_nodes
      WHERE tenant_id IS NULL OR tenant_id IN (
        SELECT agency_id FROM agency_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admin manages all edges" ON intelligence_edges
  FOR ALL USING (true);

-- Snapshots: Read-only for authenticated users
CREATE POLICY "Authenticated users can view snapshots" ON intelligence_mesh_snapshots
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin manages snapshots" ON intelligence_mesh_snapshots
  FOR ALL USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get node with edges
CREATE OR REPLACE FUNCTION get_node_with_edges(p_node_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_node intelligence_nodes%ROWTYPE;
  v_result JSONB;
BEGIN
  SELECT * INTO v_node FROM intelligence_nodes WHERE id = p_node_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'node', jsonb_build_object(
      'id', v_node.id,
      'node_type', v_node.node_type,
      'label', v_node.label,
      'weight', v_node.weight,
      'confidence', v_node.confidence,
      'region_id', v_node.region_id,
      'tenant_id', v_node.tenant_id,
      'payload', v_node.payload,
      'created_at', v_node.created_at
    ),
    'outgoing_edges', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', e.id,
        'to_node_id', e.to_node_id,
        'relationship', e.relationship,
        'strength', e.strength,
        'confidence', e.confidence
      )), '[]'::jsonb)
      FROM intelligence_edges e
      WHERE e.from_node_id = p_node_id
    ),
    'incoming_edges', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', e.id,
        'from_node_id', e.from_node_id,
        'relationship', e.relationship,
        'strength', e.strength,
        'confidence', e.confidence
      )), '[]'::jsonb)
      FROM intelligence_edges e
      WHERE e.to_node_id = p_node_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Aggregate region intelligence
CREATE OR REPLACE FUNCTION aggregate_region_intelligence(p_region_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'region_id', p_region_id,
    'node_count', COUNT(*),
    'avg_weight', ROUND(AVG(weight)::numeric, 3),
    'avg_confidence', ROUND(AVG(confidence)::numeric, 3),
    'by_type', (
      SELECT jsonb_object_agg(node_type, cnt)
      FROM (
        SELECT node_type, COUNT(*) as cnt
        FROM intelligence_nodes
        WHERE region_id = p_region_id
        GROUP BY node_type
      ) t
    ),
    'high_weight_nodes', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', id,
        'label', label,
        'weight', weight,
        'node_type', node_type
      )), '[]'::jsonb)
      FROM (
        SELECT id, label, weight, node_type
        FROM intelligence_nodes
        WHERE region_id = p_region_id AND weight > 0.7
        ORDER BY weight DESC
        LIMIT 10
      ) t
    )
  ) INTO v_result
  FROM intelligence_nodes
  WHERE region_id = p_region_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Aggregate tenant intelligence
CREATE OR REPLACE FUNCTION aggregate_tenant_intelligence(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'tenant_id', p_tenant_id,
    'node_count', COUNT(*),
    'avg_weight', ROUND(AVG(weight)::numeric, 3),
    'avg_confidence', ROUND(AVG(confidence)::numeric, 3),
    'by_type', (
      SELECT jsonb_object_agg(node_type, cnt)
      FROM (
        SELECT node_type, COUNT(*) as cnt
        FROM intelligence_nodes
        WHERE tenant_id = p_tenant_id
        GROUP BY node_type
      ) t
    )
  ) INTO v_result
  FROM intelligence_nodes
  WHERE tenant_id = p_tenant_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Global mesh overview
CREATE OR REPLACE FUNCTION get_global_mesh_overview()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_nodes', (SELECT COUNT(*) FROM intelligence_nodes),
    'total_edges', (SELECT COUNT(*) FROM intelligence_edges),
    'avg_confidence', (SELECT ROUND(AVG(confidence)::numeric, 3) FROM intelligence_nodes),
    'by_node_type', (
      SELECT jsonb_object_agg(node_type, cnt)
      FROM (
        SELECT node_type, COUNT(*) as cnt
        FROM intelligence_nodes
        GROUP BY node_type
      ) t
    ),
    'by_relationship', (
      SELECT jsonb_object_agg(relationship, cnt)
      FROM (
        SELECT relationship, COUNT(*) as cnt
        FROM intelligence_edges
        GROUP BY relationship
      ) t
    ),
    'regions_with_nodes', (
      SELECT COUNT(DISTINCT region_id)
      FROM intelligence_nodes
      WHERE region_id IS NOT NULL
    ),
    'tenants_with_nodes', (
      SELECT COUNT(DISTINCT tenant_id)
      FROM intelligence_nodes
      WHERE tenant_id IS NOT NULL
    ),
    'generated_at', now()
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Find connected nodes
CREATE OR REPLACE FUNCTION find_connected_nodes(
  p_node_id UUID,
  p_max_depth INTEGER DEFAULT 2
)
RETURNS TABLE (
  node_id UUID,
  depth INTEGER,
  path UUID[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE connected AS (
    SELECT
      p_node_id as node_id,
      0 as depth,
      ARRAY[p_node_id] as path

    UNION ALL

    SELECT
      CASE
        WHEN e.from_node_id = c.node_id THEN e.to_node_id
        ELSE e.from_node_id
      END,
      c.depth + 1,
      c.path || CASE
        WHEN e.from_node_id = c.node_id THEN e.to_node_id
        ELSE e.from_node_id
      END
    FROM connected c
    JOIN intelligence_edges e ON (
      e.from_node_id = c.node_id OR
      (e.to_node_id = c.node_id AND e.is_bidirectional)
    )
    WHERE c.depth < p_max_depth
      AND NOT (
        CASE
          WHEN e.from_node_id = c.node_id THEN e.to_node_id
          ELSE e.from_node_id
        END = ANY(c.path)
      )
  )
  SELECT DISTINCT ON (connected.node_id)
    connected.node_id,
    connected.depth,
    connected.path
  FROM connected
  WHERE connected.node_id != p_node_id
  ORDER BY connected.node_id, connected.depth;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE intelligence_nodes IS 'Phase 94: Intelligence graph nodes';
COMMENT ON TABLE intelligence_edges IS 'Phase 94: Intelligence graph edges';
COMMENT ON TABLE intelligence_mesh_snapshots IS 'Phase 94: Periodic mesh snapshots';

COMMENT ON COLUMN intelligence_nodes.node_type IS 'signal | region | tenant | engine | composite | early_warning | performance | compliance | creative | scaling';
COMMENT ON COLUMN intelligence_edges.relationship IS 'influences | conflicts | reinforces | depends_on | aggregates | causes | correlates | precedes | follows';
