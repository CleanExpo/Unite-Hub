-- Migration 435: Synthex Knowledge Graph Engine
-- Phase B29: Multi-Tenant Knowledge Graph for SEO, Content, Campaigns, Audiences
-- Created: 2025-12-07

-- =====================================================
-- ENABLE PGVECTOR EXTENSION (if not already enabled)
-- =====================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- SYNTHEX KNOWLEDGE GRAPH NODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_kg_nodes (
    node_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Node classification
    node_type text NOT NULL CHECK (node_type IN (
        'keyword', 'topic', 'content', 'campaign', 'audience',
        'brand', 'competitor', 'url', 'entity', 'concept'
    )),
    label text NOT NULL,

    -- Node properties
    properties jsonb NOT NULL DEFAULT '{}'::jsonb,
    importance_score numeric(5,4) DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),

    -- Source tracking
    source_type text, -- 'seo_report', 'campaign', 'manual', 'ai_generated'
    source_id uuid,

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for nodes
DROP INDEX IF EXISTS idx_synthex_kg_nodes_tenant;
CREATE INDEX idx_synthex_kg_nodes_tenant ON synthex_kg_nodes(tenant_id);
DROP INDEX IF EXISTS idx_synthex_kg_nodes_type;
CREATE INDEX idx_synthex_kg_nodes_type ON synthex_kg_nodes(tenant_id, node_type);
DROP INDEX IF EXISTS idx_synthex_kg_nodes_label;
CREATE INDEX idx_synthex_kg_nodes_label ON synthex_kg_nodes(tenant_id, label);
DROP INDEX IF EXISTS idx_synthex_kg_nodes_importance;
CREATE INDEX idx_synthex_kg_nodes_importance ON synthex_kg_nodes(tenant_id, importance_score DESC);
DROP INDEX IF EXISTS idx_synthex_kg_nodes_source;
CREATE INDEX idx_synthex_kg_nodes_source ON synthex_kg_nodes(source_type, source_id) WHERE source_id IS NOT NULL;

-- Update trigger
DROP TRIGGER IF EXISTS set_synthex_kg_nodes_updated_at ON synthex_kg_nodes;
CREATE TRIGGER set_synthex_kg_nodes_updated_at
    BEFORE UPDATE ON synthex_kg_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE synthex_kg_nodes IS 'Knowledge graph nodes representing entities like keywords, topics, content, campaigns';
COMMENT ON COLUMN synthex_kg_nodes.importance_score IS 'Node importance from 0-1, used for visualization and ranking';

-- =====================================================
-- SYNTHEX KNOWLEDGE GRAPH EDGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_kg_edges (
    edge_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Edge endpoints
    source_node_id uuid NOT NULL REFERENCES synthex_kg_nodes(node_id) ON DELETE CASCADE,
    target_node_id uuid NOT NULL REFERENCES synthex_kg_nodes(node_id) ON DELETE CASCADE,

    -- Edge properties
    relation text NOT NULL CHECK (relation IN (
        'related_to', 'parent_of', 'child_of', 'targets', 'mentions',
        'competes_with', 'similar_to', 'links_to', 'derived_from',
        'contains', 'part_of', 'influences', 'co_occurs_with'
    )),
    weight numeric(5,4) DEFAULT 0.5 CHECK (weight >= 0 AND weight <= 1),

    -- Additional metadata
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    confidence numeric(5,4) DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),

    -- Prevent duplicate edges
    UNIQUE(tenant_id, source_node_id, target_node_id, relation)
);

-- Indexes for edges
DROP INDEX IF EXISTS idx_synthex_kg_edges_tenant;
CREATE INDEX idx_synthex_kg_edges_tenant ON synthex_kg_edges(tenant_id);
DROP INDEX IF EXISTS idx_synthex_kg_edges_source;
CREATE INDEX idx_synthex_kg_edges_source ON synthex_kg_edges(source_node_id);
DROP INDEX IF EXISTS idx_synthex_kg_edges_target;
CREATE INDEX idx_synthex_kg_edges_target ON synthex_kg_edges(target_node_id);
DROP INDEX IF EXISTS idx_synthex_kg_edges_relation;
CREATE INDEX idx_synthex_kg_edges_relation ON synthex_kg_edges(tenant_id, relation);
DROP INDEX IF EXISTS idx_synthex_kg_edges_weight;
CREATE INDEX idx_synthex_kg_edges_weight ON synthex_kg_edges(tenant_id, weight DESC);

COMMENT ON TABLE synthex_kg_edges IS 'Knowledge graph edges representing relationships between nodes';
COMMENT ON COLUMN synthex_kg_edges.weight IS 'Edge strength from 0-1, higher = stronger relationship';
COMMENT ON COLUMN synthex_kg_edges.confidence IS 'AI confidence in this relationship';

