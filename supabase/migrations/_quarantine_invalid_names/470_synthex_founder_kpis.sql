-- =============================================================================
-- D41: Founder Control Tower + Cross-Business KPIs
-- Phase: Synthex Autonomous Growth Stack
-- Prefix: synthex_fct_* (founder control tower)
-- =============================================================================
-- SQL Pre-Flight Checklist:
-- ✅ Dependencies with IF NOT EXISTS
-- ✅ ENUMs with DO blocks and pg_type checks
-- ✅ Unique prefix: synthex_fct_*
-- ✅ Column naming to avoid type conflicts
-- ✅ RLS with current_setting('app.tenant_id', true)::uuid
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENUM Types (with existence checks)
-- -----------------------------------------------------------------------------

-- KPI category
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_fct_kpi_category') THEN
    CREATE TYPE synthex_fct_kpi_category AS ENUM (
      'revenue',
      'growth',
      'engagement',
      'acquisition',
      'retention',
      'efficiency',
      'quality',
      'custom'
    );
  END IF;
END $$;

-- Alert severity
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_fct_alert_severity') THEN
    CREATE TYPE synthex_fct_alert_severity AS ENUM (
      'info',
      'warning',
      'critical',
      'emergency'
    );
  END IF;
END $$;

-- Alert status
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_fct_alert_status') THEN
    CREATE TYPE synthex_fct_alert_status AS ENUM (
      'active',
      'acknowledged',
      'resolved',
      'snoozed'
    );
  END IF;
END $$;

-- Trend direction
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_fct_trend_direction') THEN
    CREATE TYPE synthex_fct_trend_direction AS ENUM (
      'up',
      'down',
      'stable',
      'volatile'
    );
  END IF;
END $$;

-- Dashboard widget type
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_fct_widget_type') THEN
    CREATE TYPE synthex_fct_widget_type AS ENUM (
      'kpi_card',
      'chart_line',
      'chart_bar',
      'chart_pie',
      'table',
      'alert_feed',
      'comparison',
      'heatmap',
      'custom'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Main Tables
-- -----------------------------------------------------------------------------

-- KPI definitions (what KPIs to track)
CREATE TABLE IF NOT EXISTS synthex_fct_kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- KPI info
  kpi_name TEXT NOT NULL,
  kpi_code TEXT NOT NULL, -- e.g. 'mrr', 'cac', 'ltv'
  description TEXT,
  category synthex_fct_kpi_category DEFAULT 'custom',

  -- Calculation
  calculation_formula TEXT, -- e.g. 'revenue / customers'
  data_source TEXT, -- e.g. 'stripe', 'manual', 'calculated'
  unit TEXT, -- e.g. '$', '%', 'count'
  decimals INTEGER DEFAULT 2,

  -- Display
  display_format TEXT, -- e.g. 'currency', 'percentage', 'number'
  color_positive TEXT DEFAULT '#22c55e',
  color_negative TEXT DEFAULT '#ef4444',
  icon_name TEXT,

  -- Targets
  target_value DECIMAL,
  target_comparison TEXT, -- 'greater_than', 'less_than', 'equal'

  -- Aggregation
  aggregation_type TEXT DEFAULT 'sum', -- 'sum', 'avg', 'max', 'min', 'latest'
  time_granularity TEXT DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly'

  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  is_global BOOLEAN DEFAULT FALSE, -- applies to all businesses
  show_on_dashboard BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id, kpi_code)
);

-- KPI values (actual tracked values per business)
CREATE TABLE IF NOT EXISTS synthex_fct_kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_id UUID REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,
  kpi_definition_id UUID NOT NULL REFERENCES synthex_fct_kpi_definitions(id) ON DELETE CASCADE,

  -- Value
  value DECIMAL NOT NULL,
  previous_value DECIMAL,
  change_amount DECIMAL,
  change_percentage DECIMAL,
  trend_direction synthex_fct_trend_direction DEFAULT 'stable',

  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- Source
  source_type TEXT, -- 'api', 'manual', 'calculated'
  source_reference TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes for time-series queries
  CONSTRAINT unique_kpi_period UNIQUE (kpi_definition_id, business_id, period_start)
);

-- Alerts (threshold breaches and important notifications)
CREATE TABLE IF NOT EXISTS synthex_fct_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_id UUID REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  -- Alert info
  alert_type TEXT NOT NULL, -- 'kpi_threshold', 'anomaly', 'goal_achieved', 'system'
  title TEXT NOT NULL,
  message TEXT,
  severity synthex_fct_alert_severity DEFAULT 'info',
  status synthex_fct_alert_status DEFAULT 'active',

  -- Related KPI
  kpi_definition_id UUID REFERENCES synthex_fct_kpi_definitions(id) ON DELETE SET NULL,
  kpi_value DECIMAL,
  threshold_value DECIMAL,

  -- Actions
  action_url TEXT,
  action_label TEXT,

  -- Resolution
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_notes TEXT,

  -- Snooze
  snoozed_until TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert rules (when to trigger alerts)
