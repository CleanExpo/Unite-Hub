-- Migration 437: Synthex Omni-Channel Social Scheduler
-- Phase B31: Social Media Automation for Multiple Platforms
-- Created: 2025-12-07

-- =====================================================
-- SYNTHEX SOCIAL ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_social_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Platform identification
    provider text NOT NULL CHECK (provider IN (
        'facebook', 'instagram', 'linkedin', 'twitter', 'youtube',
        'tiktok', 'threads', 'pinterest', 'snapchat', 'reddit'
    )),
    account_id text NOT NULL, -- Platform's account/page ID
    account_name text,
    account_handle text, -- @username
    profile_url text,
    avatar_url text,

    -- OAuth tokens (encrypted in application layer)
    access_token text,
    refresh_token text,
    token_expires_at timestamptz,

    -- Account metadata
    account_type text DEFAULT 'personal' CHECK (account_type IN ('personal', 'business', 'creator', 'page')),
    follower_count integer,

    -- Permissions/scopes
    granted_scopes text[],

    -- Status
    is_active boolean DEFAULT true,
    connection_status text DEFAULT 'connected' CHECK (connection_status IN ('connected', 'expired', 'revoked', 'error')),
    last_error text,

    -- Rate limiting
    daily_post_limit integer,
    posts_today integer DEFAULT 0,
    limit_reset_at timestamptz,

    -- Timestamps
    connected_at timestamptz NOT NULL DEFAULT now(),
    last_used_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),

    -- One account per provider per tenant (can have multiple pages)
    UNIQUE(tenant_id, provider, account_id)
);

-- Indexes for social accounts
DROP INDEX IF EXISTS idx_synthex_social_accounts_tenant;
CREATE INDEX idx_synthex_social_accounts_tenant ON synthex_social_accounts(tenant_id);
DROP INDEX IF EXISTS idx_synthex_social_accounts_provider;
CREATE INDEX idx_synthex_social_accounts_provider ON synthex_social_accounts(tenant_id, provider);
DROP INDEX IF EXISTS idx_synthex_social_accounts_status;
CREATE INDEX idx_synthex_social_accounts_status ON synthex_social_accounts(tenant_id, connection_status);
DROP INDEX IF EXISTS idx_synthex_social_accounts_active;
CREATE INDEX idx_synthex_social_accounts_active ON synthex_social_accounts(tenant_id, is_active) WHERE is_active = true;
DROP INDEX IF EXISTS idx_synthex_social_accounts_token_expiry;
CREATE INDEX idx_synthex_social_accounts_token_expiry ON synthex_social_accounts(token_expires_at) WHERE token_expires_at IS NOT NULL;

-- Update trigger
DROP TRIGGER IF EXISTS set_synthex_social_accounts_updated_at ON synthex_social_accounts;
CREATE TRIGGER set_synthex_social_accounts_updated_at
    BEFORE UPDATE ON synthex_social_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE synthex_social_accounts IS 'Connected social media accounts with OAuth tokens';

-- =====================================================
-- SYNTHEX SOCIAL POSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_social_posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES synthex_social_accounts(id) ON DELETE CASCADE,

    -- Post content
    content_type text NOT NULL DEFAULT 'post' CHECK (content_type IN (
        'post', 'story', 'reel', 'video', 'carousel', 'thread', 'poll', 'live'
    )),

    -- Text content
    text_content text,
    hashtags text[],
    mentions text[],

    -- Media
    media_urls text[],
    media_types text[], -- 'image', 'video', 'gif'
    thumbnail_url text,

    -- Platform-specific content
    platform_content jsonb DEFAULT '{}'::jsonb, -- Platform-specific fields

    -- Link preview
    link_url text,
    link_title text,
    link_description text,
    link_image text,

    -- Scheduling
    status text NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled'
    )),
    scheduled_for timestamptz,
    published_at timestamptz,

    -- Platform response
    platform_post_id text,
    platform_url text,

    -- AI optimization
    ai_optimized boolean DEFAULT false,
    original_content text, -- Before AI optimization
    optimization_notes text,

    -- Campaign linkage
    campaign_id uuid,

    -- Error handling
    retry_count integer DEFAULT 0,
    last_error text,

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for social posts
DROP INDEX IF EXISTS idx_synthex_social_posts_tenant;
CREATE INDEX idx_synthex_social_posts_tenant ON synthex_social_posts(tenant_id);
DROP INDEX IF EXISTS idx_synthex_social_posts_account;
CREATE INDEX idx_synthex_social_posts_account ON synthex_social_posts(account_id);
DROP INDEX IF EXISTS idx_synthex_social_posts_status;
CREATE INDEX idx_synthex_social_posts_status ON synthex_social_posts(tenant_id, status);
DROP INDEX IF EXISTS idx_synthex_social_posts_scheduled;
CREATE INDEX idx_synthex_social_posts_scheduled ON synthex_social_posts(scheduled_for) WHERE status = 'scheduled';
DROP INDEX IF EXISTS idx_synthex_social_posts_published;
CREATE INDEX idx_synthex_social_posts_published ON synthex_social_posts(tenant_id, published_at DESC) WHERE status = 'published';
DROP INDEX IF EXISTS idx_synthex_social_posts_campaign;
CREATE INDEX idx_synthex_social_posts_campaign ON synthex_social_posts(campaign_id) WHERE campaign_id IS NOT NULL;
DROP INDEX IF EXISTS idx_synthex_social_posts_due;
CREATE INDEX idx_synthex_social_posts_due ON synthex_social_posts(scheduled_for, status) WHERE status = 'scheduled' AND scheduled_for IS NOT NULL;

