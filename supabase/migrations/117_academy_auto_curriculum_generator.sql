-- Migration 117: Academy Auto-Curriculum Generator
-- Required by Phase 65 - Academy Auto-Curriculum Generator (AACG)
-- Auto-generated curriculum based on brand needs

-- Auto curriculum jobs table
CREATE TABLE IF NOT EXISTS auto_curriculum_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL,
  org_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  course_ids JSONB DEFAULT '[]'::jsonb,
  analysis JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT auto_curriculum_jobs_status_check CHECK (
    status IN ('pending', 'analyzing', 'generating', 'review', 'approved', 'rejected', 'failed')
  ),

  -- Foreign keys
  CONSTRAINT auto_curriculum_jobs_brand_fk
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  CONSTRAINT auto_curriculum_jobs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auto_curriculum_jobs_brand ON auto_curriculum_jobs(brand_id);
CREATE INDEX IF NOT EXISTS idx_auto_curriculum_jobs_org ON auto_curriculum_jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_auto_curriculum_jobs_status ON auto_curriculum_jobs(status);
CREATE INDEX IF NOT EXISTS idx_auto_curriculum_jobs_created ON auto_curriculum_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE auto_curriculum_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY auto_curriculum_jobs_select ON auto_curriculum_jobs
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY auto_curriculum_jobs_insert ON auto_curriculum_jobs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY auto_curriculum_jobs_update ON auto_curriculum_jobs
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE auto_curriculum_jobs IS 'Auto-generated curriculum jobs (Phase 65)';
