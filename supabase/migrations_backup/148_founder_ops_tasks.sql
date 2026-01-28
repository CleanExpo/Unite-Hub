-- Migration 148: Founder Ops Tasks Table
-- Creates the founder_ops_tasks table for the Founder Ops Hub
-- with full RLS policies enforcing founder-only access.

-- Drop existing table if exists (for development)
DROP TABLE IF EXISTS founder_ops_tasks CASCADE;

-- Create founder_ops_tasks table
CREATE TABLE founder_ops_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  brand_slug TEXT NOT NULL,
  archetype TEXT NOT NULL CHECK (archetype IN (
    'social_post_single',
    'social_post_carousel',
    'blog_draft',
    'email_draft',
    'newsletter_draft',
    'ad_concept',
    'branding_variation',
    'video_script',
    'landing_page_copy',
    'case_study',
    'white_paper'
  )),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL CHECK (status IN (
    'draft',
    'scheduled',
    'in_progress',
    'pending_review',
    'approved',
    'rejected',
    'completed',
    'archived'
  )),
  channels TEXT[] NOT NULL,
  deadline TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  assigned_to TEXT, -- user_id or 'ai'
  metadata JSONB DEFAULT '{}',
  execution_result JSONB,
  approval_notes TEXT,
  rejection_reason TEXT,

  -- Constraints
  CONSTRAINT valid_brand_slug CHECK (brand_slug IN (
    'disaster-recovery',
    'synthex',
    'unite-group',
    'carsi',
    'nrpg'
  )),
  CONSTRAINT valid_channels CHECK (array_length(channels, 1) > 0),
  CONSTRAINT valid_scheduled_for CHECK (
    (status = 'scheduled' AND scheduled_for IS NOT NULL) OR
    (status != 'scheduled')
  )
);

-- Create indexes for common queries
CREATE INDEX idx_founder_ops_tasks_workspace ON founder_ops_tasks(workspace_id);
CREATE INDEX idx_founder_ops_tasks_brand ON founder_ops_tasks(brand_slug);
CREATE INDEX idx_founder_ops_tasks_status ON founder_ops_tasks(status);
CREATE INDEX idx_founder_ops_tasks_priority ON founder_ops_tasks(priority);
CREATE INDEX idx_founder_ops_tasks_scheduled ON founder_ops_tasks(scheduled_for);
CREATE INDEX idx_founder_ops_tasks_deadline ON founder_ops_tasks(deadline);
CREATE INDEX idx_founder_ops_tasks_created_by ON founder_ops_tasks(created_by);
CREATE INDEX idx_founder_ops_tasks_archetype ON founder_ops_tasks(archetype);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_founder_ops_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_founder_ops_tasks_updated_at
  BEFORE UPDATE ON founder_ops_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_founder_ops_tasks_updated_at();

-- Enable Row Level Security
ALTER TABLE founder_ops_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Founder can do all operations
CREATE POLICY founder_ops_tasks_founder_all_policy ON founder_ops_tasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = founder_ops_tasks.workspace_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = founder_ops_tasks.workspace_id
    )
  );

-- RLS Policy: Service role can do all operations (for system operations)
CREATE POLICY founder_ops_tasks_service_role_policy ON founder_ops_tasks
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Helper function: Get tasks by status
CREATE OR REPLACE FUNCTION get_founder_ops_tasks_by_status(
  p_workspace_id UUID,
  p_status TEXT
)
RETURNS TABLE (
  id UUID,
  brand_slug TEXT,
  archetype TEXT,
  title TEXT,
  priority TEXT,
  status TEXT,
  channels TEXT[],
  deadline TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.brand_slug,
    t.archetype,
    t.title,
    t.priority,
    t.status,
    t.channels,
    t.deadline,
    t.scheduled_for,
    t.created_at,
    t.updated_at,
    t.metadata
  FROM founder_ops_tasks t
  WHERE t.workspace_id = p_workspace_id
  AND t.status = p_status
  ORDER BY t.priority DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get tasks by brand
CREATE OR REPLACE FUNCTION get_founder_ops_tasks_by_brand(
  p_workspace_id UUID,
  p_brand_slug TEXT
)
RETURNS TABLE (
  id UUID,
  archetype TEXT,
  title TEXT,
  priority TEXT,
  status TEXT,
  channels TEXT[],
  deadline TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.archetype,
    t.title,
    t.priority,
    t.status,
    t.channels,
    t.deadline,
    t.scheduled_for,
    t.created_at,
    t.metadata
  FROM founder_ops_tasks t
  WHERE t.workspace_id = p_workspace_id
  AND t.brand_slug = p_brand_slug
  ORDER BY t.priority DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get brand task metrics
CREATE OR REPLACE FUNCTION get_brand_task_metrics(
  p_workspace_id UUID,
  p_brand_slug TEXT
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'brand_slug', p_brand_slug,
    'total_tasks', COUNT(*),
    'by_status', json_object_agg(
      COALESCE(status, 'unknown'),
      status_count
    ),
    'by_priority', json_object_agg(
      COALESCE(priority, 'unknown'),
      priority_count
    ),
    'pending_approvals', SUM(CASE WHEN status = 'pending_review' THEN 1 ELSE 0 END),
    'next_deadline', MIN(deadline) FILTER (WHERE deadline > NOW())
  ) INTO v_result
  FROM (
    SELECT
      status,
      priority,
      deadline,
      COUNT(*) OVER (PARTITION BY status) as status_count,
      COUNT(*) OVER (PARTITION BY priority) as priority_count
    FROM founder_ops_tasks
    WHERE workspace_id = p_workspace_id
    AND brand_slug = p_brand_slug
    AND status NOT IN ('completed', 'archived')
  ) t;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE founder_ops_tasks IS 'Stores all Founder Ops Hub tasks with brand-aware routing and status management';
COMMENT ON COLUMN founder_ops_tasks.brand_slug IS 'Brand slug (disaster-recovery, synthex, unite-group, carsi, nrpg)';
COMMENT ON COLUMN founder_ops_tasks.archetype IS 'Task archetype (social_post_single, blog_draft, etc.)';
COMMENT ON COLUMN founder_ops_tasks.status IS 'Task lifecycle status (draft → scheduled → in_progress → pending_review → approved → completed)';
COMMENT ON COLUMN founder_ops_tasks.metadata IS 'Additional task metadata including brand context, AI-generated flags, etc.';
COMMENT ON COLUMN founder_ops_tasks.execution_result IS 'Result of task execution including content IDs, visual asset IDs, etc.';
