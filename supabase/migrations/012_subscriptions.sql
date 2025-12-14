-- Migration 012: Subscriptions Table
-- Created: 2025-11-16
-- Purpose: Support Stripe subscription management for organizations

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe data
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  stripe_product_id TEXT,

  -- Subscription details
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise')) DEFAULT 'starter',
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')) DEFAULT 'trialing',

  -- Billing periods
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,

  -- Cancellation
  cancel_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Pricing
  amount NUMERIC(10, 2),  -- Amount in dollars
  currency TEXT DEFAULT 'usd',
  interval TEXT CHECK (interval IN ('month', 'year')) DEFAULT 'month',

  -- Usage tracking
  seats INTEGER DEFAULT 1,
  usage_limits JSONB DEFAULT '{}',  -- Store plan-specific limits

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create invoices table for Stripe invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe data
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,

  -- Invoice details
  number TEXT,  -- Invoice number from Stripe
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),

  -- Amounts
  amount_due NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  amount_remaining NUMERIC(10, 2) DEFAULT 0,
  subtotal NUMERIC(10, 2),
  total NUMERIC(10, 2),
  tax NUMERIC(10, 2),
  currency TEXT DEFAULT 'usd',

  -- Dates
  invoice_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Links
  invoice_pdf TEXT,  -- URL to PDF
  hosted_invoice_url TEXT,  -- Stripe hosted page

  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe data
  stripe_payment_method_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,

  -- Payment method details
  type TEXT NOT NULL CHECK (type IN ('card', 'bank_account', 'paypal')),

  -- Card details (if type = 'card')
  card_brand TEXT,  -- visa, mastercard, amex, etc.
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  card_fingerprint TEXT,

  -- Bank account details (if type = 'bank_account')
  bank_name TEXT,
  bank_last4 TEXT,

  -- Status
  is_default BOOLEAN DEFAULT false,

  -- Billing details
  billing_email TEXT,
  billing_name TEXT,
  billing_address JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);
-- Indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_invoice_id ON invoices(stripe_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoice_date DESC);
-- Indexes for payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_org_id ON payment_methods(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);
-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
-- RLS Policies for subscriptions
DROP POLICY IF EXISTS "Users can view subscriptions" ON subscriptions;
CREATE POLICY "Users can view subscriptions" ON subscriptions
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (true);
-- RLS Policies for invoices
DROP POLICY IF EXISTS "Users can view invoices" ON invoices;
CREATE POLICY "Users can view invoices" ON invoices
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage invoices" ON invoices;
CREATE POLICY "Service role can manage invoices" ON invoices
  FOR ALL USING (true);
-- RLS Policies for payment_methods
DROP POLICY IF EXISTS "Users can view payment methods" ON payment_methods;
CREATE POLICY "Users can view payment methods" ON payment_methods
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage payment methods" ON payment_methods;
CREATE POLICY "Service role can manage payment methods" ON payment_methods
  FOR ALL USING (true);
-- Comments
COMMENT ON TABLE subscriptions IS 'Stripe subscription data for organizations';
COMMENT ON TABLE invoices IS 'Stripe invoice records for billing history';
COMMENT ON TABLE payment_methods IS 'Payment methods attached to organizations';
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID (also stored in organizations table)';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at end of current period';
COMMENT ON COLUMN subscriptions.usage_limits IS 'Plan-specific limits: emails_per_month, contacts, images, etc.';
