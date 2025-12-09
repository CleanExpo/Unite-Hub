-- =====================================================
-- Migration: 467_synthex_knowledge_graph.sql
-- Phase: D38 - Knowledge Graph + Insight Memory (KGIM)
-- Description: Knowledge nodes, edges, insights, and correlations
-- =====================================================

-- =====================================================
-- PRE-FLIGHT CHECKLIST VALIDATED:
-- [x] Dependencies: synthex_tenants IF NOT EXISTS
-- [x] ENUMs: DO blocks with pg_type checks, synthex_kgim_* prefix
-- [x] Columns: node_type, edge_type, insight_type to avoid conflicts
-- [x] Constraints: No COALESCE in UNIQUE
-- [x] FKs: Only to tables in this migration
-- [x] Policies: DROP IF EXISTS before CREATE
-- [x] Indexes: IF NOT EXISTS
-- =====================================================

-- =====================================================
-- DEPENDENCY CHECK
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENUMS (safe creation with DO blocks)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_kgim_node_type') THEN
    CREATE TYPE synthex_kgim_node_type AS ENUM (
      'concept',
      'entity',
      'topic',
      'skill',
      'pattern',
      'segment',
      'metric',
      'event',
      'custom'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_kgim_edge_type') THEN
    CREATE TYPE synthex_kgim_edge_type AS ENUM (
      'relates_to',
      'causes',
      'influences',
      'contains',
      'precedes',
      'correlates',
      'contradicts',
      'similar_to',
      'derived_from',
      'custom'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_kgim_insight_type') THEN
    CREATE TYPE synthex_kgim_insight_type AS ENUM (
      'pattern',
      'anomaly',
      'trend',
      'prediction',
      'recommendation',
      'correlation',
      'opportunity',
      'risk',
      'custom'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_kgim_insight_priority') THEN
    CREATE TYPE synthex_kgim_insight_priority AS ENUM (
      'critical',
      'high',
      'medium',
      'low',
      'informational'
    );
  END IF;
END $$;

-- =====================================================
-- TABLES
-- =====================================================

-- Knowledge nodes - entities in the knowledge graph
CREATE TABLE IF NOT EXISTS synthex_kgim_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Node identity
  node_key TEXT NOT NULL,
  node_name TEXT NOT NULL,
  node_type synthex_kgim_node_type NOT NULL DEFAULT 'concept',

  -- Content
  description TEXT,
  content JSONB DEFAULT '{}'::JSONB,

  -- Embedding for similarity search
  embedding VECTOR(1536),

  -- Metadata
  source TEXT,
  source_id TEXT,
  confidence NUMERIC(4, 3) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),

  -- Properties
  properties JSONB DEFAULT '{}'::JSONB,
  tags TEXT[] DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Unique node key per tenant
  CONSTRAINT unique_kgim_node_key UNIQUE (tenant_id, node_key)
);

-- Knowledge edges - relationships between nodes
CREATE TABLE IF NOT EXISTS synthex_kgim_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Edge endpoints
  source_node_id UUID NOT NULL REFERENCES synthex_kgim_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES synthex_kgim_nodes(id) ON DELETE CASCADE,

  -- Edge properties
  edge_type synthex_kgim_edge_type NOT NULL DEFAULT 'relates_to',
  edge_label TEXT,

  -- Strength/weight
  weight NUMERIC(4, 3) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  confidence NUMERIC(4, 3) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),

  -- Bidirectional flag
  is_bidirectional BOOLEAN DEFAULT FALSE,

  -- Properties
  properties JSONB DEFAULT '{}'::JSONB,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique edge per direction
  CONSTRAINT unique_kgim_edge UNIQUE (tenant_id, source_node_id, target_node_id, edge_type)
);

