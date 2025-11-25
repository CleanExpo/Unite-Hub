-- Phase 8: AGI Governance System
-- Manages multi-model routing, risk tracking, and governance enforcement

-- Model catalog and capabilities
CREATE TABLE IF NOT EXISTS model_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  model TEXT NOT NULL,
  capability TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('basic', 'intermediate', 'advanced', 'expert')),
  cost_per_token NUMERIC NOT NULL,
  latency_ms INTEGER NOT NULL,
  availability_score DECIMAL(3,2) NOT NULL CHECK (availability_score >= 0 AND availability_score <= 1),
  last_tested_at TIMESTAMP WITH TIME ZONE,
  supports_batching BOOLEAN DEFAULT FALSE,
  supports_caching BOOLEAN DEFAULT FALSE,
  supports_streaming BOOLEAN DEFAULT FALSE,
  CONSTRAINT unique_model_capability UNIQUE (model, capability)
);

-- Governance policies
CREATE TABLE IF NOT EXISTS governance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  constraints JSONB NOT NULL,
  requires_founder_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Governance audit trail
CREATE TABLE IF NOT EXISTS governance_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  decision_id TEXT NOT NULL,
  policy_id UUID NOT NULL REFERENCES governance_policies(id),
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'escalated', 'modified', 'overridden')),
  violations JSONB,
  founder_override JSONB,
  notes TEXT
);

-- Model routing decisions
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

-- Model reward tracking
CREATE TABLE IF NOT EXISTS model_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  model_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  cost_score INTEGER CHECK (cost_score >= 0 AND cost_score <= 100),
  latency_score INTEGER CHECK (latency_score >= 0 AND latency_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  metadata JSONB
);

-- Risk boundaries
CREATE TABLE IF NOT EXISTS risk_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  profile_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  dimension TEXT NOT NULL CHECK (dimension IN ('cost', 'latency', 'accuracy', 'scope', 'frequency')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  threshold NUMERIC NOT NULL,
  unit TEXT,
  founder_approval_required BOOLEAN DEFAULT FALSE
);

-- Risk profiles (conservative, balanced, aggressive)
CREATE TABLE IF NOT EXISTS risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  founder_approved BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT FALSE
);

-- Risk assessments
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  decision_id TEXT NOT NULL,
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical')),
  violations JSONB,
  requires_approval BOOLEAN DEFAULT FALSE,
  recommendation TEXT
);

-- Scenarios for simulation
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

-- Simulation results
CREATE TABLE IF NOT EXISTS simulation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  scenario_id UUID NOT NULL REFERENCES simulation_scenarios(id),
  agent_behavior JSONB,
  model_selection JSONB,
  resource_utilization JSONB,
  risk_assessment JSONB
);

-- Governance reports and summaries
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
  risk_trend TEXT CHECK (risk_trend IN ('increasing', 'stable', 'decreasing')),
  recommendations JSONB
);

-- Add risk_boundaries foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'risk_boundaries' AND constraint_name = 'risk_boundaries_profile_fk'
  ) THEN
    ALTER TABLE risk_boundaries ADD CONSTRAINT risk_boundaries_profile_fk FOREIGN KEY (profile_id) REFERENCES risk_profiles(id);
  END IF;
END $$;

-- Add simulation_results foreign key constraint (already defined inline, but ensure it exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'simulation_results' AND constraint_name = 'simulation_results_scenario_fk'
  ) THEN
    ALTER TABLE simulation_results ADD CONSTRAINT simulation_results_scenario_fk FOREIGN KEY (scenario_id) REFERENCES simulation_scenarios(id);
  END IF;
END $$;

-- Enable RLS
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

-- RLS Policies (authenticated read)
CREATE POLICY "Allow authenticated read model_capabilities" ON model_capabilities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read governance_policies" ON governance_policies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read governance_audit" ON governance_audit
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read model_routing" ON model_routing_decisions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read model_rewards" ON model_rewards
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read risk_boundaries" ON risk_boundaries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read risk_profiles" ON risk_profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read risk_assessments" ON risk_assessments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read simulation_scenarios" ON simulation_scenarios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read simulation_results" ON simulation_results
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read governance_reports" ON governance_reports
  FOR SELECT USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_model_capabilities_model ON model_capabilities(model);
CREATE INDEX IF NOT EXISTS idx_model_capabilities_capability ON model_capabilities(capability);
CREATE INDEX IF NOT EXISTS idx_model_capabilities_level ON model_capabilities(level);

CREATE INDEX IF NOT EXISTS idx_governance_policies_enabled ON governance_policies(enabled);
CREATE INDEX IF NOT EXISTS idx_governance_policies_risk_level ON governance_policies(risk_level);

CREATE INDEX IF NOT EXISTS idx_governance_audit_policy ON governance_audit(policy_id);
CREATE INDEX IF NOT EXISTS idx_governance_audit_action ON governance_audit(action);
CREATE INDEX IF NOT EXISTS idx_governance_audit_created ON governance_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_model_routing_request ON model_routing_decisions(request_id);
CREATE INDEX IF NOT EXISTS idx_model_routing_model ON model_routing_decisions(selected_model);
CREATE INDEX IF NOT EXISTS idx_model_routing_created ON model_routing_decisions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_model_rewards_model ON model_rewards(model_id);
CREATE INDEX IF NOT EXISTS idx_model_rewards_task ON model_rewards(task_type);
CREATE INDEX IF NOT EXISTS idx_model_rewards_model_task ON model_rewards(model_id, task_type);
CREATE INDEX IF NOT EXISTS idx_model_rewards_overall ON model_rewards(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_risk_boundaries_profile ON risk_boundaries(profile_id);
CREATE INDEX IF NOT EXISTS idx_risk_boundaries_dimension ON risk_boundaries(dimension);
CREATE INDEX IF NOT EXISTS idx_risk_boundaries_severity ON risk_boundaries(severity);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_decision ON risk_assessments(decision_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_level ON risk_assessments(risk_level);

CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_created ON simulation_scenarios(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_simulation_results_scenario ON simulation_results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_simulation_results_created ON simulation_results(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_governance_reports_period ON governance_reports(period_start, period_end);

-- Comments
DO $$
BEGIN
  COMMENT ON TABLE model_capabilities IS 'Catalog of available models with capabilities, cost, and performance characteristics';
  COMMENT ON TABLE governance_policies IS 'Governance policies enforcing risk boundaries and approval requirements';
  COMMENT ON TABLE governance_audit IS 'Audit trail of governance decisions and founder actions';
  COMMENT ON TABLE model_routing_decisions IS 'History of model selection decisions for routing';
  COMMENT ON TABLE model_rewards IS 'Performance reward signals for models across task types';
  COMMENT ON TABLE risk_boundaries IS 'Risk dimensions and thresholds within a profile';
  COMMENT ON TABLE risk_profiles IS 'Risk profiles (conservative, balanced, aggressive)';
  COMMENT ON TABLE risk_assessments IS 'Risk assessments of agent decisions';
  COMMENT ON TABLE simulation_scenarios IS 'Scenario definitions for behavior forecasting';
  COMMENT ON TABLE simulation_results IS 'Results from simulation runs';
  COMMENT ON TABLE governance_reports IS 'Periodic governance and compliance reports';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
