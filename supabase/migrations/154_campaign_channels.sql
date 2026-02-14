-- Migration 154: Campaign Channels Configuration
-- Purpose: Defines allowed publishing channels and per-brand permissions
-- Integrates with: Brand Matrix (v1_1_02), Campaign Blueprints (153)

-- ============================================================================
-- 1. CAMPAIGN CHANNELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Channel Identification
  channel_slug TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  channel_category TEXT NOT NULL CHECK (channel_category IN (
    'website',
    'blog',
    'social',
    'email',
    'video',
    'advertising'
  )),

  -- Channel Configuration
  platform TEXT, -- e.g., 'facebook', 'instagram', 'linkedin', 'youtube', 'tiktok'
  is_active BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT TRUE,

  -- Brand-Specific Permissions
  allowed_brands TEXT[] NOT NULL, -- Array of brand slugs that can use this channel

  -- Channel Specifications
  specs JSONB, -- { max_characters, image_dimensions, video_length, etc. }
  best_practices JSONB, -- { posting_frequency, optimal_times, content_guidelines }

  -- Publishing Configuration
  auto_publish_enabled BOOLEAN DEFAULT FALSE,
  scheduling_enabled BOOLEAN DEFAULT TRUE,
  cross_posting_rules JSONB, -- Rules for cross-posting to other channels

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Keep FK reference to auth.users (allowed in migrations)
updated_by UUID REFERENCES auth.users(id),

  CONSTRAINT unique_channel_workspace UNIQUE(workspace_id, channel_slug)
);

-- Indexes
CREATE INDEX idx_campaign_channels_workspace ON campaign_channels(workspace_id);
CREATE INDEX idx_campaign_channels_slug ON campaign_channels(channel_slug);
CREATE INDEX idx_campaign_channels_category ON campaign_channels(channel_category);
CREATE INDEX idx_campaign_channels_active ON campaign_channels(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- 2. CHANNEL TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS channel_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES campaign_channels(id) ON DELETE CASCADE,

  -- Template Metadata
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN (
    'post',
    'story',
    'reel',
    'article',
    'email',
    'video_script',
    'ad_copy',
    'carousel'
  )),

  -- Template Structure
  structure JSONB NOT NULL, -- { sections: [], placeholders: [], required_fields: [] }
  default_content JSONB, -- Default values for fields

  -- Brand Specificity
  brand_slug TEXT,
  brand_voice_rules JSONB, -- Brand-specific tone and messaging rules

  -- Usage Tracking
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id),

  CONSTRAINT unique_template_name UNIQUE(workspace_id, channel_id, template_name)
);

CREATE INDEX idx_channel_templates_channel ON channel_templates(channel_id);
CREATE INDEX idx_channel_templates_brand ON channel_templates(brand_slug) WHERE brand_slug IS NOT NULL;
CREATE INDEX idx_channel_templates_type ON channel_templates(template_type);

-- ============================================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE campaign_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_templates ENABLE ROW LEVEL SECURITY;

-- Founder can manage all channels
CREATE POLICY campaign_channels_founder_policy ON campaign_channels
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = campaign_channels.workspace_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = campaign_channels.workspace_id
    )
  );

CREATE POLICY channel_templates_founder_policy ON channel_templates
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = channel_templates.workspace_id
    )
  );

-- Service role policies
CREATE POLICY campaign_channels_service_policy ON campaign_channels
  FOR ALL TO service_role
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true)
  WITH CHECK (true);

CREATE POLICY channel_templates_service_policy ON channel_templates
  FOR ALL TO service_role
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true)
  WITH CHECK (true);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Get active channels for a brand
