-- AetherOS Omega Protocol - Database Schema
-- Visual generation system with cost tracking and tiered generation

-- ============================================================================
-- VISUAL JOBS TABLE
-- Tracks all visual generation requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_aetheros_visual_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Generation parameters
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('draft', 'refined', 'production')),
  model_used VARCHAR(100) NOT NULL,
  prompt_original TEXT NOT NULL,
  prompt_enhanced TEXT,
  
  -- Output
  output_url TEXT,
  preview_url TEXT,
  aspect_ratio VARCHAR(10),
  
  -- Cost tracking
  cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Indexes
  CONSTRAINT valid_cost CHECK (cost >= 0)
);

-- Indexes for performance
CREATE INDEX idx_aetheros_jobs_tenant ON synthex_aetheros_visual_jobs(tenant_id);
CREATE INDEX idx_aetheros_jobs_user ON synthex_aetheros_visual_jobs(user_id);
CREATE INDEX idx_aetheros_jobs_status ON synthex_aetheros_visual_jobs(status);
CREATE INDEX idx_aetheros_jobs_created ON synthex_aetheros_visual_jobs(created_at DESC);
CREATE INDEX idx_aetheros_jobs_tier ON synthex_aetheros_visual_jobs(tier);

-- ============================================================================
-- SESSIONS TABLE
-- Tracks AetherOS sessions with telemetry
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_aetheros_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Session timing
  session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_end TIMESTAMPTZ,
  
  -- Telemetry snapshot
  telemetry JSONB NOT NULL,
  region_routed VARCHAR(50),
  energy_savings_pct INTEGER DEFAULT 0,
  
  -- Session metrics
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  operations_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_session_cost CHECK (total_cost >= 0),
  CONSTRAINT valid_operations CHECK (operations_count >= 0)
);

-- Indexes
CREATE INDEX idx_aetheros_sessions_tenant ON synthex_aetheros_sessions(tenant_id);
CREATE INDEX idx_aetheros_sessions_user ON synthex_aetheros_sessions(user_id);
CREATE INDEX idx_aetheros_sessions_start ON synthex_aetheros_sessions(session_start DESC);

-- ============================================================================
-- VISUAL LAYERS TABLE
-- For multi-layer composition (Visual Studio feature)
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_aetheros_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visual_job_id UUID NOT NULL REFERENCES synthex_aetheros_visual_jobs(id) ON DELETE CASCADE,
  
  -- Layer properties
  layer_type VARCHAR(20) NOT NULL CHECK (layer_type IN ('background', 'subject', 'text', 'effect', 'overlay', 'mask')),
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('draft', 'refined', 'production')),
  z_index INTEGER NOT NULL DEFAULT 0,
  
  -- URLs
  preview_url TEXT NOT NULL,
  production_url TEXT,
  
  -- Upgrade cost
  cost_to_upgrade DECIMAL(10, 6),
  
  -- Layer state
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  opacity DECIMAL(3, 2) NOT NULL DEFAULT 1.0 CHECK (opacity >= 0 AND opacity <= 1),
  blend_mode VARCHAR(20),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_aetheros_layers_job ON synthex_aetheros_layers(visual_job_id);
CREATE INDEX idx_aetheros_layers_type ON synthex_aetheros_layers(layer_type);
CREATE INDEX idx_aetheros_layers_z ON synthex_aetheros_layers(z_index);

-- ============================================================================
-- COMPOSED VISUALS TABLE
-- Tracks multi-layer compositions
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_aetheros_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Composition details
  name VARCHAR(255) NOT NULL,
  canvas_width INTEGER NOT NULL,
  canvas_height INTEGER NOT NULL,
  
  -- Cost tracking
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'production_ready')),
  
  -- Final output
  output_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_composition_cost CHECK (total_cost >= 0)
);

