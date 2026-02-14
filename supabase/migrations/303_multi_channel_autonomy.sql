-- ============================================================================
-- Migration: 303_multi_channel_autonomy.sql
-- Description: Multi-Channel Autonomy Suite Tables
-- Created: 2025-11-28
--
-- This migration creates tables for the multi-channel autonomy suite,
-- enabling unified social inbox management, ads account orchestration,
-- search keyword tracking, and browser automation patterns.
-- ============================================================================

-- ============================================================================
-- 1. SOCIAL INBOX ACCOUNTS
-- Connected social media accounts for unified inbox management
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_inbox_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
    provider text NOT NULL,
    account_handle text NOT NULL,
    account_id_external text,
    access_token_encrypted text,
    status text DEFAULT 'active',
    connected_at timestamptz DEFAULT now(),

    CONSTRAINT social_inbox_provider_check CHECK (provider IN (
        'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok',
        'youtube', 'pinterest', 'reddit', 'threads', 'whatsapp'
    )),
    CONSTRAINT social_inbox_status_check CHECK (status IN (
        'active', 'inactive', 'expired', 'revoked', 'pending_reauth'
    )),
    CONSTRAINT social_inbox_unique_account UNIQUE (founder_business_id, provider, account_handle)
);

COMMENT ON TABLE social_inbox_accounts IS 'Connected social media accounts for unified inbox management across multiple platforms.';
COMMENT ON COLUMN social_inbox_accounts.founder_business_id IS 'Reference to the founder business owning this account';
COMMENT ON COLUMN social_inbox_accounts.provider IS 'Social platform: facebook, instagram, linkedin, twitter, tiktok, youtube, pinterest, reddit, threads, whatsapp';
COMMENT ON COLUMN social_inbox_accounts.account_handle IS 'Username or handle on the platform';
COMMENT ON COLUMN social_inbox_accounts.account_id_external IS 'External platform account ID';
COMMENT ON COLUMN social_inbox_accounts.access_token_encrypted IS 'Encrypted OAuth access token';
COMMENT ON COLUMN social_inbox_accounts.status IS 'Connection status: active, inactive, expired, revoked, pending_reauth';
COMMENT ON COLUMN social_inbox_accounts.connected_at IS 'When the account was connected';

-- Indexes for social_inbox_accounts
CREATE INDEX IF NOT EXISTS idx_social_inbox_business
    ON social_inbox_accounts (founder_business_id, status);

CREATE INDEX IF NOT EXISTS idx_social_inbox_provider
    ON social_inbox_accounts (provider, status);

-- ============================================================================
-- 2. SOCIAL MESSAGES
-- Inbound and outbound social messages across all connected accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS social_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    social_inbox_account_id uuid NOT NULL REFERENCES social_inbox_accounts(id) ON DELETE CASCADE,
    direction text NOT NULL,
    message_type text DEFAULT 'text',
    message text NOT NULL,
    sender_handle text,
    metadata jsonb DEFAULT '{}'::jsonb,
    sentiment_score numeric,
    created_at timestamptz DEFAULT now(),

    CONSTRAINT social_messages_direction_check CHECK (direction IN ('inbound', 'outbound')),
    CONSTRAINT social_messages_type_check CHECK (message_type IN (
        'text', 'image', 'video', 'link', 'story_reply', 'comment', 'mention',
        'dm', 'reaction', 'share', 'review', 'question'
    )),
    CONSTRAINT social_messages_sentiment_check CHECK (
        sentiment_score IS NULL OR (sentiment_score >= -1 AND sentiment_score <= 1)
    )
);

COMMENT ON TABLE social_messages IS 'Inbound and outbound social messages across all connected social media accounts.';
COMMENT ON COLUMN social_messages.social_inbox_account_id IS 'Reference to the social inbox account';
COMMENT ON COLUMN social_messages.direction IS 'Message direction: inbound (received) or outbound (sent)';
COMMENT ON COLUMN social_messages.message_type IS 'Type: text, image, video, link, story_reply, comment, mention, dm, reaction, share, review, question';
COMMENT ON COLUMN social_messages.message IS 'Message content or text';
COMMENT ON COLUMN social_messages.sender_handle IS 'Handle of the message sender (for inbound)';
COMMENT ON COLUMN social_messages.metadata IS 'Additional message metadata (media URLs, thread info, etc.)';
COMMENT ON COLUMN social_messages.sentiment_score IS 'AI-computed sentiment score (-1 to 1)';