-- Insights - derived knowledge from the graph
CREATE TABLE IF NOT EXISTS synthex_kgim_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Insight identity
  insight_key TEXT NOT NULL,
  insight_title TEXT NOT NULL,
  insight_type synthex_kgim_insight_type NOT NULL DEFAULT 'pattern',

  -- Content
  summary TEXT NOT NULL,
  details JSONB DEFAULT '{}'::JSONB,

  -- Priority and impact
  priority synthex_kgim_insight_priority DEFAULT 'medium',
  impact_score NUMERIC(4, 3) DEFAULT 0.5 CHECK (impact_score >= 0 AND impact_score <= 1),
  confidence NUMERIC(4, 3) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),

  -- Evidence
  evidence JSONB DEFAULT '[]'::JSONB,
  source_nodes UUID[] DEFAULT '{}',

  -- Recommendations
  recommendations JSONB DEFAULT '[]'::JSONB,

  -- Status
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,

  is_dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID,
  dismiss_reason TEXT,

  -- AI analysis
  ai_analysis JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique insight key per tenant
  CONSTRAINT unique_kgim_insight_key UNIQUE (tenant_id, insight_key)
);

-- Insight correlations - relationships between insights
CREATE TABLE IF NOT EXISTS synthex_kgim_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Correlated insights
  insight_a_id UUID NOT NULL REFERENCES synthex_kgim_insights(id) ON DELETE CASCADE,
  insight_b_id UUID NOT NULL REFERENCES synthex_kgim_insights(id) ON DELETE CASCADE,

  -- Correlation details
  correlation_type TEXT DEFAULT 'related',
  correlation_strength NUMERIC(4, 3) DEFAULT 0.5 CHECK (correlation_strength >= 0 AND correlation_strength <= 1),

  -- Direction (if applicable)
  is_causal BOOLEAN DEFAULT FALSE,
  cause_insight_id UUID,

  -- Properties
  properties JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique correlation pair (order-independent)
  CONSTRAINT unique_kgim_correlation UNIQUE (tenant_id, insight_a_id, insight_b_id)
);

-- Insight memory - long-term storage of actionable insights
CREATE TABLE IF NOT EXISTS synthex_kgim_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Memory content
  memory_key TEXT NOT NULL,
  memory_type TEXT DEFAULT 'insight',

  -- Original insight reference
  insight_id UUID REFERENCES synthex_kgim_insights(id) ON DELETE SET NULL,

  -- Compressed content
  content TEXT NOT NULL,
  summary TEXT,

  -- Importance
  importance NUMERIC(4, 3) DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),

  -- Access patterns
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,

  -- Embedding for recall
  embedding VECTOR(1536),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Unique memory key per tenant
  CONSTRAINT unique_kgim_memory_key UNIQUE (tenant_id, memory_key)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_kgim_nodes_tenant ON synthex_kgim_nodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kgim_nodes_type ON synthex_kgim_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_kgim_nodes_key ON synthex_kgim_nodes(node_key);