CREATE TABLE IF NOT EXISTS synthex_fct_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Rule info
  rule_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  -- Trigger condition
  kpi_definition_id UUID REFERENCES synthex_fct_kpi_definitions(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL, -- 'above', 'below', 'change_above', 'change_below', 'anomaly'
  threshold_value DECIMAL,
  threshold_percentage DECIMAL, -- for change-based rules

  -- Alert settings
  severity synthex_fct_alert_severity DEFAULT 'warning',
  cooldown_minutes INTEGER DEFAULT 60, -- don't re-alert within this period

  -- Notifications
  notify_email BOOLEAN DEFAULT FALSE,
  notify_slack BOOLEAN DEFAULT FALSE,
  notify_webhook TEXT,

  -- Scope
  business_ids UUID[], -- NULL = all businesses

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_triggered_at TIMESTAMPTZ
);

-- Dashboard configurations
CREATE TABLE IF NOT EXISTS synthex_fct_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Dashboard info
  dashboard_name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,

  -- Layout
  layout_type TEXT DEFAULT 'grid', -- 'grid', 'freeform'
  columns INTEGER DEFAULT 4,

  -- Access
  is_shared BOOLEAN DEFAULT FALSE,
  owner_user_id UUID,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(tenant_id, dashboard_name)
);

-- Dashboard widgets
CREATE TABLE IF NOT EXISTS synthex_fct_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES synthex_fct_dashboards(id) ON DELETE CASCADE,

  -- Widget info
  widget_name TEXT NOT NULL,
  widget_type synthex_fct_widget_type DEFAULT 'kpi_card',

  -- Position
  grid_x INTEGER DEFAULT 0,
  grid_y INTEGER DEFAULT 0,
  grid_width INTEGER DEFAULT 1,
  grid_height INTEGER DEFAULT 1,

  -- Configuration
  kpi_definition_ids UUID[], -- KPIs to display
  business_ids UUID[], -- filter to specific businesses
  time_range TEXT DEFAULT '30d', -- '7d', '30d', '90d', 'ytd', 'custom'
  comparison_type TEXT, -- 'previous_period', 'previous_year', 'target'

  -- Visual settings
  chart_type TEXT, -- for chart widgets
  color_scheme TEXT DEFAULT 'default',
  show_legend BOOLEAN DEFAULT TRUE,
  show_labels BOOLEAN DEFAULT TRUE,

  -- Metadata
  config JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-business comparisons
CREATE TABLE IF NOT EXISTS synthex_fct_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Comparison info
  comparison_name TEXT NOT NULL,
  description TEXT,

  -- What to compare
  kpi_definition_id UUID NOT NULL REFERENCES synthex_fct_kpi_definitions(id) ON DELETE CASCADE,
  business_ids UUID[] NOT NULL, -- businesses to compare

  -- Time settings
  time_range TEXT DEFAULT '30d',
  comparison_period TEXT, -- 'previous_period', 'previous_year'

  -- Results (cached)
  last_computed_at TIMESTAMPTZ,
  results JSONB, -- cached comparison results

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Founder goals and targets
CREATE TABLE IF NOT EXISTS synthex_fct_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  business_id UUID REFERENCES synthex_br_businesses(id) ON DELETE CASCADE, -- NULL = tenant-wide

  -- Goal info
  goal_name TEXT NOT NULL,
  description TEXT,

  -- Target
  kpi_definition_id UUID REFERENCES synthex_fct_kpi_definitions(id) ON DELETE SET NULL,
  target_value DECIMAL NOT NULL,
  current_value DECIMAL,

  -- Timeline
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Progress
  progress_percentage DECIMAL DEFAULT 0,
  is_achieved BOOLEAN DEFAULT FALSE,
  achieved_at TIMESTAMPTZ,

  -- Milestones
  milestones JSONB DEFAULT '[]',

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------------------------

-- KPI definitions indexes
CREATE INDEX IF NOT EXISTS idx_synthex_fct_kpi_definitions_tenant ON synthex_fct_kpi_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_kpi_definitions_category ON synthex_fct_kpi_definitions(category);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_kpi_definitions_active ON synthex_fct_kpi_definitions(tenant_id) WHERE is_active = TRUE;