-- Update trigger
DROP TRIGGER IF EXISTS set_synthex_social_posts_updated_at ON synthex_social_posts;
CREATE TRIGGER set_synthex_social_posts_updated_at
    BEFORE UPDATE ON synthex_social_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE synthex_social_posts IS 'Social media posts with scheduling and multi-platform support';

-- =====================================================
-- SYNTHEX SOCIAL POST ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_social_post_analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES synthex_social_posts(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Engagement metrics
    impressions integer DEFAULT 0,
    reach integer DEFAULT 0,
    engagements integer DEFAULT 0,

    -- Interaction breakdown
    likes integer DEFAULT 0,
    comments integer DEFAULT 0,
    shares integer DEFAULT 0,
    saves integer DEFAULT 0,
    clicks integer DEFAULT 0,

    -- Video metrics (if applicable)
    video_views integer DEFAULT 0,
    video_watch_time integer DEFAULT 0, -- seconds
    video_completion_rate numeric(5,2),

    -- Calculated metrics
    engagement_rate numeric(5,4),
    click_through_rate numeric(5,4),

    -- Audience insights
    audience_demographics jsonb DEFAULT '{}'::jsonb,

    -- Timestamps
    captured_at timestamptz NOT NULL DEFAULT now(),

    -- One analytics record per capture time
    UNIQUE(post_id, captured_at)
);

-- Indexes for post analytics
DROP INDEX IF EXISTS idx_synthex_social_post_analytics_tenant;
CREATE INDEX idx_synthex_social_post_analytics_tenant ON synthex_social_post_analytics(tenant_id);
DROP INDEX IF EXISTS idx_synthex_social_post_analytics_post;
CREATE INDEX idx_synthex_social_post_analytics_post ON synthex_social_post_analytics(post_id);
DROP INDEX IF EXISTS idx_synthex_social_post_analytics_captured;
CREATE INDEX idx_synthex_social_post_analytics_captured ON synthex_social_post_analytics(post_id, captured_at DESC);

COMMENT ON TABLE synthex_social_post_analytics IS 'Performance analytics for published social posts';

-- =====================================================
-- SYNTHEX SOCIAL ERRORS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_social_errors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    account_id uuid REFERENCES synthex_social_accounts(id) ON DELETE SET NULL,
    post_id uuid REFERENCES synthex_social_posts(id) ON DELETE SET NULL,

    -- Error details
    error_type text NOT NULL CHECK (error_type IN (
        'auth_expired', 'rate_limit', 'content_violation', 'media_error',
        'network_error', 'api_error', 'validation_error', 'unknown'
    )),
    error_code text,
    error_message text NOT NULL,

    -- Context
    operation text, -- 'publish', 'schedule', 'fetch_analytics', 'refresh_token'
    request_payload jsonb,
    response_payload jsonb,

    -- Resolution
    is_resolved boolean DEFAULT false,
    resolution_notes text,
    resolved_at timestamptz,

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for social errors
DROP INDEX IF EXISTS idx_synthex_social_errors_tenant;
CREATE INDEX idx_synthex_social_errors_tenant ON synthex_social_errors(tenant_id);
DROP INDEX IF EXISTS idx_synthex_social_errors_account;
CREATE INDEX idx_synthex_social_errors_account ON synthex_social_errors(account_id);
DROP INDEX IF EXISTS idx_synthex_social_errors_post;
CREATE INDEX idx_synthex_social_errors_post ON synthex_social_errors(post_id);
DROP INDEX IF EXISTS idx_synthex_social_errors_type;
CREATE INDEX idx_synthex_social_errors_type ON synthex_social_errors(tenant_id, error_type);
DROP INDEX IF EXISTS idx_synthex_social_errors_unresolved;
CREATE INDEX idx_synthex_social_errors_unresolved ON synthex_social_errors(tenant_id, is_resolved) WHERE is_resolved = false;
DROP INDEX IF EXISTS idx_synthex_social_errors_created;
CREATE INDEX idx_synthex_social_errors_created ON synthex_social_errors(tenant_id, created_at DESC);

