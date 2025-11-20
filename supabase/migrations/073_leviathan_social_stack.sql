-- Migration: Leviathan Social Stack
-- Phase 13 Week 5-6: Blogger + Google Sites integration
-- Created: 2025-11-20

-- =============================================================================
-- SOCIAL POSTS
-- =============================================================================

-- Table: social_posts
-- Blogger and other social platform posts
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    deployment_id UUID, -- References cloud_deployments(id) - FK added after 072 migration

    -- Platform info
    platform TEXT NOT NULL CHECK (platform IN (
        'blogger', 'medium', 'wordpress', 'tumblr'
    )),

    -- Post details
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,

    -- External IDs
    external_post_id TEXT,
    external_blog_id TEXT,

    -- URLs
    post_url TEXT,
    edit_url TEXT,

    -- Schema and OG
    schema_json JSONB,
    og_image_url TEXT,

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'scheduled', 'published', 'failed', 'archived'
    )),

    -- Timing
    scheduled_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,

    -- Variant tracking
    variant_index INTEGER,
    seed INTEGER,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SOCIAL LINKS
-- =============================================================================

-- Table: social_links
-- Cross-platform link propagation
CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Source
    source_type TEXT NOT NULL CHECK (source_type IN (
        'gsite', 'blogger', 'netlify', 'azure', 'gcs', 'aws', 'money_site'
    )),
    source_id UUID,
    source_url TEXT,

    -- Target
    target_type TEXT NOT NULL CHECK (target_type IN (
        'gsite', 'blogger', 'netlify', 'azure', 'gcs', 'aws', 'money_site'
    )),
    target_id UUID,
    target_url TEXT,

    -- Link details
    anchor_text TEXT,
    rel_attribute TEXT,
    context_text TEXT,

    -- Position in propagation chain
    layer INTEGER NOT NULL, -- 1=GSite, 2=Blogger, 3=Cloud, 4=Money
    chain_position INTEGER,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'created', 'verified', 'failed'
    )),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SOCIAL VARIANTS
-- =============================================================================

-- Table: social_variants
-- Randomized social content variants
CREATE TABLE IF NOT EXISTS social_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,

    -- Variant info
    variant_index INTEGER NOT NULL,
    seed INTEGER NOT NULL,

    -- Content variations
    title_variant TEXT,
    intro_variant TEXT,
    cta_variant TEXT,

    -- Layout
    layout_template TEXT,
    content_blocks JSONB,

    -- Styling
    heading_style TEXT,
    paragraph_style TEXT,
    image_placement TEXT,

    -- Timing
    publish_delay_ms INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- GOOGLE SITES PAGES
-- =============================================================================

-- Table: gsite_pages
-- Google Sites wrapper pages
CREATE TABLE IF NOT EXISTS gsite_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    deployment_id UUID, -- References cloud_deployments(id) - FK added after 072 migration

    -- Site info
    site_name TEXT NOT NULL,
    page_title TEXT NOT NULL,

    -- External IDs
    external_site_id TEXT,
    external_page_id TEXT,

    -- URLs
    site_url TEXT,
    page_url TEXT,
    edit_url TEXT,

    -- Content
    wrapper_content TEXT,
    embedded_urls TEXT[],

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'creating', 'created', 'failed', 'archived'
    )),

    -- Variant tracking
    variant_index INTEGER,
    seed INTEGER,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_social_posts_org ON social_posts(org_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_deployment ON social_posts(deployment_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);

CREATE INDEX IF NOT EXISTS idx_social_links_org ON social_links(org_id);
CREATE INDEX IF NOT EXISTS idx_social_links_source ON social_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_social_links_target ON social_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_social_links_layer ON social_links(layer);

CREATE INDEX IF NOT EXISTS idx_social_variants_post ON social_variants(post_id);

CREATE INDEX IF NOT EXISTS idx_gsite_pages_org ON gsite_pages(org_id);
CREATE INDEX IF NOT EXISTS idx_gsite_pages_deployment ON gsite_pages(deployment_id);
CREATE INDEX IF NOT EXISTS idx_gsite_pages_status ON gsite_pages(status);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsite_pages ENABLE ROW LEVEL SECURITY;

-- social_posts policies
CREATE POLICY "Users can view their org's social posts"
ON social_posts FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their org's social posts"
ON social_posts FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- social_links policies
CREATE POLICY "Users can view their org's social links"
ON social_links FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their org's social links"
ON social_links FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- social_variants policies
CREATE POLICY "Users can view their social variants"
ON social_variants FOR SELECT
USING (
    post_id IN (
        SELECT id FROM social_posts
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage their social variants"
ON social_variants FOR ALL
USING (
    post_id IN (
        SELECT id FROM social_posts
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

-- gsite_pages policies
CREATE POLICY "Users can view their org's gsite pages"
ON gsite_pages FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their org's gsite pages"
ON gsite_pages FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers if they exist, then create
DROP TRIGGER IF EXISTS update_social_posts_updated_at ON social_posts;
CREATE TRIGGER update_social_posts_updated_at
    BEFORE UPDATE ON social_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gsite_pages_updated_at ON gsite_pages;
CREATE TRIGGER update_gsite_pages_updated_at
    BEFORE UPDATE ON gsite_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE social_posts IS 'Blogger and social platform posts for Layer 2';
COMMENT ON TABLE social_links IS 'Cross-platform link propagation chain';
COMMENT ON TABLE social_variants IS 'Randomized social content variants';
COMMENT ON TABLE gsite_pages IS 'Google Sites wrapper pages for Layer 3';
