-- =====================================================
-- Migration 437: Synthex Cross-Channel Template Sync
-- Phase D08: Cross-Channel Template Adaptation
-- =====================================================
-- Automatically adapts templates across different channels
-- (email, SMS, social, push, etc.) while maintaining
-- brand consistency and message coherence.
-- =====================================================

-- =====================================================
-- Table: synthex_library_channel_configs
-- Channel-specific configuration and constraints
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_channel_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Channel Identity
    channel TEXT NOT NULL CHECK (channel IN (
        'email', 'sms', 'push', 'whatsapp', 'facebook', 'instagram',
        'twitter', 'linkedin', 'tiktok', 'youtube', 'slack', 'teams'
    )),
    display_name TEXT NOT NULL,
    icon TEXT,

    -- Constraints
    max_length INTEGER, -- Character limit (e.g., 160 for SMS)
    supports_html BOOLEAN DEFAULT false,
    supports_images BOOLEAN DEFAULT true,
    supports_links BOOLEAN DEFAULT true,
    supports_emoji BOOLEAN DEFAULT true,
    supports_personalization BOOLEAN DEFAULT true,

    -- Formatting
    line_break_style TEXT DEFAULT 'standard', -- standard, double, none
    link_format TEXT DEFAULT 'full', -- full, shortened, hidden
    hashtag_style TEXT, -- e.g., '#keyword' for social

    -- Timing
    best_send_times JSONB DEFAULT '[]', -- Array of { day, hour, timezone }
    avoid_times JSONB DEFAULT '[]',
    max_frequency TEXT, -- e.g., '1/day', '3/week'

    -- Tone Adjustments
    tone_modifier TEXT, -- e.g., 'more casual', 'more formal'
    emoji_density TEXT DEFAULT 'moderate', -- none, minimal, moderate, heavy
    cta_style TEXT DEFAULT 'standard', -- button, link, action-word

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false, -- Account connected

    -- Integration
    integration_id UUID, -- Reference to connected account
    api_credentials_encrypted TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, channel)
);

COMMENT ON TABLE synthex_library_channel_configs IS 'Channel-specific configuration and constraints';

-- =====================================================
-- Table: synthex_library_channel_sync
-- Template sync across channels
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_channel_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Source Template
    source_template_id UUID NOT NULL REFERENCES synthex_library_templates(id) ON DELETE CASCADE,
    source_channel TEXT NOT NULL,

    -- Sync Group (all variants share this)
    sync_group_id UUID NOT NULL,

    -- Target Channel
    target_channel TEXT NOT NULL,

    -- Adapted Content
    adapted_content TEXT NOT NULL,
    adapted_subject TEXT, -- For email
    adapted_preview TEXT, -- Preview text
    adapted_cta TEXT, -- Call to action

    -- Adaptation Details
    adaptation_type TEXT DEFAULT 'ai' CHECK (adaptation_type IN (
        'ai', 'rule_based', 'manual'
    )),
    adaptations_made JSONB DEFAULT '[]', -- List of changes made

    -- Quality
    brand_consistency_score NUMERIC(3,2),
    message_coherence_score NUMERIC(3,2),
    channel_optimization_score NUMERIC(3,2),
    overall_score NUMERIC(3,2),

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'pending_review', 'approved', 'published', 'archived'
    )),
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    published_at TIMESTAMPTZ,

    -- Performance
    sends INTEGER DEFAULT 0,
    opens INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,

    -- AI Details
    ai_model TEXT,
    confidence NUMERIC(3,2),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_channel_sync IS 'Synced template adaptations across channels';

-- =====================================================
-- Table: synthex_library_sync_rules
-- Rules for automatic template adaptation
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_sync_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Rule Identity
    name TEXT NOT NULL,
    description TEXT,

    -- Scope
    source_channel TEXT,
    target_channel TEXT,
    template_types TEXT[] DEFAULT '{}', -- Apply to specific types

    -- Conditions
    conditions JSONB DEFAULT '{}', -- When to apply
    priority INTEGER DEFAULT 50, -- Higher = runs first

    -- Transformation Rules
    rules JSONB NOT NULL DEFAULT '[]',
    -- Example: [
    --   { "action": "truncate", "target": "content", "limit": 160 },
    --   { "action": "replace", "find": "Click here", "replace": "Tap the link" },
    --   { "action": "add_emoji", "position": "start", "emoji": "📧" },
    --   { "action": "remove_html" },
    --   { "action": "shorten_links" }
    -- ]

    -- AI Enhancement
    use_ai_enhancement BOOLEAN DEFAULT true,
    ai_instructions TEXT, -- Additional AI guidance

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_sync_rules IS 'Rules for automatic template adaptation';

