-- =====================================================
-- Migration 460: Synthex Multi-Channel Send Engine v3
-- Phase: D31 - Email + SMS + Social + Push
-- =====================================================
-- Unified multi-channel message delivery with rate
-- limiting, retry logic, and delivery tracking
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

-- Channel types for sending
CREATE TYPE synthex_send_channel_type AS ENUM (
    'email',
    'sms',
    'push',
    'whatsapp',
    'slack',
    'discord',
    'telegram',
    'facebook_messenger',
    'instagram_dm',
    'twitter_dm',
    'linkedin_message',
    'in_app',
    'webhook',
    'custom'
);

-- Provider types
CREATE TYPE synthex_send_provider_type AS ENUM (
    'sendgrid',
    'mailgun',
    'ses',
    'postmark',
    'twilio',
    'messagebird',
    'vonage',
    'firebase',
    'onesignal',
    'pusher',
    'meta',
    'slack_api',
    'discord_api',
    'telegram_api',
    'custom'
);

-- Message status
CREATE TYPE synthex_send_status AS ENUM (
    'pending',
    'queued',
    'sending',
    'sent',
    'delivered',
    'failed',
    'bounced',
    'rejected',
    'spam',
    'unsubscribed',
    'cancelled'
);

-- Message priority
CREATE TYPE synthex_send_priority AS ENUM (
    'critical',
    'high',
    'normal',
    'low',
    'bulk'
);

-- Template type
CREATE TYPE synthex_send_template_type AS ENUM (
    'transactional',
    'marketing',
    'notification',
    'reminder',
    'alert',
    'welcome',
    'onboarding',
    're_engagement',
    'custom'
);

-- =====================================================
-- TABLE: synthex_send_channels
-- =====================================================
-- Channel configurations and provider credentials

CREATE TABLE IF NOT EXISTS synthex_send_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Channel identification
    channel_name TEXT NOT NULL,
    channel_type synthex_send_channel_type NOT NULL,
    provider synthex_send_provider_type,

    -- Configuration
    credentials JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',

    -- Rate limiting
    rate_limit_per_second INTEGER DEFAULT 10,
    rate_limit_per_minute INTEGER DEFAULT 500,
    rate_limit_per_hour INTEGER DEFAULT 10000,
    rate_limit_per_day INTEGER DEFAULT 100000,

    -- Current usage (reset periodically)
    current_second_count INTEGER DEFAULT 0,
    current_minute_count INTEGER DEFAULT 0,
    current_hour_count INTEGER DEFAULT 0,
    current_day_count INTEGER DEFAULT 0,
    last_rate_reset_at TIMESTAMPTZ DEFAULT NOW(),

    -- Health metrics
    success_rate NUMERIC(5,4) DEFAULT 1.0,
    avg_delivery_time_ms INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMPTZ,

    -- Status
    status TEXT DEFAULT 'active',
    is_default BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE
);

-- Indexes for send channels
CREATE INDEX idx_send_channels_tenant ON synthex_send_channels(tenant_id);
CREATE INDEX idx_send_channels_type ON synthex_send_channels(tenant_id, channel_type);
CREATE INDEX idx_send_channels_provider ON synthex_send_channels(tenant_id, provider);
CREATE INDEX idx_send_channels_status ON synthex_send_channels(tenant_id, status);
CREATE INDEX idx_send_channels_default ON synthex_send_channels(tenant_id, channel_type, is_default) WHERE is_default = TRUE;

-- RLS for send channels
ALTER TABLE synthex_send_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for send channels"
    ON synthex_send_channels
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_send_templates
-- =====================================================
-- Reusable message templates

CREATE TABLE IF NOT EXISTS synthex_send_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Template identification
    template_name TEXT NOT NULL,
    template_key TEXT NOT NULL,
    template_type synthex_send_template_type NOT NULL DEFAULT 'custom',
    channel_type synthex_send_channel_type NOT NULL,

    -- Content
    subject TEXT,
    body_text TEXT,
    body_html TEXT,
    body_json JSONB,

    -- Variables
    variables JSONB DEFAULT '[]',
    default_values JSONB DEFAULT '{}',

    -- Personalization
    personalization_rules JSONB DEFAULT '[]',
    conditional_blocks JSONB DEFAULT '[]',

    -- A/B testing
    variants JSONB DEFAULT '[]',
    variant_weights JSONB DEFAULT '{}',

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,

    -- Stats
    send_count INTEGER DEFAULT 0,
    open_count INTEGER DEFAULT 0,
    click_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    CONSTRAINT uq_template_key UNIQUE (tenant_id, template_key)
);