-- Indexes for social_messages
CREATE INDEX IF NOT EXISTS idx_social_messages_account_created
    ON social_messages (social_inbox_account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_messages_direction
    ON social_messages (direction, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_messages_sender
    ON social_messages (sender_handle, created_at DESC)
    WHERE sender_handle IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_social_messages_sentiment
    ON social_messages (sentiment_score)
    WHERE sentiment_score IS NOT NULL;

-- ============================================================================
-- 3. ADS ACCOUNTS
-- Connected advertising platform accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS ads_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
    provider text NOT NULL,
    account_id_external text,
    account_meta jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),

    CONSTRAINT ads_accounts_provider_check CHECK (provider IN (
        'google_ads', 'meta_ads', 'linkedin_ads', 'microsoft_ads',
        'twitter_ads', 'tiktok_ads', 'pinterest_ads', 'amazon_ads', 'apple_search_ads'
    )),
    CONSTRAINT ads_accounts_status_check CHECK (status IN (
        'active', 'inactive', 'suspended', 'pending_approval', 'limited'
    )),
    CONSTRAINT ads_accounts_unique_external UNIQUE (founder_business_id, provider, account_id_external)
);

COMMENT ON TABLE ads_accounts IS 'Connected advertising platform accounts for unified ads management and optimization.';
COMMENT ON COLUMN ads_accounts.founder_business_id IS 'Reference to the founder business owning this account';
COMMENT ON COLUMN ads_accounts.provider IS 'Ad platform: google_ads, meta_ads, linkedin_ads, microsoft_ads, twitter_ads, tiktok_ads, pinterest_ads, amazon_ads, apple_search_ads';
COMMENT ON COLUMN ads_accounts.account_id_external IS 'External platform account ID';
COMMENT ON COLUMN ads_accounts.account_meta IS 'Account metadata (currency, timezone, billing status, etc.)';
COMMENT ON COLUMN ads_accounts.status IS 'Account status: active, inactive, suspended, pending_approval, limited';

-- Indexes for ads_accounts
CREATE INDEX IF NOT EXISTS idx_ads_accounts_business
    ON ads_accounts (founder_business_id, status);

CREATE INDEX IF NOT EXISTS idx_ads_accounts_provider
    ON ads_accounts (provider, status);

-- ============================================================================
-- 4. ADS OPPORTUNITIES
-- AI-detected optimization opportunities for connected ad accounts
-- ============================================================================

CREATE TABLE IF NOT EXISTS ads_opportunities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ads_account_id uuid NOT NULL REFERENCES ads_accounts(id) ON DELETE CASCADE,
    opportunity_type text NOT NULL,
    summary text NOT NULL,
    impact_estimate numeric,
    confidence numeric,
    recommended_action text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),

    CONSTRAINT ads_opportunities_type_check CHECK (opportunity_type IN (
        'budget_optimization', 'bid_adjustment', 'targeting_expansion', 'targeting_exclusion',
        'creative_refresh', 'keyword_addition', 'keyword_negative', 'audience_expansion',
        'placement_optimization', 'schedule_optimization', 'conversion_tracking', 'quality_score',
        'cost_reduction', 'performance_alert', 'competitor_insight', 'trend_opportunity'
    )),
    CONSTRAINT ads_opportunities_status_check CHECK (status IN (
        'pending', 'accepted', 'rejected', 'implemented', 'expired', 'auto_applied'
    )),
    CONSTRAINT ads_opportunities_impact_check CHECK (
        impact_estimate IS NULL OR impact_estimate >= 0
    ),
    CONSTRAINT ads_opportunities_confidence_check CHECK (
        confidence IS NULL OR (confidence >= 0 AND confidence <= 1)
    )
);

COMMENT ON TABLE ads_opportunities IS 'AI-detected optimization opportunities for connected advertising accounts.';
COMMENT ON COLUMN ads_opportunities.ads_account_id IS 'Reference to the ads account';
COMMENT ON COLUMN ads_opportunities.opportunity_type IS 'Type of optimization opportunity';
COMMENT ON COLUMN ads_opportunities.summary IS 'Human-readable summary of the opportunity';
COMMENT ON COLUMN ads_opportunities.impact_estimate IS 'Estimated impact (in currency or percentage)';
COMMENT ON COLUMN ads_opportunities.confidence IS 'AI confidence score (0-1)';
COMMENT ON COLUMN ads_opportunities.recommended_action IS 'Specific recommended action to take';
COMMENT ON COLUMN ads_opportunities.status IS 'Status: pending, accepted, rejected, implemented, expired, auto_applied';

