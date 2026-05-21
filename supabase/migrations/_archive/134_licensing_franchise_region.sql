-- Migration 134: Licensing, Franchise & Region Expansion Engine
-- Phase 91: LFRE - Hierarchical agencies with region ownership

-- ============================================================================
-- Table 1: regions
-- Geographic territories assignable to agencies
-- ============================================================================

CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,

  -- Location
  country_code TEXT NOT NULL,
  state_code TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',

  -- Boundaries (GeoJSON polygon/multipolygon)
  boundary_geojson JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Parent region for hierarchy
  parent_region_id UUID REFERENCES regions(id) ON DELETE SET NULL,

  -- Status
  active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_regions_slug ON regions(slug);
CREATE INDEX IF NOT EXISTS idx_regions_country ON regions(country_code);
CREATE INDEX IF NOT EXISTS idx_regions_parent ON regions(parent_region_id);
CREATE INDEX IF NOT EXISTS idx_regions_boundary ON regions USING GIN (boundary_geojson);

-- ============================================================================
-- Table 2: franchise_tiers
-- Rule sets for franchise/license levels
-- ============================================================================

CREATE TABLE IF NOT EXISTS franchise_tiers (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Identity
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Limits
  max_clients INTEGER NOT NULL DEFAULT 100,
  max_users INTEGER NOT NULL DEFAULT 10,
  max_sub_agencies INTEGER NOT NULL DEFAULT 0,

  -- Rate limits
  posting_rate_limit_hour INTEGER NOT NULL DEFAULT 50,
  ai_budget_monthly INTEGER NOT NULL DEFAULT 1000, -- in cents

  -- Features
  features JSONB NOT NULL DEFAULT '{
    "autopilot": true,
    "combat": true,
    "scaling": true,
    "white_label": false,
    "api_access": false
  }'::jsonb,

  -- Pricing
  monthly_fee INTEGER NOT NULL DEFAULT 0, -- in cents
  revenue_share_percent NUMERIC(5,2) NOT NULL DEFAULT 0,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Insert default tiers
