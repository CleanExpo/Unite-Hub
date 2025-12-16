-- Migration 432: Synthex Sales CRM Pipeline + Opportunity Engine
-- Phase B26: Sales CRM Pipeline + Opportunity Engine
-- Purpose: Sales pipeline management, opportunity tracking, and activity logging
-- Date: 2025-12-06

-- ============================================================================
-- SECTION 1: Sales Pipelines Table
-- Configure sales stages and pipeline templates per tenant
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_sales_pipelines (
  pipeline_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Pipeline Configuration
  name TEXT NOT NULL, -- e.g., "B2B Enterprise Sales", "SMB Quick Close"
  stages TEXT[] NOT NULL, -- Ordered array of stage names, e.g., ['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won']
  is_default BOOLEAN NOT NULL DEFAULT false, -- One default pipeline per tenant

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_tenant_pipeline_name UNIQUE(tenant_id, name)
);

DROP INDEX IF EXISTS idx_synthex_sales_pipelines_tenant;
CREATE INDEX idx_synthex_sales_pipelines_tenant ON synthex_sales_pipelines(tenant_id);
DROP INDEX IF EXISTS idx_synthex_sales_pipelines_default;
CREATE INDEX idx_synthex_sales_pipelines_default ON synthex_sales_pipelines(tenant_id, is_default);
DROP INDEX IF EXISTS idx_synthex_sales_pipelines_created;
CREATE INDEX idx_synthex_sales_pipelines_created ON synthex_sales_pipelines(created_at DESC);

COMMENT ON TABLE synthex_sales_pipelines IS 'Sales pipeline configurations with custom stages per tenant';
COMMENT ON COLUMN synthex_sales_pipelines.stages IS 'Ordered array of stage names defining the sales process';
COMMENT ON COLUMN synthex_sales_pipelines.is_default IS 'The default pipeline for new opportunities (only one per tenant)';

-- ============================================================================
-- SECTION 2: Sales Opportunities Table
-- Track deals and opportunities through the sales pipeline
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_sales_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES synthex_sales_pipelines(pipeline_id) ON DELETE RESTRICT,

  -- Opportunity Details
  name TEXT NOT NULL, -- Deal name, e.g., "Acme Corp - Enterprise Plan"
  stage TEXT NOT NULL, -- Current stage from pipeline.stages
  value NUMERIC(12,2) NOT NULL DEFAULT 0, -- Deal value in currency units
  probability NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100), -- Close probability 0-100%
  expected_close DATE, -- Expected close date

  -- Ownership & Relationships
  owner_user_id TEXT NOT NULL, -- auth.uid() format (Supabase user ID as text)
  contact_id UUID, -- Optional link to synthex_contacts or similar
  company_name TEXT, -- Company/account name if not linked to contact

  -- Additional Details
  notes TEXT, -- Internal notes about the opportunity
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_synthex_sales_opportunities_tenant;
CREATE INDEX idx_synthex_sales_opportunities_tenant ON synthex_sales_opportunities(tenant_id);
DROP INDEX IF EXISTS idx_synthex_sales_opportunities_pipeline;
CREATE INDEX idx_synthex_sales_opportunities_pipeline ON synthex_sales_opportunities(pipeline_id);
DROP INDEX IF EXISTS idx_synthex_sales_opportunities_owner;
CREATE INDEX idx_synthex_sales_opportunities_owner ON synthex_sales_opportunities(owner_user_id);
DROP INDEX IF EXISTS idx_synthex_sales_opportunities_contact;
CREATE INDEX idx_synthex_sales_opportunities_contact ON synthex_sales_opportunities(contact_id);
DROP INDEX IF EXISTS idx_synthex_sales_opportunities_status;
CREATE INDEX idx_synthex_sales_opportunities_status ON synthex_sales_opportunities(status);
DROP INDEX IF EXISTS idx_synthex_sales_opportunities_stage;
CREATE INDEX idx_synthex_sales_opportunities_stage ON synthex_sales_opportunities(stage);
DROP INDEX IF EXISTS idx_synthex_sales_opportunities_expected_close;
CREATE INDEX idx_synthex_sales_opportunities_expected_close ON synthex_sales_opportunities(expected_close);
DROP INDEX IF EXISTS idx_synthex_sales_opportunities_created;
CREATE INDEX idx_synthex_sales_opportunities_created ON synthex_sales_opportunities(created_at DESC);

