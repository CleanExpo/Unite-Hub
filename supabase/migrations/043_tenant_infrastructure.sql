-- Migration 043: Tenant Infrastructure for Docker Multi-Tenant
-- Phase 3 Step 8 - Priority 3
--
-- Creates tables for managing tenant containers:
-- - tenant_containers: Container metadata and configuration
-- - tenant_health: Health check tracking and monitoring
-- - tenant_resource_usage: Resource consumption tracking
-- - tenant_deployments: Deployment history and rollback capability
--
-- Run this in Supabase SQL Editor

-- ============================================================================
-- TENANT_CONTAINERS TABLE (Container Metadata)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant identification
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,

  -- Container configuration
  container_id TEXT UNIQUE, -- Docker container ID
  container_name TEXT NOT NULL UNIQUE, -- Format: tenant_{organization_id}
  image_tag TEXT NOT NULL DEFAULT 'latest',

  -- Network configuration
  external_port INTEGER UNIQUE, -- External port mapping (3001, 3002, etc.)
  internal_port INTEGER DEFAULT 3000,
  tenant_url TEXT NOT NULL, -- Full URL: http://tenant-{id}.localhost:3001

  -- Resource limits
  cpu_limit DECIMAL(3, 2) DEFAULT 0.50 CHECK (cpu_limit > 0 AND cpu_limit <= 4.0),
  memory_limit_mb INTEGER DEFAULT 512 CHECK (memory_limit_mb >= 256 AND memory_limit_mb <= 8192),
  disk_limit_mb INTEGER DEFAULT 2048 CHECK (disk_limit_mb >= 1024),

  -- Container state
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'provisioning', 'running', 'stopped', 'error', 'terminated')),
  last_started_at TIMESTAMPTZ,
  last_stopped_at TIMESTAMPTZ,

  -- Health status
  health_status TEXT DEFAULT 'unknown' CHECK (health_status IN ('unknown', 'healthy', 'unhealthy', 'starting')),
  last_health_check_at TIMESTAMPTZ,

  -- Configuration
  environment_vars JSONB DEFAULT '{}'::jsonb, -- Tenant-specific env vars
  volume_mounts JSONB DEFAULT '[]'::jsonb, -- Volume mount configurations

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT unique_org_container UNIQUE (organization_id)
);

-- Indexes for tenant_containers
CREATE INDEX IF NOT EXISTS idx_tenant_containers_organization_id ON tenant_containers(organization_id);
CREATE INDEX IF NOT EXISTS idx_tenant_containers_container_id ON tenant_containers(container_id);
CREATE INDEX IF NOT EXISTS idx_tenant_containers_status ON tenant_containers(status);
CREATE INDEX IF NOT EXISTS idx_tenant_containers_health_status ON tenant_containers(health_status);
CREATE INDEX IF NOT EXISTS idx_tenant_containers_external_port ON tenant_containers(external_port);

-- ============================================================================
-- TENANT_HEALTH TABLE (Health Check Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  container_id UUID NOT NULL REFERENCES tenant_containers(id) ON DELETE CASCADE,

  -- Health check details
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'unhealthy', 'timeout')),

  -- Response metrics
  response_time_ms INTEGER, -- Response time in milliseconds
  http_status_code INTEGER,
  error_message TEXT,

  -- Resource metrics at check time
  cpu_usage_percent DECIMAL(5, 2),
  memory_usage_mb INTEGER,
  disk_usage_mb INTEGER,

  -- Check metadata
  check_type TEXT DEFAULT 'http' CHECK (check_type IN ('http', 'tcp', 'exec')),
  check_endpoint TEXT DEFAULT '/api/health',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tenant_health
