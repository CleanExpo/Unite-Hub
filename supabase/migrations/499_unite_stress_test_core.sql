/**
 * Phase D71: Unite System Stress-Test Engine
 *
 * Controlled load testing with AI-powered result analysis.
 * Never impacts production tenants - isolated test environments only.
 */

-- ============================================================================
-- STRESS TEST PROFILES (test configurations)
-- ============================================================================

DROP TABLE IF EXISTS unite_stress_profiles CASCADE;

CREATE TABLE unite_stress_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  target_system text NOT NULL,
  load_pattern jsonb NOT NULL,
  duration_seconds int NOT NULL DEFAULT 60,
  concurrent_users int NOT NULL DEFAULT 10,
  ramp_up_seconds int DEFAULT 10,
  tenant_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_stress_profiles_tenant ON unite_stress_profiles(tenant_id);
CREATE INDEX idx_unite_stress_profiles_target ON unite_stress_profiles(tenant_id, target_system);
CREATE INDEX idx_unite_stress_profiles_active ON unite_stress_profiles(is_active) WHERE is_active = true;

COMMENT ON TABLE unite_stress_profiles IS 'Stress test configurations and load patterns';
COMMENT ON COLUMN unite_stress_profiles.target_system IS 'System under test (e.g., "api", "database", "workflow")';
COMMENT ON COLUMN unite_stress_profiles.load_pattern IS 'Load generation config: {type: "constant|ramp|spike", requests_per_second: N}';
COMMENT ON COLUMN unite_stress_profiles.duration_seconds IS 'Total test duration in seconds';
COMMENT ON COLUMN unite_stress_profiles.concurrent_users IS 'Number of concurrent simulated users';
COMMENT ON COLUMN unite_stress_profiles.ramp_up_seconds IS 'Time to reach full load';

-- ============================================================================
-- STRESS TEST RUNS (execution results)
-- ============================================================================

DROP TABLE IF EXISTS unite_stress_runs CASCADE;

CREATE TABLE unite_stress_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES unite_stress_profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  started_at timestamptz,
  completed_at timestamptz,
  metrics jsonb,
  errors jsonb,
  ai_summary text,
  ai_insights jsonb,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_stress_runs_profile ON unite_stress_runs(profile_id);
CREATE INDEX idx_unite_stress_runs_tenant ON unite_stress_runs(tenant_id);
CREATE INDEX idx_unite_stress_runs_status ON unite_stress_runs(status);
CREATE INDEX idx_unite_stress_runs_created ON unite_stress_runs(created_at DESC);

COMMENT ON TABLE unite_stress_runs IS 'Stress test execution results and AI analysis';
COMMENT ON COLUMN unite_stress_runs.status IS 'Execution status: pending → running → completed/failed/cancelled';
COMMENT ON COLUMN unite_stress_runs.metrics IS 'Performance metrics: {requests_total, requests_per_second, avg_latency_ms, p95_latency_ms, p99_latency_ms, error_rate}';
COMMENT ON COLUMN unite_stress_runs.errors IS 'Error details: {total_errors, error_types: [{type, count, sample}]}';
COMMENT ON COLUMN unite_stress_runs.ai_summary IS 'AI-generated plain language summary';
COMMENT ON COLUMN unite_stress_runs.ai_insights IS 'AI insights: {bottlenecks: [], recommendations: [], severity: "low|medium|high"}';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE unite_stress_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_stress_runs ENABLE ROW LEVEL SECURITY;

-- Stress Profiles
CREATE POLICY "Users can view stress profiles for their tenant"
  ON unite_stress_profiles FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage stress profiles for their tenant"
  ON unite_stress_profiles FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Stress Runs
CREATE POLICY "Users can view stress runs for their tenant"
  ON unite_stress_runs FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage stress runs for their tenant"
  ON unite_stress_runs FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);
