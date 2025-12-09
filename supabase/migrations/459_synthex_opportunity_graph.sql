-- =====================================================
-- Migration 459: Synthex Opportunity Graph Engine
-- Phase: D30 - Unified Opportunity Graph Engine
-- =====================================================
-- Graph-based opportunity tracking with nodes, edges,
-- paths, clusters, and AI-powered analysis
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

-- Node types in the opportunity graph
CREATE TYPE synthex_opportunity_node_type AS ENUM (
    'contact',
    'company',
    'deal',
    'campaign',
    'content',
    'event',
    'channel',
    'product',
    'segment',
    'milestone',
    'custom'
);

-- Edge types representing relationships
CREATE TYPE synthex_opportunity_edge_type AS ENUM (
    'influences',
    'leads_to',
    'blocks',
    'requires',
    'supports',
    'competes_with',
    'belongs_to',
    'triggers',
    'converts_from',
    'converts_to',
    'interacts_with',
    'custom'
);

-- Node status
CREATE TYPE synthex_opportunity_node_status AS ENUM (
    'active',
    'inactive',
    'converted',
    'lost',
    'pending',
    'archived'
);

-- Cluster type
CREATE TYPE synthex_opportunity_cluster_type AS ENUM (
    'conversion_path',
    'influence_network',
    'risk_group',
    'opportunity_zone',
    'competitive_arena',
    'growth_segment',
    'custom'
);

-- Analysis type
CREATE TYPE synthex_opportunity_analysis_type AS ENUM (
    'path_optimization',
    'bottleneck_detection',
    'influence_scoring',
    'conversion_prediction',
    'risk_assessment',
    'opportunity_ranking',
    'cluster_analysis',
    'network_health'
);

-- =====================================================
-- TABLE: synthex_library_opportunity_nodes
-- =====================================================
-- Graph nodes representing entities in the opportunity network

CREATE TABLE IF NOT EXISTS synthex_library_opportunity_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Node identification
    node_type synthex_opportunity_node_type NOT NULL DEFAULT 'custom',
    node_name TEXT NOT NULL,
    node_label TEXT,
    external_id TEXT,
    external_type TEXT,

    -- Node status and scoring
    status synthex_opportunity_node_status NOT NULL DEFAULT 'active',
    opportunity_score NUMERIC(5,2) DEFAULT 0,
    influence_score NUMERIC(5,2) DEFAULT 0,
    conversion_probability NUMERIC(5,4) DEFAULT 0,
    risk_score NUMERIC(5,2) DEFAULT 0,

    -- Value metrics
    potential_value NUMERIC(15,2) DEFAULT 0,
    realized_value NUMERIC(15,2) DEFAULT 0,
    lifetime_value NUMERIC(15,2) DEFAULT 0,

    -- Graph metrics (computed)
    in_degree INTEGER DEFAULT 0,
    out_degree INTEGER DEFAULT 0,
    betweenness_centrality NUMERIC(10,6) DEFAULT 0,
    pagerank NUMERIC(10,6) DEFAULT 0,
    clustering_coefficient NUMERIC(5,4) DEFAULT 0,

    -- Position (for visualization)
    position_x NUMERIC(10,4),
    position_y NUMERIC(10,4),
    position_z NUMERIC(10,4),

    -- Properties
    properties JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',

    -- Temporal tracking
    first_seen_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    converted_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE
);

-- Indexes for opportunity nodes
CREATE INDEX idx_opportunity_nodes_tenant ON synthex_library_opportunity_nodes(tenant_id);
CREATE INDEX idx_opportunity_nodes_type ON synthex_library_opportunity_nodes(tenant_id, node_type);
CREATE INDEX idx_opportunity_nodes_status ON synthex_library_opportunity_nodes(tenant_id, status);
CREATE INDEX idx_opportunity_nodes_external ON synthex_library_opportunity_nodes(tenant_id, external_type, external_id);
CREATE INDEX idx_opportunity_nodes_scores ON synthex_library_opportunity_nodes(tenant_id, opportunity_score DESC);
CREATE INDEX idx_opportunity_nodes_influence ON synthex_library_opportunity_nodes(tenant_id, influence_score DESC);
CREATE INDEX idx_opportunity_nodes_tags ON synthex_library_opportunity_nodes USING GIN(tags);
CREATE INDEX idx_opportunity_nodes_properties ON synthex_library_opportunity_nodes USING GIN(properties);

