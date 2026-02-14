-- Migration 120: Production Recipe System
-- Phase 54: Automated marketing execution with recipe templates

-- Production recipes table
CREATE TABLE IF NOT EXISTS production_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  recipe_type TEXT NOT NULL CHECK (recipe_type IN ('monthly_strategy_pack', 'weekly_execution_pack', 'seo_content_bundle', 'social_post_bundle', 'visual_concept_bundle', 'review_pack_plus_report')),
  is_system BOOLEAN DEFAULT FALSE,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  outputs JSONB DEFAULT '[]'::jsonb,
  estimated_duration_hours INTEGER,
  requires_approval BOOLEAN DEFAULT TRUE,
  is_high_impact BOOLEAN DEFAULT FALSE,
  industry TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production packs (instances of recipes)
CREATE TABLE IF NOT EXISTS production_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  recipe_id UUID REFERENCES production_recipes(id) ON DELETE SET NULL,
  pack_type TEXT NOT NULL CHECK (pack_type IN ('monthly_strategy', 'weekly_execution', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'pending_review', 'approved', 'delivered', 'archived')),
  period_start DATE,
  period_end DATE,
  deliverables JSONB DEFAULT '[]'::jsonb,
  assets JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  delivered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pack deliverables
CREATE TABLE IF NOT EXISTS pack_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES production_packs(id) ON DELETE CASCADE,
  job_id UUID,
  title TEXT NOT NULL,
  deliverable_type TEXT NOT NULL CHECK (deliverable_type IN ('blog_post', 'social_post', 'email_template', 'video_script', 'visual_concept', 'seo_brief', 'report', 'case_study', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'ready', 'approved', 'rejected', 'delivered')),
  content JSONB DEFAULT '{}'::jsonb,
  file_url TEXT,
  preview_url TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT TRUE,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default recipes
INSERT INTO production_recipes (name, slug, recipe_type, description, is_system, is_high_impact, estimated_duration_hours, steps, outputs) VALUES
(
  'Monthly Strategy Pack',
  'monthly-strategy-pack',
  'monthly_strategy_pack',
  'Comprehensive monthly planning pack with content calendar, SEO focus, and performance review',
  TRUE,
  TRUE,
  8,
  '[
    {"step": 1, "title": "Review previous month performance", "action": "analyze_metrics"},
    {"step": 2, "title": "Identify content opportunities", "action": "keyword_research"},
    {"step": 3, "title": "Generate content calendar", "action": "create_calendar"},
    {"step": 4, "title": "Draft blog topics", "action": "generate_topics"},
    {"step": 5, "title": "Plan social media themes", "action": "social_planning"},
    {"step": 6, "title": "Create visual concepts", "action": "visual_brief"},
    {"step": 7, "title": "Compile strategy document", "action": "compile_pack"}
  ]'::jsonb,
  '["content_calendar", "blog_topics", "social_themes", "visual_concepts", "performance_summary"]'::jsonb
),
(
  'Weekly Execution Pack',
  'weekly-execution-pack',
  'weekly_execution_pack',
  'Ready-to-publish content for the week including posts, emails, and visuals',
  TRUE,
  FALSE,
  4,
  '[
    {"step": 1, "title": "Generate blog post draft", "action": "write_blog"},
    {"step": 2, "title": "Create social media posts", "action": "write_social"},
    {"step": 3, "title": "Draft email content", "action": "write_email"},
    {"step": 4, "title": "Generate visual assets", "action": "create_visuals"},
    {"step": 5, "title": "Package deliverables", "action": "compile_pack"}
  ]'::jsonb,
  '["blog_post", "social_posts", "email_template", "visual_assets"]'::jsonb
),
(
  'SEO Content Bundle',
  'seo-content-bundle',
  'seo_content_bundle',
  'SEO-optimized content package for targeting specific keywords',
  TRUE,
  FALSE,
  6,
  '[
    {"step": 1, "title": "Keyword research", "action": "keyword_research"},
    {"step": 2, "title": "Content brief creation", "action": "create_brief"},
    {"step": 3, "title": "Generate main article", "action": "write_article"},
    {"step": 4, "title": "Create supporting content", "action": "write_supporting"},
    {"step": 5, "title": "Internal linking suggestions", "action": "link_analysis"}
  ]'::jsonb,
  '["keyword_report", "content_brief", "main_article", "supporting_pages", "link_map"]'::jsonb
),
(
  'Social Post Bundle',
  'social-post-bundle',
  'social_post_bundle',
  'Multi-platform social media content package',
  TRUE,
  FALSE,
  3,
  '[
    {"step": 1, "title": "Generate post concepts", "action": "ideate"},
    {"step": 2, "title": "Write platform variants", "action": "write_variants"},
    {"step": 3, "title": "Create visual suggestions", "action": "visual_brief"},
    {"step": 4, "title": "Schedule recommendations", "action": "schedule_plan"}
  ]'::jsonb,
  '["linkedin_posts", "facebook_posts", "instagram_posts", "visual_briefs", "schedule"]'::jsonb
),
(
  'Visual Concept Bundle',
  'visual-concept-bundle',
  'visual_concept_bundle',
  'Brand-aligned visual concepts for marketing materials',
  TRUE,
  FALSE,
  4,
  '[
    {"step": 1, "title": "Review brand guidelines", "action": "brand_review"},
    {"step": 2, "title": "Generate concept ideas", "action": "ideate"},
    {"step": 3, "title": "Create visual briefs", "action": "create_briefs"},
    {"step": 4, "title": "Generate sample visuals", "action": "generate_visuals"}
  ]'::jsonb,
  '["concept_boards", "visual_briefs", "sample_images", "style_guide"]'::jsonb
),
(
  'Review Pack with Report',
  'review-pack-plus-report',
  'review_pack_plus_report',
  'Performance review package with analytics and recommendations',
  TRUE,
  TRUE,
  6,
  '[
    {"step": 1, "title": "Gather analytics data", "action": "collect_data"},
    {"step": 2, "title": "Analyze performance", "action": "analyze"},
    {"step": 3, "title": "Identify trends", "action": "trend_analysis"},
    {"step": 4, "title": "Generate recommendations", "action": "recommendations"},
    {"step": 5, "title": "Compile report", "action": "compile_report"}
  ]'::jsonb,
  '["analytics_summary", "trend_report", "recommendations", "action_items"]'::jsonb
);

-- Enable RLS
ALTER TABLE production_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_deliverables ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view system recipes"
  ON production_recipes FOR SELECT
  USING (is_system = TRUE);

CREATE POLICY "Users can view their org packs"
  ON production_packs FOR SELECT
  USING (organization_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org packs"
  ON production_packs FOR ALL
  USING (organization_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view deliverables for their packs"
  ON pack_deliverables FOR SELECT
  USING (pack_id IN (
    SELECT id FROM production_packs WHERE organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Users can manage deliverables for their packs"
  ON pack_deliverables FOR ALL
  USING (pack_id IN (
    SELECT id FROM production_packs WHERE organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Indexes
CREATE INDEX idx_production_packs_org ON production_packs(organization_id);
CREATE INDEX idx_production_packs_client ON production_packs(client_id);
CREATE INDEX idx_production_packs_status ON production_packs(status);
CREATE INDEX idx_production_packs_type ON production_packs(pack_type);
CREATE INDEX idx_pack_deliverables_pack ON pack_deliverables(pack_id);
CREATE INDEX idx_pack_deliverables_status ON pack_deliverables(status);
