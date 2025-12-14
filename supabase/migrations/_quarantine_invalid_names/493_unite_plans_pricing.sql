-- =====================================================================
-- Phase D65: Plans, Pricing & Quota Enforcement
-- =====================================================================
-- Tables: unite_plans, unite_plan_features, unite_tenant_subscriptions, unite_quota_snapshots
-- Enables multi-tier pricing, feature gating, and usage-based quota enforcement
--
-- Migration: 493

DROP TABLE IF EXISTS unite_quota_snapshots CASCADE;
DROP TABLE IF EXISTS unite_tenant_subscriptions CASCADE;
DROP TABLE IF EXISTS unite_plan_features CASCADE;
DROP TABLE IF EXISTS unite_plans CASCADE;

-- Plans - pricing tiers
CREATE TABLE unite_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'saas',
  billing_interval text NOT NULL DEFAULT 'monthly',
  currency text NOT NULL DEFAULT 'AUD',
  base_price numeric(18,6) NOT NULL,
  metadata jsonb,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Plan Features - limits and capabilities per plan
CREATE TABLE unite_plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES unite_plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  name text NOT NULL,
  description text,
  limit_value numeric(18,4),
  limit_unit text,
  soft_limit boolean DEFAULT false,
  overage_rate numeric(18,6),
  metadata jsonb
);

-- Tenant Subscriptions - active plan assignments
CREATE TABLE unite_tenant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES unite_plans(id),
  external_customer_id text,
  external_subscription_id text,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  renews_at timestamptz,
  cancels_at timestamptz,
  trial_ends_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quota Snapshots - usage vs limits tracking
CREATE TABLE unite_quota_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  feature_key text NOT NULL,
  used_value numeric(18,4) NOT NULL DEFAULT 0,
  limit_value numeric(18,4),
  limit_unit text,
  overage_value numeric(18,4) DEFAULT 0,
  overage_cost numeric(18,6) DEFAULT 0,
  status text NOT NULL DEFAULT 'ok',
  metadata jsonb,
  computed_at timestamptz DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_unite_plans_slug ON unite_plans(slug);
CREATE INDEX idx_unite_plans_category_active ON unite_plans(category, is_active);
CREATE INDEX idx_unite_plan_features_plan_feature ON unite_plan_features(plan_id, feature_key);
CREATE UNIQUE INDEX idx_unite_tenant_subscriptions_active ON unite_tenant_subscriptions(tenant_id) WHERE status = 'active';
CREATE INDEX idx_unite_quota_snapshots_tenant_period ON unite_quota_snapshots(tenant_id, period_start DESC);
CREATE INDEX idx_unite_quota_snapshots_tenant_feature_period ON unite_quota_snapshots(tenant_id, feature_key, period_start DESC);

-- RLS Policies
ALTER TABLE unite_tenant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_quota_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON unite_tenant_subscriptions
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON unite_quota_snapshots
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Helper Functions
CREATE OR REPLACE FUNCTION unite_get_plan_summary(p_tenant_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_summary jsonb;
  v_plan_name text;
  v_active_features integer;
  v_quota_warnings integer;
BEGIN
  -- Get active plan name
  SELECT p.name INTO v_plan_name
  FROM unite_tenant_subscriptions ts
  JOIN unite_plans p ON p.id = ts.plan_id
  WHERE ts.tenant_id = p_tenant_id
    AND ts.status = 'active'
  LIMIT 1;

  -- Count active features
  SELECT COUNT(*) INTO v_active_features
  FROM unite_plan_features pf
  JOIN unite_tenant_subscriptions ts ON ts.plan_id = pf.plan_id
  WHERE ts.tenant_id = p_tenant_id
    AND ts.status = 'active';

  -- Count quota warnings
  SELECT COUNT(*) INTO v_quota_warnings
  FROM unite_quota_snapshots
  WHERE tenant_id = p_tenant_id
    AND status IN ('warning', 'exceeded')
    AND period_start >= CURRENT_DATE - 30;

  SELECT jsonb_build_object(
    'plan_name', COALESCE(v_plan_name, 'No active plan'),
    'active_features', COALESCE(v_active_features, 0),
    'quota_warnings', COALESCE(v_quota_warnings, 0)
  ) INTO v_summary;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql;