-- RLS for opportunity nodes
ALTER TABLE synthex_library_opportunity_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for opportunity nodes"
    ON synthex_library_opportunity_nodes
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_library_opportunity_edges
-- =====================================================
-- Relationships/connections between nodes

CREATE TABLE IF NOT EXISTS synthex_library_opportunity_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Edge endpoints
    source_node_id UUID NOT NULL,
    target_node_id UUID NOT NULL,

    -- Edge properties
    edge_type synthex_opportunity_edge_type NOT NULL DEFAULT 'influences',
    edge_label TEXT,

    -- Strength and weight
    weight NUMERIC(5,4) DEFAULT 1.0,
    strength NUMERIC(5,4) DEFAULT 1.0,
    confidence NUMERIC(5,4) DEFAULT 1.0,

    -- Directional metrics
    is_bidirectional BOOLEAN DEFAULT FALSE,
    flow_volume NUMERIC(15,2) DEFAULT 0,
    conversion_rate NUMERIC(5,4) DEFAULT 0,

    -- Temporal metrics
    avg_time_to_traverse INTERVAL,
    frequency INTEGER DEFAULT 0,

    -- Properties
    properties JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_activated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_source_node FOREIGN KEY (source_node_id)
        REFERENCES synthex_library_opportunity_nodes(id) ON DELETE CASCADE,
    CONSTRAINT fk_target_node FOREIGN KEY (target_node_id)
        REFERENCES synthex_library_opportunity_nodes(id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_loop CHECK (source_node_id != target_node_id)
);

-- Indexes for opportunity edges
CREATE INDEX idx_opportunity_edges_tenant ON synthex_library_opportunity_edges(tenant_id);
CREATE INDEX idx_opportunity_edges_source ON synthex_library_opportunity_edges(source_node_id);
CREATE INDEX idx_opportunity_edges_target ON synthex_library_opportunity_edges(target_node_id);
CREATE INDEX idx_opportunity_edges_type ON synthex_library_opportunity_edges(tenant_id, edge_type);
CREATE INDEX idx_opportunity_edges_weight ON synthex_library_opportunity_edges(tenant_id, weight DESC);
CREATE INDEX idx_opportunity_edges_active ON synthex_library_opportunity_edges(tenant_id, is_active) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_opportunity_edges_unique ON synthex_library_opportunity_edges(tenant_id, source_node_id, target_node_id, edge_type);

-- RLS for opportunity edges
ALTER TABLE synthex_library_opportunity_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for opportunity edges"
    ON synthex_library_opportunity_edges
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_library_opportunity_paths
-- =====================================================
-- Computed paths through the opportunity graph

CREATE TABLE IF NOT EXISTS synthex_library_opportunity_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Path identification
    path_name TEXT NOT NULL,
    path_description TEXT,

    -- Path definition
    start_node_id UUID NOT NULL,
    end_node_id UUID NOT NULL,
    node_sequence UUID[] NOT NULL,
    edge_sequence UUID[] DEFAULT '{}',

    -- Path metrics
    path_length INTEGER NOT NULL DEFAULT 0,
    total_weight NUMERIC(10,4) DEFAULT 0,
    avg_weight NUMERIC(5,4) DEFAULT 0,
    conversion_probability NUMERIC(5,4) DEFAULT 0,

    -- Timing
    avg_traversal_time INTERVAL,
    min_traversal_time INTERVAL,
    max_traversal_time INTERVAL,

    -- Volume metrics
    total_traversals INTEGER DEFAULT 0,
    successful_traversals INTEGER DEFAULT 0,
    abandoned_traversals INTEGER DEFAULT 0,

    -- Value metrics
    avg_value_generated NUMERIC(15,2) DEFAULT 0,
    total_value_generated NUMERIC(15,2) DEFAULT 0,

    -- Optimization
    is_optimal BOOLEAN DEFAULT FALSE,
    optimization_score NUMERIC(5,2) DEFAULT 0,
    bottleneck_node_id UUID,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_analyzed_at TIMESTAMPTZ,

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_start_node FOREIGN KEY (start_node_id)
        REFERENCES synthex_library_opportunity_nodes(id) ON DELETE CASCADE,
    CONSTRAINT fk_end_node FOREIGN KEY (end_node_id)
        REFERENCES synthex_library_opportunity_nodes(id) ON DELETE CASCADE,
    CONSTRAINT fk_bottleneck_node FOREIGN KEY (bottleneck_node_id)
        REFERENCES synthex_library_opportunity_nodes(id) ON DELETE SET NULL
);

