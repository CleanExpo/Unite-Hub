-- Migration: Leviathan Cloud Deployments
-- Phase 13 Week 3-4: Quad-cloud deployment engine
-- Created: 2025-11-20

-- =============================================================================
-- CLOUD DEPLOYMENTS
-- =============================================================================

-- Table: cloud_deployments
-- Deployment configurations and status
CREATE TABLE IF NOT EXISTS cloud_deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    graph_id UUID, -- References entity_graph(id) - FK added when entity_graph table exists

    -- Deployment info
    name TEXT NOT NULL,
    description TEXT,
    deployment_type TEXT NOT NULL CHECK (deployment_type IN (
        'single', 'ring', 'daisy_chain', 'full_network'
    )),

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'deploying', 'deployed', 'failed', 'archived'
    )),

    -- Configuration
    target_url TEXT,
    config JSONB DEFAULT '{}',

    -- Timing
    deployed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: cloud_assets
-- Individual deployed assets (HTML, images, etc.)
CREATE TABLE IF NOT EXISTS cloud_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES cloud_deployments(id) ON DELETE CASCADE,

    -- Asset info
    asset_type TEXT NOT NULL CHECK (asset_type IN (
        'html', 'og_image', 'schema', 'css', 'js', 'sitemap', 'robots'
    )),
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER DEFAULT 0,

    -- Cloud location
    provider TEXT NOT NULL CHECK (provider IN ('aws', 'gcs', 'azure', 'netlify')),
    bucket_name TEXT,
    storage_path TEXT,
    public_url TEXT,
    cdn_url TEXT,

    -- Hash for deduplication
    content_hash TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'uploading', 'uploaded', 'failed'
    )),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: cloud_variants
-- Randomized variants for anti-footprint
CREATE TABLE IF NOT EXISTS cloud_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES cloud_deployments(id) ON DELETE CASCADE,

    -- Variant info
    variant_index INTEGER NOT NULL,
    seed INTEGER NOT NULL,

    -- Provider assignment
    provider TEXT NOT NULL CHECK (provider IN ('aws', 'gcs', 'azure', 'netlify')),

    -- Randomization applied
    template_variant TEXT,
    color_scheme TEXT,
    font_family TEXT,
    layout_variant TEXT,

    -- URLs
    source_url TEXT,
    deployed_url TEXT,

    -- Timing offsets
    publish_delay_ms INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: cloud_links
-- Daisy-chain link structure
CREATE TABLE IF NOT EXISTS cloud_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id UUID NOT NULL REFERENCES cloud_deployments(id) ON DELETE CASCADE,

    -- Link structure
    source_variant_id UUID REFERENCES cloud_variants(id) ON DELETE SET NULL,
    target_variant_id UUID REFERENCES cloud_variants(id) ON DELETE SET NULL,

    -- Link info
    link_type TEXT NOT NULL CHECK (link_type IN (
        'direct', 'redirect', 'canonical', 'backlink', 'citation'
    )),
    anchor_text TEXT,
    rel_attribute TEXT,

    -- Position in chain
    chain_position INTEGER,
    is_money_site_link BOOLEAN DEFAULT FALSE,

    -- URLs
    source_url TEXT,
    target_url TEXT,

    -- Randomization
    link_order INTEGER,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_cloud_deployments_org ON cloud_deployments(org_id);
CREATE INDEX IF NOT EXISTS idx_cloud_deployments_status ON cloud_deployments(status);
CREATE INDEX IF NOT EXISTS idx_cloud_deployments_type ON cloud_deployments(deployment_type);

CREATE INDEX IF NOT EXISTS idx_cloud_assets_deployment ON cloud_assets(deployment_id);
CREATE INDEX IF NOT EXISTS idx_cloud_assets_provider ON cloud_assets(provider);
CREATE INDEX IF NOT EXISTS idx_cloud_assets_type ON cloud_assets(asset_type);

CREATE INDEX IF NOT EXISTS idx_cloud_variants_deployment ON cloud_variants(deployment_id);
CREATE INDEX IF NOT EXISTS idx_cloud_variants_provider ON cloud_variants(provider);

CREATE INDEX IF NOT EXISTS idx_cloud_links_deployment ON cloud_links(deployment_id);
CREATE INDEX IF NOT EXISTS idx_cloud_links_source ON cloud_links(source_variant_id);
CREATE INDEX IF NOT EXISTS idx_cloud_links_target ON cloud_links(target_variant_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE cloud_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE cloud_links ENABLE ROW LEVEL SECURITY;

-- cloud_deployments policies
CREATE POLICY "Users can view their org's deployments"
ON cloud_deployments FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their org's deployments"
ON cloud_deployments FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- cloud_assets policies
CREATE POLICY "Users can view deployment assets"
ON cloud_assets FOR SELECT
USING (
    deployment_id IN (
        SELECT id FROM cloud_deployments
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage deployment assets"
ON cloud_assets FOR ALL
USING (
    deployment_id IN (
        SELECT id FROM cloud_deployments
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

-- cloud_variants policies
CREATE POLICY "Users can view deployment variants"
ON cloud_variants FOR SELECT
USING (
    deployment_id IN (
        SELECT id FROM cloud_deployments
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage deployment variants"
ON cloud_variants FOR ALL
USING (
    deployment_id IN (
        SELECT id FROM cloud_deployments
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

-- cloud_links policies
CREATE POLICY "Users can view deployment links"
ON cloud_links FOR SELECT
USING (
    deployment_id IN (
        SELECT id FROM cloud_deployments
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage deployment links"
ON cloud_links FOR ALL
USING (
    deployment_id IN (
        SELECT id FROM cloud_deployments
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_cloud_deployments_updated_at
    BEFORE UPDATE ON cloud_deployments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE cloud_deployments IS 'Deployment configurations for quad-cloud engine';
COMMENT ON TABLE cloud_assets IS 'Individual deployed assets across cloud providers';
COMMENT ON TABLE cloud_variants IS 'Randomized variants for anti-footprint distribution';
COMMENT ON TABLE cloud_links IS 'Daisy-chain link structure between deployments';
