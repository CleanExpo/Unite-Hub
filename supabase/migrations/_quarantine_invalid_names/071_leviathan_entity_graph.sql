-- Migration: Leviathan Entity Graph
-- Phase 13 Week 1-2: Entity extraction, content fabrication, OG-image generation
-- Created: 2025-11-20

-- =============================================================================
-- ENTITY GRAPH
-- =============================================================================

-- Table: entity_graph
-- Top-level graph containers for organizations
CREATE TABLE IF NOT EXISTS entity_graph (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,

    -- Graph metadata
    name TEXT NOT NULL,
    description TEXT,
    domain TEXT,

    -- Graph stats
    node_count INTEGER DEFAULT 0,
    link_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ,

    -- Configuration
    config JSONB DEFAULT '{}',

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: entity_nodes
-- Individual entities in the graph (brands, people, products, locations)
CREATE TABLE IF NOT EXISTS entity_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graph_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,

    -- Entity identification
    entity_type TEXT NOT NULL CHECK (entity_type IN (
        'brand', 'person', 'product', 'service', 'location',
        'organization', 'event', 'article', 'webpage'
    )),
    name TEXT NOT NULL,
    canonical_url TEXT,

    -- Entity data
    description TEXT,
    short_description TEXT,
    keywords TEXT[],

    -- Vector embedding for similarity
    embedding VECTOR(1536),

    -- Scoring
    authority_score DECIMAL(5,2) DEFAULT 0,
    relevance_score DECIMAL(5,2) DEFAULT 0,
    freshness_score DECIMAL(5,2) DEFAULT 0,

    -- External IDs
    external_ids JSONB DEFAULT '{}',

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: entity_links
-- Relationships between entities
CREATE TABLE IF NOT EXISTS entity_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    graph_id UUID NOT NULL REFERENCES entity_graph(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES entity_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES entity_nodes(id) ON DELETE CASCADE,

    -- Link properties
    link_type TEXT NOT NULL CHECK (link_type IN (
        'sameAs', 'subOrganizationOf', 'memberOf', 'owns',
        'produces', 'locatedIn', 'worksFor', 'mentions',
        'related', 'competitor', 'partner'
    )),
    weight DECIMAL(5,2) DEFAULT 1.0,
    bidirectional BOOLEAN DEFAULT FALSE,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(source_node_id, target_node_id, link_type)
);

-- Table: entity_attributes
-- Key-value attributes for entities
CREATE TABLE IF NOT EXISTS entity_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES entity_nodes(id) ON DELETE CASCADE,

    -- Attribute data
    attribute_key TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    attribute_type TEXT DEFAULT 'string' CHECK (attribute_type IN (
        'string', 'number', 'boolean', 'date', 'url', 'email', 'phone'
    )),

    -- For schema.org mapping
    schema_property TEXT,

    -- Metadata
    source TEXT,
    confidence DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(node_id, attribute_key)
);

-- Table: fabrication_history
-- History of content fabrication operations
CREATE TABLE IF NOT EXISTS fabrication_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    graph_id UUID REFERENCES entity_graph(id) ON DELETE SET NULL,
    node_id UUID REFERENCES entity_nodes(id) ON DELETE SET NULL,

    -- Fabrication details
    fabrication_type TEXT NOT NULL CHECK (fabrication_type IN (
        'rewrite', 'schema', 'og_image', 'html_template', 'full_page'
    )),
    input_url TEXT,
    input_content TEXT,

    -- Output
    output_type TEXT NOT NULL CHECK (output_type IN (
        'text', 'json', 'html', 'image', 'mixed'
    )),
    output_content TEXT,
    output_url TEXT,

    -- AI model used
    model_used TEXT,
    tokens_used INTEGER DEFAULT 0,

    -- Variations
    variation_seed INTEGER,
    variation_index INTEGER,

    -- Quality
    quality_score DECIMAL(3,2),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_entity_graph_org ON entity_graph(org_id);
