-- Migration 146: Tenant Commercial Plans, Quotas & Engine Licensing
-- Required by Phase 94 - TCPQEL
-- Universal commercial engine for subscription tiers and usage quotas

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS tcpqel_engine_licenses CASCADE;
DROP TABLE IF EXISTS tcpqel_tenant_plans CASCADE;
DROP TABLE IF EXISTS tcpqel_plans CASCADE;

-- TCPQEL plans table
CREATE TABLE tcpqel_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_name TEXT NOT NULL UNIQUE,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  included_engines JSONB DEFAULT '[]'::jsonb,
  usage_limits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT tcpqel_plans_price_check CHECK (price_monthly >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tcpqel_plans_name ON tcpqel_plans(plan_name);

-- Enable RLS
ALTER TABLE tcpqel_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for all authenticated users)
CREATE POLICY tcpqel_plans_select ON tcpqel_plans
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

-- Comment
COMMENT ON TABLE tcpqel_plans IS 'Subscription tiers and included engines (Phase 94)';

-- TCPQEL tenant plans table
CREATE TABLE tcpqel_tenant_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  active BOOLEAN DEFAULT true,
  quota_usage JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT tcpqel_tenant_plans_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT tcpqel_tenant_plans_plan_fk
    FOREIGN KEY (plan_id) REFERENCES tcpqel_plans(id) ON DELETE RESTRICT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tcpqel_tenant_plans_tenant ON tcpqel_tenant_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tcpqel_tenant_plans_plan ON tcpqel_tenant_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_tcpqel_tenant_plans_active ON tcpqel_tenant_plans(active);

-- Enable RLS
ALTER TABLE tcpqel_tenant_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tcpqel_tenant_plans_select ON tcpqel_tenant_plans
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY tcpqel_tenant_plans_insert ON tcpqel_tenant_plans
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY tcpqel_tenant_plans_update ON tcpqel_tenant_plans
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE tcpqel_tenant_plans IS 'Tenant to plan mappings with quota usage (Phase 94)';

-- TCPQEL engine licenses table
CREATE TABLE tcpqel_engine_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  engine_name TEXT NOT NULL,
  licensed BOOLEAN DEFAULT true,
  quota JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique license per tenant/engine
  CONSTRAINT tcpqel_engine_licenses_unique UNIQUE (tenant_id, engine_name),

  -- Foreign keys
  CONSTRAINT tcpqel_engine_licenses_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tcpqel_engine_licenses_tenant ON tcpqel_engine_licenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tcpqel_engine_licenses_engine ON tcpqel_engine_licenses(engine_name);
CREATE INDEX IF NOT EXISTS idx_tcpqel_engine_licenses_licensed ON tcpqel_engine_licenses(licensed);

-- Enable RLS
ALTER TABLE tcpqel_engine_licenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tcpqel_engine_licenses_select ON tcpqel_engine_licenses
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY tcpqel_engine_licenses_insert ON tcpqel_engine_licenses
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY tcpqel_engine_licenses_update ON tcpqel_engine_licenses
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE tcpqel_engine_licenses IS 'Per-engine licensing beyond base plans (Phase 94)';

-- Insert default plans
INSERT INTO tcpqel_plans (plan_name, price_monthly, included_engines, usage_limits) VALUES
('free', 0, '["maos", "mcse"]'::jsonb, '{"maos": 100, "mcse": 50}'::jsonb),
('starter', 49, '["maos", "mcse", "asrs", "upewe"]'::jsonb, '{"maos": 1000, "mcse": 500, "asrs": 500, "upewe": 200}'::jsonb),
('professional', 199, '["maos", "mcse", "asrs", "upewe", "aire", "sorie", "gslpie"]'::jsonb, '{"maos": 10000, "mcse": 5000, "asrs": 5000, "upewe": 2000, "aire": 500, "sorie": 200, "gslpie": 5000}'::jsonb),
('enterprise', 999, '["all"]'::jsonb, '{"maos": 100000, "mcse": 50000, "asrs": 50000, "upewe": 20000, "aire": 5000, "sorie": 2000, "gslpie": 50000, "aglbase": 10000}'::jsonb);
