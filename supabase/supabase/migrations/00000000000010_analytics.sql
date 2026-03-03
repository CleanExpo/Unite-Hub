-- =============================================================================
-- Migration: Analytics and Observability System
-- Description: Tables for metrics, cost tracking, and alerting
-- =============================================================================

-- Hourly metrics aggregation
CREATE TABLE IF NOT EXISTS public.analytics_metrics_hourly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_hour TIMESTAMPTZ NOT NULL,

    -- Agent metrics
    total_runs INT DEFAULT 0,
    completed_runs INT DEFAULT 0,
    failed_runs INT DEFAULT 0,
    escalated_runs INT DEFAULT 0,
    avg_duration_seconds FLOAT DEFAULT 0,

    -- Verification metrics
    total_verifications INT DEFAULT 0,
    passed_verifications INT DEFAULT 0,
    failed_verifications INT DEFAULT 0,
    avg_verification_attempts FLOAT DEFAULT 0,

    -- Cost metrics
    total_cost_usd DECIMAL(10, 6) DEFAULT 0,
    total_input_tokens BIGINT DEFAULT 0,
    total_output_tokens BIGINT DEFAULT 0,

    -- Tool metrics
    tools_loaded INT DEFAULT 0,
    tools_searched INT DEFAULT 0,
    programmatic_calls INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(metric_hour)
);

-- API usage tracking for cost analysis
CREATE TABLE IF NOT EXISTS public.api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,

    -- API details
    provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai')),
    model TEXT NOT NULL,

    -- Token usage
    input_tokens INT NOT NULL,
    output_tokens INT NOT NULL,
    total_tokens INT GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

    -- Cost calculation
    cost_per_input_token DECIMAL(12, 10) NOT NULL,
    cost_per_output_token DECIMAL(12, 10) NOT NULL,
    cost_usd DECIMAL(10, 6) GENERATED ALWAYS AS (
        (input_tokens * cost_per_input_token) +
        (output_tokens * cost_per_output_token)
    ) STORED,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Tool usage events
CREATE TABLE IF NOT EXISTS public.tool_usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID REFERENCES agent_runs(id) ON DELETE CASCADE,

    event_type TEXT NOT NULL CHECK (event_type IN ('load', 'search', 'programmatic')),
    tool_name TEXT,
    tool_category TEXT,

    -- Search-specific
    search_query TEXT,
    search_score FLOAT,

    -- Context savings
    estimated_tokens_saved INT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    rule_name TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),

    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Alert state
    status TEXT NOT NULL DEFAULT 'firing' CHECK (status IN ('firing', 'resolved', 'acknowledged')),

    -- Related entities
    agent_run_id UUID REFERENCES agent_runs(id),
    metric_value JSONB,

    -- Lifecycle
    triggered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES auth.users(id),

    -- Notification tracking
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_channels JSONB DEFAULT '[]'
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Analytics metrics
CREATE INDEX IF NOT EXISTS idx_analytics_hourly_hour ON public.analytics_metrics_hourly(metric_hour DESC);

