-- =====================================================
-- Migration 443: Synthex Agency Command Center
-- Phase B40: Agency Command Center
-- =====================================================
-- Top-level agency dashboard for Phill and internal team
-- to monitor all client tenants, health, usage, and outcomes
-- =====================================================

-- =====================================================
-- Table: synthex_agency_clients (extended from 438)
-- Links agency tenants to their client tenants
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_agency_overview_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_tenant_id UUID NOT NULL,
    client_tenant_id UUID NOT NULL,
    label TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'onboarding', 'paused', 'churned', 'trial')),
    tier TEXT DEFAULT 'standard' CHECK (tier IN ('starter', 'standard', 'premium', 'enterprise')),
    contract_start DATE,
    contract_end DATE,
    monthly_value NUMERIC(10, 2),
    notes TEXT,
    health_score INT DEFAULT 50 CHECK (health_score >= 0 AND health_score <= 100),
    last_activity_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(agency_tenant_id, client_tenant_id)
);

COMMENT ON TABLE synthex_agency_overview_clients IS 'Agency-client relationships for command center overview';
COMMENT ON COLUMN synthex_agency_overview_clients.agency_tenant_id IS 'The agency (Synthex internal) tenant';
COMMENT ON COLUMN synthex_agency_overview_clients.client_tenant_id IS 'The client tenant being managed';
COMMENT ON COLUMN synthex_agency_overview_clients.health_score IS 'Client health score 0-100 based on engagement and performance';

-- =====================================================
-- Table: synthex_agency_metrics
-- Time-series metrics for client tenants
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_agency_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_tenant_id UUID NOT NULL,
    period DATE NOT NULL,
    period_type TEXT NOT NULL DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
    -- Financial metrics
    mrr NUMERIC(12, 2) DEFAULT 0,
    arr NUMERIC(12, 2) DEFAULT 0,
    revenue_this_period NUMERIC(12, 2) DEFAULT 0,
    -- Usage metrics
    active_users INT DEFAULT 0,
    total_users INT DEFAULT 0,
    api_calls BIGINT DEFAULT 0,
    storage_used_mb BIGINT DEFAULT 0,
    -- Marketing metrics
    emails_sent BIGINT DEFAULT 0,
    emails_opened BIGINT DEFAULT 0,
    emails_clicked BIGINT DEFAULT 0,
    campaigns_running INT DEFAULT 0,
    campaigns_completed INT DEFAULT 0,
    -- Audience metrics
    total_contacts INT DEFAULT 0,
    new_contacts INT DEFAULT 0,
    leads_generated INT DEFAULT 0,
    -- Risk metrics
    churn_risk NUMERIC(5, 2) DEFAULT 0 CHECK (churn_risk >= 0 AND churn_risk <= 100),
    engagement_score NUMERIC(5, 2) DEFAULT 50,
    nps_score INT,
    -- Computed
    computed_health_score INT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(client_tenant_id, period, period_type)
);

COMMENT ON TABLE synthex_agency_metrics IS 'Time-series metrics for agency client monitoring';
COMMENT ON COLUMN synthex_agency_metrics.churn_risk IS 'Predicted churn risk percentage 0-100';
COMMENT ON COLUMN synthex_agency_metrics.engagement_score IS 'Overall engagement score 0-100';

-- =====================================================
-- Table: synthex_agency_alerts
-- Alerts and notifications for agency monitoring
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_agency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_tenant_id UUID NOT NULL,
    client_tenant_id UUID,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('churn_risk', 'inactive', 'billing_issue', 'performance_drop', 'milestone', 'renewal', 'support_ticket', 'custom')),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_agency_alerts IS 'Alerts for agency command center monitoring';

-- =====================================================
-- Table: synthex_agency_goals
-- Agency-level goals and targets
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_agency_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_tenant_id UUID NOT NULL,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('mrr', 'clients', 'retention', 'nps', 'engagement', 'custom')),
    target_value NUMERIC NOT NULL,
    current_value NUMERIC DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'achieved', 'missed', 'cancelled')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_agency_goals IS 'Agency-level goals and targets for tracking';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_agency_overview_clients_agency ON synthex_agency_overview_clients(agency_tenant_id);