-- Indexes
CREATE INDEX idx_aetheros_compositions_tenant ON synthex_aetheros_compositions(tenant_id);
CREATE INDEX idx_aetheros_compositions_user ON synthex_aetheros_compositions(user_id);
CREATE INDEX idx_aetheros_compositions_status ON synthex_aetheros_compositions(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE synthex_aetheros_visual_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_aetheros_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_aetheros_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_aetheros_compositions ENABLE ROW LEVEL SECURITY;

-- Policies for visual_jobs
CREATE POLICY "Users can view their tenant's visual jobs"
  ON synthex_aetheros_visual_jobs FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create visual jobs for their tenant"
  ON synthex_aetheros_visual_jobs FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their tenant's visual jobs"
  ON synthex_aetheros_visual_jobs FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
    )
  );

-- Policies for sessions
CREATE POLICY "Users can view their tenant's sessions"
  ON synthex_aetheros_sessions FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions for their tenant"
  ON synthex_aetheros_sessions FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
    )
  );

-- Policies for layers
CREATE POLICY "Users can view layers for their tenant's jobs"
  ON synthex_aetheros_layers FOR SELECT
  USING (
    visual_job_id IN (
      SELECT id FROM synthex_aetheros_visual_jobs 
      WHERE tenant_id IN (
        SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create layers for their tenant's jobs"
  ON synthex_aetheros_layers FOR INSERT
  WITH CHECK (
    visual_job_id IN (
      SELECT id FROM synthex_aetheros_visual_jobs 
      WHERE tenant_id IN (
        SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
      )
    )
  );

-- Policies for compositions
CREATE POLICY "Users can view their tenant's compositions"
  ON synthex_aetheros_compositions FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create compositions for their tenant"
  ON synthex_aetheros_compositions FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their tenant's compositions"
  ON synthex_aetheros_compositions FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get cost summary for a tenant
CREATE OR REPLACE FUNCTION get_aetheros_cost_summary(p_tenant_id UUID, p_start_date TIMESTAMPTZ, p_end_date TIMESTAMPTZ)
RETURNS TABLE (
  draft_costs DECIMAL,
  refined_costs DECIMAL,
  production_costs DECIMAL,
  total_cost DECIMAL,
  total_jobs INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN tier = 'draft' THEN cost ELSE 0 END), 0) as draft_costs,
    COALESCE(SUM(CASE WHEN tier = 'refined' THEN cost ELSE 0 END), 0) as refined_costs,
    COALESCE(SUM(CASE WHEN tier = 'production' THEN cost ELSE 0 END), 0) as production_costs,
    COALESCE(SUM(cost), 0) as total_cost,
    COUNT(*)::INTEGER as total_jobs
  FROM synthex_aetheros_visual_jobs
  WHERE tenant_id = p_tenant_id
    AND created_at >= p_start_date
    AND created_at <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session cost
CREATE OR REPLACE FUNCTION update_aetheros_session_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Update session total cost when a job is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE synthex_aetheros_sessions
    SET 
      total_cost = total_cost + NEW.cost,
      operations_count = operations_count + 1
    WHERE id = (
      SELECT id FROM synthex_aetheros_sessions
      WHERE tenant_id = NEW.tenant_id
        AND user_id = NEW.user_id
        AND session_start <= NEW.created_at
        AND (session_end IS NULL OR session_end >= NEW.created_at)
      ORDER BY session_start DESC
      LIMIT 1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update session costs
CREATE TRIGGER trigger_update_session_cost
  AFTER UPDATE ON synthex_aetheros_visual_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_aetheros_session_cost();

-- Updated_at trigger for layers
CREATE TRIGGER trigger_update_layers_timestamp
  BEFORE UPDATE ON synthex_aetheros_layers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for compositions
CREATE TRIGGER trigger_update_compositions_timestamp
  BEFORE UPDATE ON synthex_aetheros_compositions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE synthex_aetheros_visual_jobs IS 'AetherOS visual generation jobs with cost tracking';
COMMENT ON TABLE synthex_aetheros_sessions IS 'AetherOS sessions with telemetry and energy arbitrage data';
COMMENT ON TABLE synthex_aetheros_layers IS 'Multi-layer composition system for visual studio';
COMMENT ON TABLE synthex_aetheros_compositions IS 'Composed multi-layer visuals';
COMMENT ON FUNCTION get_aetheros_cost_summary IS 'Get cost breakdown by tier for a tenant';
