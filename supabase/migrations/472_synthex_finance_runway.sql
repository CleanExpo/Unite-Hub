/**
 * Synthex Finance Runway Migration
 *
 * Phase: D43 - Capital & Runway Dashboard (Founder Finance Brain)
 *
 * Tables:
 * - synthex_fin_accounts: Bank accounts, credit lines, investment accounts
 * - synthex_fin_events: Income/expense transactions
 * - synthex_fin_runway_snapshots: Point-in-time runway calculations
 *
 * Prefix: synthex_fin_*
 */

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Account types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_fin_account_type') THEN
    CREATE TYPE synthex_fin_account_type AS ENUM (
      'bank_checking',
      'bank_savings',
      'credit_line',
      'investment',
      'receivables',
      'payables',
      'cash',
      'other'
    );
  END IF;
END $$;

-- Event types (income/expense categories)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_fin_event_type') THEN
    CREATE TYPE synthex_fin_event_type AS ENUM (
      'revenue',
      'refund',
      'investment',
      'loan',
      'grant',
      'payroll',
      'contractor',
      'software',
      'infrastructure',
      'marketing',
      'legal',
      'rent',
      'tax',
      'transfer',
      'other_income',
      'other_expense'
    );
  END IF;
END $$;

-- Transaction direction
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_fin_direction') THEN
    CREATE TYPE synthex_fin_direction AS ENUM (
      'inflow',
      'outflow'
    );
  END IF;
END $$;

-- Currency codes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_fin_currency') THEN
    CREATE TYPE synthex_fin_currency AS ENUM (
      'AUD',
      'USD',
      'EUR',
      'GBP',
      'NZD',
      'CAD',
      'SGD'
    );
  END IF;
END $$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- Financial Accounts
CREATE TABLE IF NOT EXISTS synthex_fin_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  account_name text NOT NULL,
  account_type synthex_fin_account_type NOT NULL DEFAULT 'bank_checking',
  currency synthex_fin_currency NOT NULL DEFAULT 'AUD',

  institution_name text,
  account_number_last4 text,

  opening_balance numeric(14,2) DEFAULT 0,
  current_balance numeric(14,2) DEFAULT 0,
  available_credit numeric(14,2), -- For credit lines

  is_active boolean DEFAULT true,
  is_primary boolean DEFAULT false,

  sync_enabled boolean DEFAULT false,
  last_sync_at timestamptz,

  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Financial Events (Transactions)
CREATE TABLE IF NOT EXISTS synthex_fin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES synthex_fin_accounts(id) ON DELETE CASCADE,

  event_date date NOT NULL,
  event_type synthex_fin_event_type NOT NULL DEFAULT 'other_expense',
  direction synthex_fin_direction NOT NULL DEFAULT 'outflow',

  amount numeric(14,2) NOT NULL,
  currency synthex_fin_currency NOT NULL DEFAULT 'AUD',
  exchange_rate numeric(12,6) DEFAULT 1.0,
  amount_base numeric(14,2), -- Amount in tenant's base currency

  category text,
  subcategory text,
  description text,
  reference text, -- Invoice number, check number, etc.

  counterparty_name text,
  counterparty_id uuid, -- Link to contacts/vendors if applicable

  is_recurring boolean DEFAULT false,
  recurring_frequency text, -- 'weekly', 'monthly', 'quarterly', 'yearly'

  is_verified boolean DEFAULT false,
  verified_by uuid,
  verified_at timestamptz,

  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Runway Snapshots (Point-in-time calculations)
CREATE TABLE IF NOT EXISTS synthex_fin_runway_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  snapshot_date date NOT NULL,

  -- Current state
  total_cash numeric(14,2) NOT NULL DEFAULT 0,
  total_receivables numeric(14,2) DEFAULT 0,
  total_payables numeric(14,2) DEFAULT 0,
  net_position numeric(14,2) GENERATED ALWAYS AS (total_cash + total_receivables - total_payables) STORED,

  -- Burn calculations
  monthly_burn numeric(14,2) NOT NULL DEFAULT 0,
  monthly_revenue numeric(14,2) DEFAULT 0,
  net_burn numeric(14,2) GENERATED ALWAYS AS (monthly_burn - monthly_revenue) STORED,

  -- Runway
  runway_months numeric(6,2),
  runway_date date, -- Projected zero cash date

  -- Scenario inputs used
  revenue_growth_rate numeric(6,4) DEFAULT 0,
  expense_growth_rate numeric(6,4) DEFAULT 0,
  scenario_type text DEFAULT 'conservative', -- 'conservative', 'moderate', 'optimistic'
  scenario_inputs jsonb DEFAULT '{}',

  -- AI analysis
  ai_summary jsonb DEFAULT '{}',
  risk_flags jsonb DEFAULT '[]',
  recommendations jsonb DEFAULT '[]',

  created_by uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Budget Categories
CREATE TABLE IF NOT EXISTS synthex_fin_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  budget_name text NOT NULL,
  budget_period text NOT NULL DEFAULT 'monthly', -- 'monthly', 'quarterly', 'yearly'
  period_start date NOT NULL,
  period_end date NOT NULL,

  category text NOT NULL,
  budgeted_amount numeric(14,2) NOT NULL,
  actual_amount numeric(14,2) DEFAULT 0,
  variance numeric(14,2) GENERATED ALWAYS AS (budgeted_amount - actual_amount) STORED,
  variance_percent numeric(6,2),

  is_active boolean DEFAULT true,

  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cash Flow Forecasts
