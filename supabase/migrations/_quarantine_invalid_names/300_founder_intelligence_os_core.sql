-- ============================================================================
-- Migration: 300_founder_intelligence_os_core.sql
-- Description: Founder Intelligence OS Core Tables
-- Created: 2025-11-28
--
-- This migration creates the foundational tables for the Founder Intelligence
-- Operating System, enabling multi-business management, vault secrets, signals,
-- AI insights, and founder journaling capabilities.
-- ============================================================================

-- ============================================================================
-- 1. FOUNDER BUSINESSES
-- Registry of all businesses owned by a founder
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_businesses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL,
    code text NOT NULL,
    display_name text NOT NULL,
    description text,
    industry text,
    region text,
    primary_domain text,
    status text DEFAULT 'active',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    CONSTRAINT founder_businesses_code_unique UNIQUE (owner_user_id, code),
    CONSTRAINT founder_businesses_status_check CHECK (status IN ('active', 'inactive', 'archived'))
);

COMMENT ON TABLE founder_businesses IS 'Registry of all businesses owned by a founder. Each founder can manage multiple businesses through the Intelligence OS.';
COMMENT ON COLUMN founder_businesses.owner_user_id IS 'The user who owns this business entry';
COMMENT ON COLUMN founder_businesses.code IS 'Short unique code for the business (e.g., SYNTHEX, UNITE)';
COMMENT ON COLUMN founder_businesses.display_name IS 'Human-readable business name';
COMMENT ON COLUMN founder_businesses.industry IS 'Primary industry classification';
COMMENT ON COLUMN founder_businesses.region IS 'Primary operating region';
COMMENT ON COLUMN founder_businesses.primary_domain IS 'Main website domain';
COMMENT ON COLUMN founder_businesses.status IS 'Business status: active, inactive, or archived';

-- ============================================================================
-- 2. FOUNDER BUSINESS VAULT SECRETS
-- Per-business vault for storing API keys, credentials, and sensitive config
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_business_vault_secrets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,
    secret_label text NOT NULL,
    secret_type text NOT NULL,
    secret_payload text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    CONSTRAINT vault_secrets_label_unique UNIQUE (founder_business_id, secret_label),
    CONSTRAINT vault_secrets_type_check CHECK (secret_type IN (
        'api_key', 'oauth_token', 'webhook_secret', 'database_url',
        'smtp_credentials', 'encryption_key', 'other'
    ))
);

COMMENT ON TABLE founder_business_vault_secrets IS 'Per-business vault for storing API keys, credentials, and sensitive configuration. Secrets are encrypted at rest.';
COMMENT ON COLUMN founder_business_vault_secrets.secret_label IS 'Human-readable label for the secret (e.g., STRIPE_API_KEY)';
COMMENT ON COLUMN founder_business_vault_secrets.secret_type IS 'Type classification: api_key, oauth_token, webhook_secret, etc.';
COMMENT ON COLUMN founder_business_vault_secrets.secret_payload IS 'Encrypted secret value';
COMMENT ON COLUMN founder_business_vault_secrets.metadata IS 'Additional metadata (expiry, scopes, environment, etc.)';

-- ============================================================================
-- 3. FOUNDER BUSINESS LINKS
-- External links and resources associated with each business
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_business_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,
    link_type text NOT NULL,
    label text NOT NULL,
    url text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),

    CONSTRAINT business_links_type_check CHECK (link_type IN (
        'website', 'dashboard', 'analytics', 'repository', 'documentation',
        'social', 'support', 'billing', 'monitoring', 'other'
    ))
);

COMMENT ON TABLE founder_business_links IS 'External links and resources associated with each business (dashboards, repos, social profiles, etc.)';
COMMENT ON COLUMN founder_business_links.link_type IS 'Category: website, dashboard, analytics, repository, documentation, social, etc.';
COMMENT ON COLUMN founder_business_links.label IS 'Display label for the link';
COMMENT ON COLUMN founder_business_links.url IS 'Full URL to the external resource';
COMMENT ON COLUMN founder_business_links.metadata IS 'Additional context (description, icon, access level, etc.)';

-- ============================================================================
-- 4. FOUNDER BUSINESS SIGNALS
-- Aggregated metrics, KPIs, and signals from various sources
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_business_signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,
    signal_family text NOT NULL,
    signal_key text NOT NULL,
    value_numeric numeric,
    value_text text,
    payload jsonb DEFAULT '{}'::jsonb,
    source text NOT NULL,
    observed_at timestamptz DEFAULT now(),

    CONSTRAINT business_signals_family_check CHECK (signal_family IN (
        'revenue', 'users', 'engagement', 'performance', 'marketing',
        'support', 'infrastructure', 'custom'
    ))
);

