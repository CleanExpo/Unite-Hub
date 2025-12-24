-- Migration 151: Autonomous Cross-Engine Harmonisation & Interaction Guard
-- Required by Phase 99 - ACEHIG
-- Prevent cross-engine conflicts and cascade failures

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS acehig_blocked_cascades CASCADE;
DROP TABLE IF EXISTS acehig_dependency_map CASCADE;

-- ACEHIG dependency map table
CREATE TABLE acehig_dependency_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_engine TEXT NOT NULL,
  target_engine TEXT NOT NULL,
  dependency_type TEXT NOT NULL,
  conflict_rules JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dependency type check
  CONSTRAINT acehig_dependency_type_check CHECK (
    dependency_type IN ('requires', 'conflicts', 'triggers', 'blocks', 'precedes')
  ),

  -- Unique dependency
  CONSTRAINT acehig_dependency_unique UNIQUE (source_engine, target_engine, dependency_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_acehig_dependency_source ON acehig_dependency_map(source_engine);
CREATE INDEX IF NOT EXISTS idx_acehig_dependency_target ON acehig_dependency_map(target_engine);

-- Enable RLS
ALTER TABLE acehig_dependency_map ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for all authenticated)
CREATE POLICY acehig_dependency_select ON acehig_dependency_map
  FOR SELECT TO authenticated
  USING (true);

-- Comment
COMMENT ON TABLE acehig_dependency_map IS 'Cross-engine dependency definitions (Phase 99)';

-- ACEHIG blocked cascades table
CREATE TABLE acehig_blocked_cascades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  initiating_engine TEXT NOT NULL,
  blocked_engine TEXT NOT NULL,
  reason TEXT NOT NULL,
  cascade_path JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT acehig_blocked_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_acehig_blocked_tenant ON acehig_blocked_cascades(tenant_id);
CREATE INDEX IF NOT EXISTS idx_acehig_blocked_initiating ON acehig_blocked_cascades(initiating_engine);
CREATE INDEX IF NOT EXISTS idx_acehig_blocked_created ON acehig_blocked_cascades(created_at DESC);

-- Enable RLS
ALTER TABLE acehig_blocked_cascades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY acehig_blocked_select ON acehig_blocked_cascades
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY acehig_blocked_insert ON acehig_blocked_cascades
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE acehig_blocked_cascades IS 'Blocked cascade events (Phase 99)';

-- Insert core dependency rules
INSERT INTO acehig_dependency_map (source_engine, target_engine, dependency_type, conflict_rules) VALUES
('asrs', 'maos', 'blocks', '{"condition": "risk_score > 80"}'::jsonb),
('mcse', 'maos', 'precedes', '{"validation_required": true}'::jsonb),
('gslpie', 'aglbase', 'triggers', '{"on": "sla_breach"}'::jsonb),
('upewe', 'aire', 'triggers', '{"on": "high_probability_incident"}'::jsonb),
('tcpqel', 'maos', 'blocks', '{"condition": "quota_exceeded"}'::jsonb),
('ucscel', 'maos', 'blocks', '{"condition": "contract_violation"}'::jsonb);