COMMENT ON TABLE synthex_sales_opportunities IS 'Sales opportunities and deals tracked through pipeline stages';
COMMENT ON COLUMN synthex_sales_opportunities.probability IS 'Win probability percentage (0-100) for revenue forecasting';
COMMENT ON COLUMN synthex_sales_opportunities.owner_user_id IS 'Sales rep owner (Supabase auth.uid as text)';
COMMENT ON COLUMN synthex_sales_opportunities.status IS 'Overall status: open (active), won (closed-won), lost (closed-lost)';

-- ============================================================================
-- SECTION 3: Sales Activities Table
-- Log activities (calls, emails, meetings, notes, tasks) for opportunities
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_sales_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES synthex_sales_opportunities(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Activity Details
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task')),
  content TEXT NOT NULL, -- Activity description or notes
  next_action TEXT, -- Suggested or scheduled next action
  due_at TIMESTAMPTZ, -- For tasks: when is it due?
  completed BOOLEAN NOT NULL DEFAULT false, -- For tasks: completion status

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_synthex_sales_activities_opportunity;
CREATE INDEX idx_synthex_sales_activities_opportunity ON synthex_sales_activities(opportunity_id);
DROP INDEX IF EXISTS idx_synthex_sales_activities_tenant;
CREATE INDEX idx_synthex_sales_activities_tenant ON synthex_sales_activities(tenant_id);
DROP INDEX IF EXISTS idx_synthex_sales_activities_type;
CREATE INDEX idx_synthex_sales_activities_type ON synthex_sales_activities(type);
DROP INDEX IF EXISTS idx_synthex_sales_activities_due;
CREATE INDEX idx_synthex_sales_activities_due ON synthex_sales_activities(due_at);
DROP INDEX IF EXISTS idx_synthex_sales_activities_completed;
CREATE INDEX idx_synthex_sales_activities_completed ON synthex_sales_activities(completed);
DROP INDEX IF EXISTS idx_synthex_sales_activities_created;
CREATE INDEX idx_synthex_sales_activities_created ON synthex_sales_activities(created_at DESC);

COMMENT ON TABLE synthex_sales_activities IS 'Activity log for sales opportunities (calls, emails, meetings, notes, tasks)';
COMMENT ON COLUMN synthex_sales_activities.type IS 'Activity type: call, email, meeting, note, or task';
COMMENT ON COLUMN synthex_sales_activities.next_action IS 'Next step or follow-up action';
COMMENT ON COLUMN synthex_sales_activities.completed IS 'Whether task is completed (only applies to type=task)';

-- ============================================================================
-- SECTION 4: Helper Functions
-- Functions for pipeline and opportunity management
-- ============================================================================

-- Function: Get default pipeline for tenant
CREATE OR REPLACE FUNCTION public.get_default_pipeline(tenant_id_param UUID)
RETURNS UUID AS $$
DECLARE
  default_pipeline_id UUID;
BEGIN
  SELECT pipeline_id INTO default_pipeline_id
  FROM synthex_sales_pipelines
  WHERE tenant_id = tenant_id_param
  AND is_default = true
  LIMIT 1;

  RETURN default_pipeline_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Validate stage exists in pipeline
CREATE OR REPLACE FUNCTION public.validate_pipeline_stage(pipeline_id_param UUID, stage_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stage_exists BOOLEAN;
BEGIN
  SELECT stage_param = ANY(stages) INTO stage_exists
  FROM synthex_sales_pipelines
  WHERE pipeline_id = pipeline_id_param;

  RETURN COALESCE(stage_exists, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function: Calculate weighted revenue forecast for tenant
CREATE OR REPLACE FUNCTION public.get_revenue_forecast(tenant_id_param UUID)
RETURNS TABLE (
  total_pipeline_value NUMERIC,
  weighted_forecast NUMERIC,
  open_opportunities INTEGER,
  avg_deal_size NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(value), 0) AS total_pipeline_value,
    COALESCE(SUM(value * probability / 100), 0) AS weighted_forecast,
    COUNT(*)::INTEGER AS open_opportunities,
    COALESCE(AVG(value), 0) AS avg_deal_size
  FROM synthex_sales_opportunities
  WHERE tenant_id = tenant_id_param
  AND status = 'open';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_default_pipeline(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_pipeline_stage(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_forecast(UUID) TO authenticated;

-- ============================================================================
-- SECTION 5: Row Level Security (RLS) Policies
-- Secure access based on tenant ownership
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE synthex_sales_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_sales_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_sales_activities ENABLE ROW LEVEL SECURITY;

-- Sales Pipelines Policies
DROP POLICY IF EXISTS "pipelines_select" ON synthex_sales_pipelines;
CREATE POLICY "pipelines_select" ON synthex_sales_pipelines
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pipelines_insert" ON synthex_sales_pipelines;
CREATE POLICY "pipelines_insert" ON synthex_sales_pipelines
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pipelines_update" ON synthex_sales_pipelines;
CREATE POLICY "pipelines_update" ON synthex_sales_pipelines
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "pipelines_delete" ON synthex_sales_pipelines;
CREATE POLICY "pipelines_delete" ON synthex_sales_pipelines
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

-- Sales Opportunities Policies
DROP POLICY IF EXISTS "opportunities_select" ON synthex_sales_opportunities;
CREATE POLICY "opportunities_select" ON synthex_sales_opportunities
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "opportunities_insert" ON synthex_sales_opportunities;
CREATE POLICY "opportunities_insert" ON synthex_sales_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "opportunities_update" ON synthex_sales_opportunities;
CREATE POLICY "opportunities_update" ON synthex_sales_opportunities
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "opportunities_delete" ON synthex_sales_opportunities;
CREATE POLICY "opportunities_delete" ON synthex_sales_opportunities
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

-- Sales Activities Policies
DROP POLICY IF EXISTS "activities_select" ON synthex_sales_activities;
CREATE POLICY "activities_select" ON synthex_sales_activities
  FOR SELECT TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "activities_insert" ON synthex_sales_activities;
CREATE POLICY "activities_insert" ON synthex_sales_activities
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "activities_update" ON synthex_sales_activities;
CREATE POLICY "activities_update" ON synthex_sales_activities
  FOR UPDATE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "activities_delete" ON synthex_sales_activities;
CREATE POLICY "activities_delete" ON synthex_sales_activities
  FOR DELETE TO authenticated
  USING (
    tenant_id IN (
      SELECT id FROM synthex_tenants
      WHERE owner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECTION 6: Triggers for updated_at
-- Automatically update updated_at timestamp
-- ============================================================================

DROP TRIGGER IF EXISTS set_updated_at_sales_pipelines ON synthex_sales_pipelines;
CREATE TRIGGER set_updated_at_sales_pipelines
  BEFORE UPDATE ON synthex_sales_pipelines
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_sales_opportunities ON synthex_sales_opportunities;
CREATE TRIGGER set_updated_at_sales_opportunities
  BEFORE UPDATE ON synthex_sales_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- SECTION 7: Seed Data (Optional)
-- Default pipeline template for new tenants
-- ============================================================================

COMMENT ON TABLE synthex_sales_pipelines IS 'Example default stages: [''Lead'', ''Qualified'', ''Proposal'', ''Negotiation'', ''Closed Won'']';

-- ============================================================================
-- Verification Queries
-- ============================================================================
/*
-- Get default pipeline for tenant
SELECT * FROM public.get_default_pipeline('your-tenant-id');

-- Validate stage
SELECT public.validate_pipeline_stage('pipeline-id', 'Qualified');

-- Get revenue forecast
SELECT * FROM public.get_revenue_forecast('your-tenant-id');

-- List all pipelines for a tenant
SELECT * FROM synthex_sales_pipelines WHERE tenant_id = 'your-tenant-id';

-- List opportunities by stage
SELECT stage, COUNT(*), SUM(value) as total_value
FROM synthex_sales_opportunities
WHERE tenant_id = 'your-tenant-id' AND status = 'open'
GROUP BY stage;

-- Get opportunity activities timeline
SELECT a.created_at, a.type, a.content, a.next_action
FROM synthex_sales_activities a
WHERE a.opportunity_id = 'opportunity-id'
ORDER BY a.created_at DESC;
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================
