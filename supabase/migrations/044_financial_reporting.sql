-- Migration 044: Financial Reporting & Billing Consolidation
-- Phase 3 Step 9
--
-- Creates tables and views for consolidated financial reporting:
-- - financial_transactions: All revenue/cost transactions
-- - client_billing_summary: Materialized view for client billing
-- - project_profitability: Materialized view for P&L
-- - ai_cost_tracking: AI API usage costs
-- - payment_records: Stripe payment tracking
--
-- Run this in Supabase SQL Editor

-- ============================================================================
-- FINANCIAL_TRANSACTIONS TABLE (All Financial Events)
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organizational context
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,

  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'time_entry',      -- Billable time
    'stripe_payment',  -- Payment received
    'xero_invoice',    -- Invoice issued
    'ai_cost',         -- AI API cost
    'expense',         -- Other expense
    'refund',          -- Payment refund
    'adjustment'       -- Manual adjustment
  )),

  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Amounts
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Classification
  revenue_type TEXT CHECK (revenue_type IN ('billable_time', 'subscription', 'one_time', 'recurring')),
  cost_type TEXT CHECK (cost_type IN ('ai_api', 'labor', 'infrastructure', 'marketing', 'other')),

  -- References
  time_entry_id UUID REFERENCES time_entries(id) ON DELETE SET NULL,
  stripe_payment_id TEXT, -- Stripe payment intent ID
  xero_invoice_id TEXT,   -- Xero invoice ID

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Indexes for financial_transactions
CREATE INDEX IF NOT EXISTS idx_financial_transactions_org_id ON financial_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_workspace_id ON financial_transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_project_id ON financial_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_contact_id ON financial_transactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);