-- KPI values indexes (optimized for time-series)
CREATE INDEX IF NOT EXISTS idx_synthex_fct_kpi_values_tenant ON synthex_fct_kpi_values(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_kpi_values_business ON synthex_fct_kpi_values(business_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_kpi_values_kpi ON synthex_fct_kpi_values(kpi_definition_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_kpi_values_period ON synthex_fct_kpi_values(period_start DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_kpi_values_lookup ON synthex_fct_kpi_values(kpi_definition_id, business_id, period_start DESC);

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_synthex_fct_alerts_tenant ON synthex_fct_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_alerts_business ON synthex_fct_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_alerts_status ON synthex_fct_alerts(status);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_alerts_severity ON synthex_fct_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_alerts_active ON synthex_fct_alerts(tenant_id, status) WHERE status = 'active';

-- Alert rules indexes
CREATE INDEX IF NOT EXISTS idx_synthex_fct_alert_rules_tenant ON synthex_fct_alert_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_alert_rules_kpi ON synthex_fct_alert_rules(kpi_definition_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_alert_rules_active ON synthex_fct_alert_rules(tenant_id) WHERE is_active = TRUE;

-- Dashboard indexes
CREATE INDEX IF NOT EXISTS idx_synthex_fct_dashboards_tenant ON synthex_fct_dashboards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_dashboard_widgets_dashboard ON synthex_fct_dashboard_widgets(dashboard_id);

-- Comparisons indexes
CREATE INDEX IF NOT EXISTS idx_synthex_fct_comparisons_tenant ON synthex_fct_comparisons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_comparisons_kpi ON synthex_fct_comparisons(kpi_definition_id);

-- Goals indexes
CREATE INDEX IF NOT EXISTS idx_synthex_fct_goals_tenant ON synthex_fct_goals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_goals_business ON synthex_fct_goals(business_id);
CREATE INDEX IF NOT EXISTS idx_synthex_fct_goals_kpi ON synthex_fct_goals(kpi_definition_id);

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE synthex_fct_kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_fct_kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_fct_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_fct_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_fct_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_fct_dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_fct_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_fct_goals ENABLE ROW LEVEL SECURITY;

-- KPI definitions policy
DROP POLICY IF EXISTS synthex_fct_kpi_definitions_tenant_isolation ON synthex_fct_kpi_definitions;
CREATE POLICY synthex_fct_kpi_definitions_tenant_isolation ON synthex_fct_kpi_definitions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- KPI values policy
DROP POLICY IF EXISTS synthex_fct_kpi_values_tenant_isolation ON synthex_fct_kpi_values;
CREATE POLICY synthex_fct_kpi_values_tenant_isolation ON synthex_fct_kpi_values
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Alerts policy
DROP POLICY IF EXISTS synthex_fct_alerts_tenant_isolation ON synthex_fct_alerts;
CREATE POLICY synthex_fct_alerts_tenant_isolation ON synthex_fct_alerts
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Alert rules policy
DROP POLICY IF EXISTS synthex_fct_alert_rules_tenant_isolation ON synthex_fct_alert_rules;
CREATE POLICY synthex_fct_alert_rules_tenant_isolation ON synthex_fct_alert_rules
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Dashboards policy
DROP POLICY IF EXISTS synthex_fct_dashboards_tenant_isolation ON synthex_fct_dashboards;
CREATE POLICY synthex_fct_dashboards_tenant_isolation ON synthex_fct_dashboards
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Dashboard widgets policy
DROP POLICY IF EXISTS synthex_fct_dashboard_widgets_tenant_isolation ON synthex_fct_dashboard_widgets;
CREATE POLICY synthex_fct_dashboard_widgets_tenant_isolation ON synthex_fct_dashboard_widgets
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Comparisons policy
DROP POLICY IF EXISTS synthex_fct_comparisons_tenant_isolation ON synthex_fct_comparisons;
CREATE POLICY synthex_fct_comparisons_tenant_isolation ON synthex_fct_comparisons
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Goals policy
DROP POLICY IF EXISTS synthex_fct_goals_tenant_isolation ON synthex_fct_goals;
CREATE POLICY synthex_fct_goals_tenant_isolation ON synthex_fct_goals
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- -----------------------------------------------------------------------------
-- 5. Helper Functions
-- -----------------------------------------------------------------------------

-- Calculate trend direction based on change
CREATE OR REPLACE FUNCTION synthex_fct_calculate_trend(
  p_change_percentage DECIMAL,
  p_volatility_threshold DECIMAL DEFAULT 20
)
RETURNS synthex_fct_trend_direction AS $$
BEGIN
  IF p_change_percentage IS NULL THEN
    RETURN 'stable';
  ELSIF ABS(p_change_percentage) > p_volatility_threshold THEN
    RETURN 'volatile';
  ELSIF p_change_percentage > 2 THEN
    RETURN 'up';
  ELSIF p_change_percentage < -2 THEN
    RETURN 'down';
  ELSE
    RETURN 'stable';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get latest KPI values for a tenant
CREATE OR REPLACE FUNCTION synthex_fct_get_latest_kpis(
  p_tenant_id UUID,
  p_business_id UUID DEFAULT NULL
)
RETURNS TABLE (
  kpi_code TEXT,
  kpi_name TEXT,
  category synthex_fct_kpi_category,
  value DECIMAL,
  previous_value DECIMAL,
  change_percentage DECIMAL,
  trend_direction synthex_fct_trend_direction,
  unit TEXT,
  target_value DECIMAL,
  period_start TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (kd.kpi_code)
    kd.kpi_code,
    kd.kpi_name,
    kd.category,
    kv.value,
    kv.previous_value,
    kv.change_percentage,
    kv.trend_direction,
    kd.unit,
    kd.target_value,
    kv.period_start
  FROM synthex_fct_kpi_definitions kd
  LEFT JOIN synthex_fct_kpi_values kv ON kv.kpi_definition_id = kd.id
    AND (p_business_id IS NULL OR kv.business_id = p_business_id)
  WHERE kd.tenant_id = p_tenant_id
    AND kd.is_active = TRUE
  ORDER BY kd.kpi_code, kv.period_start DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Aggregate KPIs across all businesses
CREATE OR REPLACE FUNCTION synthex_fct_aggregate_cross_business(
  p_tenant_id UUID,
  p_kpi_definition_id UUID,
  p_aggregation_type TEXT DEFAULT 'sum'
)
RETURNS TABLE (
  total_value DECIMAL,
  avg_value DECIMAL,
  min_value DECIMAL,
  max_value DECIMAL,
  business_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(kv.value) AS total_value,
    AVG(kv.value) AS avg_value,
    MIN(kv.value) AS min_value,
    MAX(kv.value) AS max_value,
    COUNT(DISTINCT kv.business_id) AS business_count
  FROM synthex_fct_kpi_values kv
  WHERE kv.tenant_id = p_tenant_id
    AND kv.kpi_definition_id = p_kpi_definition_id
    AND kv.period_start = (
      SELECT MAX(period_start)
      FROM synthex_fct_kpi_values
      WHERE kpi_definition_id = p_kpi_definition_id
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION synthex_fct_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trg_synthex_fct_kpi_definitions_updated ON synthex_fct_kpi_definitions;
CREATE TRIGGER trg_synthex_fct_kpi_definitions_updated
  BEFORE UPDATE ON synthex_fct_kpi_definitions
  FOR EACH ROW
  EXECUTE FUNCTION synthex_fct_update_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_fct_alerts_updated ON synthex_fct_alerts;
CREATE TRIGGER trg_synthex_fct_alerts_updated
  BEFORE UPDATE ON synthex_fct_alerts
  FOR EACH ROW
  EXECUTE FUNCTION synthex_fct_update_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_fct_alert_rules_updated ON synthex_fct_alert_rules;
CREATE TRIGGER trg_synthex_fct_alert_rules_updated
  BEFORE UPDATE ON synthex_fct_alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION synthex_fct_update_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_fct_dashboards_updated ON synthex_fct_dashboards;
CREATE TRIGGER trg_synthex_fct_dashboards_updated
  BEFORE UPDATE ON synthex_fct_dashboards
  FOR EACH ROW
  EXECUTE FUNCTION synthex_fct_update_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_fct_dashboard_widgets_updated ON synthex_fct_dashboard_widgets;
CREATE TRIGGER trg_synthex_fct_dashboard_widgets_updated
  BEFORE UPDATE ON synthex_fct_dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION synthex_fct_update_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_fct_goals_updated ON synthex_fct_goals;
CREATE TRIGGER trg_synthex_fct_goals_updated
  BEFORE UPDATE ON synthex_fct_goals
  FOR EACH ROW
  EXECUTE FUNCTION synthex_fct_update_timestamp();

-- -----------------------------------------------------------------------------
-- 6. Seed Default KPI Definitions
-- -----------------------------------------------------------------------------

-- Note: These will be inserted per-tenant on first use via the service layer
-- Example KPIs that the service can create:
-- - mrr (Monthly Recurring Revenue)
-- - arr (Annual Recurring Revenue)
-- - cac (Customer Acquisition Cost)
-- - ltv (Lifetime Value)
-- - churn_rate (Customer Churn Rate)
-- - nps (Net Promoter Score)
-- - conversion_rate (Lead to Customer)
-- - active_users (Monthly Active Users)
-- - revenue_growth (MoM Revenue Growth)
-- - gross_margin (Gross Profit Margin)

-- -----------------------------------------------------------------------------
-- Migration complete
-- -----------------------------------------------------------------------------
