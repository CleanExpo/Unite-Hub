-- Ultra minimal test - subscriptions table only (no workspace_id column)

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'trialing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT 'Success! subscriptions table created' AS result;
