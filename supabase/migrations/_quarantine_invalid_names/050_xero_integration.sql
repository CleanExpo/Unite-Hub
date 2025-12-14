-- Migration 050: Xero Integration for Real Financial Operations
-- Purpose: Track real operational costs and sync with Xero accounting
-- Created: 2025-11-19

-- Store Xero OAuth tokens per organization
CREATE TABLE IF NOT EXISTS xero_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL, -- Unix timestamp
  id_token TEXT,
  scope TEXT,
  tenant_id TEXT, -- Xero organization ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Track real-time operational expenses (API costs, hosting, etc.)
CREATE TABLE IF NOT EXISTS operational_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID REFERENCES contacts(id), -- Which client caused this expense (NULL for platform-wide costs)
  expense_type TEXT NOT NULL CHECK (expense_type IN (
    'anthropic',
    'openrouter',
    'perplexity',
    'vercel',
    'sendgrid',
    'resend',
    'supabase',
    'other'
  )),
  description TEXT,
  amount DECIMAL(10,4) NOT NULL, -- In USD
  tokens_used INT, -- For AI API calls
  api_endpoint TEXT, -- Which API was called
  request_id TEXT, -- For tracking/debugging
  metadata JSONB, -- Additional data (model used, response time, etc.)
  xero_bill_id TEXT, -- Link to Xero bill (once synced)
  synced_to_xero BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track client invoices (synced with Xero)
CREATE TABLE IF NOT EXISTS client_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  xero_invoice_id TEXT UNIQUE, -- Xero invoice ID
  invoice_number TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'draft',
    'submitted',
    'authorised',
    'paid',
    'voided'
  )),
  due_date DATE,
  paid_date DATE,
  stripe_payment_intent_id TEXT, -- Link to Stripe payment
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'growth', 'premium')),
  add_ons JSONB, -- Array of add-on services
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track client profitability (materialized view for performance)
-- Refreshed daily via cron job
CREATE MATERIALIZED VIEW IF NOT EXISTS client_profitability_mv AS
SELECT
  ci.client_id,
  c.name AS client_name,
  c.email AS client_email,
  c.company AS client_company,
  ci.tier,
  ci.amount AS monthly_revenue,
  COALESCE(SUM(oe.amount), 0) AS monthly_costs,
  ci.amount - COALESCE(SUM(oe.amount), 0) AS monthly_profit,
  CASE
    WHEN ci.amount > 0 THEN
      ((ci.amount - COALESCE(SUM(oe.amount), 0)) / ci.amount * 100)
    ELSE 0
  END AS profit_margin_percentage,
  COUNT(oe.id) AS total_api_calls,
  ci.created_at AS invoice_date
FROM client_invoices ci
LEFT JOIN contacts c ON ci.client_id = c.id
LEFT JOIN operational_expenses oe ON oe.client_id = ci.client_id
  AND DATE_TRUNC('month', oe.created_at) = DATE_TRUNC('month', ci.created_at)
WHERE ci.status IN ('authorised', 'paid')
GROUP BY ci.client_id, c.name, c.email, c.company, ci.tier, ci.amount, ci.created_at;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_profitability_mv_client_invoice
  ON client_profitability_mv(client_id, invoice_date);

-- Also create a real-time view (not materialized) for instant queries
CREATE OR REPLACE VIEW client_profitability AS
SELECT
  ci.client_id,
  c.name AS client_name,
  c.email AS client_email,
  c.company AS client_company,
  ci.tier,
  ci.amount AS monthly_revenue,
  COALESCE(SUM(oe.amount), 0) AS monthly_costs,
  ci.amount - COALESCE(SUM(oe.amount), 0) AS monthly_profit,
  CASE
    WHEN ci.amount > 0 THEN
      ((ci.amount - COALESCE(SUM(oe.amount), 0)) / ci.amount * 100)
    ELSE 0
  END AS profit_margin_percentage,
  COUNT(oe.id) AS total_api_calls,
  ci.created_at AS invoice_date
FROM client_invoices ci
LEFT JOIN contacts c ON ci.client_id = c.id
LEFT JOIN operational_expenses oe ON oe.client_id = ci.client_id
  AND DATE_TRUNC('month', oe.created_at) = DATE_TRUNC('month', ci.created_at)
WHERE ci.status IN ('authorised', 'paid')
GROUP BY ci.client_id, c.name, c.email, c.company, ci.tier, ci.amount, ci.created_at;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_xero_tokens_org ON xero_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_operational_expenses_client ON operational_expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_operational_expenses_type ON operational_expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_operational_expenses_created ON operational_expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_operational_expenses_synced ON operational_expenses(synced_to_xero) WHERE synced_to_xero = FALSE;
CREATE INDEX IF NOT EXISTS idx_client_invoices_xero_id ON client_invoices(xero_invoice_id);
CREATE INDEX IF NOT EXISTS idx_client_invoices_client ON client_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_client_invoices_status ON client_invoices(status);
CREATE INDEX IF NOT EXISTS idx_client_invoices_org_workspace ON client_invoices(organization_id, workspace_id);

