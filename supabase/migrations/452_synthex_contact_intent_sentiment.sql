-- =====================================================
-- Migration 452: Synthex Contact Intent & Sentiment AI
-- Phase D23: Contact Intent + Sentiment AI Engine
-- =====================================================
-- AI-powered analysis of contact communications to extract
-- intent signals and sentiment for personalized engagement.
-- =====================================================

-- =====================================================
-- Table: synthex_library_contact_intents
-- Detected intents from contact communications
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_contact_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Contact Reference
    contact_id UUID NOT NULL,
    lead_id UUID,
    customer_id UUID,

    -- Intent Detection
    intent TEXT NOT NULL, -- 'purchase', 'inquiry', 'support', 'complaint', etc.
    intent_category TEXT NOT NULL CHECK (intent_category IN (
        'transactional', 'informational', 'navigational',
        'support', 'feedback', 'engagement', 'other'
    )),
    sub_intent TEXT,
    intent_strength TEXT CHECK (intent_strength IN (
        'weak', 'moderate', 'strong', 'very_strong'
    )) DEFAULT 'moderate',

    -- Sentiment Analysis
    sentiment TEXT CHECK (sentiment IN (
        'very_negative', 'negative', 'neutral', 'positive', 'very_positive'
    )),
    sentiment_score NUMERIC(4,3), -- -1.0 to 1.0
    sentiment_aspects JSONB DEFAULT '[]', -- [{ aspect, sentiment, score }]

    -- Confidence
    confidence NUMERIC(4,3) DEFAULT 0.0,
    ai_model TEXT,
    analysis_version INTEGER DEFAULT 1,

    -- Source
    source TEXT NOT NULL CHECK (source IN (
        'email', 'chat', 'call_transcript', 'form_submission',
        'social_media', 'support_ticket', 'meeting_notes', 'other'
    )),
    source_id TEXT, -- Reference to original message/interaction
    source_channel TEXT,

    -- Content
    raw_text TEXT,
    processed_text TEXT,
    key_phrases TEXT[] DEFAULT '{}',
    entities JSONB DEFAULT '[]', -- [{ type, value, context }]

    -- Context
    conversation_id TEXT,
    interaction_sequence INTEGER DEFAULT 1,
    previous_intent_id UUID,

    -- Urgency & Priority
    urgency_level TEXT CHECK (urgency_level IN (
        'low', 'medium', 'high', 'critical'
    )) DEFAULT 'medium',
    requires_response BOOLEAN DEFAULT false,
    response_deadline TIMESTAMPTZ,

    -- Actions
    suggested_actions JSONB DEFAULT '[]', -- [{ action, priority, reason }]
    action_taken TEXT,
    action_taken_at TIMESTAMPTZ,
    action_taken_by UUID,

    -- Lifecycle
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,

    -- Metadata
    meta JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',

    -- Timestamps
    analyzed_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT fk_previous_intent FOREIGN KEY (previous_intent_id)
        REFERENCES synthex_library_contact_intents(id) ON DELETE SET NULL
);

-- =====================================================
-- Table: synthex_library_intent_patterns
-- Learned patterns for intent detection
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_intent_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Pattern Identity
    pattern_name TEXT NOT NULL,
    description TEXT,

    -- Pattern Definition
    intent TEXT NOT NULL,
    intent_category TEXT NOT NULL,

    -- Detection Rules
    keywords TEXT[] DEFAULT '{}',
    phrases TEXT[] DEFAULT '{}',
    regex_patterns TEXT[] DEFAULT '{}',
    semantic_embeddings JSONB, -- Vector embeddings for semantic matching

    -- Weights
    keyword_weight NUMERIC(3,2) DEFAULT 0.3,
    phrase_weight NUMERIC(3,2) DEFAULT 0.4,
    semantic_weight NUMERIC(3,2) DEFAULT 0.3,

    -- Performance
    match_count INTEGER DEFAULT 0,
    accuracy_score NUMERIC(4,3),
    last_matched_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: synthex_library_sentiment_history
