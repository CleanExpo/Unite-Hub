-- Business Analytics & Cross-Business Management Tables
-- Part of Unite-Hub Evolution Spec v2.0 - Phase 4
-- @see .claude/plans/SPEC-2026-01-23.md

-- ============================================================================
-- Cross-Business Analytics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_business_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES founder_businesses(id) ON DELETE CASCADE,

  -- Time period
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Revenue metrics
  revenue_total NUMERIC(12,2) DEFAULT 0,
  revenue_recurring NUMERIC(12,2) DEFAULT 0,
  revenue_one_time NUMERIC(12,2) DEFAULT 0,
  revenue_growth_pct NUMERIC(5,2),

  -- Customer metrics
  customers_total INTEGER DEFAULT 0,
  customers_new INTEGER DEFAULT 0,
  customers_churned INTEGER DEFAULT 0,
  churn_rate NUMERIC(5,2),
  ltv_avg NUMERIC(12,2),

  -- Engagement metrics
  active_users INTEGER DEFAULT 0,
  sessions_total INTEGER DEFAULT 0,
  avg_session_duration INTEGER, -- seconds

  -- Support metrics
  tickets_opened INTEGER DEFAULT 0,
  tickets_resolved INTEGER DEFAULT 0,
  avg_resolution_time INTEGER, -- hours
  nps_score NUMERIC(3,1),

  -- Infrastructure metrics
  uptime_pct NUMERIC(5,2),
  api_calls INTEGER DEFAULT 0,
  error_rate NUMERIC(5,2),

  -- AI-generated insights
  ai_summary TEXT,
  ai_recommendations JSONB DEFAULT '[]',
  ai_risk_score INTEGER CHECK (ai_risk_score BETWEEN 0 AND 100),
  ai_growth_score INTEGER CHECK (ai_growth_score BETWEEN 0 AND 100),
  ai_analyzed_at TIMESTAMPTZ,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per business per period
  UNIQUE(business_id, period_type, period_start)
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_business_analytics_period
  ON founder_business_analytics(business_id, period_type, period_start DESC);

-- ============================================================================
-- Cross-Business Customer View Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_cross_business_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,

  -- Customer identity (unified across businesses)
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,

  -- Cross-business relationships
  businesses JSONB DEFAULT '[]', -- Array of {business_id, customer_id, status, ltv}

  -- Unified metrics
  total_ltv NUMERIC(12,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  first_transaction_at TIMESTAMPTZ,
  last_transaction_at TIMESTAMPTZ,

  -- Engagement summary
  engagement_score INTEGER CHECK (engagement_score BETWEEN 0 AND 100),
  health_status TEXT CHECK (health_status IN ('healthy', 'at_risk', 'churned', 'new')),

  -- AI insights
  ai_segment TEXT,
  ai_predicted_ltv NUMERIC(12,2),
  ai_churn_risk NUMERIC(5,2),
  ai_upsell_potential JSONB,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique email per owner
  UNIQUE(owner_user_id, email)
);

-- Index for customer lookups
CREATE INDEX IF NOT EXISTS idx_cross_business_customers_email
  ON founder_cross_business_customers(owner_user_id, email);

CREATE INDEX IF NOT EXISTS idx_cross_business_customers_health
  ON founder_cross_business_customers(owner_user_id, health_status);

-- ============================================================================
-- Resource Allocation Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_resource_allocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  business_id UUID REFERENCES founder_businesses(id) ON DELETE SET NULL,

  -- Resource details
  resource_type TEXT NOT NULL CHECK (resource_type IN (
    'time', 'budget', 'team', 'infrastructure', 'tools'
  )),
  resource_name TEXT NOT NULL,

  -- Allocation
  allocated_amount NUMERIC(12,2),
  allocated_unit TEXT, -- hours, USD, count, etc.
  utilized_amount NUMERIC(12,2) DEFAULT 0,
  utilization_pct NUMERIC(5,2),

  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Priority and status
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT DEFAULT 'active' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for resource queries
CREATE INDEX IF NOT EXISTS idx_resource_allocation_business
  ON founder_resource_allocation(business_id, period_start);

