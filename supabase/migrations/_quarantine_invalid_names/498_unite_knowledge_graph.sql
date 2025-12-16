/**
 * Phase D70: Unite Knowledge Graph Core
 *
 * Cross-system entity relationships and semantic search.
 * Vector embeddings for similarity queries.
 * Tenant-isolated knowledge graph.
 */

-- ============================================================================
-- ENTITIES (nodes in knowledge graph)
-- ============================================================================

DROP TABLE IF EXISTS unite_entities CASCADE;

CREATE TABLE unite_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  name text NOT NULL,
  properties jsonb,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_entities_tenant ON unite_entities(tenant_id);
CREATE INDEX idx_unite_entities_type ON unite_entities(tenant_id, type);
CREATE INDEX idx_unite_entities_name ON unite_entities(name);

COMMENT ON TABLE unite_entities IS 'Knowledge graph entities (nodes) across Unite-Hub systems';
COMMENT ON COLUMN unite_entities.type IS 'Entity type (e.g., "user", "project", "campaign", "contact")';
COMMENT ON COLUMN unite_entities.properties IS 'Flexible entity attributes as JSON';

-- ============================================================================
-- RELATIONSHIPS (edges in knowledge graph)
-- ============================================================================

DROP TABLE IF EXISTS unite_relationships CASCADE;

CREATE TABLE unite_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES unite_entities(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES unite_entities(id) ON DELETE CASCADE,
  type text NOT NULL,
  metadata jsonb,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_relationships_tenant ON unite_relationships(tenant_id);
CREATE INDEX idx_unite_relationships_source ON unite_relationships(source_id);
CREATE INDEX idx_unite_relationships_target ON unite_relationships(target_id);
CREATE INDEX idx_unite_relationships_type ON unite_relationships(tenant_id, type);

COMMENT ON TABLE unite_relationships IS 'Knowledge graph relationships (edges) between entities';
COMMENT ON COLUMN unite_relationships.type IS 'Relationship type (e.g., "created_by", "related_to", "depends_on")';
COMMENT ON COLUMN unite_relationships.metadata IS 'Relationship attributes (e.g., strength, confidence)';

-- ============================================================================
-- GRAPH EMBEDDINGS (vector search)
-- ============================================================================

DROP TABLE IF EXISTS unite_graph_embeddings CASCADE;

CREATE TABLE unite_graph_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES unite_entities(id) ON DELETE CASCADE,
  vector vector(1536),
  metadata jsonb,
  tenant_id uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_graph_embeddings_entity ON unite_graph_embeddings(entity_id);
CREATE INDEX idx_unite_graph_embeddings_tenant ON unite_graph_embeddings(tenant_id);

-- IVFFlat index for fast similarity search
CREATE INDEX unite_graph_embeddings_vector_idx ON unite_graph_embeddings
  USING ivfflat (vector vector_l2_ops)
  WITH (lists = 100);

COMMENT ON TABLE unite_graph_embeddings IS 'Vector embeddings for semantic similarity search';
COMMENT ON COLUMN unite_graph_embeddings.vector IS 'OpenAI Ada-002 embedding (1536 dimensions)';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE unite_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_graph_embeddings ENABLE ROW LEVEL SECURITY;

-- Entities
CREATE POLICY "Users can view entities for their tenant"
  ON unite_entities FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage entities for their tenant"
  ON unite_entities FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Relationships
CREATE POLICY "Users can view relationships for their tenant"
  ON unite_relationships FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage relationships for their tenant"
  ON unite_relationships FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Graph Embeddings
CREATE POLICY "Users can view embeddings for their tenant"
  ON unite_graph_embeddings FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage embeddings for their tenant"
  ON unite_graph_embeddings FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);