-- ============================================================================
-- AI_COST_TRACKING TABLE (AI API Usage Costs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ai_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Usage details
  usage_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'google', 'openrouter')),
  model_name TEXT NOT NULL, -- e.g., 'claude-sonnet-4-5-20250929'

  -- Token usage
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  cache_write_tokens INTEGER DEFAULT 0,

  -- Cost breakdown
  input_cost DECIMAL(10, 6) DEFAULT 0,
  output_cost DECIMAL(10, 6) DEFAULT 0,
  cache_cost DECIMAL(10, 6) DEFAULT 0,
  total_cost DECIMAL(10, 6) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',

  -- Context
  operation_type TEXT, -- e.g., 'email_processing', 'content_generation'
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Metadata
  request_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ai_cost_tracking
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_org_id ON ai_cost_tracking(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_workspace_id ON ai_cost_tracking(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_date ON ai_cost_tracking(usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_provider ON ai_cost_tracking(provider);
CREATE INDEX IF NOT EXISTS idx_ai_cost_tracking_project_id ON ai_cost_tracking(project_id);

-- ============================================================================
-- PAYMENT_RECORDS TABLE (Stripe Payment Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Stripe details
  stripe_payment_id TEXT UNIQUE NOT NULL, -- Payment intent ID
  stripe_customer_id TEXT,
  stripe_invoice_id TEXT,

  -- Payment details
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_method TEXT, -- 'card', 'bank_transfer', etc.

  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded', 'canceled')),
  failure_reason TEXT,

  -- Dates
  payment_date TIMESTAMPTZ NOT NULL,
  refund_date TIMESTAMPTZ,

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payment_records
CREATE INDEX IF NOT EXISTS idx_payment_records_org_id ON payment_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_contact_id ON payment_records(contact_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_project_id ON payment_records(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_stripe_payment_id ON payment_records(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON payment_records(payment_date DESC);

-- ============================================================================
-- MATERIALIZED VIEW: CLIENT_BILLING_SUMMARY
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS client_billing_summary AS
SELECT
  c.id as contact_id,
  c.organization_id,
  c.workspace_id,
  c.name as client_name,

  -- Time tracking metrics
  COALESCE(SUM(te.hours) FILTER (WHERE te.billable = true AND te.status = 'approved'), 0) as billable_hours,
  COALESCE(SUM(te.hours) FILTER (WHERE te.billable = false AND te.status = 'approved'), 0) as non_billable_hours,
  COALESCE(SUM(te.hours * te.hourly_rate) FILTER (WHERE te.billable = true AND te.status = 'approved'), 0) as total_billable_amount,

  -- Payment metrics
  COALESCE(SUM(pr.amount) FILTER (WHERE pr.status = 'succeeded'), 0) as total_payments,
  COALESCE(SUM(pr.amount) FILTER (WHERE pr.status = 'refunded'), 0) as total_refunds,

  -- Outstanding balance
  (
    COALESCE(SUM(te.hours * te.hourly_rate) FILTER (WHERE te.billable = true AND te.status = 'approved'), 0) -
    COALESCE(SUM(pr.amount) FILTER (WHERE pr.status = 'succeeded'), 0) +
    COALESCE(SUM(pr.amount) FILTER (WHERE pr.status = 'refunded'), 0)
  ) as outstanding_balance,

  -- Date ranges
  MIN(te.date) as first_billable_date,
  MAX(te.date) as last_billable_date,
  MAX(pr.payment_date) as last_payment_date,

  -- Counts
  COUNT(DISTINCT te.id) FILTER (WHERE te.status = 'approved') as total_entries,
  COUNT(DISTINCT pr.id) FILTER (WHERE pr.status = 'succeeded') as total_payments_count,

  NOW() as last_refreshed

FROM contacts c
LEFT JOIN time_entries te ON te.contact_id = c.id
LEFT JOIN payment_records pr ON pr.contact_id = c.id
GROUP BY c.id, c.organization_id, c.workspace_id, c.name;

-- Indexes for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_billing_summary_contact_id ON client_billing_summary(contact_id);
CREATE INDEX IF NOT EXISTS idx_client_billing_summary_org_id ON client_billing_summary(organization_id);
CREATE INDEX IF NOT EXISTS idx_client_billing_summary_workspace_id ON client_billing_summary(workspace_id);
CREATE INDEX IF NOT EXISTS idx_client_billing_summary_outstanding ON client_billing_summary(outstanding_balance DESC);

-- ============================================================================
-- MATERIALIZED VIEW: PROJECT_PROFITABILITY
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS project_profitability AS
SELECT
  p.id as project_id,
  p.organization_id,
  p.workspace_id,
  p.name as project_name,
  p.contact_id,

  -- Revenue
  COALESCE(SUM(te.hours * te.hourly_rate) FILTER (WHERE te.billable = true AND te.status = 'approved'), 0) as total_revenue,

  -- Costs
  COALESCE(SUM(te.hours * 50) FILTER (WHERE te.status = 'approved'), 0) as labor_cost, -- Assume $50/hr internal cost
  COALESCE(SUM(ai.total_cost), 0) as ai_cost,

  -- Profit
  (
    COALESCE(SUM(te.hours * te.hourly_rate) FILTER (WHERE te.billable = true AND te.status = 'approved'), 0) -
    COALESCE(SUM(te.hours * 50) FILTER (WHERE te.status = 'approved'), 0) -
    COALESCE(SUM(ai.total_cost), 0)
  ) as gross_profit,

  -- Margin
  CASE
    WHEN COALESCE(SUM(te.hours * te.hourly_rate) FILTER (WHERE te.billable = true AND te.status = 'approved'), 0) > 0 THEN
      (
        (COALESCE(SUM(te.hours * te.hourly_rate) FILTER (WHERE te.billable = true AND te.status = 'approved'), 0) -
         COALESCE(SUM(te.hours * 50) FILTER (WHERE te.status = 'approved'), 0) -
         COALESCE(SUM(ai.total_cost), 0)) /
        COALESCE(SUM(te.hours * te.hourly_rate) FILTER (WHERE te.billable = true AND te.status = 'approved'), 0)
      ) * 100
    ELSE 0
  END as profit_margin_percent,

  -- Hours
  COALESCE(SUM(te.hours) FILTER (WHERE te.billable = true AND te.status = 'approved'), 0) as billable_hours,
  COALESCE(SUM(te.hours) FILTER (WHERE te.billable = false AND te.status = 'approved'), 0) as non_billable_hours,

  -- Utilization
  CASE
    WHEN COALESCE(SUM(te.hours) FILTER (WHERE te.status = 'approved'), 0) > 0 THEN
      (COALESCE(SUM(te.hours) FILTER (WHERE te.billable = true AND te.status = 'approved'), 0) /
       COALESCE(SUM(te.hours) FILTER (WHERE te.status = 'approved'), 0)) * 100
    ELSE 0
  END as billable_utilization_percent,

  -- Date ranges
  MIN(te.date) as first_entry_date,
  MAX(te.date) as last_entry_date,

  -- Status
  p.status as project_status,

  NOW() as last_refreshed

FROM projects p
LEFT JOIN time_entries te ON te.project_id = p.id
LEFT JOIN ai_cost_tracking ai ON ai.project_id = p.id
GROUP BY p.id, p.organization_id, p.workspace_id, p.name, p.contact_id, p.status;

-- Indexes for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_profitability_project_id ON project_profitability(project_id);
CREATE INDEX IF NOT EXISTS idx_project_profitability_org_id ON project_profitability(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_profitability_workspace_id ON project_profitability(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_profitability_contact_id ON project_profitability(contact_id);
CREATE INDEX IF NOT EXISTS idx_project_profitability_margin ON project_profitability(profit_margin_percent DESC);
CREATE INDEX IF NOT EXISTS idx_project_profitability_revenue ON project_profitability(total_revenue DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- Financial Transactions Policies
CREATE POLICY "Users can view financial transactions in their organization"
  ON financial_transactions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage financial transactions"
  ON financial_transactions FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- AI Cost Tracking Policies
CREATE POLICY "Users can view AI costs in their organization"
  ON ai_cost_tracking FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert AI cost records"
  ON ai_cost_tracking FOR INSERT
  WITH CHECK (true); -- System service inserts costs

-- Payment Records Policies
CREATE POLICY "Users can view payment records in their organization"
  ON payment_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage payment records"
  ON payment_records FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_records_updated_at
  BEFORE UPDATE ON payment_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_financial_reports()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY client_billing_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY project_profitability;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization financial summary
CREATE OR REPLACE FUNCTION get_organization_financial_summary(
  org_id_param UUID,
  start_date_param TIMESTAMPTZ DEFAULT NULL,
  end_date_param TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_revenue DECIMAL,
  total_costs DECIMAL,
  gross_profit DECIMAL,
  profit_margin DECIMAL,
  total_billable_hours DECIMAL,
  total_payments DECIMAL,
  outstanding_balance DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Revenue
    COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type IN ('time_entry', 'stripe_payment', 'xero_invoice') AND ft.amount > 0), 0) as total_revenue,

    -- Costs
    COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type IN ('ai_cost', 'expense') AND ft.amount < 0), 0) as total_costs,

    -- Gross profit
    (
      COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type IN ('time_entry', 'stripe_payment', 'xero_invoice') AND ft.amount > 0), 0) -
      ABS(COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type IN ('ai_cost', 'expense') AND ft.amount < 0), 0))
    ) as gross_profit,

    -- Profit margin
    CASE
      WHEN COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type IN ('time_entry', 'stripe_payment', 'xero_invoice') AND ft.amount > 0), 0) > 0 THEN
        (
          (COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type IN ('time_entry', 'stripe_payment', 'xero_invoice') AND ft.amount > 0), 0) -
           ABS(COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type IN ('ai_cost', 'expense') AND ft.amount < 0), 0))) /
          COALESCE(SUM(ft.amount) FILTER (WHERE ft.transaction_type IN ('time_entry', 'stripe_payment', 'xero_invoice') AND ft.amount > 0), 0)
        ) * 100
      ELSE 0
    END as profit_margin,

    -- Hours
    COALESCE(SUM(te.hours) FILTER (WHERE te.billable = true AND te.status = 'approved'), 0) as total_billable_hours,

    -- Payments
    COALESCE(SUM(pr.amount) FILTER (WHERE pr.status = 'succeeded'), 0) as total_payments,

    -- Outstanding
    COALESCE(SUM(cbs.outstanding_balance), 0) as outstanding_balance

  FROM financial_transactions ft
  LEFT JOIN time_entries te ON te.organization_id = org_id_param
  LEFT JOIN payment_records pr ON pr.organization_id = org_id_param
  LEFT JOIN client_billing_summary cbs ON cbs.organization_id = org_id_param
  WHERE ft.organization_id = org_id_param
    AND (start_date_param IS NULL OR ft.transaction_date >= start_date_param)
    AND ft.transaction_date <= end_date_param;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate AI cost for a request
