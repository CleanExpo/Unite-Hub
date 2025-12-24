-- Migration 145: Autonomous Global Load Balancing & Agent Scaling Engine
-- Required by Phase 93 - Autonomous Global Load Balancing & Agent Scaling Engine (AGLBASE)
-- Autonomous load balancing and agent scaling with regional awareness

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS aglbase_routing_decisions CASCADE;
DROP TABLE IF EXISTS aglbase_scaling_events CASCADE;
DROP TABLE IF EXISTS aglbase_agent_pools CASCADE;

-- AGLBASE agent pools table
CREATE TABLE aglbase_agent_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  min_capacity INTEGER NOT NULL DEFAULT 1,
  max_capacity INTEGER NOT NULL DEFAULT 10,
  desired_capacity INTEGER NOT NULL DEFAULT 1,
  scaling_policy JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Capacity constraints
  CONSTRAINT aglbase_agent_pools_min_check CHECK (
    min_capacity >= 0
  ),

  CONSTRAINT aglbase_agent_pools_max_check CHECK (
    max_capacity >= min_capacity
  ),

  CONSTRAINT aglbase_agent_pools_desired_check CHECK (
    desired_capacity >= min_capacity AND desired_capacity <= max_capacity
  ),

  -- Agent type check
  CONSTRAINT aglbase_agent_pools_type_check CHECK (
    agent_type IN (
      'orchestrator', 'email', 'content', 'voice', 'refactor', 'analysis',
      'compliance', 'reporting', 'general'
    )
  ),

  -- Unique pool per tenant/region/type
  CONSTRAINT aglbase_agent_pools_unique UNIQUE (tenant_id, region, agent_type),

  -- Foreign keys
  CONSTRAINT aglbase_agent_pools_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aglbase_agent_pools_tenant ON aglbase_agent_pools(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aglbase_agent_pools_region ON aglbase_agent_pools(region);
CREATE INDEX IF NOT EXISTS idx_aglbase_agent_pools_type ON aglbase_agent_pools(agent_type);

-- Enable RLS
ALTER TABLE aglbase_agent_pools ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY aglbase_agent_pools_select ON aglbase_agent_pools
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aglbase_agent_pools_insert ON aglbase_agent_pools
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aglbase_agent_pools_update ON aglbase_agent_pools
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aglbase_agent_pools_delete ON aglbase_agent_pools
  FOR DELETE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE aglbase_agent_pools IS 'Agent capacity targets and scaling bounds (Phase 93)';

-- AGLBASE scaling events table
CREATE TABLE aglbase_scaling_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  previous_capacity INTEGER NOT NULL,
  new_capacity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  trigger_source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Trigger source check
  CONSTRAINT aglbase_scaling_events_trigger_check CHECK (
    trigger_source IN ('auto', 'manual', 'rebalance', 'failover', 'policy', 'forecast')
  ),

  -- Foreign keys
  CONSTRAINT aglbase_scaling_events_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aglbase_scaling_events_tenant ON aglbase_scaling_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aglbase_scaling_events_region ON aglbase_scaling_events(region);
CREATE INDEX IF NOT EXISTS idx_aglbase_scaling_events_type ON aglbase_scaling_events(agent_type);
CREATE INDEX IF NOT EXISTS idx_aglbase_scaling_events_trigger ON aglbase_scaling_events(trigger_source);
CREATE INDEX IF NOT EXISTS idx_aglbase_scaling_events_created ON aglbase_scaling_events(created_at DESC);

-- Enable RLS
ALTER TABLE aglbase_scaling_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY aglbase_scaling_events_select ON aglbase_scaling_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aglbase_scaling_events_insert ON aglbase_scaling_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE aglbase_scaling_events IS 'Scaling actions log for audit (Phase 93)';

-- AGLBASE routing decisions table
CREATE TABLE aglbase_routing_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  workload_type TEXT NOT NULL,
  selected_region TEXT NOT NULL,
  decision_reason TEXT NOT NULL,
  sla_context JSONB DEFAULT '{}'::jsonb,
  performance_context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Workload type check
  CONSTRAINT aglbase_routing_decisions_workload_check CHECK (
    workload_type IN (
      'standard', 'voice', 'refactor', 'analysis', 'compliance', 'batch',
      'real_time', 'background', 'priority'
    )
  ),

  -- Foreign keys
  CONSTRAINT aglbase_routing_decisions_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aglbase_routing_decisions_tenant ON aglbase_routing_decisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aglbase_routing_decisions_region ON aglbase_routing_decisions(region);
CREATE INDEX IF NOT EXISTS idx_aglbase_routing_decisions_selected ON aglbase_routing_decisions(selected_region);
CREATE INDEX IF NOT EXISTS idx_aglbase_routing_decisions_type ON aglbase_routing_decisions(agent_type);
CREATE INDEX IF NOT EXISTS idx_aglbase_routing_decisions_workload ON aglbase_routing_decisions(workload_type);
CREATE INDEX IF NOT EXISTS idx_aglbase_routing_decisions_created ON aglbase_routing_decisions(created_at DESC);

-- Enable RLS
ALTER TABLE aglbase_routing_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY aglbase_routing_decisions_select ON aglbase_routing_decisions
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aglbase_routing_decisions_insert ON aglbase_routing_decisions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE aglbase_routing_decisions IS 'Routing choices for workloads (Phase 93)';