INSERT INTO franchise_tiers (name, description, max_clients, max_users, max_sub_agencies, posting_rate_limit_hour, ai_budget_monthly, monthly_fee, revenue_share_percent, features)
VALUES
  ('Starter', 'Entry-level franchise tier', 25, 3, 0, 20, 500, 9900, 0, '{"autopilot": true, "combat": false, "scaling": false, "white_label": false, "api_access": false}'::jsonb),
  ('Growth', 'Growing agencies with more capacity', 100, 10, 0, 50, 2000, 29900, 0, '{"autopilot": true, "combat": true, "scaling": true, "white_label": false, "api_access": false}'::jsonb),
  ('Professional', 'Full-featured professional tier', 500, 25, 5, 200, 10000, 99900, 0, '{"autopilot": true, "combat": true, "scaling": true, "white_label": true, "api_access": true}'::jsonb),
  ('Enterprise', 'Unlimited enterprise tier', -1, -1, -1, -1, -1, 0, 10, '{"autopilot": true, "combat": true, "scaling": true, "white_label": true, "api_access": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Table 3: agency_licenses
-- Associates agencies with regions and franchise tiers
-- ============================================================================

CREATE TABLE IF NOT EXISTS agency_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  tier_id INTEGER NOT NULL REFERENCES franchise_tiers(id),

  -- License details
  license_key TEXT UNIQUE,
  started_on DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_on DATE NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'expired', 'cancelled')),

  -- Usage tracking
  current_clients INTEGER NOT NULL DEFAULT 0,
  current_users INTEGER NOT NULL DEFAULT 0,

  -- Billing
  next_billing_date DATE,
  billing_status TEXT DEFAULT 'current'
    CHECK (billing_status IN ('current', 'past_due', 'cancelled')),

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  UNIQUE(agency_id, region_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agency_licenses_agency ON agency_licenses(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_licenses_region ON agency_licenses(region_id);
CREATE INDEX IF NOT EXISTS idx_agency_licenses_tier ON agency_licenses(tier_id);
CREATE INDEX IF NOT EXISTS idx_agency_licenses_status ON agency_licenses(status);
CREATE INDEX IF NOT EXISTS idx_agency_licenses_expires ON agency_licenses(expires_on);

-- ============================================================================
-- Table 4: franchise_metrics
-- Aggregated metrics for revenue rollups
-- ============================================================================

CREATE TABLE IF NOT EXISTS franchise_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Client metrics
  total_clients INTEGER NOT NULL DEFAULT 0,
  active_clients INTEGER NOT NULL DEFAULT 0,
  new_clients INTEGER NOT NULL DEFAULT 0,
  churned_clients INTEGER NOT NULL DEFAULT 0,

  -- Revenue metrics (in cents)
  gross_revenue INTEGER NOT NULL DEFAULT 0,
  net_revenue INTEGER NOT NULL DEFAULT 0,
  mrr INTEGER NOT NULL DEFAULT 0,

  -- Performance metrics
  avg_client_health NUMERIC(5,2),
  avg_campaign_performance NUMERIC(5,2),
  total_posts INTEGER NOT NULL DEFAULT 0,
  total_engagements INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  UNIQUE(agency_id, period_start, period_end)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_franchise_metrics_agency ON franchise_metrics(agency_id);
CREATE INDEX IF NOT EXISTS idx_franchise_metrics_period ON franchise_metrics(period_start, period_end);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_metrics ENABLE ROW LEVEL SECURITY;

-- Regions policies
CREATE POLICY "Anyone can view active regions" ON regions
  FOR SELECT USING (active = true);

CREATE POLICY "System manages regions" ON regions
  FOR ALL USING (true);

-- Franchise tiers policies (public read)
CREATE POLICY "Anyone can view tiers" ON franchise_tiers
  FOR SELECT USING (true);

-- Agency licenses policies
CREATE POLICY "Agency owners can view their licenses" ON agency_licenses
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM agency_users WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Parent agencies can view child licenses" ON agency_licenses
  FOR SELECT USING (
    agency_id IN (
      SELECT id FROM agencies WHERE parent_agency_id IN (
        SELECT agency_id FROM agency_users WHERE user_id = auth.uid() AND role = 'owner'
      )
    )
  );

CREATE POLICY "System manages licenses" ON agency_licenses
  FOR ALL USING (true);

-- Franchise metrics policies
CREATE POLICY "Agency owners can view their metrics" ON franchise_metrics
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM agency_users WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Parent agencies can view child metrics" ON franchise_metrics
  FOR SELECT USING (
    agency_id IN (
      SELECT id FROM agencies WHERE parent_agency_id IN (
        SELECT agency_id FROM agency_users WHERE user_id = auth.uid() AND role = 'owner'
      )
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get agency's license with tier details
CREATE OR REPLACE FUNCTION get_agency_license(p_agency_id UUID)
RETURNS TABLE (
  license_id UUID,
  region_name TEXT,
  tier_name TEXT,
  status TEXT,
  expires_on DATE,
  max_clients INTEGER,
  current_clients INTEGER,
  max_users INTEGER,
  current_users INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id AS license_id,
    r.name AS region_name,
    ft.name AS tier_name,
    al.status,
    al.expires_on,
    ft.max_clients,
    al.current_clients,
    ft.max_users,
    al.current_users
  FROM agency_licenses al
  JOIN regions r ON al.region_id = r.id
  JOIN franchise_tiers ft ON al.tier_id = ft.id
  WHERE al.agency_id = p_agency_id
  AND al.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Check if agency is within tier limits
CREATE OR REPLACE FUNCTION check_tier_limit(
  p_agency_id UUID,
  p_limit_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_license agency_licenses%ROWTYPE;
  v_tier franchise_tiers%ROWTYPE;
BEGIN
  SELECT * INTO v_license FROM agency_licenses
  WHERE agency_id = p_agency_id AND status = 'active'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  SELECT * INTO v_tier FROM franchise_tiers
  WHERE id = v_license.tier_id;

  IF p_limit_type = 'clients' THEN
    RETURN v_tier.max_clients = -1 OR v_license.current_clients < v_tier.max_clients;
  ELSIF p_limit_type = 'users' THEN
    RETURN v_tier.max_users = -1 OR v_license.current_users < v_tier.max_users;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Get child agencies for a parent
CREATE OR REPLACE FUNCTION get_child_agencies(p_parent_id UUID)
RETURNS TABLE (
  agency_id UUID,
  agency_name TEXT,
  agency_slug TEXT,
  license_status TEXT,
  tier_name TEXT,
  region_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS agency_id,
    a.name AS agency_name,
    a.slug AS agency_slug,
    al.status AS license_status,
    ft.name AS tier_name,
    r.name AS region_name
  FROM agencies a
  LEFT JOIN agency_licenses al ON a.id = al.agency_id AND al.status = 'active'
  LEFT JOIN franchise_tiers ft ON al.tier_id = ft.id
  LEFT JOIN regions r ON al.region_id = r.id
  WHERE a.parent_agency_id = p_parent_id
  ORDER BY a.name;
END;
$$ LANGUAGE plpgsql;

-- Aggregate metrics for parent agency
CREATE OR REPLACE FUNCTION rollup_franchise_metrics(
  p_parent_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS JSONB AS $$
DECLARE
  v_rollup JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_agencies', (
      SELECT COUNT(*) FROM agencies WHERE parent_agency_id = p_parent_id
    ),
    'total_clients', (
      SELECT COALESCE(SUM(total_clients), 0) FROM franchise_metrics fm
      JOIN agencies a ON fm.agency_id = a.id
      WHERE a.parent_agency_id = p_parent_id
        AND fm.period_start = p_period_start
        AND fm.period_end = p_period_end
    ),
    'total_revenue', (
      SELECT COALESCE(SUM(gross_revenue), 0) FROM franchise_metrics fm
      JOIN agencies a ON fm.agency_id = a.id
      WHERE a.parent_agency_id = p_parent_id
        AND fm.period_start = p_period_start
        AND fm.period_end = p_period_end
    ),
    'avg_health', (
      SELECT COALESCE(AVG(avg_client_health), 0) FROM franchise_metrics fm
      JOIN agencies a ON fm.agency_id = a.id
      WHERE a.parent_agency_id = p_parent_id
        AND fm.period_start = p_period_start
        AND fm.period_end = p_period_end
    )
  ) INTO v_rollup;

  RETURN v_rollup;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update license timestamps
CREATE OR REPLACE FUNCTION update_agency_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agency_licenses_updated_at
  BEFORE UPDATE ON agency_licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_licenses_updated_at();

-- Update region timestamps
CREATE OR REPLACE FUNCTION update_regions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_regions_updated_at
  BEFORE UPDATE ON regions
  FOR EACH ROW
  EXECUTE FUNCTION update_regions_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE regions IS 'Phase 91: Geographic territories for franchise expansion';
COMMENT ON TABLE franchise_tiers IS 'Phase 91: License tier definitions with limits';
COMMENT ON TABLE agency_licenses IS 'Phase 91: Agency-region-tier assignments';
COMMENT ON TABLE franchise_metrics IS 'Phase 91: Aggregated metrics for revenue rollups';

COMMENT ON COLUMN franchise_tiers.max_clients IS '-1 means unlimited';
COMMENT ON COLUMN franchise_tiers.ai_budget_monthly IS 'Budget in cents';
COMMENT ON COLUMN agency_licenses.status IS 'active | suspended | expired | cancelled';