-- API usage
CREATE INDEX IF NOT EXISTS idx_api_usage_agent_run ON public.api_usage(agent_run_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON public.api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_provider ON public.api_usage(provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_model ON public.api_usage(model);

-- Tool usage
CREATE INDEX IF NOT EXISTS idx_tool_usage_run ON public.tool_usage_events(agent_run_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created ON public.tool_usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool ON public.tool_usage_events(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_usage_event_type ON public.tool_usage_events(event_type);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON public.alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_agent_run ON public.alerts(agent_run_id);

-- =============================================================================
-- Aggregation Functions
-- =============================================================================

CREATE OR REPLACE FUNCTION aggregate_hourly_metrics(p_hour TIMESTAMPTZ)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.analytics_metrics_hourly (
        metric_hour,
        total_runs,
        completed_runs,
        failed_runs,
        escalated_runs,
        avg_duration_seconds,
        total_verifications,
        passed_verifications,
        failed_verifications,
        total_cost_usd,
        total_input_tokens,
        total_output_tokens
    )
    SELECT
        p_hour,
        COUNT(*) as total_runs,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_runs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
        COUNT(*) FILTER (WHERE status = 'escalated_to_human') as escalated_runs,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
        (SELECT COUNT(*) FROM verification_results WHERE DATE_TRUNC('hour', created_at) = p_hour),
        (SELECT COUNT(*) FROM verification_results WHERE DATE_TRUNC('hour', created_at) = p_hour AND verified = true),
        (SELECT COUNT(*) FROM verification_results WHERE DATE_TRUNC('hour', created_at) = p_hour AND verified = false),
        (SELECT COALESCE(SUM(cost_usd), 0) FROM api_usage WHERE DATE_TRUNC('hour', created_at) = p_hour),
        (SELECT COALESCE(SUM(input_tokens), 0) FROM api_usage WHERE DATE_TRUNC('hour', created_at) = p_hour),
        (SELECT COALESCE(SUM(output_tokens), 0) FROM api_usage WHERE DATE_TRUNC('hour', created_at) = p_hour)
    FROM agent_runs
    WHERE DATE_TRUNC('hour', started_at) = p_hour
    ON CONFLICT (metric_hour) DO UPDATE SET
        total_runs = EXCLUDED.total_runs,
        completed_runs = EXCLUDED.completed_runs,
        failed_runs = EXCLUDED.failed_runs,
        escalated_runs = EXCLUDED.escalated_runs,
        avg_duration_seconds = EXCLUDED.avg_duration_seconds,
        total_verifications = EXCLUDED.total_verifications,
        passed_verifications = EXCLUDED.passed_verifications,
        failed_verifications = EXCLUDED.failed_verifications,
        total_cost_usd = EXCLUDED.total_cost_usd,
        total_input_tokens = EXCLUDED.total_input_tokens,
        total_output_tokens = EXCLUDED.total_output_tokens;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE public.analytics_metrics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Analytics metrics (aggregated - public read)
CREATE POLICY "Public read access to analytics metrics"
    ON public.analytics_metrics_hourly FOR SELECT
    USING (true);

CREATE POLICY "Service role can write analytics"
    ON public.analytics_metrics_hourly FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- API usage (user-specific via agent_runs join)
CREATE POLICY "Users can view their own API usage"
    ON public.api_usage FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM agent_runs
            WHERE agent_runs.id = api_usage.agent_run_id
                AND agent_runs.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can write API usage"
    ON public.api_usage FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Tool usage (service role only)
CREATE POLICY "Service role manages tool usage"
    ON public.tool_usage_events FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Alerts (user can view and acknowledge their alerts)
CREATE POLICY "Users can view alerts for their runs"
    ON public.alerts FOR SELECT
    USING (
        agent_run_id IS NULL
        OR EXISTS (
            SELECT 1 FROM agent_runs
            WHERE agent_runs.id = alerts.agent_run_id
                AND agent_runs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can acknowledge alerts"
    ON public.alerts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM agent_runs
            WHERE agent_runs.id = alerts.agent_run_id
                AND agent_runs.user_id = auth.uid()
        )
    )
    WITH CHECK (acknowledged_by = auth.uid());

CREATE POLICY "Service role manages alerts"
    ON public.alerts FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.analytics_metrics_hourly IS 'Hourly aggregated metrics for dashboard performance';
COMMENT ON TABLE public.api_usage IS 'LLM API call tracking for cost analysis';
COMMENT ON TABLE public.tool_usage_events IS 'Tool usage events for analytics';
COMMENT ON TABLE public.alerts IS 'System alerts and notifications';
COMMENT ON FUNCTION aggregate_hourly_metrics IS 'Aggregates metrics from agent_runs and verification_results into hourly buckets';