-- RLS Policies
ALTER TABLE xero_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;

-- Xero tokens: Only allow authenticated users to access their own org data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'xero_tokens'
    AND policyname = 'Users can view their org''s Xero tokens'
  ) THEN
    CREATE POLICY "Users can view their org's Xero tokens"
      ON xero_tokens FOR SELECT
      USING (organization_id IN (
        SELECT w.org_id FROM workspaces w
        JOIN user_organizations uo ON CAST(uo.org_id AS UUID) = w.org_id
        WHERE uo.user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'xero_tokens'
    AND policyname = 'Users can update their org''s Xero tokens'
  ) THEN
    CREATE POLICY "Users can update their org's Xero tokens"
      ON xero_tokens FOR UPDATE
      USING (organization_id IN (
        SELECT w.org_id FROM workspaces w
        JOIN user_organizations uo ON CAST(uo.org_id AS UUID) = w.org_id
        WHERE uo.user_id = auth.uid()
      ));
  END IF;
END $$;

-- Operational expenses: Users can view their org's expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'operational_expenses'
    AND policyname = 'Users can view their org''s expenses'
  ) THEN
    CREATE POLICY "Users can view their org's expenses"
      ON operational_expenses FOR SELECT
      USING (organization_id IN (
        SELECT w.org_id FROM workspaces w
        JOIN user_organizations uo ON CAST(uo.org_id AS UUID) = w.org_id
        WHERE uo.user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'operational_expenses'
    AND policyname = 'System can insert expenses'
  ) THEN
    CREATE POLICY "System can insert expenses"
      ON operational_expenses FOR INSERT
      WITH CHECK (true); -- Service role can insert
  END IF;
END $$;

-- Client invoices: Users can view their org's invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_invoices'
    AND policyname = 'Users can view their org''s invoices'
  ) THEN
    CREATE POLICY "Users can view their org's invoices"
      ON client_invoices FOR SELECT
      USING (organization_id IN (
        SELECT w.org_id FROM workspaces w
        JOIN user_organizations uo ON CAST(uo.org_id AS UUID) = w.org_id
        WHERE uo.user_id = auth.uid()
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_invoices'
    AND policyname = 'System can manage invoices'
  ) THEN
    CREATE POLICY "System can manage invoices"
      ON client_invoices FOR ALL
      USING (true)
      WITH CHECK (true); -- Service role can manage
  END IF;
END $$;

-- Function to refresh materialized view (called by cron or manually)
CREATE OR REPLACE FUNCTION refresh_client_profitability_mv()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY client_profitability_mv;
END;
$$;

-- Trigger to auto-update updated_at on xero_tokens
DROP TRIGGER IF EXISTS update_xero_tokens_updated_at ON xero_tokens;
CREATE TRIGGER update_xero_tokens_updated_at
  BEFORE UPDATE ON xero_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on client_invoices
DROP TRIGGER IF EXISTS update_client_invoices_updated_at ON client_invoices;
CREATE TRIGGER update_client_invoices_updated_at
  BEFORE UPDATE ON client_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
GRANT SELECT ON xero_tokens TO authenticated;
GRANT SELECT, UPDATE ON xero_tokens TO authenticated;
GRANT SELECT ON operational_expenses TO authenticated;
GRANT SELECT ON client_invoices TO authenticated;
GRANT SELECT ON client_profitability TO authenticated;
GRANT SELECT ON client_profitability_mv TO authenticated;

-- Grant service role full access
GRANT ALL ON xero_tokens TO service_role;
GRANT ALL ON operational_expenses TO service_role;
GRANT ALL ON client_invoices TO service_role;

-- Comments for documentation
COMMENT ON TABLE xero_tokens IS 'Stores Xero OAuth 2.0 tokens per organization for accounting integration';
COMMENT ON TABLE operational_expenses IS 'Tracks real-time operational costs (API usage, hosting, etc.) for accurate profitability calculation';
COMMENT ON TABLE client_invoices IS 'Client invoices synced with Xero for revenue tracking';
COMMENT ON VIEW client_profitability IS 'Real-time view of client profitability (revenue - costs = profit)';
COMMENT ON MATERIALIZED VIEW client_profitability_mv IS 'Materialized view of client profitability for better performance (refreshed daily)';
COMMENT ON FUNCTION refresh_client_profitability_mv() IS 'Refreshes the client_profitability materialized view (call daily via cron)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 050: Xero Integration completed successfully';
  RAISE NOTICE '📊 Created tables: xero_tokens, operational_expenses, client_invoices';
  RAISE NOTICE '📈 Created views: client_profitability (real-time), client_profitability_mv (materialized)';
  RAISE NOTICE '🔒 RLS policies enabled on all tables';
  RAISE NOTICE '⚡ Next steps: Configure Xero OAuth in .env and implement XeroService client';
END $$;
