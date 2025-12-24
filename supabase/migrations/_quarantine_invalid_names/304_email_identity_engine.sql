-- ============================================================================
-- Migration: 304_email_identity_engine.sql
-- Description: Pre-Client Historical Email Identity Engine Tables
-- Created: 2025-11-28
--
-- This migration creates tables for the pre-client email identity engine,
-- enabling extraction and management of contacts from historical email data,
-- thread analysis, timeline tracking, and AI-generated insights.
-- ============================================================================

-- ============================================================================
-- 1. PRE-CLIENTS
-- Contacts extracted from historical email analysis before becoming clients
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL,
    founder_business_id uuid REFERENCES founder_businesses(id) ON DELETE SET NULL,
    name text,
    email text NOT NULL,
    phone text,
    company text,
    job_title text,
    source text,
    status text DEFAULT 'new',
    relationship_score numeric,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    CONSTRAINT pre_clients_status_check CHECK (status IN (
        'new', 'researching', 'warm', 'hot', 'contacted', 'engaged',
        'qualified', 'converted', 'lost', 'dormant', 'do_not_contact'
    )),
    CONSTRAINT pre_clients_score_check CHECK (
        relationship_score IS NULL OR (relationship_score >= 0 AND relationship_score <= 100)
    ),
    CONSTRAINT pre_clients_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT pre_clients_unique_email_owner UNIQUE (owner_user_id, email)
);

COMMENT ON TABLE pre_clients IS 'Pre-client contacts extracted from historical email analysis. Represents potential leads before formal client relationship.';
COMMENT ON COLUMN pre_clients.owner_user_id IS 'The user who owns this pre-client record';
COMMENT ON COLUMN pre_clients.founder_business_id IS 'Optional link to a specific founder business';
COMMENT ON COLUMN pre_clients.name IS 'Contact full name (extracted or enriched)';
COMMENT ON COLUMN pre_clients.email IS 'Primary email address';
COMMENT ON COLUMN pre_clients.phone IS 'Phone number if available';
COMMENT ON COLUMN pre_clients.company IS 'Company name if identified';
COMMENT ON COLUMN pre_clients.job_title IS 'Job title if identified';
COMMENT ON COLUMN pre_clients.source IS 'How this contact was discovered (email_thread, cold_outreach, referral, etc.)';
COMMENT ON COLUMN pre_clients.status IS 'Current status: new, researching, warm, hot, contacted, engaged, qualified, converted, lost, dormant, do_not_contact';
COMMENT ON COLUMN pre_clients.relationship_score IS 'AI-calculated relationship strength score (0-100)';

-- Indexes for pre_clients
CREATE INDEX IF NOT EXISTS idx_pre_clients_owner_status
    ON pre_clients (owner_user_id, status);

CREATE INDEX IF NOT EXISTS idx_pre_clients_business
    ON pre_clients (founder_business_id)
    WHERE founder_business_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pre_clients_email
    ON pre_clients (email);

CREATE INDEX IF NOT EXISTS idx_pre_clients_company
    ON pre_clients (company)
    WHERE company IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pre_clients_score
    ON pre_clients (relationship_score DESC)
    WHERE relationship_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pre_clients_created
    ON pre_clients (created_at DESC);

-- ============================================================================
-- 2. PRE-CLIENT THREADS
-- Email threads associated with pre-clients
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_client_threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pre_client_id uuid NOT NULL REFERENCES pre_clients(id) ON DELETE CASCADE,
    thread_id text NOT NULL,
    subject text,
    summary text,
    message_count int DEFAULT 0,
    last_message_at timestamptz,
    sentiment_trend text,
    tags text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),

    CONSTRAINT pre_client_threads_count_check CHECK (message_count >= 0),
    CONSTRAINT pre_client_threads_sentiment_check CHECK (sentiment_trend IS NULL OR sentiment_trend IN (
        'improving', 'stable', 'declining', 'mixed', 'neutral'
    )),
    CONSTRAINT pre_client_threads_unique_thread UNIQUE (pre_client_id, thread_id)
);

