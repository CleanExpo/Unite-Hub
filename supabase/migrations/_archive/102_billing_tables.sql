-- Phase 31: Stripe Live Billing Activation
-- Create billing tables for subscriptions, payments, usage, and events

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  price_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('test', 'live')),
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mode ON subscriptions(mode);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'aud',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending')),
  mode TEXT NOT NULL CHECK (mode IN ('test', 'live')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_mode ON payments(mode);

-- Usage records table
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('ai_tokens', 'audits')),
  quantity INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for usage records
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_workspace_id ON usage_records(workspace_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_type ON usage_records(usage_type);
CREATE INDEX IF NOT EXISTS idx_usage_records_created_at ON usage_records(created_at);

-- Billing events table (webhook events)
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('test', 'live')),
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for billing events
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_mode ON billing_events(mode);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at);

-- Notifications table (for billing alerts)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Add Stripe customer ID columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id_test TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id_live TEXT;

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "users_view_own_subscriptions" ON subscriptions
FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() = user_id);

-- RLS policies for payments
CREATE POLICY "users_view_own_payments" ON payments
FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() = user_id);

-- RLS policies for usage records
CREATE POLICY "users_view_own_usage" ON usage_records
FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() = user_id);

-- RLS policies for notifications
CREATE POLICY "users_view_own_notifications" ON notifications
FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() = user_id);

CREATE POLICY "users_update_own_notifications" ON notifications
FOR UPDATE USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() = user_id);

-- Service role can insert/update all tables
CREATE POLICY "service_role_all_subscriptions" ON subscriptions
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_all_payments" ON payments
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_all_usage" ON usage_records
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_all_events" ON billing_events
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_all_notifications" ON notifications
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON usage_records TO authenticated;
GRANT ALL ON billing_events TO authenticated;
GRANT ALL ON notifications TO authenticated;
