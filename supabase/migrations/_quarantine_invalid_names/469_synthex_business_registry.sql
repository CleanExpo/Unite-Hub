-- =============================================================================
-- D40: Multi-Business Registry + Brand Graph
-- Phase: Synthex Autonomous Growth Stack
-- Prefix: synthex_br_* (business registry)
-- =============================================================================
-- SQL Pre-Flight Checklist:
-- ✅ Dependencies with IF NOT EXISTS
-- ✅ ENUMs with DO blocks and pg_type checks
-- ✅ Unique prefix: synthex_br_*
-- ✅ Column naming to avoid type conflicts
-- ✅ RLS with current_setting('app.tenant_id', true)::uuid
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENUM Types (with existence checks)
-- -----------------------------------------------------------------------------

-- Business status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_br_business_status') THEN
    CREATE TYPE synthex_br_business_status AS ENUM (
      'active',
      'inactive',
      'suspended',
      'archived'
    );
  END IF;
END $$;

-- Channel type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_br_channel_type') THEN
    CREATE TYPE synthex_br_channel_type AS ENUM (
      'website',
      'facebook',
      'instagram',
      'twitter',
      'linkedin',
      'youtube',
      'tiktok',
      'google_business',
      'email',
      'sms',
      'whatsapp',
      'custom'
    );
  END IF;
END $$;

-- Industry category
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_br_industry') THEN
    CREATE TYPE synthex_br_industry AS ENUM (
      'retail',
      'ecommerce',
      'saas',
      'healthcare',
      'finance',
      'education',
      'hospitality',
      'real_estate',
      'manufacturing',
      'professional_services',
      'media',
      'nonprofit',
      'other'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Main Tables
-- -----------------------------------------------------------------------------

-- Business registry (multi-business support)
CREATE TABLE IF NOT EXISTS synthex_br_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identification
  external_id TEXT,
  legal_name TEXT NOT NULL,
  display_name TEXT,
  slug TEXT,

  -- Classification
  industry synthex_br_industry DEFAULT 'other',
  business_type TEXT,
  region TEXT,
  country_code CHAR(2),

  -- Operations
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  fiscal_year_start INTEGER DEFAULT 1,

  -- Contact
  website_url TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,

  -- Status
  status synthex_br_business_status DEFAULT 'active',
  is_primary BOOLEAN DEFAULT FALSE,

  -- Branding
  logo_url TEXT,
  brand_color TEXT,
  brand_guidelines JSONB DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Ownership
  owner_user_id UUID,
  created_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id, slug)
);

-- Brand channels (social, website, etc.)
CREATE TABLE IF NOT EXISTS synthex_br_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  -- Channel info
  channel_type synthex_br_channel_type NOT NULL,
  channel_name TEXT,
  channel_handle TEXT,
  channel_url TEXT,

  -- Connection
  connection_id UUID,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Status
  is_primary BOOLEAN DEFAULT FALSE,
  is_connected BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,

  -- Metrics
  follower_count INTEGER,
  engagement_rate DECIMAL(5,2),
  last_metric_update TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(business_id, channel_type, channel_handle)
);

-- Business settings (key-value store)
CREATE TABLE IF NOT EXISTS synthex_br_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  -- Setting
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  setting_type TEXT DEFAULT 'string',

  -- Metadata
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(business_id, setting_key)
);

-- Business relationships (parent-child, partnerships)
CREATE TABLE IF NOT EXISTS synthex_br_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Relationship
  source_business_id UUID NOT NULL REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,
  target_business_id UUID NOT NULL REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'parent', 'subsidiary', 'partner', 'franchise'

  -- Details
  relationship_details JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(source_business_id, target_business_id, relationship_type)
);

-- Brand assets (logos, images, documents)
CREATE TABLE IF NOT EXISTS synthex_br_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  -- Asset info
  asset_type TEXT NOT NULL, -- 'logo', 'image', 'document', 'video'
  asset_name TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,

  -- Usage
  usage_context TEXT, -- 'primary_logo', 'social_avatar', 'email_header'
  is_primary BOOLEAN DEFAULT FALSE,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------

-- Businesses indexes
CREATE INDEX IF NOT EXISTS idx_synthex_br_businesses_tenant ON synthex_br_businesses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_br_businesses_status ON synthex_br_businesses(status);
CREATE INDEX IF NOT EXISTS idx_synthex_br_businesses_industry ON synthex_br_businesses(industry);
CREATE INDEX IF NOT EXISTS idx_synthex_br_businesses_region ON synthex_br_businesses(region);
CREATE INDEX IF NOT EXISTS idx_synthex_br_businesses_primary ON synthex_br_businesses(tenant_id) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_synthex_br_businesses_tags ON synthex_br_businesses USING GIN(tags);

-- Channels indexes
CREATE INDEX IF NOT EXISTS idx_synthex_br_channels_business ON synthex_br_channels(business_id);
CREATE INDEX IF NOT EXISTS idx_synthex_br_channels_type ON synthex_br_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_synthex_br_channels_connected ON synthex_br_channels(business_id) WHERE is_connected = TRUE;

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_synthex_br_settings_business ON synthex_br_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_synthex_br_settings_key ON synthex_br_settings(setting_key);

