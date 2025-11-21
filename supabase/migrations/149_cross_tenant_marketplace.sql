-- Migration 149: Cross-Tenant Marketplace & Engine Distribution Portal
-- Required by Phase 97 - CTMEDP
-- Marketplace for engines, add-ons, and compliance packs

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS ctmedp_purchases CASCADE;
DROP TABLE IF EXISTS ctmedp_products CASCADE;

-- CTMEDP products table
CREATE TABLE ctmedp_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Product type check
  CONSTRAINT ctmedp_products_type_check CHECK (
    product_type IN ('engine', 'region', 'addon', 'compliance_pack', 'quota_expansion')
  ),

  CONSTRAINT ctmedp_products_price_check CHECK (price >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ctmedp_products_type ON ctmedp_products(product_type);
CREATE INDEX IF NOT EXISTS idx_ctmedp_products_active ON ctmedp_products(active);

-- Enable RLS
ALTER TABLE ctmedp_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for all authenticated)
CREATE POLICY ctmedp_products_select ON ctmedp_products
  FOR SELECT TO authenticated
  USING (active = true);

-- Comment
COMMENT ON TABLE ctmedp_products IS 'Marketplace products catalog (Phase 97)';

-- CTMEDP purchases table
CREATE TABLE ctmedp_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provisioned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT ctmedp_purchases_status_check CHECK (
    status IN ('pending', 'completed', 'failed', 'refunded')
  ),

  -- Foreign keys
  CONSTRAINT ctmedp_purchases_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT ctmedp_purchases_product_fk
    FOREIGN KEY (product_id) REFERENCES ctmedp_products(id) ON DELETE RESTRICT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ctmedp_purchases_tenant ON ctmedp_purchases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ctmedp_purchases_product ON ctmedp_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_ctmedp_purchases_status ON ctmedp_purchases(status);

-- Enable RLS
ALTER TABLE ctmedp_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ctmedp_purchases_select ON ctmedp_purchases
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY ctmedp_purchases_insert ON ctmedp_purchases
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE ctmedp_purchases IS 'Tenant marketplace purchases (Phase 97)';

-- Insert sample products
INSERT INTO ctmedp_products (product_name, product_type, price, description, metadata) VALUES
('AIRE Engine', 'engine', 99, 'Autonomous Incident Response', '{"engine": "aire"}'::jsonb),
('SORIE Engine', 'engine', 149, 'Strategic Objective & Roadmap Intelligence', '{"engine": "sorie"}'::jsonb),
('EU Region', 'region', 49, 'European Union region capacity', '{"region": "eu"}'::jsonb),
('APAC Region', 'region', 49, 'Asia Pacific region capacity', '{"region": "apac"}'::jsonb),
('GDPR Compliance Pack', 'compliance_pack', 199, 'Full GDPR compliance suite', '{"frameworks": ["gdpr"]}'::jsonb),
('HIPAA Compliance Pack', 'compliance_pack', 299, 'Healthcare compliance suite', '{"frameworks": ["hipaa"]}'::jsonb),
('10K Quota Expansion', 'quota_expansion', 29, '10,000 additional operations', '{"amount": 10000}'::jsonb);