CREATE TABLE IF NOT EXISTS synthex_fin_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid REFERENCES synthex_br_businesses(id) ON DELETE CASCADE,

  forecast_name text NOT NULL,
  forecast_type text NOT NULL DEFAULT '13_week', -- '13_week', '12_month', 'custom'

  start_date date NOT NULL,
  end_date date NOT NULL,

  periods jsonb NOT NULL DEFAULT '[]', -- Array of { period, inflows, outflows, net, balance }

  assumptions jsonb DEFAULT '{}',
  ai_adjustments jsonb DEFAULT '{}',

  is_baseline boolean DEFAULT false,

  created_by uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_synthex_fin_accounts_tenant_business
  ON synthex_fin_accounts (tenant_id, business_id);

CREATE INDEX IF NOT EXISTS idx_synthex_fin_events_tenant_business_date
  ON synthex_fin_events (tenant_id, business_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_fin_events_account
  ON synthex_fin_events (account_id, event_date DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_fin_events_type
  ON synthex_fin_events (tenant_id, event_type, direction);

CREATE INDEX IF NOT EXISTS idx_synthex_fin_runway_snapshots_tenant_business_date
  ON synthex_fin_runway_snapshots (tenant_id, business_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_fin_budgets_tenant_business_period
  ON synthex_fin_budgets (tenant_id, business_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_synthex_fin_forecasts_tenant_business
  ON synthex_fin_forecasts (tenant_id, business_id, start_date);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE synthex_fin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_fin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_fin_runway_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_fin_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_fin_forecasts ENABLE ROW LEVEL SECURITY;

-- Accounts policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_fin_accounts_tenant_isolation') THEN
    CREATE POLICY synthex_fin_accounts_tenant_isolation ON synthex_fin_accounts
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Events policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_fin_events_tenant_isolation') THEN
    CREATE POLICY synthex_fin_events_tenant_isolation ON synthex_fin_events
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Runway snapshots policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_fin_runway_snapshots_tenant_isolation') THEN
    CREATE POLICY synthex_fin_runway_snapshots_tenant_isolation ON synthex_fin_runway_snapshots
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Budgets policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_fin_budgets_tenant_isolation') THEN
    CREATE POLICY synthex_fin_budgets_tenant_isolation ON synthex_fin_budgets
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- Forecasts policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'synthex_fin_forecasts_tenant_isolation') THEN
    CREATE POLICY synthex_fin_forecasts_tenant_isolation ON synthex_fin_forecasts
      FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
  END IF;
END $$;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Calculate runway from current state
CREATE OR REPLACE FUNCTION synthex_fin_calculate_runway(
  p_total_cash numeric,
  p_monthly_burn numeric,
  p_monthly_revenue numeric DEFAULT 0
) RETURNS numeric AS $$
DECLARE
  net_burn numeric;
BEGIN
  net_burn := p_monthly_burn - p_monthly_revenue;

  IF net_burn <= 0 THEN
    -- Cash flow positive or break-even
    RETURN 999; -- Infinite runway indicator
  END IF;

  RETURN ROUND(p_total_cash / net_burn, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get account balance at a specific date
CREATE OR REPLACE FUNCTION synthex_fin_get_balance_at_date(
  p_account_id uuid,
  p_date date
) RETURNS numeric AS $$
DECLARE
  v_opening_balance numeric;
  v_net_change numeric;
BEGIN
  -- Get opening balance
  SELECT opening_balance INTO v_opening_balance
  FROM synthex_fin_accounts
  WHERE id = p_account_id;

  -- Calculate net change up to date
  SELECT COALESCE(SUM(
    CASE
      WHEN direction = 'inflow' THEN amount
      WHEN direction = 'outflow' THEN -amount
      ELSE 0
    END
  ), 0) INTO v_net_change
  FROM synthex_fin_events
  WHERE account_id = p_account_id
    AND event_date <= p_date;

  RETURN COALESCE(v_opening_balance, 0) + v_net_change;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update account balance on event changes
CREATE OR REPLACE FUNCTION synthex_fin_update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate current balance
  UPDATE synthex_fin_accounts
  SET current_balance = synthex_fin_get_balance_at_date(NEW.account_id, CURRENT_DATE),
      updated_at = now()
  WHERE id = NEW.account_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_fin_events_update_balance ON synthex_fin_events;
CREATE TRIGGER trg_synthex_fin_events_update_balance
  AFTER INSERT OR UPDATE OR DELETE ON synthex_fin_events
  FOR EACH ROW
  EXECUTE FUNCTION synthex_fin_update_account_balance();

-- Updated_at trigger for accounts
CREATE OR REPLACE FUNCTION synthex_fin_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_fin_accounts_updated_at ON synthex_fin_accounts;
CREATE TRIGGER trg_synthex_fin_accounts_updated_at
  BEFORE UPDATE ON synthex_fin_accounts
  FOR EACH ROW
  EXECUTE FUNCTION synthex_fin_accounts_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE synthex_fin_accounts IS 'Financial accounts for capital tracking (D43)';
COMMENT ON TABLE synthex_fin_events IS 'Financial transactions/events (D43)';
COMMENT ON TABLE synthex_fin_runway_snapshots IS 'Point-in-time runway calculations (D43)';
COMMENT ON TABLE synthex_fin_budgets IS 'Budget categories and tracking (D43)';
COMMENT ON TABLE synthex_fin_forecasts IS 'Cash flow forecasts (D43)';
