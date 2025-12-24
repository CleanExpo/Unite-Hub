-- Migration 123: AI Compliance Marketplace
-- Required by Phase 71 - AI Compliance Marketplace (AICM)
-- Compliance document library and marketplace

-- Compliance templates table
CREATE TABLE IF NOT EXISTS compliance_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_template TEXT NOT NULL,
  region_applicability JSONB DEFAULT '[]'::jsonb,
  price_usd NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Category check
  CONSTRAINT compliance_templates_category_check CHECK (
    category IN (
      'swms', 'sop', 'sds', 'ohs', 'privacy_gdpr',
      'insurance', 'contractor', 'manual', 'other'
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_templates_category ON compliance_templates(category);
CREATE INDEX IF NOT EXISTS idx_compliance_templates_title ON compliance_templates(title);
CREATE INDEX IF NOT EXISTS idx_compliance_templates_price ON compliance_templates(price_usd);
CREATE INDEX IF NOT EXISTS idx_compliance_templates_created ON compliance_templates(created_at DESC);

-- Enable RLS
ALTER TABLE compliance_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global read)
CREATE POLICY compliance_templates_select ON compliance_templates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY compliance_templates_insert ON compliance_templates
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE compliance_templates IS 'Compliance document templates (Phase 71)';

-- Compliance purchases table
CREATE TABLE IF NOT EXISTS compliance_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  template_id UUID NOT NULL,
  customized_document_url TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT compliance_purchases_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT compliance_purchases_template_fk
    FOREIGN KEY (template_id) REFERENCES compliance_templates(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_purchases_org ON compliance_purchases(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_purchases_template ON compliance_purchases(template_id);
CREATE INDEX IF NOT EXISTS idx_compliance_purchases_date ON compliance_purchases(purchased_at DESC);

-- Enable RLS
ALTER TABLE compliance_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY compliance_purchases_select ON compliance_purchases
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY compliance_purchases_insert ON compliance_purchases
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE compliance_purchases IS 'Purchased compliance documents (Phase 71)';