-- Indexes for opportunity paths
CREATE INDEX idx_opportunity_paths_tenant ON synthex_library_opportunity_paths(tenant_id);
CREATE INDEX idx_opportunity_paths_start ON synthex_library_opportunity_paths(start_node_id);
CREATE INDEX idx_opportunity_paths_end ON synthex_library_opportunity_paths(end_node_id);
CREATE INDEX idx_opportunity_paths_optimal ON synthex_library_opportunity_paths(tenant_id, is_optimal) WHERE is_optimal = TRUE;
CREATE INDEX idx_opportunity_paths_conversion ON synthex_library_opportunity_paths(tenant_id, conversion_probability DESC);
CREATE INDEX idx_opportunity_paths_nodes ON synthex_library_opportunity_paths USING GIN(node_sequence);

-- RLS for opportunity paths
ALTER TABLE synthex_library_opportunity_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for opportunity paths"
    ON synthex_library_opportunity_paths
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_library_opportunity_clusters
-- =====================================================
-- Groupings of related opportunity nodes

CREATE TABLE IF NOT EXISTS synthex_library_opportunity_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Cluster identification
    cluster_type synthex_opportunity_cluster_type NOT NULL DEFAULT 'opportunity_zone',
    cluster_name TEXT NOT NULL,
    cluster_description TEXT,

    -- Member nodes
    member_node_ids UUID[] NOT NULL DEFAULT '{}',
    member_count INTEGER DEFAULT 0,

    -- Cluster centroid (representative node)
    centroid_node_id UUID,

    -- Cluster metrics
    cohesion_score NUMERIC(5,4) DEFAULT 0,
    separation_score NUMERIC(5,4) DEFAULT 0,
    silhouette_score NUMERIC(5,4) DEFAULT 0,
    density NUMERIC(10,6) DEFAULT 0,

    -- Aggregate metrics
    total_opportunity_score NUMERIC(15,2) DEFAULT 0,
    avg_opportunity_score NUMERIC(5,2) DEFAULT 0,
    total_potential_value NUMERIC(15,2) DEFAULT 0,
    avg_conversion_probability NUMERIC(5,4) DEFAULT 0,

    -- Risk assessment
    risk_level TEXT DEFAULT 'low',
    risk_factors JSONB DEFAULT '[]',

    -- Growth metrics
    growth_rate NUMERIC(5,2) DEFAULT 0,
    momentum_score NUMERIC(5,2) DEFAULT 0,

    -- AI analysis
    ai_summary TEXT,
    ai_recommendations JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_analyzed_at TIMESTAMPTZ,

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_centroid_node FOREIGN KEY (centroid_node_id)
        REFERENCES synthex_library_opportunity_nodes(id) ON DELETE SET NULL
);