-- =====================================================
-- Table: synthex_library_sync_jobs
-- Batch sync jobs
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Job Configuration
    name TEXT,
    source_channel TEXT,
    target_channels TEXT[] NOT NULL,

    -- Scope
    template_ids UUID[] DEFAULT '{}', -- Specific templates, or empty for all
    template_filters JSONB DEFAULT '{}', -- Filter criteria

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled'
    )),
    progress INTEGER DEFAULT 0,
    error_message TEXT,

    -- Results
    total_templates INTEGER DEFAULT 0,
    synced_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    results JSONB DEFAULT '[]', -- Per-template results

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID
);

COMMENT ON TABLE synthex_library_sync_jobs IS 'Batch sync jobs for template adaptation';

-- =====================================================
-- Table: synthex_library_channel_analytics
-- Cross-channel performance analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_channel_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Scope
    sync_group_id UUID, -- Specific sync group or NULL for overall
    channel TEXT NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Metrics
    total_sends INTEGER DEFAULT 0,
    unique_recipients INTEGER DEFAULT 0,
    opens INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    unsubscribes INTEGER DEFAULT 0,
    bounces INTEGER DEFAULT 0,
    complaints INTEGER DEFAULT 0,

    -- Calculated Rates
    open_rate NUMERIC(5,4),
    click_rate NUMERIC(5,4),
    conversion_rate NUMERIC(5,4),
    unsubscribe_rate NUMERIC(5,4),
    bounce_rate NUMERIC(5,4),

    -- Engagement
    avg_time_to_open INTERVAL,
    avg_time_to_click INTERVAL,
    engagement_score NUMERIC(3,2),

    -- Comparison
    vs_channel_avg NUMERIC(5,2), -- % difference from channel average
    vs_previous_period NUMERIC(5,2), -- % difference from previous period

    -- Metadata
    calculated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_library_channel_analytics IS 'Cross-channel performance analytics';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_channel_configs_tenant
    ON synthex_library_channel_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_channel_configs_channel
    ON synthex_library_channel_configs(channel);

CREATE INDEX IF NOT EXISTS idx_channel_sync_tenant
    ON synthex_library_channel_sync(tenant_id);
CREATE INDEX IF NOT EXISTS idx_channel_sync_source
    ON synthex_library_channel_sync(source_template_id);
CREATE INDEX IF NOT EXISTS idx_channel_sync_group
    ON synthex_library_channel_sync(sync_group_id);
CREATE INDEX IF NOT EXISTS idx_channel_sync_target
    ON synthex_library_channel_sync(target_channel);
CREATE INDEX IF NOT EXISTS idx_channel_sync_status
    ON synthex_library_channel_sync(status);

CREATE INDEX IF NOT EXISTS idx_sync_rules_tenant
    ON synthex_library_sync_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_rules_channels
    ON synthex_library_sync_rules(source_channel, target_channel);
CREATE INDEX IF NOT EXISTS idx_sync_rules_priority
    ON synthex_library_sync_rules(priority DESC);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_tenant
    ON synthex_library_sync_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status
    ON synthex_library_sync_jobs(status);

CREATE INDEX IF NOT EXISTS idx_channel_analytics_tenant
    ON synthex_library_channel_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_channel_analytics_group
    ON synthex_library_channel_analytics(sync_group_id);
CREATE INDEX IF NOT EXISTS idx_channel_analytics_channel
    ON synthex_library_channel_analytics(channel);
CREATE INDEX IF NOT EXISTS idx_channel_analytics_period
    ON synthex_library_channel_analytics(period_start, period_end);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_channel_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_channel_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_sync_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_channel_analytics ENABLE ROW LEVEL SECURITY;