CREATE OR REPLACE FUNCTION calculate_ai_cost(
  provider_param TEXT,
  model_param TEXT,
  input_tokens_param INTEGER,
  output_tokens_param INTEGER,
  cache_read_tokens_param INTEGER DEFAULT 0,
  cache_write_tokens_param INTEGER DEFAULT 0
)
RETURNS DECIMAL AS $$
DECLARE
  input_rate DECIMAL;
  output_rate DECIMAL;
  cache_read_rate DECIMAL;
  cache_write_rate DECIMAL;
  total DECIMAL;
BEGIN
  -- Anthropic pricing (per million tokens)
  IF provider_param = 'anthropic' THEN
    CASE model_param
      WHEN 'claude-opus-4-1-20250805' THEN
        input_rate := 15.00;
        output_rate := 75.00;
      WHEN 'claude-sonnet-4-5-20250929' THEN
        input_rate := 3.00;
        output_rate := 15.00;
      WHEN 'claude-haiku-4-5-20251001' THEN
        input_rate := 0.80;
        output_rate := 4.00;
      ELSE
        input_rate := 3.00;
        output_rate := 15.00;
    END CASE;
    cache_read_rate := input_rate * 0.10; -- 90% discount
    cache_write_rate := input_rate * 1.25; -- 25% premium

  -- OpenRouter pricing (average)
  ELSIF provider_param = 'openrouter' THEN
    input_rate := 0.50;
    output_rate := 1.50;
    cache_read_rate := 0;
    cache_write_rate := 0;

  -- Google Gemini pricing
  ELSIF provider_param = 'google' THEN
    input_rate := 1.25;
    output_rate := 5.00;
    cache_read_rate := 0;
    cache_write_rate := 0;

  -- Default
  ELSE
    input_rate := 1.00;
    output_rate := 3.00;
    cache_read_rate := 0;
    cache_write_rate := 0;
  END IF;

  -- Calculate total cost
  total :=
    (input_tokens_param::DECIMAL / 1000000.0) * input_rate +
    (output_tokens_param::DECIMAL / 1000000.0) * output_rate +
    (cache_read_tokens_param::DECIMAL / 1000000.0) * cache_read_rate +
    (cache_write_tokens_param::DECIMAL / 1000000.0) * cache_write_rate;

  RETURN total;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE financial_transactions IS 'All financial events (revenue, costs, payments) for consolidated reporting';
COMMENT ON TABLE ai_cost_tracking IS 'AI API usage costs by provider, model, and operation';
COMMENT ON TABLE payment_records IS 'Stripe payment tracking with status and metadata';

COMMENT ON MATERIALIZED VIEW client_billing_summary IS 'Per-client billing summary with hours, payments, and outstanding balance';
COMMENT ON MATERIALIZED VIEW project_profitability IS 'Per-project P&L with revenue, costs, profit margin, and utilization';

COMMENT ON FUNCTION refresh_financial_reports() IS 'Refresh all financial reporting materialized views';
COMMENT ON FUNCTION get_organization_financial_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Get organization-wide financial summary for date range';
COMMENT ON FUNCTION calculate_ai_cost(TEXT, TEXT, INTEGER, INTEGER, INTEGER, INTEGER) IS 'Calculate AI API cost based on provider, model, and token usage';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this SQL in Supabase SQL Editor
-- After running:
-- 1. Refresh materialized views: SELECT refresh_financial_reports();
-- 2. Verify tables created: SELECT * FROM financial_transactions LIMIT 1;
-- 3. Test functions: SELECT calculate_ai_cost('anthropic', 'claude-sonnet-4-5-20250929', 1000, 500);
