-- Migration 124: Industry Knowledge Graph Engine
-- Required by Phase 72 - Industry Knowledge Graph Engine (IKGE)
-- Unified knowledge graph for domain intelligence

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS knowledge_graph_edges CASCADE;
DROP TABLE IF EXISTS knowledge_graph_nodes CASCADE;

-- Knowledge graph nodes table
CREATE TABLE knowledge_graph_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_type TEXT NOT NULL,
  name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Node type check
  CONSTRAINT knowledge_graph_nodes_type_check CHECK (
    node_type IN (
      'procedure', 'skill', 'equipment', 'compliance_rule',
      'location', 'weather', 'model_dataset', 'academy_topic',
      'brand_term', 'benchmark', 'other'
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_type ON knowledge_graph_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_name ON knowledge_graph_nodes(name);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_nodes_created ON knowledge_graph_nodes(created_at DESC);

-- Enable RLS
ALTER TABLE knowledge_graph_nodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global read)
CREATE POLICY knowledge_graph_nodes_select ON knowledge_graph_nodes
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

CREATE POLICY knowledge_graph_nodes_insert ON knowledge_graph_nodes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY knowledge_graph_nodes_update ON knowledge_graph_nodes
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

-- Comment
COMMENT ON TABLE knowledge_graph_nodes IS 'Knowledge graph nodes (Phase 72)';

-- Knowledge graph edges table
CREATE TABLE knowledge_graph_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_node_id UUID NOT NULL,
  to_node_id UUID NOT NULL,
  relationship TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence check
  CONSTRAINT knowledge_graph_edges_confidence_check CHECK (
    confidence >= 0 AND confidence <= 100
  ),

  -- Foreign keys
  CONSTRAINT knowledge_graph_edges_from_fk
    FOREIGN KEY (from_node_id) REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE,
  CONSTRAINT knowledge_graph_edges_to_fk
    FOREIGN KEY (to_node_id) REFERENCES knowledge_graph_nodes(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_from ON knowledge_graph_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_to ON knowledge_graph_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_relationship ON knowledge_graph_edges(relationship);
CREATE INDEX IF NOT EXISTS idx_knowledge_graph_edges_created ON knowledge_graph_edges(created_at DESC);

-- Enable RLS
ALTER TABLE knowledge_graph_edges ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global read)
CREATE POLICY knowledge_graph_edges_select ON knowledge_graph_edges
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

CREATE POLICY knowledge_graph_edges_insert ON knowledge_graph_edges
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE knowledge_graph_edges IS 'Knowledge graph relationships (Phase 72)';