-- Indexes for send templates
CREATE INDEX idx_send_templates_tenant ON synthex_send_templates(tenant_id);
CREATE INDEX idx_send_templates_key ON synthex_send_templates(tenant_id, template_key);
CREATE INDEX idx_send_templates_type ON synthex_send_templates(tenant_id, template_type);
CREATE INDEX idx_send_templates_channel ON synthex_send_templates(tenant_id, channel_type);
CREATE INDEX idx_send_templates_active ON synthex_send_templates(tenant_id, is_active) WHERE is_active = TRUE;

-- RLS for send templates
ALTER TABLE synthex_send_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for send templates"
    ON synthex_send_templates
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_send_queue_v3
-- =====================================================
-- Message queue with retry logic

CREATE TABLE IF NOT EXISTS synthex_send_queue_v3 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Channel and template
    channel_id UUID NOT NULL,
    template_id UUID,

    -- Recipient
    recipient_id TEXT,
    recipient_type TEXT DEFAULT 'contact',
    recipient_address TEXT NOT NULL,
    recipient_name TEXT,
    recipient_metadata JSONB DEFAULT '{}',

    -- Message content
    channel_type synthex_send_channel_type NOT NULL,
    subject TEXT,
    body TEXT,
    payload JSONB NOT NULL DEFAULT '{}',
    attachments JSONB DEFAULT '[]',

    -- Personalization data
    merge_fields JSONB DEFAULT '{}',

    -- Priority and scheduling
    priority synthex_send_priority NOT NULL DEFAULT 'normal',
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    -- Status tracking
    status synthex_send_status NOT NULL DEFAULT 'pending',
    status_message TEXT,

    -- Retry logic
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    retry_delay_seconds INTEGER DEFAULT 60,

    -- Delivery tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,

    -- Provider response
    provider_message_id TEXT,
    provider_response JSONB DEFAULT '{}',

    -- Source tracking
    campaign_id UUID,
    sequence_id UUID,
    journey_id UUID,
    trigger_type TEXT,
    trigger_id TEXT,

    -- Cost tracking
    estimated_cost NUMERIC(10,6) DEFAULT 0,
    actual_cost NUMERIC(10,6) DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_channel FOREIGN KEY (channel_id)
        REFERENCES synthex_send_channels(id) ON DELETE CASCADE,
    CONSTRAINT fk_template FOREIGN KEY (template_id)
        REFERENCES synthex_send_templates(id) ON DELETE SET NULL
);

-- Indexes for send queue
CREATE INDEX idx_send_queue_tenant ON synthex_send_queue_v3(tenant_id);
CREATE INDEX idx_send_queue_status ON synthex_send_queue_v3(tenant_id, status);
CREATE INDEX idx_send_queue_priority ON synthex_send_queue_v3(tenant_id, priority, scheduled_at);
CREATE INDEX idx_send_queue_next_attempt ON synthex_send_queue_v3(status, next_attempt_at) WHERE status IN ('pending', 'queued', 'failed');
CREATE INDEX idx_send_queue_recipient ON synthex_send_queue_v3(tenant_id, recipient_address);
CREATE INDEX idx_send_queue_campaign ON synthex_send_queue_v3(tenant_id, campaign_id);
CREATE INDEX idx_send_queue_channel ON synthex_send_queue_v3(tenant_id, channel_type);
CREATE INDEX idx_send_queue_created ON synthex_send_queue_v3(tenant_id, created_at DESC);

-- RLS for send queue
ALTER TABLE synthex_send_queue_v3 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for send queue"
    ON synthex_send_queue_v3
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_send_events
-- =====================================================
-- Delivery and engagement events