COMMENT ON TABLE founder_business_signals IS 'Aggregated metrics, KPIs, and signals from various data sources. Used for trend analysis and AI insights.';
COMMENT ON COLUMN founder_business_signals.signal_family IS 'Category: revenue, users, engagement, performance, marketing, support, infrastructure, custom';
COMMENT ON COLUMN founder_business_signals.signal_key IS 'Specific metric name (e.g., mrr, dau, churn_rate)';
COMMENT ON COLUMN founder_business_signals.value_numeric IS 'Numeric value for quantitative signals';
COMMENT ON COLUMN founder_business_signals.value_text IS 'Text value for qualitative signals';
COMMENT ON COLUMN founder_business_signals.payload IS 'Full signal payload with additional context';
COMMENT ON COLUMN founder_business_signals.source IS 'Data source identifier (e.g., stripe, analytics, manual)';
COMMENT ON COLUMN founder_business_signals.observed_at IS 'Timestamp when the signal was observed/recorded';

-- Unique index for time-series signal data
CREATE UNIQUE INDEX IF NOT EXISTS idx_business_signals_unique
    ON founder_business_signals (founder_business_id, signal_family, signal_key, observed_at);

-- Performance index for signal queries
CREATE INDEX IF NOT EXISTS idx_business_signals_lookup
    ON founder_business_signals (founder_business_id, signal_family, observed_at DESC);

-- ============================================================================
-- 5. FOUNDER OS SNAPSHOTS
-- Point-in-time snapshots generated by AI Phill for trend analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_os_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL,
    snapshot_type text NOT NULL,
    scope text NOT NULL,
    scope_id uuid,
    summary jsonb NOT NULL,
    score numeric,
    created_at timestamptz DEFAULT now(),

    CONSTRAINT os_snapshots_type_check CHECK (snapshot_type IN (
        'daily_briefing', 'weekly_report', 'monthly_review',
        'health_check', 'opportunity_scan', 'risk_assessment', 'custom'
    )),
    CONSTRAINT os_snapshots_scope_check CHECK (scope IN (
        'portfolio', 'business', 'project', 'campaign', 'custom'
    )),
    CONSTRAINT os_snapshots_score_check CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);

COMMENT ON TABLE founder_os_snapshots IS 'Point-in-time snapshots generated by AI Phill for trend analysis and historical comparison.';
COMMENT ON COLUMN founder_os_snapshots.snapshot_type IS 'Type: daily_briefing, weekly_report, monthly_review, health_check, opportunity_scan, risk_assessment';
COMMENT ON COLUMN founder_os_snapshots.scope IS 'Scope level: portfolio (all businesses), business, project, campaign';
COMMENT ON COLUMN founder_os_snapshots.scope_id IS 'Reference ID when scope is business, project, or campaign';
COMMENT ON COLUMN founder_os_snapshots.summary IS 'Structured summary data (metrics, insights, recommendations)';
COMMENT ON COLUMN founder_os_snapshots.score IS 'Overall health/performance score (0-100)';

-- Index for snapshot queries
CREATE INDEX IF NOT EXISTS idx_os_snapshots_lookup
    ON founder_os_snapshots (owner_user_id, snapshot_type, created_at DESC);

-- ============================================================================
-- 6. AI PHILL INSIGHTS
-- Human-governed insight queue for founder review and action
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_phill_insights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL,
    related_business_id uuid REFERENCES founder_businesses(id) ON DELETE SET NULL,
    scope text,
    scope_id uuid,
    title text NOT NULL,
    body_md text NOT NULL,
    priority text NOT NULL,
    category text NOT NULL,
    recommended_actions jsonb DEFAULT '[]'::jsonb,
    governance_mode text DEFAULT 'HUMAN_GOVERNED',
    created_at timestamptz DEFAULT now(),
    reviewed_at timestamptz,
    review_status text DEFAULT 'pending',

    CONSTRAINT insights_priority_check CHECK (priority IN (
        'critical', 'high', 'medium', 'low', 'info'
    )),
    CONSTRAINT insights_category_check CHECK (category IN (
        'opportunity', 'risk', 'anomaly', 'milestone', 'recommendation',
        'alert', 'trend', 'benchmark', 'custom'
    )),
    CONSTRAINT insights_governance_check CHECK (governance_mode IN (
        'HUMAN_GOVERNED', 'AUTO_APPROVED', 'AUTO_EXECUTED'
    )),
    CONSTRAINT insights_review_status_check CHECK (review_status IN (
        'pending', 'acknowledged', 'actioned', 'dismissed', 'deferred'
    ))
);

