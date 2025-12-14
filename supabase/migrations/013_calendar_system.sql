-- Migration 013: Calendar System (Content Calendar, Personas, Strategies)
-- Created: 2025-11-16
-- Purpose: Support AI-powered content calendar generation and management

-- Create marketing_personas table
CREATE TABLE IF NOT EXISTS marketing_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Persona details
  persona_name TEXT NOT NULL,
  description TEXT,
  demographics JSONB DEFAULT '{}',  -- age, location, income, etc.
  pain_points TEXT[],
  goals TEXT[],
  preferred_channels TEXT[],  -- facebook, instagram, linkedin, etc.

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create marketing_strategies table
CREATE TABLE IF NOT EXISTS marketing_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Strategy details
  strategy_title TEXT NOT NULL,
  objectives TEXT[],
  content_pillars JSONB DEFAULT '[]',  -- Array of pillar objects with name, description
  target_platforms TEXT[],  -- facebook, instagram, linkedin, etc.
  posting_frequency JSONB DEFAULT '{}',  -- Platform-specific frequency

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create calendar_posts table (content calendar)
CREATE TABLE IF NOT EXISTS calendar_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES marketing_strategies(id) ON DELETE SET NULL,

  -- Scheduling
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'general')),
  post_type TEXT NOT NULL CHECK (post_type IN ('post', 'story', 'reel', 'carousel', 'video', 'article')),

  -- Content details
  content_pillar TEXT,
  suggested_copy TEXT NOT NULL,
  suggested_hashtags TEXT[],
  suggested_image_prompt TEXT,

  -- AI metadata
  ai_reasoning TEXT,
  best_time_to_post TEXT,
  target_audience TEXT,
  call_to_action TEXT,

  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published', 'archived')),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES user_profiles(id),
  published_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Indexes for marketing_personas
CREATE INDEX IF NOT EXISTS idx_personas_contact_id ON marketing_personas(contact_id);
CREATE INDEX IF NOT EXISTS idx_personas_workspace_id ON marketing_personas(workspace_id);
CREATE INDEX IF NOT EXISTS idx_personas_is_active ON marketing_personas(is_active);
-- Indexes for marketing_strategies
CREATE INDEX IF NOT EXISTS idx_strategies_contact_id ON marketing_strategies(contact_id);
CREATE INDEX IF NOT EXISTS idx_strategies_workspace_id ON marketing_strategies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_strategies_is_active ON marketing_strategies(is_active);
-- Indexes for calendar_posts
CREATE INDEX IF NOT EXISTS idx_calendar_posts_contact_id ON calendar_posts(contact_id);
CREATE INDEX IF NOT EXISTS idx_calendar_posts_workspace_id ON calendar_posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calendar_posts_strategy_id ON calendar_posts(strategy_id);
CREATE INDEX IF NOT EXISTS idx_calendar_posts_scheduled_date ON calendar_posts(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_posts_platform ON calendar_posts(platform);
CREATE INDEX IF NOT EXISTS idx_calendar_posts_status ON calendar_posts(status);
CREATE INDEX IF NOT EXISTS idx_calendar_posts_contact_scheduled ON calendar_posts(contact_id, scheduled_date DESC);
-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_personas_updated_at ON marketing_personas;
CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON marketing_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_strategies_updated_at ON marketing_strategies;
CREATE TRIGGER update_strategies_updated_at
  BEFORE UPDATE ON marketing_strategies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_calendar_posts_updated_at ON calendar_posts;
CREATE TRIGGER update_calendar_posts_updated_at
  BEFORE UPDATE ON calendar_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Enable RLS
ALTER TABLE marketing_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_posts ENABLE ROW LEVEL SECURITY;
-- RLS Policies for marketing_personas
DROP POLICY IF EXISTS "Users can view personas" ON marketing_personas;
CREATE POLICY "Users can view personas" ON marketing_personas
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage personas" ON marketing_personas;
CREATE POLICY "Service role can manage personas" ON marketing_personas
  FOR ALL USING (true);
-- RLS Policies for marketing_strategies
DROP POLICY IF EXISTS "Users can view strategies" ON marketing_strategies;
CREATE POLICY "Users can view strategies" ON marketing_strategies
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage strategies" ON marketing_strategies;
CREATE POLICY "Service role can manage strategies" ON marketing_strategies
  FOR ALL USING (true);
-- RLS Policies for calendar_posts
DROP POLICY IF EXISTS "Users can view calendar posts" ON calendar_posts;
CREATE POLICY "Users can view calendar posts" ON calendar_posts
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Service role can manage calendar posts" ON calendar_posts;
CREATE POLICY "Service role can manage calendar posts" ON calendar_posts
  FOR ALL USING (true);
-- Comments
COMMENT ON TABLE marketing_personas IS 'Marketing personas for content targeting';
COMMENT ON TABLE marketing_strategies IS 'Marketing strategies and content plans';
COMMENT ON TABLE calendar_posts IS 'AI-generated content calendar posts';
COMMENT ON COLUMN calendar_posts.suggested_copy IS 'AI-generated post copy';
COMMENT ON COLUMN calendar_posts.suggested_hashtags IS 'AI-suggested hashtags for the post';
COMMENT ON COLUMN calendar_posts.suggested_image_prompt IS 'DALL-E prompt for image generation';
COMMENT ON COLUMN calendar_posts.ai_reasoning IS 'AI explanation for content choices';
COMMENT ON COLUMN calendar_posts.best_time_to_post IS 'AI-suggested optimal posting time';
