-- Migration: Enterprise Financial Reporting
-- Phase 12 Week 7-8: Financial reports, usage analytics, audit compliance
-- Created: 2025-11-20

-- =============================================================================
-- FINANCIAL REPORTS
-- =============================================================================

-- Table: financial_reports
-- Generated financial reports (monthly, quarterly, annual)
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Report details
    report_type TEXT NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'custom')),
    report_name TEXT NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Financial data
    total_revenue DECIMAL(12,2) DEFAULT 0,
    subscription_revenue DECIMAL(12,2) DEFAULT 0,
    overage_revenue DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,

    -- Usage summary
    usage_summary JSONB DEFAULT '{}',
    workspace_breakdown JSONB DEFAULT '[]',

    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'finalized', 'archived')),
    generated_at TIMESTAMPTZ,
    finalized_at TIMESTAMPTZ,
    -- Keep FK reference to auth.users (allowed in migrations)
generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- USAGE ROLLUPS
-- =============================================================================

-- Table: usage_rollups
-- Aggregated usage data for reporting
CREATE TABLE IF NOT EXISTS usage_rollups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,

    -- Period
    period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Usage counts
    email_count INTEGER DEFAULT 0,
    ai_request_count INTEGER DEFAULT 0,
    contact_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    campaign_count INTEGER DEFAULT 0,
    api_call_count INTEGER DEFAULT 0,
    storage_bytes BIGINT DEFAULT 0,

    -- Costs
    total_cost DECIMAL(10,2) DEFAULT 0,
    overage_cost DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(org_id, workspace_id, period_type, period_start)
);

-- =============================================================================
-- COST PROJECTIONS
-- =============================================================================

-- Table: cost_projections
-- Predicted future costs based on usage trends
CREATE TABLE IF NOT EXISTS cost_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Projection details
    projection_type TEXT NOT NULL CHECK (projection_type IN ('next_month', 'next_quarter', 'next_year')),
    projected_date TIMESTAMPTZ NOT NULL,

    -- Projected amounts
    projected_subscription DECIMAL(10,2) DEFAULT 0,
    projected_overage DECIMAL(10,2) DEFAULT 0,
    projected_total DECIMAL(10,2) DEFAULT 0,
    confidence_score DECIMAL(3,2) DEFAULT 0,

    -- Usage projections
    projected_usage JSONB DEFAULT '{}',

    -- Model info
    model_type TEXT DEFAULT 'linear',
    input_data_points INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- AUDIT EVENTS
-- =============================================================================

-- Table: audit_events
-- Compliance and security audit trail
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Event details
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL CHECK (event_category IN (
        'billing', 'subscription', 'usage', 'access', 'security',
        'data', 'admin', 'integration', 'compliance'
    )),
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),

    -- Event data
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    old_value JSONB,
    new_value JSONB,

    -- Context
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_financial_reports_org ON financial_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_type ON financial_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_financial_reports_period ON financial_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_financial_reports_status ON financial_reports(status);