-- =====================================================
-- SYNTHEX KNOWLEDGE GRAPH EMBEDDINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_kg_embeddings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id uuid NOT NULL REFERENCES synthex_kg_nodes(node_id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Vector embedding (1536 dimensions for OpenAI ada-002 compatible)
    embedding vector(1536) NOT NULL,

    -- Embedding metadata
    model_version text DEFAULT 'text-embedding-ada-002',

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),

    -- One embedding per node
    UNIQUE(node_id)
);

-- Indexes for embeddings
DROP INDEX IF EXISTS idx_synthex_kg_embeddings_tenant;
CREATE INDEX idx_synthex_kg_embeddings_tenant ON synthex_kg_embeddings(tenant_id);
DROP INDEX IF EXISTS idx_synthex_kg_embeddings_node;
CREATE INDEX idx_synthex_kg_embeddings_node ON synthex_kg_embeddings(node_id);

-- Vector similarity search index (using IVFFlat for performance)
DROP INDEX IF EXISTS idx_synthex_kg_embeddings_vector;
CREATE INDEX idx_synthex_kg_embeddings_vector ON synthex_kg_embeddings
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE synthex_kg_embeddings IS 'Vector embeddings for semantic search on knowledge graph nodes';
COMMENT ON COLUMN synthex_kg_embeddings.embedding IS '1536-dimensional embedding vector for similarity search';