COMMENT ON TABLE ai_phill_insights IS 'Human-governed insight queue. AI Phill generates insights that require founder review before action.';
COMMENT ON COLUMN ai_phill_insights.title IS 'Concise insight title';
COMMENT ON COLUMN ai_phill_insights.body_md IS 'Full insight body in Markdown format';
COMMENT ON COLUMN ai_phill_insights.priority IS 'Priority level: critical, high, medium, low, info';
COMMENT ON COLUMN ai_phill_insights.category IS 'Category: opportunity, risk, anomaly, milestone, recommendation, alert, trend, benchmark';
COMMENT ON COLUMN ai_phill_insights.recommended_actions IS 'Array of recommended actions with metadata';
COMMENT ON COLUMN ai_phill_insights.governance_mode IS 'Control mode: HUMAN_GOVERNED (default), AUTO_APPROVED, AUTO_EXECUTED';
COMMENT ON COLUMN ai_phill_insights.review_status IS 'Review status: pending, acknowledged, actioned, dismissed, deferred';

-- Index for insight queries
CREATE INDEX IF NOT EXISTS idx_phill_insights_lookup
    ON ai_phill_insights (owner_user_id, review_status, priority, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phill_insights_business
    ON ai_phill_insights (related_business_id, created_at DESC)
    WHERE related_business_id IS NOT NULL;

-- ============================================================================
-- 7. AI PHILL JOURNAL ENTRIES
-- Founder journal for notes, reflections, and context
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_phill_journal_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id uuid NOT NULL,
    related_business_id uuid REFERENCES founder_businesses(id) ON DELETE SET NULL,
    title text,
    body_md text NOT NULL,
    tags text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE ai_phill_journal_entries IS 'Founder journal for notes, reflections, decisions, and context. Used by AI Phill for personalized insights.';
COMMENT ON COLUMN ai_phill_journal_entries.title IS 'Optional entry title';
COMMENT ON COLUMN ai_phill_journal_entries.body_md IS 'Journal entry body in Markdown format';
COMMENT ON COLUMN ai_phill_journal_entries.tags IS 'Array of tags for categorization and search';

-- Index for journal queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_lookup
    ON ai_phill_journal_entries (owner_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_entries_tags
    ON ai_phill_journal_entries USING gin (tags);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE founder_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_business_vault_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_business_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_business_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_os_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_phill_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_phill_journal_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: founder_businesses
-- ============================================================================

DROP POLICY IF EXISTS "founder_businesses_select_own" ON founder_businesses;
CREATE POLICY "founder_businesses_select_own" ON founder_businesses
    FOR SELECT USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "founder_businesses_insert_own" ON founder_businesses;
CREATE POLICY "founder_businesses_insert_own" ON founder_businesses
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "founder_businesses_update_own" ON founder_businesses;
CREATE POLICY "founder_businesses_update_own" ON founder_businesses
    FOR UPDATE USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "founder_businesses_delete_own" ON founder_businesses;
CREATE POLICY "founder_businesses_delete_own" ON founder_businesses
    FOR DELETE USING (owner_user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: founder_business_vault_secrets
-- Access through business ownership
-- ============================================================================

DROP POLICY IF EXISTS "vault_secrets_select_via_business" ON founder_business_vault_secrets;
CREATE POLICY "vault_secrets_select_via_business" ON founder_business_vault_secrets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_vault_secrets.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "vault_secrets_insert_via_business" ON founder_business_vault_secrets;
CREATE POLICY "vault_secrets_insert_via_business" ON founder_business_vault_secrets
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_vault_secrets.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "vault_secrets_update_via_business" ON founder_business_vault_secrets;
CREATE POLICY "vault_secrets_update_via_business" ON founder_business_vault_secrets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_vault_secrets.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "vault_secrets_delete_via_business" ON founder_business_vault_secrets;
CREATE POLICY "vault_secrets_delete_via_business" ON founder_business_vault_secrets
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_vault_secrets.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: founder_business_links
-- Access through business ownership
-- ============================================================================

DROP POLICY IF EXISTS "business_links_select_via_business" ON founder_business_links;
CREATE POLICY "business_links_select_via_business" ON founder_business_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_links.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "business_links_insert_via_business" ON founder_business_links;
CREATE POLICY "business_links_insert_via_business" ON founder_business_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_links.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "business_links_update_via_business" ON founder_business_links;
CREATE POLICY "business_links_update_via_business" ON founder_business_links
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_links.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "business_links_delete_via_business" ON founder_business_links;
CREATE POLICY "business_links_delete_via_business" ON founder_business_links
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_links.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: founder_business_signals
-- Access through business ownership
-- ============================================================================

DROP POLICY IF EXISTS "business_signals_select_via_business" ON founder_business_signals;
CREATE POLICY "business_signals_select_via_business" ON founder_business_signals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_signals.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "business_signals_insert_via_business" ON founder_business_signals;
CREATE POLICY "business_signals_insert_via_business" ON founder_business_signals
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_signals.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "business_signals_update_via_business" ON founder_business_signals;
CREATE POLICY "business_signals_update_via_business" ON founder_business_signals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_signals.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "business_signals_delete_via_business" ON founder_business_signals;
CREATE POLICY "business_signals_delete_via_business" ON founder_business_signals
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = founder_business_signals.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: founder_os_snapshots
-- Direct owner access
-- ============================================================================

DROP POLICY IF EXISTS "os_snapshots_select_own" ON founder_os_snapshots;
CREATE POLICY "os_snapshots_select_own" ON founder_os_snapshots
    FOR SELECT USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "os_snapshots_insert_own" ON founder_os_snapshots;
CREATE POLICY "os_snapshots_insert_own" ON founder_os_snapshots
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "os_snapshots_update_own" ON founder_os_snapshots;
CREATE POLICY "os_snapshots_update_own" ON founder_os_snapshots
    FOR UPDATE USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "os_snapshots_delete_own" ON founder_os_snapshots;
CREATE POLICY "os_snapshots_delete_own" ON founder_os_snapshots
    FOR DELETE USING (owner_user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: ai_phill_insights
-- Direct owner access
-- ============================================================================

DROP POLICY IF EXISTS "phill_insights_select_own" ON ai_phill_insights;
CREATE POLICY "phill_insights_select_own" ON ai_phill_insights
    FOR SELECT USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "phill_insights_insert_own" ON ai_phill_insights;
CREATE POLICY "phill_insights_insert_own" ON ai_phill_insights
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "phill_insights_update_own" ON ai_phill_insights;
CREATE POLICY "phill_insights_update_own" ON ai_phill_insights
    FOR UPDATE USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "phill_insights_delete_own" ON ai_phill_insights;
CREATE POLICY "phill_insights_delete_own" ON ai_phill_insights
    FOR DELETE USING (owner_user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES: ai_phill_journal_entries
-- Direct owner access
-- ============================================================================

DROP POLICY IF EXISTS "journal_entries_select_own" ON ai_phill_journal_entries;
CREATE POLICY "journal_entries_select_own" ON ai_phill_journal_entries
    FOR SELECT USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "journal_entries_insert_own" ON ai_phill_journal_entries;
CREATE POLICY "journal_entries_insert_own" ON ai_phill_journal_entries
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "journal_entries_update_own" ON ai_phill_journal_entries;
CREATE POLICY "journal_entries_update_own" ON ai_phill_journal_entries
    FOR UPDATE USING (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "journal_entries_delete_own" ON ai_phill_journal_entries;
CREATE POLICY "journal_entries_delete_own" ON ai_phill_journal_entries
    FOR DELETE USING (owner_user_id = auth.uid());

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for founder_businesses
DROP TRIGGER IF EXISTS trigger_founder_businesses_updated_at ON founder_businesses;
CREATE TRIGGER trigger_founder_businesses_updated_at
    BEFORE UPDATE ON founder_businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for founder_business_vault_secrets
DROP TRIGGER IF EXISTS trigger_vault_secrets_updated_at ON founder_business_vault_secrets;
CREATE TRIGGER trigger_vault_secrets_updated_at
    BEFORE UPDATE ON founder_business_vault_secrets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for ai_phill_journal_entries
DROP TRIGGER IF EXISTS trigger_journal_entries_updated_at ON ai_phill_journal_entries;
CREATE TRIGGER trigger_journal_entries_updated_at
    BEFORE UPDATE ON ai_phill_journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS
-- Grant necessary permissions to authenticated users
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON founder_businesses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON founder_business_vault_secrets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON founder_business_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON founder_business_signals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON founder_os_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_phill_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_phill_journal_entries TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 300_founder_intelligence_os_core.sql completed successfully';
    RAISE NOTICE 'Created tables: founder_businesses, founder_business_vault_secrets, founder_business_links, founder_business_signals, founder_os_snapshots, ai_phill_insights, ai_phill_journal_entries';
    RAISE NOTICE 'RLS enabled and policies created for all tables';
END $$;