CREATE TABLE IF NOT EXISTS synthex_send_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    queue_id UUID NOT NULL,

    -- Event details
    event_type TEXT NOT NULL,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Event data
    event_data JSONB DEFAULT '{}',
    user_agent TEXT,
    ip_address INET,
    geo_data JSONB DEFAULT '{}',

    -- Link tracking
    link_url TEXT,
    link_id TEXT,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_queue FOREIGN KEY (queue_id)
        REFERENCES synthex_send_queue_v3(id) ON DELETE CASCADE
);

-- Indexes for send events
CREATE INDEX idx_send_events_tenant ON synthex_send_events(tenant_id);
CREATE INDEX idx_send_events_queue ON synthex_send_events(queue_id);
CREATE INDEX idx_send_events_type ON synthex_send_events(tenant_id, event_type);
CREATE INDEX idx_send_events_timestamp ON synthex_send_events(tenant_id, event_timestamp DESC);

-- RLS for send events
ALTER TABLE synthex_send_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for send events"
    ON synthex_send_events
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_send_analytics
-- =====================================================
-- Aggregated send analytics

CREATE TABLE IF NOT EXISTS synthex_send_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Aggregation period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type TEXT NOT NULL DEFAULT 'daily',

    -- Dimensions
    channel_type synthex_send_channel_type,
    channel_id UUID,
    template_id UUID,
    campaign_id UUID,

    -- Volume metrics
    total_queued INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    total_bounced INTEGER DEFAULT 0,

    -- Engagement metrics
    total_opened INTEGER DEFAULT 0,
    total_clicked INTEGER DEFAULT 0,
    total_converted INTEGER DEFAULT 0,
    total_unsubscribed INTEGER DEFAULT 0,
    total_spam_reported INTEGER DEFAULT 0,

    -- Rate metrics
    delivery_rate NUMERIC(5,4) DEFAULT 0,
    open_rate NUMERIC(5,4) DEFAULT 0,
    click_rate NUMERIC(5,4) DEFAULT 0,
    conversion_rate NUMERIC(5,4) DEFAULT 0,
    bounce_rate NUMERIC(5,4) DEFAULT 0,

    -- Performance metrics
    avg_delivery_time_ms INTEGER DEFAULT 0,
    p95_delivery_time_ms INTEGER DEFAULT 0,

    -- Cost metrics
    total_cost NUMERIC(15,6) DEFAULT 0,
    cost_per_send NUMERIC(10,6) DEFAULT 0,
    cost_per_conversion NUMERIC(10,6) DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE
);

-- Indexes for send analytics
CREATE INDEX idx_send_analytics_tenant ON synthex_send_analytics(tenant_id);
CREATE INDEX idx_send_analytics_period ON synthex_send_analytics(tenant_id, period_start, period_end);
CREATE INDEX idx_send_analytics_channel ON synthex_send_analytics(tenant_id, channel_type, period_start);
CREATE INDEX idx_send_analytics_campaign ON synthex_send_analytics(tenant_id, campaign_id, period_start);

