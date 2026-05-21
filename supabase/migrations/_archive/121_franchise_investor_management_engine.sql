-- Migration 121: Franchise & Investor Management Engine
-- Required by Phase 69 - Franchise & Investor Management Engine (FIME)
-- Multi-region franchise and investor support

-- Franchises table
CREATE TABLE IF NOT EXISTS franchises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  owner_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT franchises_status_check CHECK (
    status IN ('pending', 'onboarding', 'active', 'suspended', 'terminated')
  ),

  -- Foreign keys
  CONSTRAINT franchises_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT franchises_owner_fk
    -- Keep FK reference to auth.users (allowed in migrations)
FOREIGN KEY (owner_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_franchises_org ON franchises(org_id);
CREATE INDEX IF NOT EXISTS idx_franchises_owner ON franchises(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_franchises_status ON franchises(status);
CREATE INDEX IF NOT EXISTS idx_franchises_created ON franchises(created_at DESC);

-- Enable RLS
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY franchises_select ON franchises
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ) OR owner_user_id = auth.uid());

CREATE POLICY franchises_insert ON franchises
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY franchises_update ON franchises
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE franchises IS 'Franchise entities (Phase 69)';

-- Franchise regions table
CREATE TABLE IF NOT EXISTS franchise_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID NOT NULL,
  territory_name TEXT NOT NULL,
  postal_codes JSONB DEFAULT '[]'::jsonb,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT franchise_regions_franchise_fk
    FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_franchise_regions_franchise ON franchise_regions(franchise_id);
CREATE INDEX IF NOT EXISTS idx_franchise_regions_territory ON franchise_regions(territory_name);
CREATE INDEX IF NOT EXISTS idx_franchise_regions_locked ON franchise_regions(locked);

-- Enable RLS
ALTER TABLE franchise_regions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY franchise_regions_select ON franchise_regions
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND franchise_id IN (
    SELECT id FROM franchises
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    ) OR owner_user_id = auth.uid()
  ));

CREATE POLICY franchise_regions_insert ON franchise_regions
  FOR INSERT TO authenticated
  WITH CHECK (franchise_id IN (
    SELECT id FROM franchises
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE franchise_regions IS 'Franchise territory mappings (Phase 69)';

-- Franchise revenue shares table
CREATE TABLE IF NOT EXISTS franchise_revenue_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID NOT NULL,
  percentage NUMERIC NOT NULL,
  rules JSONB DEFAULT '{}'::jsonb,
  effective_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Percentage check
  CONSTRAINT franchise_revenue_shares_percentage_check CHECK (
    percentage >= 0 AND percentage <= 100
  ),

  -- Foreign key
  CONSTRAINT franchise_revenue_shares_franchise_fk
    FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_franchise_revenue_shares_franchise ON franchise_revenue_shares(franchise_id);
CREATE INDEX IF NOT EXISTS idx_franchise_revenue_shares_date ON franchise_revenue_shares(effective_date DESC);

-- Enable RLS
ALTER TABLE franchise_revenue_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY franchise_revenue_shares_select ON franchise_revenue_shares
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND franchise_id IN (
    SELECT id FROM franchises
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    ) OR owner_user_id = auth.uid()
  ));

CREATE POLICY franchise_revenue_shares_insert ON franchise_revenue_shares
  FOR INSERT TO authenticated
  WITH CHECK (franchise_id IN (
    SELECT id FROM franchises
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE franchise_revenue_shares IS 'Franchise revenue share rules (Phase 69)';

-- Investor relations table
CREATE TABLE IF NOT EXISTS investor_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  investor_user_id UUID NOT NULL,
  investment_amount NUMERIC NOT NULL,
  stake_percentage NUMERIC NOT NULL,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Stake check
  CONSTRAINT investor_relations_stake_check CHECK (
    stake_percentage >= 0 AND stake_percentage <= 100
  ),

  -- Foreign keys
  CONSTRAINT investor_relations_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT investor_relations_investor_fk
    -- Keep FK reference to auth.users (allowed in migrations)
FOREIGN KEY (investor_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_investor_relations_org ON investor_relations(org_id);
CREATE INDEX IF NOT EXISTS idx_investor_relations_investor ON investor_relations(investor_user_id);
CREATE INDEX IF NOT EXISTS idx_investor_relations_created ON investor_relations(created_at DESC);

-- Enable RLS
ALTER TABLE investor_relations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY investor_relations_select ON investor_relations
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ) OR investor_user_id = auth.uid());

CREATE POLICY investor_relations_insert ON investor_relations
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE investor_relations IS 'Investor stakeholder records (Phase 69)';