CREATE INDEX IF NOT EXISTS idx_resource_allocation_type
  ON founder_resource_allocation(owner_user_id, resource_type);

-- ============================================================================
-- Business Health Aggregates View (for dashboards)
-- ============================================================================

CREATE OR REPLACE VIEW founder_business_health_summary AS
SELECT
  fb.id AS business_id,
  fb.owner_user_id,
  fb.code,
  fb.display_name,
  fb.industry,
  fb.status,

  -- Latest analytics
  fba.revenue_total AS current_revenue,
  fba.revenue_growth_pct,
  fba.customers_total,
  fba.churn_rate,
  fba.ai_risk_score,
  fba.ai_growth_score,
  fba.ai_summary,

  -- Latest signals (aggregated)
  (
    SELECT jsonb_object_agg(signal_key, value_numeric)
    FROM (
      SELECT DISTINCT ON (signal_key) signal_key, value_numeric
      FROM founder_business_signals
      WHERE founder_business_id = fb.id
        AND signal_family = 'revenue'
      ORDER BY signal_key, observed_at DESC
    ) recent_signals
  ) AS recent_revenue_signals,

  -- Cross-customer count
  (
    SELECT COUNT(*)
    FROM founder_cross_business_customers fcbc
    WHERE fcbc.owner_user_id = fb.owner_user_id
      AND fcbc.businesses::text LIKE '%' || fb.id::text || '%'
  ) AS shared_customers,

  -- GitHub repo count (if linked)
  (
    SELECT COUNT(*)
    FROM founder_github_repos fgr
    WHERE fgr.metadata->>'linked_business_id' = fb.id::text
  ) AS linked_repos

FROM founder_businesses fb
LEFT JOIN LATERAL (
  SELECT *
  FROM founder_business_analytics
  WHERE business_id = fb.id
    AND period_type = 'monthly'
  ORDER BY period_start DESC
  LIMIT 1
) fba ON true;

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE founder_business_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_cross_business_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_resource_allocation ENABLE ROW LEVEL SECURITY;

-- Policies for founder_business_analytics
DROP POLICY IF EXISTS "business_analytics_tenant_isolation" ON founder_business_analytics;
CREATE POLICY "business_analytics_tenant_isolation" ON founder_business_analytics
  FOR ALL USING (
    business_id IN (
      SELECT id FROM founder_businesses
      WHERE owner_user_id = auth.uid()
    )
  );

-- Policies for founder_cross_business_customers
DROP POLICY IF EXISTS "cross_business_customers_tenant_isolation" ON founder_cross_business_customers;
CREATE POLICY "cross_business_customers_tenant_isolation" ON founder_cross_business_customers
  FOR ALL USING (owner_user_id = auth.uid());

-- Policies for founder_resource_allocation
DROP POLICY IF EXISTS "resource_allocation_tenant_isolation" ON founder_resource_allocation;
CREATE POLICY "resource_allocation_tenant_isolation" ON founder_resource_allocation
  FOR ALL USING (owner_user_id = auth.uid());

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_business_analytics_updated_at ON founder_business_analytics;
CREATE TRIGGER trigger_business_analytics_updated_at
  BEFORE UPDATE ON founder_business_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_cross_customers_updated_at ON founder_cross_business_customers;
CREATE TRIGGER trigger_cross_customers_updated_at
  BEFORE UPDATE ON founder_cross_business_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_resource_allocation_updated_at ON founder_resource_allocation;
CREATE TRIGGER trigger_resource_allocation_updated_at
  BEFORE UPDATE ON founder_resource_allocation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE founder_business_analytics IS 'Cross-business analytics with AI-generated insights for unified SaaS management';
COMMENT ON TABLE founder_cross_business_customers IS 'Unified customer view across all founder businesses';
COMMENT ON TABLE founder_resource_allocation IS 'Time, budget, and resource allocation tracking across businesses';
COMMENT ON VIEW founder_business_health_summary IS 'Aggregated business health view for dashboards';