-- RLS for send analytics
ALTER TABLE synthex_send_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for send analytics"
    ON synthex_send_analytics
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Get next messages to send
CREATE OR REPLACE FUNCTION get_pending_messages(
    p_tenant_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS SETOF synthex_send_queue_v3
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM synthex_send_queue_v3
    WHERE tenant_id = p_tenant_id
      AND status IN ('pending', 'queued')
      AND next_attempt_at <= NOW()
      AND (expires_at IS NULL OR expires_at > NOW())
      AND attempts < max_attempts
    ORDER BY
        CASE priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
            WHEN 'bulk' THEN 5
        END,
        scheduled_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED;
END;
$$;

-- Function: Check rate limit
CREATE OR REPLACE FUNCTION check_channel_rate_limit(p_channel_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_channel RECORD;
    v_can_send BOOLEAN := TRUE;
BEGIN
    SELECT * INTO v_channel
    FROM synthex_send_channels
    WHERE id = p_channel_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Reset counters if needed
    IF v_channel.last_rate_reset_at < NOW() - INTERVAL '1 second' THEN
        UPDATE synthex_send_channels
        SET current_second_count = 0,
            last_rate_reset_at = NOW()
        WHERE id = p_channel_id;
        v_channel.current_second_count := 0;
    END IF;

    -- Check rate limits
    IF v_channel.current_second_count >= v_channel.rate_limit_per_second THEN
        v_can_send := FALSE;
    ELSIF v_channel.current_minute_count >= v_channel.rate_limit_per_minute THEN
        v_can_send := FALSE;
    ELSIF v_channel.current_hour_count >= v_channel.rate_limit_per_hour THEN
        v_can_send := FALSE;
    ELSIF v_channel.current_day_count >= v_channel.rate_limit_per_day THEN
        v_can_send := FALSE;
    END IF;

    RETURN v_can_send;
END;
$$;

-- Function: Increment rate limit counters
CREATE OR REPLACE FUNCTION increment_rate_limit(p_channel_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE synthex_send_channels
    SET current_second_count = current_second_count + 1,
        current_minute_count = current_minute_count + 1,
        current_hour_count = current_hour_count + 1,
        current_day_count = current_day_count + 1
    WHERE id = p_channel_id;
END;
$$;

-- Function: Get send engine stats
CREATE OR REPLACE FUNCTION get_send_engine_stats(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats JSONB;
    v_total_channels INTEGER;
    v_active_channels INTEGER;
    v_total_templates INTEGER;
    v_pending_messages INTEGER;
    v_sent_today INTEGER;
    v_failed_today INTEGER;
    v_delivery_rate NUMERIC;
BEGIN
    -- Count channels
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'active')
    INTO v_total_channels, v_active_channels
    FROM synthex_send_channels
    WHERE tenant_id = p_tenant_id;

    -- Count templates
    SELECT COUNT(*) INTO v_total_templates
    FROM synthex_send_templates
    WHERE tenant_id = p_tenant_id AND is_active = TRUE;

    -- Count pending messages
    SELECT COUNT(*) INTO v_pending_messages
    FROM synthex_send_queue_v3
    WHERE tenant_id = p_tenant_id
      AND status IN ('pending', 'queued');

    -- Count sent today
    SELECT COUNT(*) INTO v_sent_today
    FROM synthex_send_queue_v3
    WHERE tenant_id = p_tenant_id
      AND status = 'sent'
      AND sent_at >= CURRENT_DATE;

    -- Count failed today
    SELECT COUNT(*) INTO v_failed_today
    FROM synthex_send_queue_v3
    WHERE tenant_id = p_tenant_id
      AND status = 'failed'
      AND failed_at >= CURRENT_DATE;

    -- Calculate delivery rate
    IF v_sent_today + v_failed_today > 0 THEN
        v_delivery_rate := v_sent_today::NUMERIC / (v_sent_today + v_failed_today);
    ELSE
        v_delivery_rate := 1.0;
    END IF;

    v_stats := jsonb_build_object(
        'total_channels', v_total_channels,
        'active_channels', v_active_channels,
        'total_templates', v_total_templates,
        'pending_messages', v_pending_messages,
        'sent_today', v_sent_today,
        'failed_today', v_failed_today,
        'delivery_rate', v_delivery_rate
    );

    RETURN v_stats;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION update_send_engine_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_send_channels_updated
    BEFORE UPDATE ON synthex_send_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_send_engine_timestamp();

CREATE TRIGGER trg_send_templates_updated
    BEFORE UPDATE ON synthex_send_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_send_engine_timestamp();

CREATE TRIGGER trg_send_queue_updated
    BEFORE UPDATE ON synthex_send_queue_v3
    FOR EACH ROW
    EXECUTE FUNCTION update_send_engine_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE synthex_send_channels IS 'Channel configurations with provider credentials and rate limits';
COMMENT ON TABLE synthex_send_templates IS 'Reusable message templates with personalization';
COMMENT ON TABLE synthex_send_queue_v3 IS 'Message queue with retry logic and delivery tracking';
COMMENT ON TABLE synthex_send_events IS 'Delivery and engagement events';
COMMENT ON TABLE synthex_send_analytics IS 'Aggregated send analytics by period';

COMMENT ON FUNCTION get_pending_messages IS 'Get next batch of messages to send with priority ordering';
COMMENT ON FUNCTION check_channel_rate_limit IS 'Check if channel is within rate limits';
COMMENT ON FUNCTION get_send_engine_stats IS 'Get overall send engine statistics';