CREATE INDEX IF NOT EXISTS idx_tenant_health_container_id ON tenant_health(container_id);
CREATE INDEX IF NOT EXISTS idx_tenant_health_checked_at ON tenant_health(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_health_status ON tenant_health(status);

-- ============================================================================
-- TENANT_RESOURCE_USAGE TABLE (Resource Consumption Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_resource_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  container_id UUID NOT NULL REFERENCES tenant_containers(id) ON DELETE CASCADE,

  -- Time period
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,

  -- CPU metrics
  cpu_usage_percent_avg DECIMAL(5, 2),
  cpu_usage_percent_max DECIMAL(5, 2),
  cpu_throttling_count INTEGER DEFAULT 0,

  -- Memory metrics
  memory_usage_mb_avg INTEGER,
  memory_usage_mb_max INTEGER,
  memory_limit_mb INTEGER,
  oom_kill_count INTEGER DEFAULT 0, -- Out of memory kills

  -- Network metrics
  network_rx_bytes BIGINT DEFAULT 0, -- Received bytes
  network_tx_bytes BIGINT DEFAULT 0, -- Transmitted bytes

  -- Disk metrics
  disk_usage_mb INTEGER,
  disk_io_read_mb INTEGER DEFAULT 0,
  disk_io_write_mb INTEGER DEFAULT 0,

  -- Request metrics
  request_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  avg_response_time_ms INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tenant_resource_usage
CREATE INDEX IF NOT EXISTS idx_tenant_resource_usage_container_id ON tenant_resource_usage(container_id);
CREATE INDEX IF NOT EXISTS idx_tenant_resource_usage_recorded_at ON tenant_resource_usage(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_resource_usage_period ON tenant_resource_usage(period_start, period_end);

-- ============================================================================
-- TENANT_DEPLOYMENTS TABLE (Deployment History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  container_id UUID NOT NULL REFERENCES tenant_containers(id) ON DELETE CASCADE,

  -- Deployment details
  deployment_type TEXT NOT NULL CHECK (deployment_type IN ('provision', 'update', 'restart', 'scale', 'rollback', 'terminate')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),

  -- Version information
  previous_image_tag TEXT,
  new_image_tag TEXT NOT NULL,

  -- Configuration changes
  previous_config JSONB,
  new_config JSONB,

  -- Deployment metadata
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Rollback capability
  can_rollback BOOLEAN DEFAULT true,
  rollback_deployment_id UUID REFERENCES tenant_deployments(id) ON DELETE SET NULL,

  -- Audit
  deployed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  deployment_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for tenant_deployments
CREATE INDEX IF NOT EXISTS idx_tenant_deployments_container_id ON tenant_deployments(container_id);
CREATE INDEX IF NOT EXISTS idx_tenant_deployments_status ON tenant_deployments(status);
CREATE INDEX IF NOT EXISTS idx_tenant_deployments_started_at ON tenant_deployments(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_deployments_deployment_type ON tenant_deployments(deployment_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE tenant_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_resource_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_deployments ENABLE ROW LEVEL SECURITY;

-- Tenant Containers Policies
CREATE POLICY "Users can view containers in their organization"
  ON tenant_containers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage containers"
  ON tenant_containers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Tenant Health Policies
CREATE POLICY "Users can view health in their organization"
  ON tenant_health FOR SELECT
  USING (
    container_id IN (
      SELECT id FROM tenant_containers
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert health checks"
  ON tenant_health FOR INSERT
  WITH CHECK (true); -- System service inserts health checks

-- Tenant Resource Usage Policies
CREATE POLICY "Users can view resource usage in their organization"
  ON tenant_resource_usage FOR SELECT
  USING (
    container_id IN (
      SELECT id FROM tenant_containers
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert resource usage"
  ON tenant_resource_usage FOR INSERT
  WITH CHECK (true); -- System service inserts metrics

-- Tenant Deployments Policies
CREATE POLICY "Users can view deployments in their organization"
  ON tenant_deployments FOR SELECT
  USING (
    container_id IN (
      SELECT id FROM tenant_containers
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins can manage deployments"
  ON tenant_deployments FOR ALL
  USING (
    container_id IN (
      SELECT id FROM tenant_containers
      WHERE organization_id IN (
        SELECT organization_id FROM user_organizations
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
      )
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_tenant_containers_updated_at
  BEFORE UPDATE ON tenant_containers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get next available port
CREATE OR REPLACE FUNCTION get_next_available_port()
RETURNS INTEGER AS $$
DECLARE
  next_port INTEGER;
BEGIN
  -- Start from port 3001, find first available
  SELECT COALESCE(MAX(external_port), 3000) + 1
  INTO next_port
  FROM tenant_containers
  WHERE external_port IS NOT NULL;

  -- Ensure port is in valid range (3001-65535)
  IF next_port < 3001 THEN
    next_port := 3001;
  END IF;

  IF next_port > 65535 THEN
    RAISE EXCEPTION 'No available ports in range';
  END IF;

  RETURN next_port;
END;
$$ LANGUAGE plpgsql;

-- Function to check container health status
CREATE OR REPLACE FUNCTION get_container_health_status(container_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  recent_health_count INTEGER;
  healthy_count INTEGER;
BEGIN
  -- Get last 5 health checks
  SELECT COUNT(*) INTO recent_health_count
  FROM tenant_health
  WHERE container_id = container_id_param
    AND checked_at > NOW() - INTERVAL '5 minutes';

  -- If no recent health checks, return unknown
  IF recent_health_count = 0 THEN
    RETURN 'unknown';
  END IF;

  -- Count healthy checks in last 5
  SELECT COUNT(*) INTO healthy_count
  FROM tenant_health
  WHERE container_id = container_id_param
    AND checked_at > NOW() - INTERVAL '5 minutes'
    AND status = 'healthy';

  -- If all healthy, return healthy
  IF healthy_count = recent_health_count THEN
    RETURN 'healthy';
  END IF;

  -- If some healthy, return starting
  IF healthy_count > 0 THEN
    RETURN 'starting';
  END IF;

  -- Otherwise unhealthy
  RETURN 'unhealthy';
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to calculate average resource usage
CREATE OR REPLACE FUNCTION get_container_avg_resource_usage(
  container_id_param UUID,
  hours_param INTEGER DEFAULT 24
)
RETURNS TABLE (
  avg_cpu_percent DECIMAL,
  avg_memory_mb DECIMAL,
  total_requests BIGINT,
  total_errors BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(cpu_usage_percent_avg)::DECIMAL(5,2) as avg_cpu_percent,
    AVG(memory_usage_mb_avg)::DECIMAL(10,2) as avg_memory_mb,
    SUM(request_count) as total_requests,
    SUM(error_count) as total_errors
  FROM tenant_resource_usage
  WHERE container_id = container_id_param
    AND recorded_at > NOW() - (hours_param || ' hours')::INTERVAL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- VIEWS FOR MONITORING
-- ============================================================================

-- View: Current container status
CREATE OR REPLACE VIEW container_status_view AS
SELECT
  tc.id,
  tc.organization_id,
  tc.tenant_name,
  tc.container_name,
  tc.status,
  tc.health_status,
  tc.external_port,
  tc.tenant_url,
  tc.cpu_limit,
  tc.memory_limit_mb,
  tc.last_started_at,
  tc.last_health_check_at,
  (
    SELECT COUNT(*)
    FROM tenant_health th
    WHERE th.container_id = tc.id
      AND th.checked_at > NOW() - INTERVAL '1 hour'
      AND th.status = 'unhealthy'
  ) as unhealthy_checks_last_hour,
  (
    SELECT AVG(cpu_usage_percent_avg)
    FROM tenant_resource_usage tru
    WHERE tru.container_id = tc.id
      AND tru.recorded_at > NOW() - INTERVAL '1 hour'
  ) as avg_cpu_last_hour,
  (
    SELECT AVG(memory_usage_mb_avg)
    FROM tenant_resource_usage tru
    WHERE tru.container_id = tc.id
      AND tru.recorded_at > NOW() - INTERVAL '1 hour'
  ) as avg_memory_last_hour
FROM tenant_containers tc;

-- View: Recent deployments
CREATE OR REPLACE VIEW recent_deployments_view AS
SELECT
  td.id,
  tc.organization_id,
  tc.tenant_name,
  td.deployment_type,
  td.status,
  td.new_image_tag,
  td.started_at,
  td.completed_at,
  td.error_message,
  up.email as deployed_by_email
FROM tenant_deployments td
JOIN tenant_containers tc ON td.container_id = tc.id
LEFT JOIN user_profiles up ON td.deployed_by = up.id
WHERE td.started_at > NOW() - INTERVAL '7 days'
ORDER BY td.started_at DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tenant_containers IS 'Docker container metadata and configuration for multi-tenant deployment';
COMMENT ON TABLE tenant_health IS 'Health check history and monitoring for tenant containers';
COMMENT ON TABLE tenant_resource_usage IS 'Resource consumption tracking (CPU, memory, network, disk)';
COMMENT ON TABLE tenant_deployments IS 'Deployment history with rollback capability';

COMMENT ON COLUMN tenant_containers.cpu_limit IS 'CPU limit as decimal (e.g., 0.50 = 50% of one core)';
COMMENT ON COLUMN tenant_containers.memory_limit_mb IS 'Memory limit in megabytes (256-8192)';
COMMENT ON COLUMN tenant_containers.external_port IS 'External port mapping for accessing container';
COMMENT ON COLUMN tenant_containers.status IS 'Container lifecycle state';
COMMENT ON COLUMN tenant_containers.health_status IS 'Current health status from health checks';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this SQL in Supabase SQL Editor
-- After running, tenant infrastructure is ready for use;
