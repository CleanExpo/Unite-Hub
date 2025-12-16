-- =====================================================
-- Migration 442: Synthex White-Label & Multi-Brand
-- Phase B39: White-Label & Multi-Brand Settings
-- =====================================================
-- Support multiple brands per tenant with white-label
-- configuration (logo, colors, domains) and per-brand
-- campaign targeting
-- =====================================================

-- =====================================================
-- Table: synthex_brands
-- Brand configuration for white-label support
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    -- Visual branding
    primary_color TEXT DEFAULT '#ff6b35',
    secondary_color TEXT DEFAULT '#1a1a2e',
    accent_color TEXT DEFAULT '#f39c12',
    text_color TEXT DEFAULT '#ffffff',
    background_color TEXT DEFAULT '#0f0f1a',
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    -- Custom domains
    sending_domain TEXT,
    custom_domain TEXT,
    -- Email settings
    from_name TEXT,
    from_email TEXT,
    reply_to_email TEXT,
    -- Status
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- Constraints
    UNIQUE(tenant_id, slug)
);

COMMENT ON TABLE synthex_brands IS 'White-label brand configurations for multi-brand tenants';
COMMENT ON COLUMN synthex_brands.slug IS 'URL-safe unique identifier for the brand within tenant';
COMMENT ON COLUMN synthex_brands.sending_domain IS 'Verified domain for sending emails';
COMMENT ON COLUMN synthex_brands.custom_domain IS 'Custom domain for landing pages and links';
COMMENT ON COLUMN synthex_brands.is_default IS 'Default brand for the tenant (only one allowed per tenant)';

-- =====================================================
-- Table: synthex_brand_features
-- Feature toggles per brand
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_brand_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES synthex_brands(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(brand_id, feature_key)
);

COMMENT ON TABLE synthex_brand_features IS 'Feature toggles and configuration per brand';

-- =====================================================
-- Table: synthex_brand_assets
-- Brand-specific assets (images, fonts, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES synthex_brands(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('logo', 'icon', 'background', 'font', 'image', 'video')),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_brand_assets IS 'Brand-specific media assets';

-- =====================================================
-- Add brand_id to existing Synthex tables
-- =====================================================
DO $$
BEGIN
    -- Add brand_id to campaigns if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'synthex_campaigns' AND column_name = 'brand_id'
    ) THEN
        ALTER TABLE synthex_campaigns ADD COLUMN brand_id UUID REFERENCES synthex_brands(id);
        CREATE INDEX IF NOT EXISTS idx_synthex_campaigns_brand ON synthex_campaigns(brand_id) WHERE brand_id IS NOT NULL;
    END IF;

    -- Add brand_id to content if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'synthex_content' AND column_name = 'brand_id'
    ) THEN
        ALTER TABLE synthex_content ADD COLUMN brand_id UUID REFERENCES synthex_brands(id);
        CREATE INDEX IF NOT EXISTS idx_synthex_content_brand ON synthex_content(brand_id) WHERE brand_id IS NOT NULL;
    END IF;

    -- Add brand_id to audience segments if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'synthex_audience_segments' AND column_name = 'brand_id'
    ) THEN
        ALTER TABLE synthex_audience_segments ADD COLUMN brand_id UUID REFERENCES synthex_brands(id);
        CREATE INDEX IF NOT EXISTS idx_synthex_segments_brand ON synthex_audience_segments(brand_id) WHERE brand_id IS NOT NULL;
    END IF;
EXCEPTION
    WHEN undefined_table THEN
        -- Tables may not exist yet, that's OK
        NULL;
END $$;

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_synthex_brands_tenant ON synthex_brands(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_brands_slug ON synthex_brands(slug);
CREATE INDEX IF NOT EXISTS idx_synthex_brands_default ON synthex_brands(tenant_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_synthex_brands_domain ON synthex_brands(custom_domain) WHERE custom_domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_synthex_brand_features_brand ON synthex_brand_features(brand_id);
CREATE INDEX IF NOT EXISTS idx_synthex_brand_assets_brand ON synthex_brand_assets(brand_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_brand_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_brand_assets ENABLE ROW LEVEL SECURITY;

-- Brands scoped to tenant
CREATE POLICY "Brands scoped to tenant"
    ON synthex_brands FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Brand features follow brand access
CREATE POLICY "Brand features follow brand access"
    ON synthex_brand_features FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM synthex_brands b
            WHERE b.id = brand_id
            AND b.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM synthex_brands b
            WHERE b.id = brand_id
            AND b.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );

-- Brand assets follow brand access
CREATE POLICY "Brand assets follow brand access"
    ON synthex_brand_assets FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM synthex_brands b
            WHERE b.id = brand_id
            AND b.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM synthex_brands b
            WHERE b.id = brand_id
            AND b.tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );

-- =====================================================
-- Function: Enforce single default brand per tenant
-- =====================================================
CREATE OR REPLACE FUNCTION enforce_single_default_brand()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Unset any other default brands for this tenant
        UPDATE synthex_brands
        SET is_default = false, updated_at = now()
        WHERE tenant_id = NEW.tenant_id
          AND id != NEW.id
          AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_single_default_brand ON synthex_brands;
CREATE TRIGGER trg_enforce_single_default_brand
    BEFORE INSERT OR UPDATE ON synthex_brands
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION enforce_single_default_brand();

-- =====================================================
-- Function: Get brand by custom domain
-- =====================================================
CREATE OR REPLACE FUNCTION get_brand_by_domain(p_domain TEXT)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    name TEXT,
    slug TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    logo_url TEXT,
    favicon_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.tenant_id,
        b.name,
        b.slug,
        b.primary_color,
        b.secondary_color,
        b.logo_url,
        b.favicon_url
    FROM synthex_brands b
    WHERE b.custom_domain = p_domain
      AND b.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get default brand for tenant
-- =====================================================
CREATE OR REPLACE FUNCTION get_default_brand(p_tenant_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    accent_color TEXT,
    logo_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    from_name TEXT,
    from_email TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.name,
        b.slug,
        b.primary_color,
        b.secondary_color,
        b.accent_color,
        b.logo_url,
        b.logo_dark_url,
        b.favicon_url,
        b.from_name,
        b.from_email
    FROM synthex_brands b
    WHERE b.tenant_id = p_tenant_id
      AND b.is_default = true
      AND b.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_synthex_brand_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_brands_updated ON synthex_brands;
CREATE TRIGGER trg_synthex_brands_updated
    BEFORE UPDATE ON synthex_brands
    FOR EACH ROW EXECUTE FUNCTION update_synthex_brand_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_brand_features_updated ON synthex_brand_features;
CREATE TRIGGER trg_synthex_brand_features_updated
    BEFORE UPDATE ON synthex_brand_features
    FOR EACH ROW EXECUTE FUNCTION update_synthex_brand_timestamp();

-- =====================================================
-- Grants
-- =====================================================
GRANT ALL ON synthex_brands TO authenticated;
GRANT ALL ON synthex_brand_features TO authenticated;
GRANT ALL ON synthex_brand_assets TO authenticated;
GRANT EXECUTE ON FUNCTION get_brand_by_domain(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_default_brand(UUID) TO authenticated;
