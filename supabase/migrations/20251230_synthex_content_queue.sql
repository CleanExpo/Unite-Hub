-- Synthex Content Queue Table
-- Manages scheduled social posts and content across all tiers

CREATE TABLE IF NOT EXISTS synthex_content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Content details
  content_type TEXT NOT NULL CHECK (content_type IN ('social_post', 'blog_post', 'email', 'video', 'ad_copy')),
  platform TEXT CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube', 'email')),
  title TEXT,
  body TEXT NOT NULL,
  media_urls TEXT[], -- Array of image/video URLs
  hashtags TEXT[],

  -- Scheduling
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'published', 'failed', 'cancelled')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Tier limits
  tier TEXT NOT NULL CHECK (tier IN ('starter', 'professional', 'elite')),
  weekly_limit INTEGER, -- NULL for unlimited (elite)

  -- AI generation metadata
  generated_by TEXT, -- Agent name
  prompt_used TEXT,
  industry TEXT,
  brand_voice JSONB,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_synthex_content_queue_workspace ON synthex_content_queue(workspace_id);
CREATE INDEX IF NOT EXISTS idx_synthex_content_queue_status ON synthex_content_queue(status);
CREATE INDEX IF NOT EXISTS idx_synthex_content_queue_scheduled ON synthex_content_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_synthex_content_queue_tier ON synthex_content_queue(tier);

-- RLS Policies
ALTER TABLE synthex_content_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON synthex_content_queue;
CREATE POLICY "tenant_isolation" ON synthex_content_queue
FOR ALL USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_synthex_content_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_synthex_content_queue_updated_at ON synthex_content_queue;
CREATE TRIGGER trigger_synthex_content_queue_updated_at
  BEFORE UPDATE ON synthex_content_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_synthex_content_queue_updated_at();