CREATE INDEX IF NOT EXISTS idx_entity_graph_domain ON entity_graph(domain);

CREATE INDEX IF NOT EXISTS idx_entity_nodes_graph ON entity_nodes(graph_id);
CREATE INDEX IF NOT EXISTS idx_entity_nodes_type ON entity_nodes(entity_type);
CREATE INDEX IF NOT EXISTS idx_entity_nodes_name ON entity_nodes(name);
CREATE INDEX IF NOT EXISTS idx_entity_nodes_url ON entity_nodes(canonical_url);

CREATE INDEX IF NOT EXISTS idx_entity_links_graph ON entity_links(graph_id);
CREATE INDEX IF NOT EXISTS idx_entity_links_source ON entity_links(source_node_id);
CREATE INDEX IF NOT EXISTS idx_entity_links_target ON entity_links(target_node_id);
CREATE INDEX IF NOT EXISTS idx_entity_links_type ON entity_links(link_type);

CREATE INDEX IF NOT EXISTS idx_entity_attributes_node ON entity_attributes(node_id);
CREATE INDEX IF NOT EXISTS idx_entity_attributes_key ON entity_attributes(attribute_key);

CREATE INDEX IF NOT EXISTS idx_fabrication_history_org ON fabrication_history(org_id);
CREATE INDEX IF NOT EXISTS idx_fabrication_history_graph ON fabrication_history(graph_id);
CREATE INDEX IF NOT EXISTS idx_fabrication_history_type ON fabrication_history(fabrication_type);
CREATE INDEX IF NOT EXISTS idx_fabrication_history_created ON fabrication_history(created_at);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- entity_graph policies
ALTER TABLE entity_graph ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's entity graphs"
ON entity_graph FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their org's entity graphs"
ON entity_graph FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- entity_nodes policies
ALTER TABLE entity_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entity nodes"
ON entity_nodes FOR SELECT
USING (
    graph_id IN (
        SELECT id FROM entity_graph
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage entity nodes"
ON entity_nodes FOR ALL
USING (
    graph_id IN (
        SELECT id FROM entity_graph
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

-- entity_links policies
ALTER TABLE entity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entity links"
ON entity_links FOR SELECT
USING (
    graph_id IN (
        SELECT id FROM entity_graph
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage entity links"
ON entity_links FOR ALL
USING (
    graph_id IN (
        SELECT id FROM entity_graph
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

-- entity_attributes policies
ALTER TABLE entity_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view entity attributes"
ON entity_attributes FOR SELECT
USING (
    node_id IN (
        SELECT id FROM entity_nodes
        WHERE graph_id IN (
            SELECT id FROM entity_graph
            WHERE org_id IN (
                SELECT org_id FROM user_organizations
                WHERE user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Users can manage entity attributes"
ON entity_attributes FOR ALL
USING (
    node_id IN (
        SELECT id FROM entity_nodes
        WHERE graph_id IN (
            SELECT id FROM entity_graph
            WHERE org_id IN (
                SELECT org_id FROM user_organizations
                WHERE user_id = auth.uid()
            )
        )
    )
);

-- fabrication_history policies
ALTER TABLE fabrication_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fabrication history"
ON fabrication_history FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create fabrication history"
ON fabrication_history FOR INSERT
WITH CHECK (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_entity_graph_updated_at
    BEFORE UPDATE ON entity_graph
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entity_nodes_updated_at
    BEFORE UPDATE ON entity_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE entity_graph IS 'Top-level containers for entity knowledge graphs';
COMMENT ON TABLE entity_nodes IS 'Individual entities (brands, people, products, etc.)';
COMMENT ON TABLE entity_links IS 'Relationships between entities';
COMMENT ON TABLE entity_attributes IS 'Key-value attributes for entities';
COMMENT ON TABLE fabrication_history IS 'History of AI content fabrication operations';
