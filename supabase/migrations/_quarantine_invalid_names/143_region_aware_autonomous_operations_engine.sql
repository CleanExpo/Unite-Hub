-- Migration 143: Region-Aware Autonomous Operations Engine
-- Required by Phase 91 - Region-Aware Autonomous Operations Engine (RAAOE)
-- Dynamic region-sensitive operational layer for MAOS

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS raaoe_actions_log CASCADE;
DROP TABLE IF EXISTS raaoe_tenant_regions CASCADE;
DROP TABLE IF EXISTS raaoe_region_profiles CASCADE;

-- RAAOE region profiles table
CREATE TABLE raaoe_region_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT NOT NULL UNIQUE,
  operational_mode TEXT NOT NULL DEFAULT 'standard',
  safety_threshold NUMERIC NOT NULL DEFAULT 0.7,
  reasoning_weights JSONB DEFAULT '{}'::jsonb,
  sla_profile JSONB DEFAULT '{}'::jsonb,
  compliance_frameworks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Operational mode check
  CONSTRAINT raaoe_region_profiles_mode_check CHECK (
    operational_mode IN ('standard', 'conservative', 'aggressive', 'compliance_heavy')
  ),

  -- Safety threshold range
  CONSTRAINT raaoe_region_profiles_threshold_check CHECK (
    safety_threshold >= 0 AND safety_threshold <= 1
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_raaoe_region_profiles_region ON raaoe_region_profiles(region);
CREATE INDEX IF NOT EXISTS idx_raaoe_region_profiles_mode ON raaoe_region_profiles(operational_mode);

-- Enable RLS
ALTER TABLE raaoe_region_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for all authenticated users - reference data)
CREATE POLICY raaoe_region_profiles_select ON raaoe_region_profiles
  FOR SELECT TO authenticated
  USING (true);

-- Comment
COMMENT ON TABLE raaoe_region_profiles IS 'Regional operational profiles and SLA configurations (Phase 91)';

-- RAAOE tenant regions table
CREATE TABLE raaoe_tenant_regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  config_overrides JSONB DEFAULT '{}'::jsonb,
  auto_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique tenant-region mapping
  CONSTRAINT raaoe_tenant_regions_unique UNIQUE (tenant_id),

  -- Foreign keys
  CONSTRAINT raaoe_tenant_regions_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_raaoe_tenant_regions_tenant ON raaoe_tenant_regions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_raaoe_tenant_regions_region ON raaoe_tenant_regions(region);
CREATE INDEX IF NOT EXISTS idx_raaoe_tenant_regions_auto ON raaoe_tenant_regions(auto_detected);

-- Enable RLS
ALTER TABLE raaoe_tenant_regions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY raaoe_tenant_regions_select ON raaoe_tenant_regions
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY raaoe_tenant_regions_insert ON raaoe_tenant_regions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY raaoe_tenant_regions_update ON raaoe_tenant_regions
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE raaoe_tenant_regions IS 'Tenant-to-region mappings with config overrides (Phase 91)';

-- RAAOE actions log table
CREATE TABLE raaoe_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  action_type TEXT NOT NULL,
  original_params JSONB DEFAULT '{}'::jsonb,
  adjusted_params JSONB DEFAULT '{}'::jsonb,
  adjustment_reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT raaoe_actions_log_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_raaoe_actions_log_tenant ON raaoe_actions_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_raaoe_actions_log_region ON raaoe_actions_log(region);
CREATE INDEX IF NOT EXISTS idx_raaoe_actions_log_action ON raaoe_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_raaoe_actions_log_timestamp ON raaoe_actions_log(timestamp DESC);

-- Enable RLS
ALTER TABLE raaoe_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY raaoe_actions_log_select ON raaoe_actions_log
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY raaoe_actions_log_insert ON raaoe_actions_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE raaoe_actions_log IS 'Region-aware action adjustments log (Phase 91)';

-- Insert default region profiles
INSERT INTO raaoe_region_profiles (region, operational_mode, safety_threshold, reasoning_weights, sla_profile, compliance_frameworks) VALUES
-- Global default
('global', 'standard', 0.7,
 '{"efficiency": 0.7, "compliance": 0.7, "scalability": 0.7}'::jsonb,
 '{"max_response_time_ms": 5000, "max_retries": 3, "timeout_ms": 30000}'::jsonb,
 '["iso27001"]'::jsonb),

-- European Union
('eu', 'compliance_heavy', 0.8,
 '{"privacy": 0.9, "compliance": 0.9, "efficiency": 0.6}'::jsonb,
 '{"max_response_time_ms": 5000, "max_retries": 3, "timeout_ms": 30000}'::jsonb,
 '["gdpr", "iso27001"]'::jsonb),

-- United States
('us', 'standard', 0.7,
 '{"efficiency": 0.8, "scalability": 0.8, "compliance": 0.7}'::jsonb,
 '{"max_response_time_ms": 3000, "max_retries": 5, "timeout_ms": 20000}'::jsonb,
 '["ccpa", "hipaa", "pci"]'::jsonb),

-- California (specific CCPA requirements)
('california', 'compliance_heavy', 0.75,
 '{"privacy": 0.85, "compliance": 0.85, "efficiency": 0.7}'::jsonb,
 '{"max_response_time_ms": 4000, "max_retries": 4, "timeout_ms": 25000}'::jsonb,
 '["ccpa", "pci"]'::jsonb),

-- Australia
('au', 'conservative', 0.75,
 '{"privacy": 0.85, "compliance": 0.8, "efficiency": 0.7}'::jsonb,
 '{"max_response_time_ms": 4000, "max_retries": 4, "timeout_ms": 25000}'::jsonb,
 '["app", "iso27001"]'::jsonb),

-- Asia Pacific
('apac', 'standard', 0.7,
 '{"efficiency": 0.75, "scalability": 0.8, "compliance": 0.7}'::jsonb,
 '{"max_response_time_ms": 4000, "max_retries": 4, "timeout_ms": 25000}'::jsonb,
 '["iso27001"]'::jsonb),

-- Canada
('ca', 'conservative', 0.75,
 '{"privacy": 0.85, "compliance": 0.8, "efficiency": 0.7}'::jsonb,
 '{"max_response_time_ms": 4000, "max_retries": 4, "timeout_ms": 25000}'::jsonb,
 '["pipeda", "iso27001"]'::jsonb);