COMMENT ON TABLE synthex_social_errors IS 'Error logging for social media operations';

-- =====================================================
-- SYNTHEX SOCIAL TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_social_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Template info
    name text NOT NULL,
    description text,

    -- Target platforms
    platforms text[] NOT NULL, -- Which platforms this template works for
    content_type text NOT NULL DEFAULT 'post',

    -- Template content
    text_template text, -- With {{placeholders}}
    hashtag_suggestions text[],

    -- Media guidelines
    recommended_media_count integer DEFAULT 1,
    media_aspect_ratio text, -- '1:1', '16:9', '9:16', etc.

    -- AI settings
    ai_tone text, -- 'professional', 'casual', 'humorous', 'urgent'
    ai_length text DEFAULT 'medium' CHECK (ai_length IN ('short', 'medium', 'long')),

    -- Usage tracking
    use_count integer DEFAULT 0,
    last_used_at timestamptz,

    -- Status
    is_active boolean DEFAULT true,

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for social templates
DROP INDEX IF EXISTS idx_synthex_social_templates_tenant;
CREATE INDEX idx_synthex_social_templates_tenant ON synthex_social_templates(tenant_id);
DROP INDEX IF EXISTS idx_synthex_social_templates_platforms;
CREATE INDEX idx_synthex_social_templates_platforms ON synthex_social_templates USING GIN(platforms);
DROP INDEX IF EXISTS idx_synthex_social_templates_active;
CREATE INDEX idx_synthex_social_templates_active ON synthex_social_templates(tenant_id, is_active) WHERE is_active = true;

-- Update trigger
DROP TRIGGER IF EXISTS set_synthex_social_templates_updated_at ON synthex_social_templates;
CREATE TRIGGER set_synthex_social_templates_updated_at
    BEFORE UPDATE ON synthex_social_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE synthex_social_templates IS 'Reusable templates for social media posts';

-- =====================================================
-- SYNTHEX SOCIAL CALENDAR TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_social_calendar (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

    -- Calendar slot
    slot_date date NOT NULL,
    slot_time time NOT NULL,

    -- Assignment
    post_id uuid REFERENCES synthex_social_posts(id) ON DELETE SET NULL,
    account_id uuid REFERENCES synthex_social_accounts(id) ON DELETE CASCADE,

    -- Slot metadata
    slot_type text DEFAULT 'regular' CHECK (slot_type IN ('regular', 'prime_time', 'campaign', 'reserved')),
    notes text,

    -- AI recommendation
    ai_recommended boolean DEFAULT false,
    recommendation_score numeric(5,4),

    -- Timestamps
    created_at timestamptz NOT NULL DEFAULT now(),

    -- One slot per time per account
    UNIQUE(account_id, slot_date, slot_time)
);

-- Indexes for social calendar
DROP INDEX IF EXISTS idx_synthex_social_calendar_tenant;
CREATE INDEX idx_synthex_social_calendar_tenant ON synthex_social_calendar(tenant_id);
DROP INDEX IF EXISTS idx_synthex_social_calendar_account;
CREATE INDEX idx_synthex_social_calendar_account ON synthex_social_calendar(account_id);
DROP INDEX IF EXISTS idx_synthex_social_calendar_date;
CREATE INDEX idx_synthex_social_calendar_date ON synthex_social_calendar(slot_date);
DROP INDEX IF EXISTS idx_synthex_social_calendar_post;
CREATE INDEX idx_synthex_social_calendar_post ON synthex_social_calendar(post_id) WHERE post_id IS NOT NULL;
DROP INDEX IF EXISTS idx_synthex_social_calendar_available;
CREATE INDEX idx_synthex_social_calendar_available ON synthex_social_calendar(account_id, slot_date) WHERE post_id IS NULL;