-- Channel Configs RLS
DROP POLICY IF EXISTS channel_configs_tenant_policy ON synthex_library_channel_configs;
CREATE POLICY channel_configs_tenant_policy ON synthex_library_channel_configs
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Channel Sync RLS
DROP POLICY IF EXISTS channel_sync_tenant_policy ON synthex_library_channel_sync;
CREATE POLICY channel_sync_tenant_policy ON synthex_library_channel_sync
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Sync Rules RLS
DROP POLICY IF EXISTS sync_rules_tenant_policy ON synthex_library_sync_rules;
CREATE POLICY sync_rules_tenant_policy ON synthex_library_sync_rules
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Sync Jobs RLS
DROP POLICY IF EXISTS sync_jobs_tenant_policy ON synthex_library_sync_jobs;
CREATE POLICY sync_jobs_tenant_policy ON synthex_library_sync_jobs
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Channel Analytics RLS
DROP POLICY IF EXISTS channel_analytics_tenant_policy ON synthex_library_channel_analytics;
CREATE POLICY channel_analytics_tenant_policy ON synthex_library_channel_analytics
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
DROP TRIGGER IF EXISTS trigger_channel_configs_updated ON synthex_library_channel_configs;
CREATE TRIGGER trigger_channel_configs_updated
    BEFORE UPDATE ON synthex_library_channel_configs
    FOR EACH ROW EXECUTE FUNCTION update_persona_updated_at();

DROP TRIGGER IF EXISTS trigger_channel_sync_updated ON synthex_library_channel_sync;
CREATE TRIGGER trigger_channel_sync_updated
    BEFORE UPDATE ON synthex_library_channel_sync
    FOR EACH ROW EXECUTE FUNCTION update_persona_updated_at();

DROP TRIGGER IF EXISTS trigger_sync_rules_updated ON synthex_library_sync_rules;
CREATE TRIGGER trigger_sync_rules_updated
    BEFORE UPDATE ON synthex_library_sync_rules
    FOR EACH ROW EXECUTE FUNCTION update_persona_updated_at();

-- =====================================================
-- Function: Get channel constraints
-- =====================================================
CREATE OR REPLACE FUNCTION get_channel_constraints(p_channel TEXT)
RETURNS TABLE (
    max_length INTEGER,
    supports_html BOOLEAN,
    supports_images BOOLEAN,
    supports_links BOOLEAN,
    emoji_density TEXT,
    cta_style TEXT
) AS $$
BEGIN
    -- Return defaults based on channel if no config exists
    RETURN QUERY
    SELECT
        CASE p_channel
            WHEN 'sms' THEN 160
            WHEN 'push' THEN 200
            WHEN 'twitter' THEN 280
            WHEN 'whatsapp' THEN 4096
            ELSE NULL
        END AS max_length,
        CASE p_channel
            WHEN 'email' THEN true
            WHEN 'linkedin' THEN true
            ELSE false
        END AS supports_html,
        CASE p_channel
            WHEN 'sms' THEN false
            WHEN 'push' THEN false
            ELSE true
        END AS supports_images,
        true AS supports_links,
        CASE p_channel
            WHEN 'sms' THEN 'minimal'
            WHEN 'twitter' THEN 'moderate'
            WHEN 'instagram' THEN 'heavy'
            ELSE 'moderate'
        END AS emoji_density,
        CASE p_channel
            WHEN 'email' THEN 'button'
            WHEN 'sms' THEN 'action-word'
            ELSE 'link'
        END AS cta_style;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Calculate sync quality score
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_sync_quality(
    p_brand_score NUMERIC,
    p_coherence_score NUMERIC,
    p_channel_score NUMERIC
)
RETURNS NUMERIC AS $$
BEGIN
    -- Weighted average: brand 40%, coherence 35%, channel optimization 25%
    RETURN ROUND(
        (COALESCE(p_brand_score, 0.5) * 0.40) +
        (COALESCE(p_coherence_score, 0.5) * 0.35) +
        (COALESCE(p_channel_score, 0.5) * 0.25),
        2
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;