-- Indexes for ads_opportunities
CREATE INDEX IF NOT EXISTS idx_ads_opportunities_account_status
    ON ads_opportunities (ads_account_id, status);

CREATE INDEX IF NOT EXISTS idx_ads_opportunities_type
    ON ads_opportunities (opportunity_type, status);

CREATE INDEX IF NOT EXISTS idx_ads_opportunities_impact
    ON ads_opportunities (impact_estimate DESC)
    WHERE status = 'pending';

-- ============================================================================
-- 5. SEARCH KEYWORDS
-- Tracked search keywords with SERP data and trends
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_keywords (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
    keyword text NOT NULL,
    search_engine text DEFAULT 'google',
    serp_position int,
    impressions int,
    clicks int,
    ctr numeric,
    volatility numeric,
    trend text,
    observed_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),

    CONSTRAINT search_keywords_engine_check CHECK (search_engine IN (
        'google', 'bing', 'yahoo', 'duckduckgo', 'yandex', 'baidu', 'brave'
    )),
    CONSTRAINT search_keywords_position_check CHECK (
        serp_position IS NULL OR serp_position > 0
    ),
    CONSTRAINT search_keywords_ctr_check CHECK (
        ctr IS NULL OR (ctr >= 0 AND ctr <= 1)
    ),
    CONSTRAINT search_keywords_volatility_check CHECK (
        volatility IS NULL OR (volatility >= 0 AND volatility <= 100)
    ),
    CONSTRAINT search_keywords_trend_check CHECK (trend IS NULL OR trend IN (
        'rising', 'stable', 'declining', 'volatile', 'new', 'lost'
    ))
);

COMMENT ON TABLE search_keywords IS 'Tracked search keywords with SERP position, engagement metrics, and trend data.';
COMMENT ON COLUMN search_keywords.founder_business_id IS 'Reference to the founder business';
COMMENT ON COLUMN search_keywords.keyword IS 'The tracked keyword or phrase';
COMMENT ON COLUMN search_keywords.search_engine IS 'Search engine: google, bing, yahoo, duckduckgo, yandex, baidu, brave';
COMMENT ON COLUMN search_keywords.serp_position IS 'Current SERP position (1 = first)';
COMMENT ON COLUMN search_keywords.impressions IS 'Number of search impressions';
COMMENT ON COLUMN search_keywords.clicks IS 'Number of clicks from search';
COMMENT ON COLUMN search_keywords.ctr IS 'Click-through rate (0-1)';
COMMENT ON COLUMN search_keywords.volatility IS 'Ranking volatility score (0-100)';
COMMENT ON COLUMN search_keywords.trend IS 'Trend direction: rising, stable, declining, volatile, new, lost';
COMMENT ON COLUMN search_keywords.observed_at IS 'When this data point was observed';

-- Indexes for search_keywords
CREATE INDEX IF NOT EXISTS idx_search_keywords_business_keyword
    ON search_keywords (founder_business_id, keyword, search_engine);

CREATE INDEX IF NOT EXISTS idx_search_keywords_position
    ON search_keywords (serp_position)
    WHERE serp_position IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_search_keywords_observed
    ON search_keywords (observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_keywords_trend
    ON search_keywords (trend, observed_at DESC)
    WHERE trend IS NOT NULL;

-- ============================================================================
-- 6. BROWSER PATTERNS
-- Reusable browser automation patterns for engagement and monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS browser_patterns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
    pattern_name text NOT NULL,
    pattern_type text NOT NULL,
    pattern_steps jsonb NOT NULL,
    success_rate numeric,
    last_executed_at timestamptz,
    created_at timestamptz DEFAULT now(),

    CONSTRAINT browser_patterns_type_check CHECK (pattern_type IN (
        'serp_engagement', 'social_engagement', 'competitor_monitor',
        'form_submission', 'data_extraction', 'content_verification',
        'link_building_outreach', 'review_monitor', 'custom'
    )),
    CONSTRAINT browser_patterns_success_rate_check CHECK (
        success_rate IS NULL OR (success_rate >= 0 AND success_rate <= 100)
    ),
    CONSTRAINT browser_patterns_unique_name UNIQUE (founder_business_id, pattern_name)
);