CREATE INDEX IF NOT EXISTS idx_kgim_nodes_active ON synthex_kgim_nodes(tenant_id, is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_kgim_edges_tenant ON synthex_kgim_edges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kgim_edges_source ON synthex_kgim_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_kgim_edges_target ON synthex_kgim_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_kgim_edges_type ON synthex_kgim_edges(edge_type);

CREATE INDEX IF NOT EXISTS idx_kgim_insights_tenant ON synthex_kgim_insights(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kgim_insights_type ON synthex_kgim_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_kgim_insights_priority ON synthex_kgim_insights(priority);
CREATE INDEX IF NOT EXISTS idx_kgim_insights_active ON synthex_kgim_insights(tenant_id, is_acknowledged, is_dismissed);
CREATE INDEX IF NOT EXISTS idx_kgim_insights_discovered ON synthex_kgim_insights(discovered_at DESC);

CREATE INDEX IF NOT EXISTS idx_kgim_correlations_tenant ON synthex_kgim_correlations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kgim_correlations_a ON synthex_kgim_correlations(insight_a_id);
CREATE INDEX IF NOT EXISTS idx_kgim_correlations_b ON synthex_kgim_correlations(insight_b_id);

CREATE INDEX IF NOT EXISTS idx_kgim_memory_tenant ON synthex_kgim_memory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kgim_memory_key ON synthex_kgim_memory(memory_key);
CREATE INDEX IF NOT EXISTS idx_kgim_memory_type ON synthex_kgim_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_kgim_memory_importance ON synthex_kgim_memory(importance DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE synthex_kgim_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_kgim_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_kgim_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_kgim_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_kgim_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kgim_nodes_tenant_isolation" ON synthex_kgim_nodes;
CREATE POLICY "kgim_nodes_tenant_isolation" ON synthex_kgim_nodes
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "kgim_edges_tenant_isolation" ON synthex_kgim_edges;
CREATE POLICY "kgim_edges_tenant_isolation" ON synthex_kgim_edges
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "kgim_insights_tenant_isolation" ON synthex_kgim_insights;
CREATE POLICY "kgim_insights_tenant_isolation" ON synthex_kgim_insights
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "kgim_correlations_tenant_isolation" ON synthex_kgim_correlations;
CREATE POLICY "kgim_correlations_tenant_isolation" ON synthex_kgim_correlations
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "kgim_memory_tenant_isolation" ON synthex_kgim_memory;
CREATE POLICY "kgim_memory_tenant_isolation" ON synthex_kgim_memory
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION synthex_kgim_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS kgim_nodes_updated_at ON synthex_kgim_nodes;
CREATE TRIGGER kgim_nodes_updated_at
  BEFORE UPDATE ON synthex_kgim_nodes
  FOR EACH ROW EXECUTE FUNCTION synthex_kgim_update_timestamp();

DROP TRIGGER IF EXISTS kgim_edges_updated_at ON synthex_kgim_edges;
CREATE TRIGGER kgim_edges_updated_at
  BEFORE UPDATE ON synthex_kgim_edges
  FOR EACH ROW EXECUTE FUNCTION synthex_kgim_update_timestamp();

DROP TRIGGER IF EXISTS kgim_insights_updated_at ON synthex_kgim_insights;
CREATE TRIGGER kgim_insights_updated_at
  BEFORE UPDATE ON synthex_kgim_insights
  FOR EACH ROW EXECUTE FUNCTION synthex_kgim_update_timestamp();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get connected nodes from a starting node
CREATE OR REPLACE FUNCTION synthex_kgim_get_connected_nodes(
  p_tenant_id UUID,
  p_node_id UUID,
  p_max_depth INTEGER DEFAULT 2
)
RETURNS TABLE (
  node_id UUID,
  node_key TEXT,
  node_name TEXT,
  node_type synthex_kgim_node_type,
  edge_type synthex_kgim_edge_type,
  depth INTEGER,
  path UUID[]
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE connected AS (
    -- Base case: start node
    SELECT
      n.id AS node_id,
      n.node_key,
      n.node_name,
      n.node_type,
      NULL::synthex_kgim_edge_type AS edge_type,
      0 AS depth,
      ARRAY[n.id] AS path
    FROM synthex_kgim_nodes n
    WHERE n.id = p_node_id AND n.tenant_id = p_tenant_id AND n.is_active = TRUE

    UNION ALL

    -- Recursive case: follow edges
    SELECT
      n.id AS node_id,
      n.node_key,
      n.node_name,
      n.node_type,
      e.edge_type,
      c.depth + 1 AS depth,
      c.path || n.id AS path
    FROM connected c
    JOIN synthex_kgim_edges e ON (e.source_node_id = c.node_id OR (e.is_bidirectional AND e.target_node_id = c.node_id))
    JOIN synthex_kgim_nodes n ON (
      (e.target_node_id = n.id AND e.source_node_id = c.node_id) OR
      (e.source_node_id = n.id AND e.is_bidirectional AND e.target_node_id = c.node_id)
    )
    WHERE c.depth < p_max_depth
      AND n.tenant_id = p_tenant_id
      AND n.is_active = TRUE
      AND e.is_active = TRUE
      AND NOT n.id = ANY(c.path)  -- Prevent cycles
  )
  SELECT * FROM connected ORDER BY depth, node_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get knowledge graph stats
CREATE OR REPLACE FUNCTION synthex_kgim_get_stats(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_nodes', (SELECT COUNT(*) FROM synthex_kgim_nodes WHERE tenant_id = p_tenant_id AND is_active = TRUE),
    'total_edges', (SELECT COUNT(*) FROM synthex_kgim_edges WHERE tenant_id = p_tenant_id AND is_active = TRUE),
    'total_insights', (SELECT COUNT(*) FROM synthex_kgim_insights WHERE tenant_id = p_tenant_id),
    'active_insights', (SELECT COUNT(*) FROM synthex_kgim_insights WHERE tenant_id = p_tenant_id AND NOT is_dismissed AND NOT is_acknowledged),
    'total_memories', (SELECT COUNT(*) FROM synthex_kgim_memory WHERE tenant_id = p_tenant_id),
    'nodes_by_type', (
      SELECT jsonb_object_agg(node_type, cnt)
      FROM (
        SELECT node_type, COUNT(*) as cnt
        FROM synthex_kgim_nodes
        WHERE tenant_id = p_tenant_id AND is_active = TRUE
        GROUP BY node_type
      ) s
    ),
    'insights_by_priority', (
      SELECT jsonb_object_agg(priority, cnt)
      FROM (
        SELECT priority, COUNT(*) as cnt
        FROM synthex_kgim_insights
        WHERE tenant_id = p_tenant_id AND NOT is_dismissed
        GROUP BY priority
      ) s
    )
  ) INTO result;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find similar nodes by embedding
CREATE OR REPLACE FUNCTION synthex_kgim_find_similar_nodes(
  p_tenant_id UUID,
  p_embedding VECTOR(1536),
  p_limit INTEGER DEFAULT 10,
  p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  node_id UUID,
  node_key TEXT,
  node_name TEXT,
  node_type synthex_kgim_node_type,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id AS node_id,
    n.node_key,
    n.node_name,
    n.node_type,
    1 - (n.embedding <=> p_embedding) AS similarity
  FROM synthex_kgim_nodes n
  WHERE n.tenant_id = p_tenant_id
    AND n.is_active = TRUE
    AND n.embedding IS NOT NULL
    AND 1 - (n.embedding <=> p_embedding) >= p_threshold
  ORDER BY n.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recall relevant memories
CREATE OR REPLACE FUNCTION synthex_kgim_recall_memories(
  p_tenant_id UUID,
  p_embedding VECTOR(1536),
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  memory_id UUID,
  memory_key TEXT,
  content TEXT,
  summary TEXT,
  importance NUMERIC,
  similarity FLOAT
) AS $$
BEGIN
  -- Update access count and timestamp for recalled memories
  UPDATE synthex_kgim_memory
  SET
    access_count = access_count + 1,
    last_accessed_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND embedding IS NOT NULL
    AND id IN (
      SELECT m.id
      FROM synthex_kgim_memory m
      WHERE m.tenant_id = p_tenant_id
        AND m.embedding IS NOT NULL
      ORDER BY m.embedding <=> p_embedding
      LIMIT p_limit
    );

  RETURN QUERY
  SELECT
    m.id AS memory_id,
    m.memory_key,
    m.content,
    m.summary,
    m.importance,
    1 - (m.embedding <=> p_embedding) AS similarity
  FROM synthex_kgim_memory m
  WHERE m.tenant_id = p_tenant_id
    AND m.embedding IS NOT NULL
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
  ORDER BY m.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE synthex_kgim_nodes IS 'Knowledge graph nodes representing concepts, entities, and patterns';
COMMENT ON TABLE synthex_kgim_edges IS 'Knowledge graph edges representing relationships between nodes';
COMMENT ON TABLE synthex_kgim_insights IS 'AI-derived insights from knowledge graph analysis';
COMMENT ON TABLE synthex_kgim_correlations IS 'Correlations between related insights';
COMMENT ON TABLE synthex_kgim_memory IS 'Long-term memory storage for actionable insights';
