-- Phase 41: Founder Financial Command Center
-- Multi-org Xero integration, unified ledger, forecasting
-- FOUNDER-ONLY ACCESS - No client exposure

-- Founder Financial Accounts (linked to Xero orgs)
CREATE TABLE IF NOT EXISTS founder_financial_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank', 'credit_card', 'asset', 'liability', 'equity', 'revenue', 'expense')),
  xero_org_id TEXT,
  xero_account_id TEXT,
  currency TEXT DEFAULT 'AUD',
  balance NUMERIC DEFAULT 0,
  last_synced_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Founder Financial Transactions (unified ledger)
CREATE TABLE IF NOT EXISTS founder_financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES founder_financial_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  source TEXT NOT NULL CHECK (source IN ('xero', 'bank_feed', 'email_receipt', 'manual')),
  category TEXT,
  vendor TEXT,
  invoice_number TEXT,
  is_reconciled BOOLEAN DEFAULT false,
  is_duplicate BOOLEAN DEFAULT false,
  is_anomaly BOOLEAN DEFAULT false,
  anomaly_reason TEXT,
  xero_transaction_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Founder Financial Forecasts
CREATE TABLE IF NOT EXISTS founder_financial_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL CHECK (period IN ('monthly', 'quarterly', 'annual')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  forecast_type TEXT NOT NULL CHECK (forecast_type IN ('cash_flow', 'revenue', 'expense', 'budget')),
  projection JSONB NOT NULL DEFAULT '{}',
  assumptions JSONB DEFAULT '{}',
  scenario TEXT DEFAULT 'neutral' CHECK (scenario IN ('optimistic', 'neutral', 'conservative')),
  confidence_level NUMERIC CHECK (confidence_level >= 0 AND confidence_level <= 100),
  data_sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Founder Email Receipts (parsed from inbox)
CREATE TABLE IF NOT EXISTS founder_email_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT,
  subject TEXT,
  sender TEXT,
  received_at TIMESTAMPTZ,
  vendor TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'AUD',
  category TEXT,
  invoice_number TEXT,
  due_date DATE,
  extracted_data JSONB DEFAULT '{}',
  attachment_urls TEXT[] DEFAULT '{}',
  is_processed BOOLEAN DEFAULT false,
  transaction_id UUID REFERENCES founder_financial_transactions(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Founder Financial Anomalies
CREATE TABLE IF NOT EXISTS founder_financial_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES founder_financial_transactions(id),
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('duplicate', 'unusual_amount', 'unusual_vendor', 'overdue', 'category_mismatch')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  suggested_action TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_founder_transactions_account ON founder_financial_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_founder_transactions_date ON founder_financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_founder_transactions_source ON founder_financial_transactions(source);
CREATE INDEX IF NOT EXISTS idx_founder_transactions_category ON founder_financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_founder_forecasts_period ON founder_financial_forecasts(period);
CREATE INDEX IF NOT EXISTS idx_founder_forecasts_type ON founder_financial_forecasts(forecast_type);
CREATE INDEX IF NOT EXISTS idx_founder_receipts_vendor ON founder_email_receipts(vendor);
CREATE INDEX IF NOT EXISTS idx_founder_anomalies_type ON founder_financial_anomalies(anomaly_type);

-- NO RLS - Founder-only tables accessed via service role
-- Access controlled at application layer

-- Grant permissions to authenticated (will be restricted at app level)
GRANT ALL ON founder_financial_accounts TO authenticated;
GRANT ALL ON founder_financial_transactions TO authenticated;
GRANT ALL ON founder_financial_forecasts TO authenticated;
GRANT ALL ON founder_email_receipts TO authenticated;
GRANT ALL ON founder_financial_anomalies TO authenticated;
