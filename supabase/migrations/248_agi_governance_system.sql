-- Phase 8: AGI Governance System
-- Manages multi-model routing, risk tracking, and governance enforcement
-- SIMPLIFIED VERSION - Pure table creation only

CREATE TABLE IF NOT EXISTS model_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  model TEXT NOT NULL,
  capability TEXT NOT NULL,
  level TEXT NOT NULL,
  cost_per_token NUMERIC NOT NULL,
  latency_ms INTEGER NOT NULL,
  availability_score DECIMAL(3,2) NOT NULL,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  supports_batching BOOLEAN DEFAULT FALSE,
  supports_caching BOOLEAN DEFAULT FALSE,
  supports_streaming BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS governance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  risk_level TEXT NOT NULL,
  constraints JSONB NOT NULL,
  requires_founder_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS governance_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  decision_id TEXT NOT NULL,
  policy_id UUID NOT NULL,
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  violations JSONB,
  founder_override JSONB,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS model_routing_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT NOT NULL,
  selected_model TEXT NOT NULL,
  alternatives TEXT[],
  routing_reason TEXT,
  estimated_latency INTEGER,
  estimated_cost NUMERIC,
  confidence_score DECIMAL(3,2),
  success BOOLEAN,
  actual_latency INTEGER,
  actual_cost NUMERIC
);

CREATE TABLE IF NOT EXISTS model_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  model_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  quality_score INTEGER,
  cost_score INTEGER,
  latency_score INTEGER,
  overall_score INTEGER,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  founder_approved BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS risk_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  profile_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  dimension TEXT NOT NULL,
  severity TEXT NOT NULL,
  threshold NUMERIC NOT NULL,
  unit TEXT,
  founder_approval_required BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  decision_id TEXT NOT NULL,
  risk_score INTEGER,
  risk_level TEXT NOT NULL,
  violations JSONB,
  requires_approval BOOLEAN DEFAULT FALSE,
  recommendation TEXT
);

CREATE TABLE IF NOT EXISTS simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL,
  expected_outcome JSONB,
  confidence DECIMAL(3,2),
  probability DECIMAL(3,2)
);

CREATE TABLE IF NOT EXISTS simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  scenario_id UUID NOT NULL,
  agent_behavior JSONB,
  model_selection JSONB,
  resource_utilization JSONB,
  risk_assessment JSONB
);

CREATE TABLE IF NOT EXISTS governance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  total_decisions INTEGER,
  approved INTEGER,
  rejected INTEGER,
  escalated INTEGER,
  founder_overrides INTEGER,
  violations_detected INTEGER,
  risk_trend TEXT,
  recommendations JSONB
);

ALTER TABLE model_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_routing_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_model_capabilities" ON model_capabilities;
DROP POLICY IF EXISTS "authenticated_read_governance_policies" ON governance_policies;
DROP POLICY IF EXISTS "authenticated_read_governance_audit" ON governance_audit;
DROP POLICY IF EXISTS "authenticated_read_model_routing" ON model_routing_decisions;
DROP POLICY IF EXISTS "authenticated_read_model_rewards" ON model_rewards;
DROP POLICY IF EXISTS "authenticated_read_risk_boundaries" ON risk_boundaries;
DROP POLICY IF EXISTS "authenticated_read_risk_profiles" ON risk_profiles;
DROP POLICY IF EXISTS "authenticated_read_risk_assessments" ON risk_assessments;
DROP POLICY IF EXISTS "authenticated_read_simulation_scenarios" ON simulation_scenarios;
DROP POLICY IF EXISTS "authenticated_read_simulation_results" ON simulation_results;
DROP POLICY IF EXISTS "authenticated_read_governance_reports" ON governance_reports;

CREATE POLICY authenticated_read_model_capabilities ON model_capabilities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_read_governance_policies ON governance_policies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_read_governance_audit ON governance_audit FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_read_model_routing ON model_routing_decisions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_read_model_rewards ON model_rewards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_read_risk_boundaries ON risk_boundaries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_read_risk_profiles ON risk_profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_read_risk_assessments ON risk_assessments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_read_simulation_scenarios ON simulation_scenarios FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_read_simulation_results ON simulation_results FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_read_governance_reports ON governance_reports FOR SELECT USING (auth.role() = 'authenticated');
