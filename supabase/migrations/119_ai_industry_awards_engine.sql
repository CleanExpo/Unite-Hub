-- Migration 119: AI Industry Awards Engine
-- Required by Phase 67 - AI Industry Awards Engine (AIAE)
-- Auto-generated awards and certificates

-- Award badges table
CREATE TABLE IF NOT EXISTS award_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  brand_id UUID,
  badge_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  criteria_met JSONB DEFAULT '{}'::jsonb,
  score NUMERIC NOT NULL DEFAULT 0,
  certificate_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT award_badges_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT award_badges_brand_fk
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_award_badges_org ON award_badges(org_id);
CREATE INDEX IF NOT EXISTS idx_award_badges_brand ON award_badges(brand_id);
CREATE INDEX IF NOT EXISTS idx_award_badges_year ON award_badges(year);
CREATE INDEX IF NOT EXISTS idx_award_badges_type ON award_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_award_badges_generated ON award_badges(generated_at DESC);

-- Enable RLS
ALTER TABLE award_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY award_badges_select ON award_badges
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY award_badges_insert ON award_badges
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE award_badges IS 'Client award badges and certificates (Phase 67)';

-- Award eligibility rules table
CREATE TABLE IF NOT EXISTS award_eligibility_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  badge_type TEXT NOT NULL UNIQUE,
  criteria JSONB NOT NULL,
  min_score NUMERIC NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_award_eligibility_rules_type ON award_eligibility_rules(badge_type);
CREATE INDEX IF NOT EXISTS idx_award_eligibility_rules_active ON award_eligibility_rules(active);

-- Enable RLS
ALTER TABLE award_eligibility_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global read)
CREATE POLICY award_eligibility_rules_select ON award_eligibility_rules
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

CREATE POLICY award_eligibility_rules_insert ON award_eligibility_rules
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE award_eligibility_rules IS 'Award eligibility criteria (Phase 67)';