-- =====================================================
-- SYNTHEX KNOWLEDGE GRAPH CLUSTERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_kg_clusters (
    cluster_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Cluster properties
    name text NOT NULL,
    description text,
    cluster_type text DEFAULT 'topic' CHECK (cluster_type IN ('topic', 'semantic', 'campaign', 'audience', 'custom')),

    -- Cluster metrics
    node_count integer DEFAULT 0,
    avg_importance numeric(5,4) DEFAULT 0,
    coherence_score numeric(5,4) DEFAULT 0, -- How tightly related nodes are

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for clusters
DROP INDEX IF EXISTS idx_synthex_kg_clusters_tenant;
CREATE INDEX idx_synthex_kg_clusters_tenant ON synthex_kg_clusters(tenant_id);
DROP INDEX IF EXISTS idx_synthex_kg_clusters_type;
CREATE INDEX idx_synthex_kg_clusters_type ON synthex_kg_clusters(tenant_id, cluster_type);

-- Update trigger
DROP TRIGGER IF EXISTS set_synthex_kg_clusters_updated_at ON synthex_kg_clusters;
CREATE TRIGGER set_synthex_kg_clusters_updated_at
    BEFORE UPDATE ON synthex_kg_clusters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE synthex_kg_clusters IS 'Topic clusters grouping related knowledge graph nodes';

-- =====================================================
-- SYNTHEX KNOWLEDGE GRAPH CLUSTER MEMBERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_kg_cluster_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cluster_id uuid NOT NULL REFERENCES synthex_kg_clusters(cluster_id) ON DELETE CASCADE,
    node_id uuid NOT NULL REFERENCES synthex_kg_nodes(node_id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Membership properties
    membership_score numeric(5,4) DEFAULT 1.0, -- How strongly node belongs to cluster

    -- Timestamps
    added_at timestamptz NOT NULL DEFAULT now(),

    -- One membership per node-cluster pair
    UNIQUE(cluster_id, node_id)
);

-- Indexes for cluster members
DROP INDEX IF EXISTS idx_synthex_kg_cluster_members_cluster;
CREATE INDEX idx_synthex_kg_cluster_members_cluster ON synthex_kg_cluster_members(cluster_id);
DROP INDEX IF EXISTS idx_synthex_kg_cluster_members_node;
CREATE INDEX idx_synthex_kg_cluster_members_node ON synthex_kg_cluster_members(node_id);
DROP INDEX IF EXISTS idx_synthex_kg_cluster_members_tenant;
CREATE INDEX idx_synthex_kg_cluster_members_tenant ON synthex_kg_cluster_members(tenant_id);

COMMENT ON TABLE synthex_kg_cluster_members IS 'Junction table for nodes belonging to clusters';

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- KG Nodes RLS
ALTER TABLE synthex_kg_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_kg_nodes_select" ON synthex_kg_nodes;
CREATE POLICY "synthex_kg_nodes_select" ON synthex_kg_nodes FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_nodes_insert" ON synthex_kg_nodes;
CREATE POLICY "synthex_kg_nodes_insert" ON synthex_kg_nodes FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_nodes_update" ON synthex_kg_nodes;
CREATE POLICY "synthex_kg_nodes_update" ON synthex_kg_nodes FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_nodes_delete" ON synthex_kg_nodes;
CREATE POLICY "synthex_kg_nodes_delete" ON synthex_kg_nodes FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- KG Edges RLS
ALTER TABLE synthex_kg_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_kg_edges_select" ON synthex_kg_edges;
CREATE POLICY "synthex_kg_edges_select" ON synthex_kg_edges FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_edges_insert" ON synthex_kg_edges;
CREATE POLICY "synthex_kg_edges_insert" ON synthex_kg_edges FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_edges_update" ON synthex_kg_edges;
CREATE POLICY "synthex_kg_edges_update" ON synthex_kg_edges FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_edges_delete" ON synthex_kg_edges;
CREATE POLICY "synthex_kg_edges_delete" ON synthex_kg_edges FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- KG Embeddings RLS
ALTER TABLE synthex_kg_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_kg_embeddings_select" ON synthex_kg_embeddings;
CREATE POLICY "synthex_kg_embeddings_select" ON synthex_kg_embeddings FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_embeddings_insert" ON synthex_kg_embeddings;
CREATE POLICY "synthex_kg_embeddings_insert" ON synthex_kg_embeddings FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_embeddings_delete" ON synthex_kg_embeddings;
CREATE POLICY "synthex_kg_embeddings_delete" ON synthex_kg_embeddings FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- KG Clusters RLS
ALTER TABLE synthex_kg_clusters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_kg_clusters_select" ON synthex_kg_clusters;
CREATE POLICY "synthex_kg_clusters_select" ON synthex_kg_clusters FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_clusters_insert" ON synthex_kg_clusters;
CREATE POLICY "synthex_kg_clusters_insert" ON synthex_kg_clusters FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_clusters_update" ON synthex_kg_clusters;
CREATE POLICY "synthex_kg_clusters_update" ON synthex_kg_clusters FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_clusters_delete" ON synthex_kg_clusters;
CREATE POLICY "synthex_kg_clusters_delete" ON synthex_kg_clusters FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- KG Cluster Members RLS
ALTER TABLE synthex_kg_cluster_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_kg_cluster_members_select" ON synthex_kg_cluster_members;
CREATE POLICY "synthex_kg_cluster_members_select" ON synthex_kg_cluster_members FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_cluster_members_insert" ON synthex_kg_cluster_members;
CREATE POLICY "synthex_kg_cluster_members_insert" ON synthex_kg_cluster_members FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_kg_cluster_members_delete" ON synthex_kg_cluster_members;
CREATE POLICY "synthex_kg_cluster_members_delete" ON synthex_kg_cluster_members FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get node neighbors
CREATE OR REPLACE FUNCTION get_kg_neighbors(
    p_tenant_id uuid,
    p_node_id uuid,
    p_depth integer DEFAULT 1
)
RETURNS TABLE (
    node_id uuid,
    label text,
    node_type text,
    relation text,
    distance integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE neighbors AS (
        -- Base case: direct neighbors
        SELECT
            CASE WHEN e.source_node_id = p_node_id THEN e.target_node_id ELSE e.source_node_id END as nid,
            e.relation,
            1 as dist
        FROM synthex_kg_edges e
        WHERE e.tenant_id = p_tenant_id
        AND (e.source_node_id = p_node_id OR e.target_node_id = p_node_id)

        UNION

        -- Recursive case
        SELECT
            CASE WHEN e.source_node_id = nb.nid THEN e.target_node_id ELSE e.source_node_id END,
            e.relation,
            nb.dist + 1
        FROM synthex_kg_edges e
        JOIN neighbors nb ON (e.source_node_id = nb.nid OR e.target_node_id = nb.nid)
        WHERE e.tenant_id = p_tenant_id
        AND nb.dist < p_depth
        AND CASE WHEN e.source_node_id = nb.nid THEN e.target_node_id ELSE e.source_node_id END != p_node_id
    )
    SELECT DISTINCT
        n.node_id,
        n.label,
        n.node_type,
        nb.relation,
        nb.dist as distance
    FROM neighbors nb
    JOIN synthex_kg_nodes n ON n.node_id = nb.nid
    WHERE n.tenant_id = p_tenant_id
    ORDER BY nb.dist, n.importance_score DESC;
END;
$$;

COMMENT ON FUNCTION get_kg_neighbors IS 'Get all neighbors of a node up to specified depth';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE synthex_kg_nodes IS 'Knowledge graph nodes for semantic entity relationships';
COMMENT ON TABLE synthex_kg_edges IS 'Knowledge graph edges connecting nodes with typed relations';
COMMENT ON TABLE synthex_kg_embeddings IS 'Vector embeddings for semantic similarity search';
COMMENT ON TABLE synthex_kg_clusters IS 'Topic clusters grouping related nodes';