-- Historical sentiment tracking per contact
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_sentiment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Contact Reference
    contact_id UUID NOT NULL,

    -- Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type TEXT NOT NULL CHECK (period_type IN (
        'day', 'week', 'month', 'quarter'
    )),

    -- Aggregated Sentiment
    avg_sentiment_score NUMERIC(4,3),
    min_sentiment_score NUMERIC(4,3),
    max_sentiment_score NUMERIC(4,3),
    sentiment_variance NUMERIC(4,3),

    -- Distribution
    very_negative_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    positive_count INTEGER DEFAULT 0,
    very_positive_count INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,

    -- Trends
    sentiment_trend TEXT CHECK (sentiment_trend IN (
        'improving', 'stable', 'declining'
    )),
    trend_strength NUMERIC(4,3),

    -- Top Intents
    top_intents JSONB DEFAULT '[]', -- [{ intent, count, avg_sentiment }]

    -- Timestamps
    calculated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: synthex_library_intent_signals
-- Real-time intent signals for scoring
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_intent_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Contact Reference
    contact_id UUID NOT NULL,

    -- Signal
    signal_type TEXT NOT NULL CHECK (signal_type IN (
        'buying_signal', 'churn_risk', 'upsell_opportunity',
        'support_escalation', 'engagement_drop', 'advocacy_potential',
        'referral_intent', 'expansion_interest', 'renewal_concern'
    )),
    signal_strength NUMERIC(4,3) NOT NULL, -- 0.0 to 1.0
    signal_source TEXT NOT NULL, -- 'intent_analysis', 'pattern_match', 'ml_prediction'

    -- Evidence
    contributing_intents UUID[] DEFAULT '{}',
    evidence JSONB DEFAULT '[]', -- [{ type, description, weight }]

    -- Scoring Impact
    score_impact NUMERIC(5,2), -- Points to add/subtract
    confidence NUMERIC(4,3),

    -- Lifecycle
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,

    -- Timestamps
    detected_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: synthex_library_intent_responses
-- Suggested/automated responses based on intent
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_intent_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Targeting
    intent TEXT NOT NULL,
    intent_category TEXT,
    sentiment_range_min NUMERIC(4,3),
    sentiment_range_max NUMERIC(4,3),
    urgency_levels TEXT[] DEFAULT '{}',

    -- Response Configuration
    response_name TEXT NOT NULL,
    response_type TEXT NOT NULL CHECK (response_type IN (
        'email_template', 'chat_script', 'task_creation',
        'notification', 'workflow_trigger', 'escalation'
    )),

    -- Response Content
    response_content JSONB NOT NULL,
    personalization_tokens TEXT[] DEFAULT '{}',

    -- Automation
    auto_trigger BOOLEAN DEFAULT false,
    approval_required BOOLEAN DEFAULT true,
    delay_minutes INTEGER DEFAULT 0,

    -- Performance
    use_count INTEGER DEFAULT 0,
    success_rate NUMERIC(4,3),
    avg_response_time_minutes INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT true,
    priority_order INTEGER DEFAULT 100,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: synthex_library_intent_analytics