COMMENT ON TABLE pre_client_threads IS 'Email threads associated with pre-clients, with AI-generated summaries and sentiment analysis.';
COMMENT ON COLUMN pre_client_threads.pre_client_id IS 'Reference to the pre-client';
COMMENT ON COLUMN pre_client_threads.thread_id IS 'External email thread identifier';
COMMENT ON COLUMN pre_client_threads.subject IS 'Thread subject line';
COMMENT ON COLUMN pre_client_threads.summary IS 'AI-generated summary of the thread';
COMMENT ON COLUMN pre_client_threads.message_count IS 'Number of messages in the thread';
COMMENT ON COLUMN pre_client_threads.last_message_at IS 'Timestamp of the most recent message';
COMMENT ON COLUMN pre_client_threads.sentiment_trend IS 'Overall sentiment trend: improving, stable, declining, mixed, neutral';
COMMENT ON COLUMN pre_client_threads.tags IS 'Array of tags for categorization (topics, intent, urgency, etc.)';

-- Indexes for pre_client_threads
CREATE INDEX IF NOT EXISTS idx_pre_client_threads_client
    ON pre_client_threads (pre_client_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_pre_client_threads_sentiment
    ON pre_client_threads (sentiment_trend)
    WHERE sentiment_trend IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pre_client_threads_tags
    ON pre_client_threads USING gin (tags);

-- ============================================================================
-- 3. PRE-CLIENT TIMELINE
-- Chronological timeline of events and interactions with pre-clients
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_client_timeline (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pre_client_id uuid NOT NULL REFERENCES pre_clients(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    summary text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    importance text DEFAULT 'normal',
    occurred_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),

    CONSTRAINT pre_client_timeline_type_check CHECK (event_type IN (
        'email_sent', 'email_received', 'email_opened', 'link_clicked',
        'meeting_scheduled', 'meeting_held', 'call_made', 'call_received',
        'proposal_sent', 'contract_sent', 'payment_received',
        'status_change', 'note_added', 'task_created', 'task_completed',
        'referral_made', 'research_completed', 'enrichment_updated',
        'follow_up_due', 'milestone_reached', 'custom'
    )),
    CONSTRAINT pre_client_timeline_importance_check CHECK (importance IN (
        'critical', 'high', 'normal', 'low', 'info'
    ))
);

COMMENT ON TABLE pre_client_timeline IS 'Chronological timeline of all events and interactions with pre-clients.';
COMMENT ON COLUMN pre_client_timeline.pre_client_id IS 'Reference to the pre-client';
COMMENT ON COLUMN pre_client_timeline.event_type IS 'Type of event: email_sent, meeting_scheduled, proposal_sent, status_change, etc.';
COMMENT ON COLUMN pre_client_timeline.summary IS 'Human-readable summary of the event';
COMMENT ON COLUMN pre_client_timeline.payload IS 'Additional event data (email details, meeting notes, etc.)';
COMMENT ON COLUMN pre_client_timeline.importance IS 'Event importance: critical, high, normal, low, info';
COMMENT ON COLUMN pre_client_timeline.occurred_at IS 'When the event occurred';

-- Indexes for pre_client_timeline
CREATE INDEX IF NOT EXISTS idx_pre_client_timeline_client_time
    ON pre_client_timeline (pre_client_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_pre_client_timeline_type
    ON pre_client_timeline (event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_pre_client_timeline_importance
    ON pre_client_timeline (importance, occurred_at DESC)
    WHERE importance IN ('critical', 'high');

-- ============================================================================
-- 4. PRE-CLIENT INSIGHTS
-- AI-generated insights and recommendations for pre-clients
-- ============================================================================

CREATE TABLE IF NOT EXISTS pre_client_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pre_client_id uuid NOT NULL REFERENCES pre_clients(id) ON DELETE CASCADE,
    insight_type text NOT NULL,
    insight text NOT NULL,
    confidence numeric,
    recommended_action text,
    status text DEFAULT 'pending',
    created_at timestamptz DEFAULT now(),

    CONSTRAINT pre_client_insights_type_check CHECK (insight_type IN (
        'intent_detected', 'buying_signal', 'pain_point', 'competitor_mention',
        'budget_indicator', 'timeline_hint', 'decision_maker', 'influencer',
        'objection_pattern', 'engagement_opportunity', 'follow_up_timing',
        'relationship_risk', 'conversion_probability', 'upsell_opportunity',
        'referral_potential', 'churn_risk', 'sentiment_shift', 'custom'
    )),
    CONSTRAINT pre_client_insights_confidence_check CHECK (
        confidence IS NULL OR (confidence >= 0 AND confidence <= 1)
    ),
    CONSTRAINT pre_client_insights_status_check CHECK (status IN (
        'pending', 'reviewed', 'actioned', 'dismissed', 'expired'
    ))
);

COMMENT ON TABLE pre_client_insights IS 'AI-generated insights and recommendations for pre-client engagement.';
COMMENT ON COLUMN pre_client_insights.pre_client_id IS 'Reference to the pre-client';
COMMENT ON COLUMN pre_client_insights.insight_type IS 'Type of insight: intent_detected, buying_signal, pain_point, etc.';
COMMENT ON COLUMN pre_client_insights.insight IS 'The insight text';
COMMENT ON COLUMN pre_client_insights.confidence IS 'AI confidence score (0-1)';
COMMENT ON COLUMN pre_client_insights.recommended_action IS 'Suggested action to take';
COMMENT ON COLUMN pre_client_insights.status IS 'Status: pending, reviewed, actioned, dismissed, expired';

-- Indexes for pre_client_insights
CREATE INDEX IF NOT EXISTS idx_pre_client_insights_client_status
    ON pre_client_insights (pre_client_id, status);

CREATE INDEX IF NOT EXISTS idx_pre_client_insights_type
    ON pre_client_insights (insight_type, status);

CREATE INDEX IF NOT EXISTS idx_pre_client_insights_confidence
    ON pre_client_insights (confidence DESC)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pre_client_insights_created
    ON pre_client_insights (created_at DESC);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE pre_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_client_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_client_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_client_insights ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: pre_clients
-- ============================================================================

DROP POLICY IF EXISTS "pre_clients_select_own" ON pre_clients;
CREATE POLICY "pre_clients_select_own" ON pre_clients
    FOR SELECT USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "pre_clients_insert_own" ON pre_clients;
CREATE POLICY "pre_clients_insert_own" ON pre_clients
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "pre_clients_update_own" ON pre_clients;
CREATE POLICY "pre_clients_update_own" ON pre_clients
    FOR UPDATE USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "pre_clients_delete_own" ON pre_clients;
CREATE POLICY "pre_clients_delete_own" ON pre_clients
    FOR DELETE USING (owner_user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: pre_client_threads
-- Access through parent pre_client ownership
-- ============================================================================

DROP POLICY IF EXISTS "pre_client_threads_select_via_client" ON pre_client_threads;
CREATE POLICY "pre_client_threads_select_via_client" ON pre_client_threads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_threads.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "pre_client_threads_insert_via_client" ON pre_client_threads;
CREATE POLICY "pre_client_threads_insert_via_client" ON pre_client_threads
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_threads.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "pre_client_threads_update_via_client" ON pre_client_threads;
CREATE POLICY "pre_client_threads_update_via_client" ON pre_client_threads
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_threads.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "pre_client_threads_delete_via_client" ON pre_client_threads;
CREATE POLICY "pre_client_threads_delete_via_client" ON pre_client_threads
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_threads.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: pre_client_timeline
-- Access through parent pre_client ownership
-- ============================================================================

DROP POLICY IF EXISTS "pre_client_timeline_select_via_client" ON pre_client_timeline;
CREATE POLICY "pre_client_timeline_select_via_client" ON pre_client_timeline
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_timeline.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "pre_client_timeline_insert_via_client" ON pre_client_timeline;
CREATE POLICY "pre_client_timeline_insert_via_client" ON pre_client_timeline
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_timeline.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "pre_client_timeline_update_via_client" ON pre_client_timeline;
CREATE POLICY "pre_client_timeline_update_via_client" ON pre_client_timeline
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_timeline.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "pre_client_timeline_delete_via_client" ON pre_client_timeline;
CREATE POLICY "pre_client_timeline_delete_via_client" ON pre_client_timeline
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_timeline.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: pre_client_insights
-- Access through parent pre_client ownership
-- ============================================================================

DROP POLICY IF EXISTS "pre_client_insights_select_via_client" ON pre_client_insights;
CREATE POLICY "pre_client_insights_select_via_client" ON pre_client_insights
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_insights.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "pre_client_insights_insert_via_client" ON pre_client_insights;
CREATE POLICY "pre_client_insights_insert_via_client" ON pre_client_insights
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_insights.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "pre_client_insights_update_via_client" ON pre_client_insights;
CREATE POLICY "pre_client_insights_update_via_client" ON pre_client_insights
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_insights.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "pre_client_insights_delete_via_client" ON pre_client_insights;
CREATE POLICY "pre_client_insights_delete_via_client" ON pre_client_insights
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM pre_clients pc
            WHERE pc.id = pre_client_insights.pre_client_id
            AND pc.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON pre_clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pre_client_threads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pre_client_timeline TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pre_client_insights TO authenticated;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================================

-- Trigger for pre_clients
DROP TRIGGER IF EXISTS trigger_pre_clients_updated_at ON pre_clients;
CREATE TRIGGER trigger_pre_clients_updated_at
    BEFORE UPDATE ON pre_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get pre-client overview with engagement metrics
CREATE OR REPLACE FUNCTION get_pre_client_overview(p_owner_user_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    email text,
    company text,
    status text,
    relationship_score numeric,
    thread_count bigint,
    last_interaction timestamptz,
    pending_insights bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pc.id,
        pc.name,
        pc.email,
        pc.company,
        pc.status,
        pc.relationship_score,
        COUNT(DISTINCT pct.id)::bigint AS thread_count,
        MAX(pctl.occurred_at) AS last_interaction,
        COUNT(DISTINCT pci.id) FILTER (WHERE pci.status = 'pending')::bigint AS pending_insights
    FROM pre_clients pc
    LEFT JOIN pre_client_threads pct ON pct.pre_client_id = pc.id
    LEFT JOIN pre_client_timeline pctl ON pctl.pre_client_id = pc.id
    LEFT JOIN pre_client_insights pci ON pci.pre_client_id = pc.id
    WHERE pc.owner_user_id = p_owner_user_id
    GROUP BY pc.id
    ORDER BY pc.relationship_score DESC NULLS LAST, pc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get hot pre-clients (high relationship score, recent activity)
CREATE OR REPLACE FUNCTION get_hot_pre_clients(p_owner_user_id uuid, p_limit int DEFAULT 10)
RETURNS TABLE (
    id uuid,
    name text,
    email text,
    company text,
    relationship_score numeric,
    latest_insight text,
    days_since_contact int
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pc.id,
        pc.name,
        pc.email,
        pc.company,
        pc.relationship_score,
        (
            SELECT pci.insight
            FROM pre_client_insights pci
            WHERE pci.pre_client_id = pc.id
            ORDER BY pci.created_at DESC
            LIMIT 1
        ) AS latest_insight,
        EXTRACT(DAY FROM (now() - COALESCE(
            (SELECT MAX(pctl.occurred_at) FROM pre_client_timeline pctl WHERE pctl.pre_client_id = pc.id),
            pc.created_at
        )))::int AS days_since_contact
    FROM pre_clients pc
    WHERE pc.owner_user_id = p_owner_user_id
    AND pc.status IN ('warm', 'hot', 'engaged', 'qualified')
    AND pc.relationship_score >= 60
    ORDER BY pc.relationship_score DESC, days_since_contact ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate and update relationship score
CREATE OR REPLACE FUNCTION calculate_pre_client_score(p_pre_client_id uuid)
RETURNS numeric AS $$
DECLARE
    v_score numeric := 0;
    v_thread_count int;
    v_recent_interactions int;
    v_positive_sentiment int;
    v_buying_signals int;
BEGIN
    -- Count threads
    SELECT COUNT(*) INTO v_thread_count
    FROM pre_client_threads
    WHERE pre_client_id = p_pre_client_id;

    -- Count recent interactions (last 30 days)
    SELECT COUNT(*) INTO v_recent_interactions
    FROM pre_client_timeline
    WHERE pre_client_id = p_pre_client_id
    AND occurred_at > now() - INTERVAL '30 days';

    -- Count positive sentiment threads
    SELECT COUNT(*) INTO v_positive_sentiment
    FROM pre_client_threads
    WHERE pre_client_id = p_pre_client_id
    AND sentiment_trend IN ('improving', 'stable');

    -- Count buying signals
    SELECT COUNT(*) INTO v_buying_signals
    FROM pre_client_insights
    WHERE pre_client_id = p_pre_client_id
    AND insight_type IN ('buying_signal', 'intent_detected', 'budget_indicator');

    -- Calculate composite score
    v_score := LEAST(100,
        (v_thread_count * 5) +
        (v_recent_interactions * 3) +
        (v_positive_sentiment * 10) +
        (v_buying_signals * 15)
    );

    -- Update the pre_client
    UPDATE pre_clients
    SET relationship_score = v_score, updated_at = now()
    WHERE id = p_pre_client_id;

    RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 304_email_identity_engine.sql completed successfully';
    RAISE NOTICE 'Created tables: pre_clients, pre_client_threads, pre_client_timeline, pre_client_insights';
    RAISE NOTICE 'RLS enabled and policies created for all tables';
END $$;
