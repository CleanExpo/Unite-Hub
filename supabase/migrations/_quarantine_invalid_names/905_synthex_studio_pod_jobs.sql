-- Migration 905: Synthex Studio Pod - Multi-Stage Content Synthesis Jobs
-- Tracks research → script → visual → voice synthesis pipeline
-- Week 4 enhancement for v2.0

CREATE TABLE IF NOT EXISTS synthex_studio_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  platforms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  stages JSONB NOT NULL DEFAULT '["research", "script", "visual", "voice"]'::jsonb,
  current_stage TEXT DEFAULT 'research' CHECK (current_stage IN ('research', 'script', 'visual', 'voice', 'completed', 'failed')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stage_results JSONB DEFAULT '{}'::jsonb,
  research_data JSONB,
  script_data JSONB,
  visual_data JSONB,
  voice_data JSONB,
  final_output JSONB,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track stage transitions for debugging
CREATE TABLE IF NOT EXISTS synthex_studio_stage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_job_id UUID NOT NULL REFERENCES synthex_studio_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  error JSONB,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Templates for studio workflows
CREATE TABLE IF NOT EXISTS synthex_studio_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('promotional', 'educational', 'testimonial', 'product_demo', 'behind_the_scenes')),
  script_template TEXT,
  visual_style_description TEXT,
  platforms TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommended_duration_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, name)
);

-- Cost tracking for multi-stage workflows
CREATE TABLE IF NOT EXISTS synthex_studio_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_job_id UUID NOT NULL REFERENCES synthex_studio_jobs(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd NUMERIC(10, 4),
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_studio_jobs_workspace ON synthex_studio_jobs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_studio_jobs_status ON synthex_studio_jobs(status);
CREATE INDEX IF NOT EXISTS idx_studio_jobs_created ON synthex_studio_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_studio_jobs_stage ON synthex_studio_jobs(current_stage);

CREATE INDEX IF NOT EXISTS idx_stage_logs_job ON synthex_studio_stage_logs(studio_job_id);
CREATE INDEX IF NOT EXISTS idx_stage_logs_stage ON synthex_studio_stage_logs(stage);

CREATE INDEX IF NOT EXISTS idx_studio_templates_workspace ON synthex_studio_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_studio_templates_category ON synthex_studio_templates(category);

CREATE INDEX IF NOT EXISTS idx_studio_costs_job ON synthex_studio_costs(studio_job_id);
CREATE INDEX IF NOT EXISTS idx_studio_costs_stage ON synthex_studio_costs(stage);

-- Enable RLS
ALTER TABLE synthex_studio_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_studio_stage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_studio_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_studio_costs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for studio jobs
DROP POLICY IF EXISTS "studio_jobs_tenant_isolation" ON synthex_studio_jobs;
CREATE POLICY "studio_jobs_tenant_isolation" ON synthex_studio_jobs
  FOR ALL
  USING (workspace_id = (SELECT current_setting('request.jwt.claims', true)::jsonb->>'workspace_id')::uuid);

-- RLS Policies for stage logs
DROP POLICY IF EXISTS "stage_logs_tenant_isolation" ON synthex_studio_stage_logs;
CREATE POLICY "stage_logs_tenant_isolation" ON synthex_studio_stage_logs
  FOR ALL
  USING (
    studio_job_id IN (
      SELECT id FROM synthex_studio_jobs
      WHERE workspace_id = (SELECT current_setting('request.jwt.claims', true)::jsonb->>'workspace_id')::uuid
    )
  );

-- RLS Policies for templates
DROP POLICY IF EXISTS "studio_templates_tenant_isolation" ON synthex_studio_templates;
CREATE POLICY "studio_templates_tenant_isolation" ON synthex_studio_templates
  FOR ALL
  USING (workspace_id = (SELECT current_setting('request.jwt.claims', true)::jsonb->>'workspace_id')::uuid);

-- RLS Policies for costs
DROP POLICY IF EXISTS "studio_costs_tenant_isolation" ON synthex_studio_costs;
CREATE POLICY "studio_costs_tenant_isolation" ON synthex_studio_costs
  FOR ALL
  USING (
    studio_job_id IN (
      SELECT id FROM synthex_studio_jobs
      WHERE workspace_id = (SELECT current_setting('request.jwt.claims', true)::jsonb->>'workspace_id')::uuid
    )
  );

-- Comments
COMMENT ON TABLE synthex_studio_jobs IS 'Multi-stage content synthesis jobs: research → script → visual → voice → final output';
COMMENT ON TABLE synthex_studio_stage_logs IS 'Audit trail of each pipeline stage with inputs, outputs, and performance metrics';
COMMENT ON TABLE synthex_studio_templates IS 'Pre-built templates for common studio workflows (promotional, educational, testimonial, etc.)';
COMMENT ON TABLE synthex_studio_costs IS 'Cost tracking for each stage and AI provider call';