COMMENT ON TABLE synthex_social_calendar IS 'Posting schedule calendar with time slots';

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Social Accounts RLS
ALTER TABLE synthex_social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_social_accounts_select" ON synthex_social_accounts;
CREATE POLICY "synthex_social_accounts_select" ON synthex_social_accounts FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_accounts_insert" ON synthex_social_accounts;
CREATE POLICY "synthex_social_accounts_insert" ON synthex_social_accounts FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_accounts_update" ON synthex_social_accounts;
CREATE POLICY "synthex_social_accounts_update" ON synthex_social_accounts FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_accounts_delete" ON synthex_social_accounts;
CREATE POLICY "synthex_social_accounts_delete" ON synthex_social_accounts FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- Social Posts RLS
ALTER TABLE synthex_social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_social_posts_select" ON synthex_social_posts;
CREATE POLICY "synthex_social_posts_select" ON synthex_social_posts FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_posts_insert" ON synthex_social_posts;
CREATE POLICY "synthex_social_posts_insert" ON synthex_social_posts FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_posts_update" ON synthex_social_posts;
CREATE POLICY "synthex_social_posts_update" ON synthex_social_posts FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_posts_delete" ON synthex_social_posts;
CREATE POLICY "synthex_social_posts_delete" ON synthex_social_posts FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- Social Post Analytics RLS
ALTER TABLE synthex_social_post_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_social_post_analytics_select" ON synthex_social_post_analytics;
CREATE POLICY "synthex_social_post_analytics_select" ON synthex_social_post_analytics FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_post_analytics_insert" ON synthex_social_post_analytics;
CREATE POLICY "synthex_social_post_analytics_insert" ON synthex_social_post_analytics FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- Social Errors RLS
ALTER TABLE synthex_social_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_social_errors_select" ON synthex_social_errors;
CREATE POLICY "synthex_social_errors_select" ON synthex_social_errors FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_errors_insert" ON synthex_social_errors;
CREATE POLICY "synthex_social_errors_insert" ON synthex_social_errors FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_errors_update" ON synthex_social_errors;
CREATE POLICY "synthex_social_errors_update" ON synthex_social_errors FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- Social Templates RLS
ALTER TABLE synthex_social_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_social_templates_select" ON synthex_social_templates;
CREATE POLICY "synthex_social_templates_select" ON synthex_social_templates FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_templates_insert" ON synthex_social_templates;
CREATE POLICY "synthex_social_templates_insert" ON synthex_social_templates FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_templates_update" ON synthex_social_templates;
CREATE POLICY "synthex_social_templates_update" ON synthex_social_templates FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_templates_delete" ON synthex_social_templates;
CREATE POLICY "synthex_social_templates_delete" ON synthex_social_templates FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- Social Calendar RLS
ALTER TABLE synthex_social_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "synthex_social_calendar_select" ON synthex_social_calendar;
CREATE POLICY "synthex_social_calendar_select" ON synthex_social_calendar FOR SELECT
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_calendar_insert" ON synthex_social_calendar;
CREATE POLICY "synthex_social_calendar_insert" ON synthex_social_calendar FOR INSERT
    WITH CHECK (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_calendar_update" ON synthex_social_calendar;
CREATE POLICY "synthex_social_calendar_update" ON synthex_social_calendar FOR UPDATE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

DROP POLICY IF EXISTS "synthex_social_calendar_delete" ON synthex_social_calendar;
CREATE POLICY "synthex_social_calendar_delete" ON synthex_social_calendar FOR DELETE
    USING (tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()));

-- =====================================================
-- HELPER FUNCTION: Get Due Posts
-- =====================================================
CREATE OR REPLACE FUNCTION get_due_social_posts(p_limit integer DEFAULT 100)
RETURNS TABLE (
    post_id uuid,
    tenant_id uuid,
    account_id uuid,
    provider text,
    access_token text,
    content_type text,
    text_content text,
    media_urls text[],
    platform_content jsonb,
    scheduled_for timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as post_id,
        p.tenant_id,
        p.account_id,
        a.provider,
        a.access_token,
        p.content_type,
        p.text_content,
        p.media_urls,
        p.platform_content,
        p.scheduled_for
    FROM synthex_social_posts p
    JOIN synthex_social_accounts a ON a.id = p.account_id
    WHERE p.status = 'scheduled'
    AND p.scheduled_for <= now()
    AND a.is_active = true
    AND a.connection_status = 'connected'
    ORDER BY p.scheduled_for ASC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_due_social_posts IS 'Get posts that are due for publishing';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE synthex_social_accounts IS 'Connected social media accounts with OAuth tokens';
COMMENT ON TABLE synthex_social_posts IS 'Social media posts with scheduling and multi-platform support';
COMMENT ON TABLE synthex_social_post_analytics IS 'Performance analytics for published social posts';
COMMENT ON TABLE synthex_social_errors IS 'Error logging for social media operations';
COMMENT ON TABLE synthex_social_templates IS 'Reusable templates for social media posts';
COMMENT ON TABLE synthex_social_calendar IS 'Posting schedule calendar with time slots';
