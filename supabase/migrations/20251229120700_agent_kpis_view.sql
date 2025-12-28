-- Project Vend Phase 2: Agent KPIs Materialized View
-- Aggregates metrics for fast dashboard queries

-- Agent KPIs materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS agent_kpis AS
SELECT
  workspace_id,
  agent_name,

  -- Performance (24h window)
  COUNT(*) FILTER (WHERE executed_at > NOW() - INTERVAL '24 hours') as executions_24h,
  AVG(execution_time_ms) FILTER (WHERE executed_at > NOW() - INTERVAL '24 hours') as avg_time_24h,
  (COUNT(*) FILTER (WHERE success = true AND executed_at > NOW() - INTERVAL '24 hours'))::DECIMAL /
    NULLIF(COUNT(*) FILTER (WHERE executed_at > NOW() - INTERVAL '24 hours'), 0) * 100 as success_rate_24h,

  -- Cost (30d window)
  SUM(cost_usd) FILTER (WHERE executed_at > NOW() - INTERVAL '30 days') as cost_30d,
  AVG(cost_usd) FILTER (WHERE executed_at > NOW() - INTERVAL '30 days') as avg_cost_per_execution,

  -- Health indicators
  MAX(executed_at) as last_execution_at,
  COUNT(*) FILTER (WHERE success = false AND executed_at > NOW() - INTERVAL '24 hours') as failures_24h,

  -- Recent activity (7d)
  COUNT(*) FILTER (WHERE executed_at > NOW() - INTERVAL '7 days') as executions_7d,
  SUM(cost_usd) FILTER (WHERE executed_at > NOW() - INTERVAL '7 days') as cost_7d

FROM agent_execution_metrics
GROUP BY workspace_id, agent_name;

-- Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_kpis_workspace_agent
  ON agent_kpis(workspace_id, agent_name);

-- Additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_agent_kpis_executions
  ON agent_kpis(executions_24h DESC);

CREATE INDEX IF NOT EXISTS idx_agent_kpis_cost
  ON agent_kpis(cost_30d DESC);

-- Function to refresh KPIs view
CREATE OR REPLACE FUNCTION refresh_agent_kpis()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY agent_kpis;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_agent_kpis IS 'Refresh agent_kpis materialized view. Should be called every 5 minutes via cron.';

-- Function to get KPI trends (compare current vs previous period)
CREATE OR REPLACE FUNCTION get_agent_kpi_trends(
  p_workspace_id UUID,
  p_agent_name TEXT
)
RETURNS TABLE (
  metric_name TEXT,
  current_value DECIMAL,
  previous_value DECIMAL,
  change_percent DECIMAL,
  trend TEXT -- 'up' | 'down' | 'stable'
) AS $$
DECLARE
  v_current_success_rate DECIMAL;
  v_previous_success_rate DECIMAL;
  v_current_avg_time DECIMAL;
  v_previous_avg_time DECIMAL;
  v_current_cost DECIMAL;
  v_previous_cost DECIMAL;
BEGIN
  -- Get current period (24h)
  SELECT
    (COUNT(*) FILTER (WHERE success = true))::DECIMAL / NULLIF(COUNT(*), 0) * 100,
    AVG(execution_time_ms),
    SUM(cost_usd)
  INTO v_current_success_rate, v_current_avg_time, v_current_cost
  FROM agent_execution_metrics
  WHERE workspace_id = p_workspace_id
    AND agent_name = p_agent_name
    AND executed_at > NOW() - INTERVAL '24 hours';

  -- Get previous period (24h-48h ago)
  SELECT
    (COUNT(*) FILTER (WHERE success = true))::DECIMAL / NULLIF(COUNT(*), 0) * 100,
    AVG(execution_time_ms),
    SUM(cost_usd)
  INTO v_previous_success_rate, v_previous_avg_time, v_previous_cost
  FROM agent_execution_metrics
  WHERE workspace_id = p_workspace_id
    AND agent_name = p_agent_name
    AND executed_at BETWEEN NOW() - INTERVAL '48 hours' AND NOW() - INTERVAL '24 hours';

  -- Return trends
  RETURN QUERY
  SELECT
    'success_rate'::TEXT as metric_name,
    COALESCE(v_current_success_rate, 0) as current_value,
    COALESCE(v_previous_success_rate, 0) as previous_value,
    CASE
      WHEN v_previous_success_rate > 0 THEN
        ((v_current_success_rate - v_previous_success_rate) / v_previous_success_rate * 100)
      ELSE 0
    END as change_percent,
    CASE
      WHEN v_current_success_rate > v_previous_success_rate + 2 THEN 'up'::TEXT
      WHEN v_current_success_rate < v_previous_success_rate - 2 THEN 'down'::TEXT
      ELSE 'stable'::TEXT
    END as trend

  UNION ALL

  SELECT
    'avg_execution_time'::TEXT,
    COALESCE(v_current_avg_time, 0),
    COALESCE(v_previous_avg_time, 0),
    CASE
      WHEN v_previous_avg_time > 0 THEN
        ((v_current_avg_time - v_previous_avg_time) / v_previous_avg_time * 100)
      ELSE 0
    END,
    CASE
      WHEN v_current_avg_time < v_previous_avg_time * 0.9 THEN 'up'::TEXT -- Faster is up/good
      WHEN v_current_avg_time > v_previous_avg_time * 1.1 THEN 'down'::TEXT
      ELSE 'stable'::TEXT
    END

  UNION ALL

  SELECT
    'cost'::TEXT,
    COALESCE(v_current_cost, 0),
    COALESCE(v_previous_cost, 0),
    CASE
      WHEN v_previous_cost > 0 THEN
        ((v_current_cost - v_previous_cost) / v_previous_cost * 100)
      ELSE 0
    END,
    CASE
      WHEN v_current_cost > v_previous_cost * 1.2 THEN 'down'::TEXT -- Higher cost is down/bad
      WHEN v_current_cost < v_previous_cost * 0.8 THEN 'up'::TEXT
      ELSE 'stable'::TEXT
    END;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_agent_kpi_trends IS 'Compare current 24h performance vs previous 24h to detect trends';

-- Comments for documentation
COMMENT ON MATERIALIZED VIEW agent_kpis IS 'Aggregated agent performance KPIs. Refresh every 5 minutes via refresh_agent_kpis() function.';
COMMENT ON COLUMN agent_kpis.success_rate_24h IS 'Success rate percentage (0-100) for last 24 hours';
COMMENT ON COLUMN agent_kpis.avg_time_24h IS 'Average execution time in milliseconds for last 24 hours';
COMMENT ON COLUMN agent_kpis.cost_30d IS 'Total AI spend in USD for last 30 days';
