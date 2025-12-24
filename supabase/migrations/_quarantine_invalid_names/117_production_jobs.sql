-- Migration 117: Production Jobs System
-- Phase 50: Automated production pipeline for client marketing assets

-- Production jobs table
CREATE TABLE IF NOT EXISTS production_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Job details
  job_type TEXT NOT NULL CHECK (job_type IN (
    'content', 'visual', 'brand', 'social', 'seo', 'website', 'voice'
  )),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Workflow status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'queued', 'processing', 'draft', 'review',
    'revision', 'approved', 'completed', 'cancelled', 'failed'
  )),
  mode TEXT DEFAULT 'draft' CHECK (mode IN ('draft', 'refine', 'final')),

  -- Input data
  input_data JSONB DEFAULT '{}'::jsonb,
  source TEXT CHECK (source IN ('roadmap', 'voice', 'text', 'chatbot', 'manual')),
  source_id UUID,

  -- Output data
  output_data JSONB DEFAULT '[]'::jsonb,
  output_urls JSONB DEFAULT '[]'::jsonb,

  -- AI generation metadata
  ai_model_used TEXT,
  generation_cost DECIMAL(10,4) DEFAULT 0,
  generation_time_ms INTEGER,
  tokens_used INTEGER,

  -- Approval workflow
  requires_client_approval BOOLEAN DEFAULT true,
  requires_owner_oversight BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  revision_count INTEGER DEFAULT 0,
  revision_notes TEXT,

  -- Safety
  safety_score INTEGER DEFAULT 100 CHECK (safety_score >= 0 AND safety_score <= 100),
  safety_flags JSONB DEFAULT '[]'::jsonb,
  truth_layer_verified BOOLEAN DEFAULT false,

  -- Timestamps
  queued_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production outputs table (individual deliverables)
CREATE TABLE IF NOT EXISTS production_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES production_jobs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Output details
  output_type TEXT NOT NULL CHECK (output_type IN (
    'text', 'markdown', 'html', 'image', 'video', 'audio',
    'pdf', 'json', 'svg', 'script'
  )),
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  thumbnail_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  format_specs JSONB DEFAULT '{}'::jsonb,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'archived')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production job history (audit trail)
CREATE TABLE IF NOT EXISTS production_job_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES production_jobs(id) ON DELETE CASCADE,

  -- Event details
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'queued', 'started', 'completed', 'failed',
    'approved', 'rejected', 'revision_requested', 'cancelled'
  )),
  previous_status TEXT,
  new_status TEXT,
  user_id UUID REFERENCES auth.users(id),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production templates (reusable job templates)
CREATE TABLE IF NOT EXISTS production_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Template details
  name TEXT NOT NULL,
  job_type TEXT NOT NULL,
  description TEXT,
  input_schema JSONB DEFAULT '{}'::jsonb,
  default_settings JSONB DEFAULT '{}'::jsonb,

  -- Usage
  times_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_production_jobs_client ON production_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_org ON production_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_status ON production_jobs(status);
CREATE INDEX IF NOT EXISTS idx_production_jobs_type ON production_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_production_jobs_priority ON production_jobs(priority);
CREATE INDEX IF NOT EXISTS idx_production_jobs_created ON production_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_outputs_job ON production_outputs(job_id);
CREATE INDEX IF NOT EXISTS idx_production_outputs_client ON production_outputs(client_id);
CREATE INDEX IF NOT EXISTS idx_production_history_job ON production_job_history(job_id);
CREATE INDEX IF NOT EXISTS idx_production_templates_org ON production_templates(organization_id);

-- RLS Policies
ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_job_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_templates ENABLE ROW LEVEL SECURITY;

-- Clients can view their own jobs
CREATE POLICY "clients_view_own_jobs" ON production_jobs
  FOR SELECT USING (auth.uid() = client_id);

-- Clients can insert jobs (requests)
CREATE POLICY "clients_insert_own_jobs" ON production_jobs
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Clients can update their own jobs (cancel, approve)
CREATE POLICY "clients_update_own_jobs" ON production_jobs
  FOR UPDATE USING (auth.uid() = client_id);

-- Staff can view all jobs in their org
CREATE POLICY "staff_view_org_jobs" ON production_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.org_id = production_jobs.organization_id
      AND uo.role IN ('owner', 'admin', 'staff')
    )
  );

-- Staff can update jobs (process, approve)
CREATE POLICY "staff_update_org_jobs" ON production_jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.org_id = production_jobs.organization_id
      AND uo.role IN ('owner', 'admin', 'staff')
    )
  );

-- Clients can view their own outputs
CREATE POLICY "clients_view_own_outputs" ON production_outputs
  FOR SELECT USING (auth.uid() = client_id);

-- Staff can view all outputs in their org
CREATE POLICY "staff_view_org_outputs" ON production_outputs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM production_jobs pj
      JOIN user_organizations uo ON uo.org_id = pj.organization_id
      WHERE pj.id = production_outputs.job_id
      AND uo.user_id = auth.uid()
      AND uo.role IN ('owner', 'admin', 'staff')
    )
  );

-- History policies
CREATE POLICY "clients_view_own_history" ON production_job_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM production_jobs pj
      WHERE pj.id = production_job_history.job_id
      AND pj.client_id = auth.uid()
    )
  );

CREATE POLICY "staff_view_org_history" ON production_job_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM production_jobs pj
      JOIN user_organizations uo ON uo.org_id = pj.organization_id
      WHERE pj.id = production_job_history.job_id
      AND uo.user_id = auth.uid()
      AND uo.role IN ('owner', 'admin', 'staff')
    )
  );

-- Template policies
CREATE POLICY "staff_view_org_templates" ON production_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
      AND uo.org_id = production_templates.organization_id
      AND uo.role IN ('owner', 'admin', 'staff')
    )
  );

-- Service role can do everything
CREATE POLICY "service_role_jobs" ON production_jobs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_outputs" ON production_outputs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_history" ON production_job_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_templates" ON production_templates
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Update timestamp trigger
CREATE TRIGGER update_production_jobs_timestamp
  BEFORE UPDATE ON production_jobs
  FOR EACH ROW EXECUTE FUNCTION update_launch_kit_timestamp();

CREATE TRIGGER update_production_templates_timestamp
  BEFORE UPDATE ON production_templates
  FOR EACH ROW EXECUTE FUNCTION update_launch_kit_timestamp();

-- Comments
COMMENT ON TABLE production_jobs IS 'Client marketing production jobs with approval workflow';
COMMENT ON TABLE production_outputs IS 'Individual deliverables from production jobs';
COMMENT ON TABLE production_job_history IS 'Audit trail for production job changes';
COMMENT ON TABLE production_templates IS 'Reusable production job templates';