COMMENT ON TABLE browser_patterns IS 'Reusable browser automation patterns for engagement, monitoring, and data extraction.';
COMMENT ON COLUMN browser_patterns.founder_business_id IS 'Reference to the founder business';
COMMENT ON COLUMN browser_patterns.pattern_name IS 'Human-readable pattern name';
COMMENT ON COLUMN browser_patterns.pattern_type IS 'Type: serp_engagement, social_engagement, competitor_monitor, form_submission, data_extraction, content_verification, link_building_outreach, review_monitor, custom';
COMMENT ON COLUMN browser_patterns.pattern_steps IS 'JSON array of automation steps with selectors, actions, and conditions';
COMMENT ON COLUMN browser_patterns.success_rate IS 'Historical success rate (0-100)';
COMMENT ON COLUMN browser_patterns.last_executed_at IS 'Last execution timestamp';

-- Indexes for browser_patterns
CREATE INDEX IF NOT EXISTS idx_browser_patterns_business_type
    ON browser_patterns (founder_business_id, pattern_type);

CREATE INDEX IF NOT EXISTS idx_browser_patterns_success
    ON browser_patterns (success_rate DESC)
    WHERE success_rate IS NOT NULL;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE social_inbox_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_patterns ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: social_inbox_accounts
-- ============================================================================

DROP POLICY IF EXISTS "social_inbox_select_via_business" ON social_inbox_accounts;
CREATE POLICY "social_inbox_select_via_business" ON social_inbox_accounts
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = social_inbox_accounts.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "social_inbox_insert_via_business" ON social_inbox_accounts;
CREATE POLICY "social_inbox_insert_via_business" ON social_inbox_accounts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = social_inbox_accounts.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "social_inbox_update_via_business" ON social_inbox_accounts;
CREATE POLICY "social_inbox_update_via_business" ON social_inbox_accounts
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = social_inbox_accounts.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "social_inbox_delete_via_business" ON social_inbox_accounts;
CREATE POLICY "social_inbox_delete_via_business" ON social_inbox_accounts
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = social_inbox_accounts.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: social_messages
-- ============================================================================

DROP POLICY IF EXISTS "social_messages_select_via_account" ON social_messages;
CREATE POLICY "social_messages_select_via_account" ON social_messages
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM social_inbox_accounts sia
            JOIN founder_businesses fb ON fb.id = sia.founder_business_id
            WHERE sia.id = social_messages.social_inbox_account_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "social_messages_insert_via_account" ON social_messages;
CREATE POLICY "social_messages_insert_via_account" ON social_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM social_inbox_accounts sia
            JOIN founder_businesses fb ON fb.id = sia.founder_business_id
            WHERE sia.id = social_messages.social_inbox_account_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "social_messages_update_via_account" ON social_messages;
CREATE POLICY "social_messages_update_via_account" ON social_messages
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM social_inbox_accounts sia
            JOIN founder_businesses fb ON fb.id = sia.founder_business_id
            WHERE sia.id = social_messages.social_inbox_account_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "social_messages_delete_via_account" ON social_messages;
CREATE POLICY "social_messages_delete_via_account" ON social_messages
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM social_inbox_accounts sia
            JOIN founder_businesses fb ON fb.id = sia.founder_business_id
            WHERE sia.id = social_messages.social_inbox_account_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: ads_accounts
-- ============================================================================

DROP POLICY IF EXISTS "ads_accounts_select_via_business" ON ads_accounts;
CREATE POLICY "ads_accounts_select_via_business" ON ads_accounts
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = ads_accounts.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "ads_accounts_insert_via_business" ON ads_accounts;
CREATE POLICY "ads_accounts_insert_via_business" ON ads_accounts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = ads_accounts.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "ads_accounts_update_via_business" ON ads_accounts;
CREATE POLICY "ads_accounts_update_via_business" ON ads_accounts
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = ads_accounts.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "ads_accounts_delete_via_business" ON ads_accounts;
CREATE POLICY "ads_accounts_delete_via_business" ON ads_accounts
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = ads_accounts.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: ads_opportunities
-- ============================================================================

DROP POLICY IF EXISTS "ads_opportunities_select_via_account" ON ads_opportunities;
CREATE POLICY "ads_opportunities_select_via_account" ON ads_opportunities
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM ads_accounts aa
            JOIN founder_businesses fb ON fb.id = aa.founder_business_id
            WHERE aa.id = ads_opportunities.ads_account_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "ads_opportunities_insert_via_account" ON ads_opportunities;
CREATE POLICY "ads_opportunities_insert_via_account" ON ads_opportunities
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ads_accounts aa
            JOIN founder_businesses fb ON fb.id = aa.founder_business_id
            WHERE aa.id = ads_opportunities.ads_account_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "ads_opportunities_update_via_account" ON ads_opportunities;