CREATE INDEX IF NOT EXISTS idx_usage_rollups_org ON usage_rollups(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_rollups_workspace ON usage_rollups(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_rollups_period ON usage_rollups(period_type, period_start);

CREATE INDEX IF NOT EXISTS idx_cost_projections_org ON cost_projections(org_id);
CREATE INDEX IF NOT EXISTS idx_cost_projections_type ON cost_projections(projection_type);
CREATE INDEX IF NOT EXISTS idx_cost_projections_date ON cost_projections(projected_date);

CREATE INDEX IF NOT EXISTS idx_audit_events_org ON audit_events(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_user ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_category ON audit_events(event_category);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON audit_events(severity);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- financial_reports policies
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's financial reports"
ON financial_reports FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage financial reports"
ON financial_reports FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- usage_rollups policies
ALTER TABLE usage_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's usage rollups"
ON usage_rollups FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- cost_projections policies
ALTER TABLE cost_projections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's cost projections"
ON cost_projections FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- audit_events policies
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit events"
ON audit_events FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "System can insert audit events"
ON audit_events FOR INSERT
WITH CHECK (TRUE);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function: Generate usage rollup for period
CREATE OR REPLACE FUNCTION generate_usage_rollup(
    p_org_id UUID,
    p_workspace_id UUID,
    p_period_type TEXT,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
    v_rollup_id UUID;
    v_email_count INTEGER;
    v_ai_count INTEGER;
    v_contact_count INTEGER;
    v_report_count INTEGER;
    v_campaign_count INTEGER;
    v_api_count INTEGER;
BEGIN
    -- Aggregate usage events
    SELECT
        COALESCE(SUM(CASE WHEN event_category = 'email_sent' THEN quantity ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN event_category = 'ai_request' THEN quantity ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN event_category = 'contact_created' THEN quantity ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN event_category = 'report_generated' THEN quantity ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN event_category = 'campaign_step' THEN quantity ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN event_category = 'api_call' THEN quantity ELSE 0 END), 0)
    INTO v_email_count, v_ai_count, v_contact_count, v_report_count, v_campaign_count, v_api_count
    FROM usage_events
    WHERE org_id = p_org_id
      AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
      AND created_at >= p_period_start
      AND created_at < p_period_end;

    -- Upsert rollup
    INSERT INTO usage_rollups (
        org_id, workspace_id, period_type, period_start, period_end,
        email_count, ai_request_count, contact_count, report_count,
        campaign_count, api_call_count
    )
    VALUES (
        p_org_id, p_workspace_id, p_period_type, p_period_start, p_period_end,
        v_email_count, v_ai_count, v_contact_count, v_report_count,
        v_campaign_count, v_api_count
    )
    ON CONFLICT (org_id, workspace_id, period_type, period_start)
    DO UPDATE SET
        email_count = v_email_count,
        ai_request_count = v_ai_count,
        contact_count = v_contact_count,
        report_count = v_report_count,
        campaign_count = v_campaign_count,
        api_call_count = v_api_count
    RETURNING id INTO v_rollup_id;

    RETURN v_rollup_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get org usage summary for period
CREATE OR REPLACE FUNCTION get_org_usage_summary(
    p_org_id UUID,
    p_period_start TIMESTAMPTZ,
    p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
    category TEXT,
    total_count BIGINT,
    workspace_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        event_category::TEXT,
        SUM(quantity)::BIGINT,
        COUNT(DISTINCT workspace_id)::BIGINT
    FROM usage_events
    WHERE org_id = p_org_id
      AND created_at >= p_period_start
      AND created_at < p_period_end
    GROUP BY event_category;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
    p_org_id UUID,
    p_workspace_id UUID,
    p_user_id UUID,
    p_event_type TEXT,
    p_event_category TEXT,
    p_action TEXT,
    p_severity TEXT DEFAULT 'info',
    p_resource_type TEXT DEFAULT NULL,
    p_resource_id TEXT DEFAULT NULL,
    p_old_value JSONB DEFAULT NULL,
    p_new_value JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO audit_events (
        org_id, workspace_id, user_id, event_type, event_category,
        action, severity, resource_type, resource_id, old_value, new_value, metadata
    )
    VALUES (
        p_org_id, p_workspace_id, p_user_id, p_event_type, p_event_category,
        p_action, p_severity, p_resource_type, p_resource_id, p_old_value, p_new_value, p_metadata
    )
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get audit events with filters
CREATE OR REPLACE FUNCTION get_audit_events(
    p_org_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_severity TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    event_type TEXT,
    event_category TEXT,
    severity TEXT,
    action TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ae.id,
        ae.event_type,
        ae.event_category,
        ae.severity,
        ae.action,
        ae.user_id,
        ae.created_at,
        ae.metadata
    FROM audit_events ae
    WHERE ae.org_id = p_org_id
      AND (p_start_date IS NULL OR ae.created_at >= p_start_date)
      AND (p_end_date IS NULL OR ae.created_at <= p_end_date)
      AND (p_category IS NULL OR ae.event_category = p_category)
      AND (p_severity IS NULL OR ae.severity = p_severity)
    ORDER BY ae.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_financial_reports_updated_at
    BEFORE UPDATE ON financial_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE financial_reports IS 'Generated financial reports for billing periods';
COMMENT ON TABLE usage_rollups IS 'Aggregated usage data for reporting and analytics';
COMMENT ON TABLE cost_projections IS 'Predicted future costs based on usage trends';
COMMENT ON TABLE audit_events IS 'Compliance and security audit trail for billing events';

COMMENT ON FUNCTION generate_usage_rollup IS 'Aggregates usage events into rollup records';
COMMENT ON FUNCTION get_org_usage_summary IS 'Returns usage summary by category for a period';
COMMENT ON FUNCTION log_audit_event IS 'Creates an audit event record';
COMMENT ON FUNCTION get_audit_events IS 'Retrieves audit events with filters';
