-- Migration 129: Multi-Licensor Royalty Compliance Engine
-- Required by Phase 77 - Multi-Licensor Royalty, Compliance & Territory Engine (MLRCTE)
-- Royalty, revenue sharing, territory protection, compliance auditing

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS licensor_territory_zones CASCADE;
DROP TABLE IF EXISTS licensor_revenue_events CASCADE;
DROP TABLE IF EXISTS licensor_profiles CASCADE;

-- Licensor profiles table
CREATE TABLE licensor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  brand_id UUID,
  licensor_name TEXT NOT NULL,
  royalty_type TEXT NOT NULL,
  royalty_rate NUMERIC NOT NULL DEFAULT 0,
  territory_rules JSONB DEFAULT '{}'::jsonb,
  compliance_requirements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Royalty type check
  CONSTRAINT licensor_profiles_royalty_type_check CHECK (
    royalty_type IN ('percentage', 'fixed', 'hybrid', 'usage_based')
  ),

  -- Foreign key
  CONSTRAINT licensor_profiles_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_licensor_profiles_org ON licensor_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_licensor_profiles_brand ON licensor_profiles(brand_id);
CREATE INDEX IF NOT EXISTS idx_licensor_profiles_type ON licensor_profiles(royalty_type);
CREATE INDEX IF NOT EXISTS idx_licensor_profiles_created ON licensor_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE licensor_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY licensor_profiles_select ON licensor_profiles
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_profiles_insert ON licensor_profiles
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_profiles_update ON licensor_profiles
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE licensor_profiles IS 'Licensor profiles (Phase 77)';

-- Licensor revenue events table
CREATE TABLE licensor_revenue_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  licensor_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  calculated_royalty NUMERIC NOT NULL DEFAULT 0,
  stripe_payment_id TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT licensor_revenue_events_status_check CHECK (
    status IN ('pending', 'calculated', 'invoiced', 'paid', 'disputed')
  ),

  -- Foreign keys
  CONSTRAINT licensor_revenue_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT licensor_revenue_events_licensor_fk
    FOREIGN KEY (licensor_id) REFERENCES licensor_profiles(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_licensor_revenue_events_org ON licensor_revenue_events(org_id);
CREATE INDEX IF NOT EXISTS idx_licensor_revenue_events_licensor ON licensor_revenue_events(licensor_id);
CREATE INDEX IF NOT EXISTS idx_licensor_revenue_events_status ON licensor_revenue_events(status);
CREATE INDEX IF NOT EXISTS idx_licensor_revenue_events_period ON licensor_revenue_events(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_licensor_revenue_events_created ON licensor_revenue_events(created_at DESC);

-- Enable RLS
ALTER TABLE licensor_revenue_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY licensor_revenue_events_select ON licensor_revenue_events
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_revenue_events_insert ON licensor_revenue_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_revenue_events_update ON licensor_revenue_events
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE licensor_revenue_events IS 'Licensor revenue events (Phase 77)';

-- Licensor territory zones table
CREATE TABLE licensor_territory_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  licensor_id UUID NOT NULL,
  region_code TEXT NOT NULL,
  coordinates_geojson JSONB,
  competitor_overlap_score NUMERIC NOT NULL DEFAULT 0,
  territory_protection_level TEXT NOT NULL DEFAULT 'standard',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Protection level check
  CONSTRAINT licensor_territory_zones_protection_check CHECK (
    territory_protection_level IN ('none', 'standard', 'exclusive', 'super_exclusive')
  ),

  -- Overlap score check
  CONSTRAINT licensor_territory_zones_overlap_check CHECK (
    competitor_overlap_score >= 0 AND competitor_overlap_score <= 100
  ),

  -- Foreign keys
  CONSTRAINT licensor_territory_zones_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT licensor_territory_zones_licensor_fk
    FOREIGN KEY (licensor_id) REFERENCES licensor_profiles(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_licensor_territory_zones_org ON licensor_territory_zones(org_id);
CREATE INDEX IF NOT EXISTS idx_licensor_territory_zones_licensor ON licensor_territory_zones(licensor_id);
CREATE INDEX IF NOT EXISTS idx_licensor_territory_zones_region ON licensor_territory_zones(region_code);
CREATE INDEX IF NOT EXISTS idx_licensor_territory_zones_protection ON licensor_territory_zones(territory_protection_level);
CREATE INDEX IF NOT EXISTS idx_licensor_territory_zones_created ON licensor_territory_zones(created_at DESC);

-- Enable RLS
ALTER TABLE licensor_territory_zones ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY licensor_territory_zones_select ON licensor_territory_zones
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_territory_zones_insert ON licensor_territory_zones
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY licensor_territory_zones_update ON licensor_territory_zones
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE licensor_territory_zones IS 'Licensor territory zones (Phase 77)';