CREATE POLICY "ads_opportunities_update_via_account" ON ads_opportunities
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM ads_accounts aa
            JOIN founder_businesses fb ON fb.id = aa.founder_business_id
            WHERE aa.id = ads_opportunities.ads_account_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "ads_opportunities_delete_via_account" ON ads_opportunities;
CREATE POLICY "ads_opportunities_delete_via_account" ON ads_opportunities
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM ads_accounts aa
            JOIN founder_businesses fb ON fb.id = aa.founder_business_id
            WHERE aa.id = ads_opportunities.ads_account_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: search_keywords
-- ============================================================================

DROP POLICY IF EXISTS "search_keywords_select_via_business" ON search_keywords;
CREATE POLICY "search_keywords_select_via_business" ON search_keywords
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = search_keywords.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "search_keywords_insert_via_business" ON search_keywords;
CREATE POLICY "search_keywords_insert_via_business" ON search_keywords
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = search_keywords.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "search_keywords_update_via_business" ON search_keywords;
CREATE POLICY "search_keywords_update_via_business" ON search_keywords
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = search_keywords.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "search_keywords_delete_via_business" ON search_keywords;
CREATE POLICY "search_keywords_delete_via_business" ON search_keywords
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = search_keywords.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: browser_patterns
-- ============================================================================

DROP POLICY IF EXISTS "browser_patterns_select_via_business" ON browser_patterns;
CREATE POLICY "browser_patterns_select_via_business" ON browser_patterns
    FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = browser_patterns.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "browser_patterns_insert_via_business" ON browser_patterns;
CREATE POLICY "browser_patterns_insert_via_business" ON browser_patterns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = browser_patterns.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "browser_patterns_update_via_business" ON browser_patterns;
CREATE POLICY "browser_patterns_update_via_business" ON browser_patterns
    FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = browser_patterns.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "browser_patterns_delete_via_business" ON browser_patterns;
CREATE POLICY "browser_patterns_delete_via_business" ON browser_patterns
    FOR DELETE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = browser_patterns.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON social_inbox_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON social_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ads_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ads_opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON search_keywords TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON browser_patterns TO authenticated;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get unified inbox message count by platform
CREATE OR REPLACE FUNCTION get_social_inbox_summary(p_business_id uuid)
RETURNS TABLE (
    provider text,
    account_handle text,
    total_messages bigint,
    unread_inbound bigint,
    avg_sentiment numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sia.provider,
        sia.account_handle,
        COUNT(sm.id)::bigint AS total_messages,
        COUNT(sm.id) FILTER (WHERE sm.direction = 'inbound')::bigint AS unread_inbound,
        ROUND(AVG(sm.sentiment_score)::numeric, 2) AS avg_sentiment
    FROM social_inbox_accounts sia
    LEFT JOIN social_messages sm ON sm.social_inbox_account_id = sia.id
    WHERE sia.founder_business_id = p_business_id
    AND sia.status = 'active'
    GROUP BY sia.id, sia.provider, sia.account_handle
    ORDER BY sia.provider;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get top keyword opportunities
CREATE OR REPLACE FUNCTION get_keyword_opportunities(p_business_id uuid, p_limit int DEFAULT 20)
RETURNS TABLE (
    keyword text,
    search_engine text,
    serp_position int,
    trend text,
    opportunity_score numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sk.keyword,
        sk.search_engine,
        sk.serp_position,
        sk.trend,
        CASE
            WHEN sk.serp_position <= 10 AND sk.trend = 'rising' THEN 90
            WHEN sk.serp_position <= 10 AND sk.trend = 'stable' THEN 70
            WHEN sk.serp_position BETWEEN 11 AND 20 AND sk.trend = 'rising' THEN 85
            WHEN sk.serp_position BETWEEN 11 AND 20 THEN 60
            WHEN sk.serp_position BETWEEN 21 AND 50 AND sk.trend = 'rising' THEN 75
            ELSE 40
        END::numeric AS opportunity_score
    FROM search_keywords sk
    WHERE sk.founder_business_id = p_business_id
    AND sk.serp_position IS NOT NULL
    ORDER BY opportunity_score DESC, sk.observed_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 303_multi_channel_autonomy.sql completed successfully';
    RAISE NOTICE 'Created tables: social_inbox_accounts, social_messages, ads_accounts, ads_opportunities, search_keywords, browser_patterns';
    RAISE NOTICE 'RLS enabled and policies created for all tables';
END $$;