CREATE OR REPLACE FUNCTION get_brand_channels(
  p_workspace_id UUID,
  p_brand_slug TEXT
)
RETURNS TABLE (
  id UUID,
  channel_slug TEXT,
  channel_name TEXT,
  channel_category TEXT,
  platform TEXT,
  requires_approval BOOLEAN,
  specs JSONB,
  best_practices JSONB
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cc.id,
    cc.channel_slug,
    cc.channel_name,
    cc.channel_category,
    cc.platform,
    cc.requires_approval,
    cc.specs,
    cc.best_practices
  FROM campaign_channels cc
  WHERE cc.workspace_id = p_workspace_id
    AND cc.is_active = TRUE
    AND p_brand_slug = ANY(cc.allowed_brands)
  ORDER BY cc.channel_category, cc.channel_name;
END;
$$;

-- Get channel templates
CREATE OR REPLACE FUNCTION get_channel_templates(
  p_workspace_id UUID,
  p_channel_id UUID,
  p_brand_slug TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  template_name TEXT,
  template_type TEXT,
  structure JSONB,
  usage_count INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ct.id,
    ct.template_name,
    ct.template_type,
    ct.structure,
    ct.usage_count
  FROM channel_templates ct
  WHERE ct.workspace_id = p_workspace_id
    AND ct.channel_id = p_channel_id
    AND (p_brand_slug IS NULL OR ct.brand_slug = p_brand_slug OR ct.brand_slug IS NULL)
  ORDER BY ct.usage_count DESC, ct.created_at DESC;
END;
$$;

-- Increment template usage
CREATE OR REPLACE FUNCTION increment_template_usage(
  p_template_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE channel_templates
  SET
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE id = p_template_id;
END;
$$;

-- ============================================================================
-- 5. SEED DEFAULT CHANNELS
-- ============================================================================

-- Function to seed default channels for a workspace
CREATE OR REPLACE FUNCTION seed_default_channels(
  p_workspace_id UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Website Channels
  INSERT INTO campaign_channels (workspace_id, channel_slug, channel_name, channel_category, allowed_brands, specs, best_practices)
  VALUES
    (
      p_workspace_id,
      'website_landing_page',
      'Website Landing Page',
      'website',
      ARRAY['unite_group', 'aussie_stainless', 'rp_tech', 'bne_glass_pool_fencing', 'ultra_chrome'],
      '{"seo_optimized": true, "sections": ["hero", "benefits", "features", "testimonials", "cta"]}'::JSONB,
      '{"focus": "conversion", "cta_placement": "above_fold", "load_time": "< 3s"}'::JSONB
    ),
    (
      p_workspace_id,
      'website_product_page',
      'Website Product Page',
      'website',
      ARRAY['unite_group', 'aussie_stainless', 'rp_tech', 'bne_glass_pool_fencing', 'ultra_chrome'],
      '{"seo_optimized": true, "schema_markup": true, "sections": ["specs", "gallery", "pricing", "faq"]}'::JSONB,
      '{"focus": "information", "images": "high_quality", "specifications": "detailed"}'::JSONB
    );

  -- Blog Channels
  INSERT INTO campaign_channels (workspace_id, channel_slug, channel_name, channel_category, allowed_brands, specs, best_practices)
  VALUES
    (
      p_workspace_id,
      'blog_pillar_post',
      'Blog Pillar Post',
      'blog',
      ARRAY['unite_group', 'aussie_stainless', 'rp_tech', 'bne_glass_pool_fencing', 'ultra_chrome'],
      '{"word_count": "2500-4000", "headings": "H1-H4", "images": "5-10", "internal_links": "10-15"}'::JSONB,
      '{"depth": "comprehensive", "keyword_focus": "primary", "update_frequency": "quarterly"}'::JSONB
    ),
    (
      p_workspace_id,
      'blog_cluster_post',
      'Blog Cluster Post',
      'blog',
      ARRAY['unite_group', 'aussie_stainless', 'rp_tech', 'bne_glass_pool_fencing', 'ultra_chrome'],
      '{"word_count": "1000-1500", "headings": "H2-H3", "images": "2-4", "internal_links": "3-5"}'::JSONB,
      '{"depth": "focused", "keyword_focus": "long_tail", "link_to_pillar": true}'::JSONB
    );

  -- Social Media Channels
  INSERT INTO campaign_channels (workspace_id, channel_slug, channel_name, channel_category, platform, allowed_brands, specs, best_practices)
  VALUES
    (
      p_workspace_id,
      'facebook_post',
      'Facebook Post',
      'social',
      'facebook',
      ARRAY['unite_group', 'aussie_stainless', 'rp_tech', 'bne_glass_pool_fencing', 'ultra_chrome'],
      '{"max_characters": 63206, "optimal_length": "40-80", "image_ratio": "1.91:1", "video_length": "< 240s"}'::JSONB,
      '{"post_frequency": "1-2 daily", "best_times": ["9am", "1pm", "3pm"], "engagement": "ask_questions"}'::JSONB
    ),
    (
      p_workspace_id,
      'instagram_post',
      'Instagram Post',
      'social',
      'instagram',
      ARRAY['unite_group', 'aussie_stainless', 'bne_glass_pool_fencing', 'ultra_chrome'],
      '{"max_characters": 2200, "optimal_length": 125, "image_ratio": "1:1", "hashtags": "20-30"}'::JSONB,
      '{"post_frequency": "1-2 daily", "best_times": ["11am", "1pm", "7pm"], "visual_quality": "high"}'::JSONB
    ),
    (
      p_workspace_id,
      'linkedin_post',
      'LinkedIn Post',
      'social',
      'linkedin',
      ARRAY['unite_group', 'rp_tech'],
      '{"max_characters": 3000, "optimal_length": "1300", "image_ratio": "1.91:1", "hashtags": "3-5"}'::JSONB,
      '{"post_frequency": "3-5 weekly", "best_times": ["Tue-Thu 8-10am"], "tone": "professional"}'::JSONB
    ),
    (
      p_workspace_id,
      'tiktok_video',
      'TikTok Video',
      'video',
      'tiktok',
      ARRAY['unite_group', 'aussie_stainless', 'bne_glass_pool_fencing', 'ultra_chrome'],
      '{"video_length": "21-34s", "aspect_ratio": "9:16", "caption": "< 150 chars", "hashtags": "3-5"}'::JSONB,
      '{"hook": "1-3s", "trending_audio": true, "call_to_action": "clear"}'::JSONB
    ),
    (
      p_workspace_id,
      'youtube_short',
      'YouTube Short',
      'video',
      'youtube',
      ARRAY['unite_group', 'aussie_stainless', 'rp_tech', 'bne_glass_pool_fencing', 'ultra_chrome'],
      '{"video_length": "< 60s", "aspect_ratio": "9:16", "title": "< 100 chars"}'::JSONB,
      '{"hook": "first_3s", "description": "keyword_rich", "end_screen": "subscribe_cta"}'::JSONB
    );

  -- Email Channels
  INSERT INTO campaign_channels (workspace_id, channel_slug, channel_name, channel_category, allowed_brands, specs, best_practices)
  VALUES
    (
      p_workspace_id,
      'email_newsletter',
      'Email Newsletter',
      'email',
      ARRAY['unite_group', 'aussie_stainless', 'rp_tech', 'bne_glass_pool_fencing', 'ultra_chrome'],
      '{"subject_line": "< 50 chars", "preview_text": "< 90 chars", "body": "< 500 words"}'::JSONB,
      '{"frequency": "weekly", "send_time": "Tue 9am", "mobile_optimized": true}'::JSONB
    ),
    (
      p_workspace_id,
      'email_nurture_sequence',
      'Email Nurture Sequence',
      'email',
      ARRAY['unite_group', 'aussie_stainless', 'rp_tech', 'bne_glass_pool_fencing', 'ultra_chrome'],
      '{"sequence_length": "5-7 emails", "interval": "3-5 days", "personalization": true}'::JSONB,
      '{"goal": "conversion", "segment_specific": true, "ab_test": true}'::JSONB
    );

END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE campaign_channels IS 'Defines allowed publishing channels with per-brand permissions';
COMMENT ON TABLE channel_templates IS 'Reusable content templates for each channel';
COMMENT ON FUNCTION get_brand_channels IS 'Returns active channels available for a specific brand';
COMMENT ON FUNCTION get_channel_templates IS 'Returns templates for a channel, optionally filtered by brand';
COMMENT ON FUNCTION seed_default_channels IS 'Seeds default channels for a new workspace';
