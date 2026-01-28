-- Migration 144: Global SLA, Latency & Performance Intelligence Engine
-- Required by Phase 92 - Global SLA, Latency & Performance Intelligence Engine (GSLPIE)
-- Real-time global performance and SLA intelligence layer

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS gslpie_performance_history CASCADE;
DROP TABLE IF EXISTS gslpie_sla_profiles CASCADE;
DROP TABLE IF EXISTS gslpie_region_metrics CASCADE;

-- GSLPIE region metrics table (live metrics)
CREATE TABLE gslpie_region_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT NOT NULL,
  latency_ms NUMERIC NOT NULL,
  error_rate NUMERIC NOT NULL DEFAULT 0,
  throughput NUMERIC NOT NULL DEFAULT 0,
  signal_source TEXT NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW(),

  -- Latency must be positive
  CONSTRAINT gslpie_region_metrics_latency_check CHECK (
    latency_ms >= 0
  ),

  -- Error rate between 0 and 1
  CONSTRAINT gslpie_region_metrics_error_check CHECK (
    error_rate >= 0 AND error_rate <= 1
  ),

  -- Throughput must be non-negative
  CONSTRAINT gslpie_region_metrics_throughput_check CHECK (
    throughput >= 0
  ),

  -- Signal source check
  CONSTRAINT gslpie_region_metrics_source_check CHECK (
    signal_source IN ('api', 'agent', 'database', 'external', 'health_check', 'failover_trigger', 'synthetic')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gslpie_region_metrics_region ON gslpie_region_metrics(region);
CREATE INDEX IF NOT EXISTS idx_gslpie_region_metrics_captured ON gslpie_region_metrics(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_gslpie_region_metrics_source ON gslpie_region_metrics(signal_source);
CREATE INDEX IF NOT EXISTS idx_gslpie_region_metrics_latency ON gslpie_region_metrics(latency_ms);

-- Enable RLS
ALTER TABLE gslpie_region_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for all authenticated users - operational data)
CREATE POLICY gslpie_region_metrics_select ON gslpie_region_metrics
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY gslpie_region_metrics_insert ON gslpie_region_metrics
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE gslpie_region_metrics IS 'Live regional performance metrics (Phase 92)';

-- GSLPIE SLA profiles table
CREATE TABLE gslpie_sla_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  sla_type TEXT NOT NULL DEFAULT 'standard',
  latency_threshold_ms NUMERIC NOT NULL,
  uptime_target NUMERIC NOT NULL DEFAULT 99.9,
  max_error_rate NUMERIC NOT NULL DEFAULT 0.01,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- SLA type check
  CONSTRAINT gslpie_sla_profiles_type_check CHECK (
    sla_type IN ('standard', 'premium', 'enterprise', 'critical')
  ),

  -- Latency threshold must be positive
  CONSTRAINT gslpie_sla_profiles_latency_check CHECK (
    latency_threshold_ms > 0
  ),

  -- Uptime target between 0 and 100
  CONSTRAINT gslpie_sla_profiles_uptime_check CHECK (
    uptime_target >= 0 AND uptime_target <= 100
  ),

  -- Error rate between 0 and 1
  CONSTRAINT gslpie_sla_profiles_error_check CHECK (
    max_error_rate >= 0 AND max_error_rate <= 1
  ),

  -- Unique tenant-region combination
  CONSTRAINT gslpie_sla_profiles_unique UNIQUE (tenant_id, region),

  -- Foreign keys
  CONSTRAINT gslpie_sla_profiles_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gslpie_sla_profiles_tenant ON gslpie_sla_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gslpie_sla_profiles_region ON gslpie_sla_profiles(region);
CREATE INDEX IF NOT EXISTS idx_gslpie_sla_profiles_type ON gslpie_sla_profiles(sla_type);

-- Enable RLS
ALTER TABLE gslpie_sla_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY gslpie_sla_profiles_select ON gslpie_sla_profiles
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY gslpie_sla_profiles_insert ON gslpie_sla_profiles
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY gslpie_sla_profiles_update ON gslpie_sla_profiles
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE gslpie_sla_profiles IS 'SLA requirements per tenant and region (Phase 92)';

-- GSLPIE performance history table (immutable)
CREATE TABLE gslpie_performance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region TEXT NOT NULL,
  latency_ms NUMERIC NOT NULL,
  error_rate NUMERIC NOT NULL DEFAULT 0,
  throughput NUMERIC NOT NULL DEFAULT 0,
  uptime NUMERIC NOT NULL DEFAULT 100,
  snapshot_period TEXT NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT NOW(),

  -- Latency must be non-negative
  CONSTRAINT gslpie_performance_history_latency_check CHECK (
    latency_ms >= 0
  ),

  -- Error rate between 0 and 1
  CONSTRAINT gslpie_performance_history_error_check CHECK (
    error_rate >= 0 AND error_rate <= 1
  ),

  -- Uptime between 0 and 100
  CONSTRAINT gslpie_performance_history_uptime_check CHECK (
    uptime >= 0 AND uptime <= 100
  ),

  -- Snapshot period format (hourly, daily, weekly)
  CONSTRAINT gslpie_performance_history_period_check CHECK (
    snapshot_period ~ '^(H[0-9]{2}-[0-9]{4}-[0-9]{2}-[0-9]{2}|D[0-9]{4}-[0-9]{2}-[0-9]{2}|W[0-9]{4}-[0-9]{2})$'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gslpie_performance_history_region ON gslpie_performance_history(region);
CREATE INDEX IF NOT EXISTS idx_gslpie_performance_history_period ON gslpie_performance_history(snapshot_period);
CREATE INDEX IF NOT EXISTS idx_gslpie_performance_history_captured ON gslpie_performance_history(captured_at DESC);

-- Enable RLS
ALTER TABLE gslpie_performance_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for all authenticated users, insert only - immutable)
CREATE POLICY gslpie_performance_history_select ON gslpie_performance_history
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY gslpie_performance_history_insert ON gslpie_performance_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- No UPDATE or DELETE policies - history is immutable

-- Comment
COMMENT ON TABLE gslpie_performance_history IS 'Immutable historical performance snapshots (Phase 92)';