-- Aggregated analytics for intent patterns
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_intent_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Period
    analytics_date DATE NOT NULL,
    analytics_type TEXT NOT NULL CHECK (analytics_type IN (
        'daily', 'weekly', 'monthly'
    )),

    -- Intent Breakdown
    intent_counts JSONB DEFAULT '{}', -- { intent: count }
    category_counts JSONB DEFAULT '{}', -- { category: count }

    -- Sentiment Overview
    avg_sentiment_score NUMERIC(4,3),
    sentiment_distribution JSONB DEFAULT '{}', -- { sentiment: count }

    -- Volume
    total_intents INTEGER DEFAULT 0,
    unique_contacts INTEGER DEFAULT 0,

    -- Signals
    signal_counts JSONB DEFAULT '{}', -- { signal_type: count }
    active_signals INTEGER DEFAULT 0,

    -- Performance
    response_rate NUMERIC(4,3),
    avg_response_time_minutes INTEGER,
    resolution_rate NUMERIC(4,3),

    -- Timestamps
    calculated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, analytics_date, analytics_type)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_contact_intents_tenant
    ON synthex_library_contact_intents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contact_intents_contact
    ON synthex_library_contact_intents(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_intents_intent
    ON synthex_library_contact_intents(intent, intent_category);
CREATE INDEX IF NOT EXISTS idx_contact_intents_sentiment
    ON synthex_library_contact_intents(sentiment, sentiment_score);
CREATE INDEX IF NOT EXISTS idx_contact_intents_source
    ON synthex_library_contact_intents(source, source_id);
CREATE INDEX IF NOT EXISTS idx_contact_intents_analyzed
    ON synthex_library_contact_intents(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_intents_unresolved
    ON synthex_library_contact_intents(is_resolved, requires_response)
    WHERE is_resolved = false AND requires_response = true;

CREATE INDEX IF NOT EXISTS idx_intent_patterns_tenant
    ON synthex_library_intent_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_intent_patterns_intent
    ON synthex_library_intent_patterns(intent, is_active);
CREATE INDEX IF NOT EXISTS idx_intent_patterns_keywords
    ON synthex_library_intent_patterns USING GIN(keywords);

CREATE INDEX IF NOT EXISTS idx_sentiment_history_tenant
    ON synthex_library_sentiment_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_history_contact
    ON synthex_library_sentiment_history(contact_id, period_type);
CREATE INDEX IF NOT EXISTS idx_sentiment_history_period
    ON synthex_library_sentiment_history(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_intent_signals_tenant
    ON synthex_library_intent_signals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_intent_signals_contact
    ON synthex_library_intent_signals(contact_id, signal_type);
CREATE INDEX IF NOT EXISTS idx_intent_signals_active
    ON synthex_library_intent_signals(is_active, expires_at)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_intent_responses_tenant
    ON synthex_library_intent_responses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_intent_responses_targeting
    ON synthex_library_intent_responses(intent, intent_category, is_active);

CREATE INDEX IF NOT EXISTS idx_intent_analytics_tenant
    ON synthex_library_intent_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_intent_analytics_date
    ON synthex_library_intent_analytics(analytics_date DESC, analytics_type);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_contact_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_intent_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_sentiment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_intent_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_intent_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_intent_analytics ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "tenant_isolation" ON synthex_library_contact_intents
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_intent_patterns
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_sentiment_history
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_intent_signals
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_intent_responses
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_intent_analytics
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Functions
-- =====================================================

-- Function: Update contact sentiment after new intent
CREATE OR REPLACE FUNCTION update_contact_sentiment_on_intent()
RETURNS TRIGGER AS $$
BEGIN
    -- This could trigger a background job to recalculate sentiment history
    -- For now, just update timestamp on any related records
    UPDATE synthex_library_contact_intents
    SET updated_at = now()
    WHERE contact_id = NEW.contact_id
      AND id != NEW.id
      AND analyzed_at > now() - interval '24 hours';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_contact_sentiment
    AFTER INSERT ON synthex_library_contact_intents
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_sentiment_on_intent();

-- Function: Expire old signals
CREATE OR REPLACE FUNCTION expire_old_intent_signals()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE synthex_library_intent_signals
    SET is_active = false
    WHERE is_active = true
      AND expires_at IS NOT NULL
      AND expires_at < now();

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get contact sentiment summary
CREATE OR REPLACE FUNCTION get_contact_sentiment_summary(
    p_tenant_id UUID,
    p_contact_id UUID
)
RETURNS TABLE (
    total_intents BIGINT,
    avg_sentiment NUMERIC,
    dominant_sentiment TEXT,
    top_intent TEXT,
    recent_trend TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_intents AS (
        SELECT
            sentiment,
            sentiment_score,
            intent,
            analyzed_at
        FROM synthex_library_contact_intents
        WHERE tenant_id = p_tenant_id
          AND contact_id = p_contact_id
          AND analyzed_at > now() - interval '30 days'
    ),
    sentiment_mode AS (
        SELECT sentiment, COUNT(*) as cnt
        FROM recent_intents
        WHERE sentiment IS NOT NULL
        GROUP BY sentiment
        ORDER BY cnt DESC
        LIMIT 1
    ),
    intent_mode AS (
        SELECT intent, COUNT(*) as cnt
        FROM recent_intents
        GROUP BY intent
        ORDER BY cnt DESC
        LIMIT 1
    ),
    trend_calc AS (
        SELECT
            CASE
                WHEN AVG(CASE WHEN analyzed_at > now() - interval '7 days' THEN sentiment_score END) >
                     AVG(CASE WHEN analyzed_at <= now() - interval '7 days' THEN sentiment_score END)
                THEN 'improving'
                WHEN AVG(CASE WHEN analyzed_at > now() - interval '7 days' THEN sentiment_score END) <
                     AVG(CASE WHEN analyzed_at <= now() - interval '7 days' THEN sentiment_score END)
                THEN 'declining'
                ELSE 'stable'
            END as trend
        FROM recent_intents
    )
    SELECT
        COUNT(*)::BIGINT as total_intents,
        ROUND(AVG(sentiment_score), 3) as avg_sentiment,
        (SELECT sentiment FROM sentiment_mode) as dominant_sentiment,
        (SELECT intent FROM intent_mode) as top_intent,
        (SELECT trend FROM trend_calc) as recent_trend
    FROM recent_intents;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Default Data: Intent Patterns
-- =====================================================
INSERT INTO synthex_library_intent_patterns (
    tenant_id, pattern_name, description, intent, intent_category,
    keywords, phrases, is_system
)
SELECT
    '00000000-0000-0000-0000-000000000000'::uuid,
    pattern_name, description, intent, intent_category,
    keywords, phrases, true
FROM (VALUES
    ('Purchase Intent', 'Signals buying intention', 'purchase',
     'transactional',
     ARRAY['buy', 'purchase', 'order', 'pricing', 'quote', 'cost', 'subscribe'],
     ARRAY['how much does', 'what is the price', 'ready to buy', 'want to order']),
    ('Support Request', 'Seeking help or assistance', 'support',
     'support',
     ARRAY['help', 'issue', 'problem', 'error', 'broken', 'not working', 'fix'],
     ARRAY['need help with', 'having trouble', 'can you assist', 'experiencing issues']),
    ('Information Inquiry', 'Seeking information', 'inquiry',
     'informational',
     ARRAY['how', 'what', 'when', 'where', 'why', 'explain', 'information'],
     ARRAY['can you tell me', 'I would like to know', 'could you explain']),
    ('Complaint', 'Expressing dissatisfaction', 'complaint',
     'feedback',
     ARRAY['disappointed', 'frustrated', 'unhappy', 'terrible', 'worst', 'refund'],
     ARRAY['not satisfied', 'very disappointed', 'want my money back']),
    ('Cancellation Intent', 'Wants to cancel service', 'cancellation',
     'transactional',
     ARRAY['cancel', 'unsubscribe', 'stop', 'terminate', 'end', 'close account'],
     ARRAY['want to cancel', 'cancel my subscription', 'close my account'])
) AS t(pattern_name, description, intent, intent_category, keywords, phrases)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE synthex_library_contact_intents IS 'Detected intents from contact communications';
COMMENT ON TABLE synthex_library_intent_patterns IS 'Learned patterns for intent detection';
COMMENT ON TABLE synthex_library_sentiment_history IS 'Historical sentiment tracking per contact';
COMMENT ON TABLE synthex_library_intent_signals IS 'Real-time intent signals for scoring';
COMMENT ON TABLE synthex_library_intent_responses IS 'Suggested/automated responses based on intent';
COMMENT ON TABLE synthex_library_intent_analytics IS 'Aggregated analytics for intent patterns';