CREATE INDEX IF NOT EXISTS idx_agency_overview_clients_client ON synthex_agency_overview_clients(client_tenant_id);
CREATE INDEX IF NOT EXISTS idx_agency_overview_clients_status ON synthex_agency_overview_clients(status);
CREATE INDEX IF NOT EXISTS idx_agency_metrics_client ON synthex_agency_metrics(client_tenant_id);
CREATE INDEX IF NOT EXISTS idx_agency_metrics_period ON synthex_agency_metrics(period);
CREATE INDEX IF NOT EXISTS idx_agency_metrics_client_period ON synthex_agency_metrics(client_tenant_id, period DESC);
CREATE INDEX IF NOT EXISTS idx_agency_alerts_agency ON synthex_agency_alerts(agency_tenant_id);
CREATE INDEX IF NOT EXISTS idx_agency_alerts_client ON synthex_agency_alerts(client_tenant_id);
CREATE INDEX IF NOT EXISTS idx_agency_alerts_unresolved ON synthex_agency_alerts(agency_tenant_id, resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_agency_goals_agency ON synthex_agency_goals(agency_tenant_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_agency_overview_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_agency_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_agency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_agency_goals ENABLE ROW LEVEL SECURITY;

-- Agency clients: agency can see their linked clients
CREATE POLICY "Agency clients visible to agency"
    ON synthex_agency_overview_clients FOR ALL
    USING (agency_tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (agency_tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Metrics: agency can see metrics for their clients
CREATE POLICY "Metrics visible to agency for their clients"
    ON synthex_agency_metrics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM synthex_agency_overview_clients c
            WHERE c.client_tenant_id = synthex_agency_metrics.client_tenant_id
            AND c.agency_tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );

-- Metrics: agency can insert/update metrics for their clients
CREATE POLICY "Metrics modifiable by agency"
    ON synthex_agency_metrics FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM synthex_agency_overview_clients c
            WHERE c.client_tenant_id = synthex_agency_metrics.client_tenant_id
            AND c.agency_tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM synthex_agency_overview_clients c
            WHERE c.client_tenant_id = synthex_agency_metrics.client_tenant_id
            AND c.agency_tenant_id = current_setting('app.tenant_id', true)::uuid
        )
    );

-- Alerts: agency can manage their alerts
CREATE POLICY "Alerts visible to agency"
    ON synthex_agency_alerts FOR ALL
    USING (agency_tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (agency_tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Goals: agency can manage their goals
CREATE POLICY "Goals visible to agency"
    ON synthex_agency_goals FOR ALL
    USING (agency_tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (agency_tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Function: Get agency overview
-- =====================================================
CREATE OR REPLACE FUNCTION get_agency_overview(
    p_agency_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_clients BIGINT,
    active_clients BIGINT,
    total_mrr NUMERIC,
    total_arr NUMERIC,
    total_emails_sent BIGINT,
    total_leads BIGINT,
    avg_churn_risk NUMERIC,
    avg_health_score NUMERIC,
    clients_at_risk BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT c.client_tenant_id)::BIGINT AS total_clients,
        COUNT(DISTINCT c.client_tenant_id) FILTER (WHERE c.status = 'active')::BIGINT AS active_clients,
        COALESCE(SUM(DISTINCT c.monthly_value), 0)::NUMERIC AS total_mrr,
        COALESCE(SUM(DISTINCT c.monthly_value) * 12, 0)::NUMERIC AS total_arr,
        COALESCE(SUM(m.emails_sent), 0)::BIGINT AS total_emails_sent,
        COALESCE(SUM(m.leads_generated), 0)::BIGINT AS total_leads,
        COALESCE(AVG(m.churn_risk), 0)::NUMERIC AS avg_churn_risk,
        COALESCE(AVG(c.health_score), 50)::NUMERIC AS avg_health_score,
        COUNT(DISTINCT c.client_tenant_id) FILTER (WHERE c.health_score < 40 OR m.churn_risk > 70)::BIGINT AS clients_at_risk
    FROM synthex_agency_overview_clients c
    LEFT JOIN synthex_agency_metrics m ON m.client_tenant_id = c.client_tenant_id
        AND m.period >= p_start_date
        AND m.period <= p_end_date
        AND m.period_type = 'daily'
    WHERE c.agency_tenant_id = p_agency_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get client metrics summary
-- =====================================================
CREATE OR REPLACE FUNCTION get_client_metrics_summary(
    p_client_tenant_id UUID,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    emails_sent BIGINT,
    emails_opened BIGINT,
    emails_clicked BIGINT,
    open_rate NUMERIC,
    click_rate NUMERIC,
    campaigns_running INT,
    leads_generated INT,
    new_contacts INT,
    churn_risk NUMERIC,
    engagement_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(m.emails_sent), 0)::BIGINT,
        COALESCE(SUM(m.emails_opened), 0)::BIGINT,
        COALESCE(SUM(m.emails_clicked), 0)::BIGINT,
        CASE WHEN SUM(m.emails_sent) > 0
            THEN (SUM(m.emails_opened)::NUMERIC / SUM(m.emails_sent) * 100)
            ELSE 0
        END::NUMERIC,
        CASE WHEN SUM(m.emails_opened) > 0
            THEN (SUM(m.emails_clicked)::NUMERIC / SUM(m.emails_opened) * 100)
            ELSE 0
        END::NUMERIC,
        COALESCE(MAX(m.campaigns_running), 0)::INT,
        COALESCE(SUM(m.leads_generated), 0)::INT,
        COALESCE(SUM(m.new_contacts), 0)::INT,
        COALESCE(AVG(m.churn_risk), 0)::NUMERIC,
        COALESCE(AVG(m.engagement_score), 50)::NUMERIC
    FROM synthex_agency_metrics m
    WHERE m.client_tenant_id = p_client_tenant_id
      AND m.period >= p_start_date
      AND m.period <= p_end_date
      AND m.period_type = 'daily';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Calculate and update client health score
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_client_health_score(p_client_tenant_id UUID)
RETURNS INT AS $$
DECLARE
    v_health_score INT;
    v_recent_metrics RECORD;
BEGIN
    -- Get most recent metrics
    SELECT
        churn_risk,
        engagement_score,
        emails_sent,
        campaigns_running,
        active_users
    INTO v_recent_metrics
    FROM synthex_agency_metrics
    WHERE client_tenant_id = p_client_tenant_id
    ORDER BY period DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN 50; -- Default score
    END IF;

    -- Calculate health score (inverse of churn risk, weighted with engagement)
    v_health_score := GREATEST(0, LEAST(100,
        (100 - COALESCE(v_recent_metrics.churn_risk, 50)) * 0.4 +
        COALESCE(v_recent_metrics.engagement_score, 50) * 0.4 +
        CASE
            WHEN v_recent_metrics.campaigns_running > 0 THEN 10
            ELSE 0
        END +
        CASE
            WHEN v_recent_metrics.active_users > 0 THEN 10
            ELSE 0
        END
    ))::INT;

    -- Update the client record
    UPDATE synthex_agency_overview_clients
    SET health_score = v_health_score,
        updated_at = now()
    WHERE client_tenant_id = p_client_tenant_id;

    RETURN v_health_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_agency_client_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agency_overview_clients_updated ON synthex_agency_overview_clients;
CREATE TRIGGER trg_agency_overview_clients_updated
    BEFORE UPDATE ON synthex_agency_overview_clients
    FOR EACH ROW EXECUTE FUNCTION update_agency_client_timestamp();

DROP TRIGGER IF EXISTS trg_agency_goals_updated ON synthex_agency_goals;
CREATE TRIGGER trg_agency_goals_updated
    BEFORE UPDATE ON synthex_agency_goals
    FOR EACH ROW EXECUTE FUNCTION update_agency_client_timestamp();

-- =====================================================
-- Grants
-- =====================================================
GRANT ALL ON synthex_agency_overview_clients TO authenticated;
GRANT ALL ON synthex_agency_metrics TO authenticated;
GRANT ALL ON synthex_agency_alerts TO authenticated;
GRANT ALL ON synthex_agency_goals TO authenticated;
GRANT EXECUTE ON FUNCTION get_agency_overview(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_metrics_summary(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_client_health_score(UUID) TO authenticated;