-- Indexes for opportunity clusters
CREATE INDEX idx_opportunity_clusters_tenant ON synthex_library_opportunity_clusters(tenant_id);
CREATE INDEX idx_opportunity_clusters_type ON synthex_library_opportunity_clusters(tenant_id, cluster_type);
CREATE INDEX idx_opportunity_clusters_active ON synthex_library_opportunity_clusters(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_opportunity_clusters_members ON synthex_library_opportunity_clusters USING GIN(member_node_ids);
CREATE INDEX idx_opportunity_clusters_value ON synthex_library_opportunity_clusters(tenant_id, total_potential_value DESC);

-- RLS for opportunity clusters
ALTER TABLE synthex_library_opportunity_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for opportunity clusters"
    ON synthex_library_opportunity_clusters
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_library_opportunity_analysis
-- =====================================================
-- AI-powered analysis results

CREATE TABLE IF NOT EXISTS synthex_library_opportunity_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Analysis identification
    analysis_type synthex_opportunity_analysis_type NOT NULL,
    analysis_name TEXT NOT NULL,

    -- Scope
    target_node_ids UUID[] DEFAULT '{}',
    target_cluster_ids UUID[] DEFAULT '{}',
    target_path_ids UUID[] DEFAULT '{}',

    -- Analysis results
    overall_score NUMERIC(5,2) DEFAULT 0,
    confidence NUMERIC(5,4) DEFAULT 0,

    -- Findings
    key_findings JSONB DEFAULT '[]',
    opportunities JSONB DEFAULT '[]',
    risks JSONB DEFAULT '[]',
    bottlenecks JSONB DEFAULT '[]',

    -- Recommendations
    recommendations JSONB DEFAULT '[]',
    action_items JSONB DEFAULT '[]',
    priority_ranking JSONB DEFAULT '[]',

    -- Predictions
    predictions JSONB DEFAULT '{}',
    forecast_horizon TEXT,

    -- AI metadata
    ai_model TEXT,
    ai_prompt_tokens INTEGER DEFAULT 0,
    ai_completion_tokens INTEGER DEFAULT 0,
    ai_reasoning TEXT,

    -- Status
    status TEXT DEFAULT 'completed',
    error_message TEXT,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by UUID,

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE
);

-- Indexes for opportunity analysis
CREATE INDEX idx_opportunity_analysis_tenant ON synthex_library_opportunity_analysis(tenant_id);
CREATE INDEX idx_opportunity_analysis_type ON synthex_library_opportunity_analysis(tenant_id, analysis_type);
CREATE INDEX idx_opportunity_analysis_status ON synthex_library_opportunity_analysis(tenant_id, status);
CREATE INDEX idx_opportunity_analysis_score ON synthex_library_opportunity_analysis(tenant_id, overall_score DESC);
CREATE INDEX idx_opportunity_analysis_created ON synthex_library_opportunity_analysis(tenant_id, created_at DESC);
CREATE INDEX idx_opportunity_analysis_nodes ON synthex_library_opportunity_analysis USING GIN(target_node_ids);