-- Relationships indexes
CREATE INDEX IF NOT EXISTS idx_synthex_br_relationships_source ON synthex_br_relationships(source_business_id);
CREATE INDEX IF NOT EXISTS idx_synthex_br_relationships_target ON synthex_br_relationships(target_business_id);
CREATE INDEX IF NOT EXISTS idx_synthex_br_relationships_type ON synthex_br_relationships(relationship_type);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_synthex_br_assets_business ON synthex_br_assets(business_id);
CREATE INDEX IF NOT EXISTS idx_synthex_br_assets_type ON synthex_br_assets(asset_type);

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE synthex_br_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_br_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_br_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_br_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_br_assets ENABLE ROW LEVEL SECURITY;

-- Businesses policy
DROP POLICY IF EXISTS synthex_br_businesses_tenant_isolation ON synthex_br_businesses;
CREATE POLICY synthex_br_businesses_tenant_isolation ON synthex_br_businesses
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Channels policy
DROP POLICY IF EXISTS synthex_br_channels_tenant_isolation ON synthex_br_channels;
CREATE POLICY synthex_br_channels_tenant_isolation ON synthex_br_channels
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Settings policy
DROP POLICY IF EXISTS synthex_br_settings_tenant_isolation ON synthex_br_settings;
CREATE POLICY synthex_br_settings_tenant_isolation ON synthex_br_settings
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Relationships policy
DROP POLICY IF EXISTS synthex_br_relationships_tenant_isolation ON synthex_br_relationships;
CREATE POLICY synthex_br_relationships_tenant_isolation ON synthex_br_relationships
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Assets policy
DROP POLICY IF EXISTS synthex_br_assets_tenant_isolation ON synthex_br_assets;
CREATE POLICY synthex_br_assets_tenant_isolation ON synthex_br_assets
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- 5. Helper Functions
-- -----------------------------------------------------------------------------

-- Get business with channels
CREATE OR REPLACE FUNCTION synthex_br_get_business_with_channels(p_business_id UUID)
RETURNS TABLE (
  business JSONB,
  channels JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(b.*) AS business,
    COALESCE(
      jsonb_agg(to_jsonb(c.*) ORDER BY c.is_primary DESC, c.channel_type) FILTER (WHERE c.id IS NOT NULL),
      '[]'::jsonb
    ) AS channels
  FROM synthex_br_businesses b
  LEFT JOIN synthex_br_channels c ON c.business_id = b.id
  WHERE b.id = p_business_id
  GROUP BY b.id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get business stats
CREATE OR REPLACE FUNCTION synthex_br_get_stats(p_tenant_id UUID)
RETURNS TABLE (
  total_businesses BIGINT,
  active_businesses BIGINT,
  total_channels BIGINT,
  connected_channels BIGINT,
  businesses_by_industry JSONB,
  businesses_by_region JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT b.id) AS total_businesses,
    COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'active') AS active_businesses,
    COUNT(DISTINCT c.id) AS total_channels,
    COUNT(DISTINCT c.id) FILTER (WHERE c.is_connected = TRUE) AS connected_channels,
    COALESCE(
      jsonb_object_agg(b.industry::text, cnt) FILTER (WHERE b.industry IS NOT NULL),
      '{}'::jsonb
    ) AS businesses_by_industry,
    COALESCE(
      jsonb_object_agg(b.region, region_cnt) FILTER (WHERE b.region IS NOT NULL),
      '{}'::jsonb
    ) AS businesses_by_region
  FROM synthex_br_businesses b
  LEFT JOIN synthex_br_channels c ON c.business_id = b.id
  LEFT JOIN LATERAL (
    SELECT b.industry, COUNT(*) as cnt
    FROM synthex_br_businesses
    WHERE tenant_id = p_tenant_id
    GROUP BY industry
  ) industry_counts ON TRUE
  LEFT JOIN LATERAL (
    SELECT b.region, COUNT(*) as region_cnt
    FROM synthex_br_businesses
    WHERE tenant_id = p_tenant_id AND region IS NOT NULL
    GROUP BY region
  ) region_counts ON TRUE
  WHERE b.tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION synthex_br_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_br_businesses_updated ON synthex_br_businesses;
CREATE TRIGGER trg_synthex_br_businesses_updated
  BEFORE UPDATE ON synthex_br_businesses
  FOR EACH ROW
  EXECUTE FUNCTION synthex_br_update_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_br_channels_updated ON synthex_br_channels;
CREATE TRIGGER trg_synthex_br_channels_updated
  BEFORE UPDATE ON synthex_br_channels
  FOR EACH ROW
  EXECUTE FUNCTION synthex_br_update_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_br_settings_updated ON synthex_br_settings;
CREATE TRIGGER trg_synthex_br_settings_updated
  BEFORE UPDATE ON synthex_br_settings
  FOR EACH ROW
  EXECUTE FUNCTION synthex_br_update_timestamp();

-- -----------------------------------------------------------------------------
-- Migration complete
-- -----------------------------------------------------------------------------