-- RLS for opportunity analysis
ALTER TABLE synthex_library_opportunity_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for opportunity analysis"
    ON synthex_library_opportunity_analysis
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Calculate node graph metrics
CREATE OR REPLACE FUNCTION calculate_node_graph_metrics(p_tenant_id UUID, p_node_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_in_degree INTEGER;
    v_out_degree INTEGER;
    v_metrics JSONB;
BEGIN
    -- Calculate in-degree
    SELECT COUNT(*) INTO v_in_degree
    FROM synthex_library_opportunity_edges
    WHERE tenant_id = p_tenant_id
      AND target_node_id = p_node_id
      AND is_active = TRUE;

    -- Calculate out-degree
    SELECT COUNT(*) INTO v_out_degree
    FROM synthex_library_opportunity_edges
    WHERE tenant_id = p_tenant_id
      AND source_node_id = p_node_id
      AND is_active = TRUE;

    -- Update node metrics
    UPDATE synthex_library_opportunity_nodes
    SET in_degree = v_in_degree,
        out_degree = v_out_degree,
        updated_at = NOW()
    WHERE id = p_node_id
      AND tenant_id = p_tenant_id;

    v_metrics := jsonb_build_object(
        'in_degree', v_in_degree,
        'out_degree', v_out_degree,
        'total_degree', v_in_degree + v_out_degree
    );

    RETURN v_metrics;
END;
$$;

-- Function: Find shortest path between nodes
CREATE OR REPLACE FUNCTION find_opportunity_path(
    p_tenant_id UUID,
    p_start_node_id UUID,
    p_end_node_id UUID,
    p_max_depth INTEGER DEFAULT 10
)
RETURNS TABLE (
    path_nodes UUID[],
    path_length INTEGER,
    total_weight NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE path_search AS (
        -- Base case: start from source node
        SELECT
            ARRAY[p_start_node_id] AS nodes,
            0 AS depth,
            0::NUMERIC AS weight

        UNION ALL

        -- Recursive case: extend path through edges
        SELECT
            ps.nodes || e.target_node_id,
            ps.depth + 1,
            ps.weight + e.weight
        FROM path_search ps
        JOIN synthex_library_opportunity_edges e
            ON e.source_node_id = ps.nodes[array_length(ps.nodes, 1)]
            AND e.tenant_id = p_tenant_id
            AND e.is_active = TRUE
        WHERE ps.depth < p_max_depth
          AND NOT e.target_node_id = ANY(ps.nodes)  -- Avoid cycles
    )
    SELECT
        ps.nodes AS path_nodes,
        array_length(ps.nodes, 1) - 1 AS path_length,
        ps.weight AS total_weight
    FROM path_search ps
    WHERE ps.nodes[array_length(ps.nodes, 1)] = p_end_node_id
    ORDER BY ps.weight ASC
    LIMIT 5;
END;
$$;

-- Function: Get cluster members with details
CREATE OR REPLACE FUNCTION get_cluster_members(p_tenant_id UUID, p_cluster_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_ids UUID[];
    v_members JSONB;
BEGIN
    -- Get member IDs
    SELECT member_node_ids INTO v_member_ids
    FROM synthex_library_opportunity_clusters
    WHERE id = p_cluster_id
      AND tenant_id = p_tenant_id;

    -- Get member details
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', n.id,
            'node_type', n.node_type,
            'node_name', n.node_name,
            'opportunity_score', n.opportunity_score,
            'influence_score', n.influence_score,
            'potential_value', n.potential_value,
            'status', n.status
        )
    ) INTO v_members
    FROM synthex_library_opportunity_nodes n
    WHERE n.id = ANY(v_member_ids)
      AND n.tenant_id = p_tenant_id;

    RETURN COALESCE(v_members, '[]'::jsonb);
END;
$$;

-- Function: Get graph statistics
CREATE OR REPLACE FUNCTION get_opportunity_graph_stats(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats JSONB;
    v_node_count INTEGER;
    v_edge_count INTEGER;
    v_path_count INTEGER;
    v_cluster_count INTEGER;
    v_analysis_count INTEGER;
    v_avg_degree NUMERIC;
    v_total_potential_value NUMERIC;
    v_avg_opportunity_score NUMERIC;
BEGIN
    -- Count nodes
    SELECT COUNT(*) INTO v_node_count
    FROM synthex_library_opportunity_nodes
    WHERE tenant_id = p_tenant_id AND status != 'archived';

    -- Count edges
    SELECT COUNT(*) INTO v_edge_count
    FROM synthex_library_opportunity_edges
    WHERE tenant_id = p_tenant_id AND is_active = TRUE;

    -- Count paths
    SELECT COUNT(*) INTO v_path_count
    FROM synthex_library_opportunity_paths
    WHERE tenant_id = p_tenant_id AND is_active = TRUE;

    -- Count clusters
    SELECT COUNT(*) INTO v_cluster_count
    FROM synthex_library_opportunity_clusters
    WHERE tenant_id = p_tenant_id AND is_active = TRUE;

    -- Count analyses
    SELECT COUNT(*) INTO v_analysis_count
    FROM synthex_library_opportunity_analysis
    WHERE tenant_id = p_tenant_id;

    -- Calculate average degree
    SELECT AVG(in_degree + out_degree) INTO v_avg_degree
    FROM synthex_library_opportunity_nodes
    WHERE tenant_id = p_tenant_id AND status != 'archived';

    -- Calculate total potential value
    SELECT COALESCE(SUM(potential_value), 0) INTO v_total_potential_value
    FROM synthex_library_opportunity_nodes
    WHERE tenant_id = p_tenant_id AND status = 'active';

    -- Calculate average opportunity score
    SELECT AVG(opportunity_score) INTO v_avg_opportunity_score
    FROM synthex_library_opportunity_nodes
    WHERE tenant_id = p_tenant_id AND status = 'active';

    v_stats := jsonb_build_object(
        'total_nodes', v_node_count,
        'total_edges', v_edge_count,
        'total_paths', v_path_count,
        'total_clusters', v_cluster_count,
        'total_analyses', v_analysis_count,
        'avg_degree', COALESCE(v_avg_degree, 0),
        'graph_density', CASE WHEN v_node_count > 1
            THEN v_edge_count::NUMERIC / (v_node_count * (v_node_count - 1))
            ELSE 0 END,
        'total_potential_value', v_total_potential_value,
        'avg_opportunity_score', COALESCE(v_avg_opportunity_score, 0)
    );

    RETURN v_stats;
END;
$$;

-- Function: Add node to cluster
CREATE OR REPLACE FUNCTION add_node_to_cluster(
    p_tenant_id UUID,
    p_cluster_id UUID,
    p_node_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_members UUID[];
BEGIN
    -- Get current members
    SELECT member_node_ids INTO v_current_members
    FROM synthex_library_opportunity_clusters
    WHERE id = p_cluster_id
      AND tenant_id = p_tenant_id;

    -- Check if node already in cluster
    IF p_node_id = ANY(v_current_members) THEN
        RETURN FALSE;
    END IF;

    -- Add node to cluster
    UPDATE synthex_library_opportunity_clusters
    SET member_node_ids = array_append(member_node_ids, p_node_id),
        member_count = member_count + 1,
        updated_at = NOW()
    WHERE id = p_cluster_id
      AND tenant_id = p_tenant_id;

    RETURN TRUE;
END;
$$;

-- Function: Remove node from cluster
CREATE OR REPLACE FUNCTION remove_node_from_cluster(
    p_tenant_id UUID,
    p_cluster_id UUID,
    p_node_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE synthex_library_opportunity_clusters
    SET member_node_ids = array_remove(member_node_ids, p_node_id),
        member_count = GREATEST(0, member_count - 1),
        updated_at = NOW()
    WHERE id = p_cluster_id
      AND tenant_id = p_tenant_id
      AND p_node_id = ANY(member_node_ids);

    RETURN FOUND;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update node timestamps
CREATE OR REPLACE FUNCTION update_opportunity_node_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_opportunity_nodes_updated
    BEFORE UPDATE ON synthex_library_opportunity_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_opportunity_node_timestamp();

-- Trigger: Update edge timestamps
CREATE TRIGGER trg_opportunity_edges_updated
    BEFORE UPDATE ON synthex_library_opportunity_edges
    FOR EACH ROW
    EXECUTE FUNCTION update_opportunity_node_timestamp();

-- Trigger: Update path timestamps
CREATE TRIGGER trg_opportunity_paths_updated
    BEFORE UPDATE ON synthex_library_opportunity_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_opportunity_node_timestamp();

-- Trigger: Update cluster timestamps
CREATE TRIGGER trg_opportunity_clusters_updated
    BEFORE UPDATE ON synthex_library_opportunity_clusters
    FOR EACH ROW
    EXECUTE FUNCTION update_opportunity_node_timestamp();

-- Trigger: Recalculate node degrees when edges change
CREATE OR REPLACE FUNCTION recalculate_node_degrees()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM calculate_node_graph_metrics(NEW.tenant_id, NEW.source_node_id);
        PERFORM calculate_node_graph_metrics(NEW.tenant_id, NEW.target_node_id);
    END IF;

    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_node_graph_metrics(OLD.tenant_id, OLD.source_node_id);
        PERFORM calculate_node_graph_metrics(OLD.tenant_id, OLD.target_node_id);
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_degrees
    AFTER INSERT OR UPDATE OR DELETE ON synthex_library_opportunity_edges
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_node_degrees();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE synthex_library_opportunity_nodes IS 'Graph nodes representing entities in the opportunity network';
COMMENT ON TABLE synthex_library_opportunity_edges IS 'Relationships and connections between opportunity nodes';
COMMENT ON TABLE synthex_library_opportunity_paths IS 'Computed paths through the opportunity graph';
COMMENT ON TABLE synthex_library_opportunity_clusters IS 'Groupings of related opportunity nodes';
COMMENT ON TABLE synthex_library_opportunity_analysis IS 'AI-powered analysis results for the opportunity graph';

COMMENT ON FUNCTION calculate_node_graph_metrics IS 'Calculate in-degree, out-degree for a node';
COMMENT ON FUNCTION find_opportunity_path IS 'Find shortest paths between two nodes in the graph';
COMMENT ON FUNCTION get_cluster_members IS 'Get detailed information about cluster members';
COMMENT ON FUNCTION get_opportunity_graph_stats IS 'Get overall graph statistics for a tenant';
