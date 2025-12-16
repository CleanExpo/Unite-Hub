-- Migration 153: Campaign Blueprints Table
-- Purpose: Structured multi-channel campaign blueprints with approval workflows
-- Integrates with: Topic Discovery (v1_1_03), Brand Matrix (v1_1_02), Analytics (v1_1_07)

-- ============================================================================
-- 1. CAMPAIGN BLUEPRINTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Brand and Topic Linkage
  brand_slug TEXT NOT NULL,
  topic_id UUID, -- Reference to topic_discovery table (v1_1_03)
  topic_title TEXT NOT NULL,
  topic_keywords TEXT[] NOT NULL,

  -- Blueprint Metadata
  blueprint_title TEXT NOT NULL,
  blueprint_type TEXT NOT NULL CHECK (blueprint_type IN (
    'integrated_campaign',      -- Full multi-channel campaign
    'content_cluster',          -- Blog cluster with supporting content
    'product_launch',           -- Product/service launch campaign
    'seasonal_promotion',       -- Seasonal/event-based campaign
    'thought_leadership',       -- Educational/authority building
    'lead_nurture',            -- Lead nurturing sequence
    'brand_awareness'          -- Brand visibility campaign
  )),

  -- Campaign Objectives
  primary_objective TEXT NOT NULL CHECK (primary_objective IN (
    'traffic',
    'engagement',
    'conversions',
    'brand_awareness',
    'lead_generation',
    'customer_retention',
    'thought_leadership'
  )),
  target_audience JSONB NOT NULL, -- { segments: [], personas: [], industries: [] }

  -- Multi-Channel Content Structure (JSON)
  channels JSONB NOT NULL DEFAULT '{}', -- { website: {...}, blog: {...}, social: {...}, email: {...}, video: {...} }

  -- Channel-Specific Content
  website_content JSONB, -- { page_type, headline, sections, cta, seo_meta }
  blog_content JSONB,    -- { pillar_post, cluster_posts, internal_links, keywords }
  social_content JSONB,  -- { facebook, instagram, linkedin, tiktok, twitter }
  email_content JSONB,   -- { subject_lines, sequences, segments, automation }
  video_content JSONB,   -- { youtube_shorts, tiktok, reels, scripts }

  -- Visual Placeholders (VIF Integration)
  visual_concepts JSONB, -- { hero_image, carousel_images, video_thumbnails, infographics }
  vif_references TEXT[], -- Array of VIF prompt IDs for draft visuals

  -- Scoring and Priority
  difficulty_score INTEGER CHECK (difficulty_score >= 1 AND difficulty_score <= 10),
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
  effort_score INTEGER CHECK (effort_score >= 1 AND effort_score <= 10),
  priority_score NUMERIC(5,2), -- Calculated: (impact * 10) / (difficulty + effort)

  -- Analytics Integration (from v1_1_07)
  analytics_insights JSONB, -- { search_volume, competition, trending_keywords, opportunities }
  seo_recommendations JSONB, -- { target_keywords, content_gaps, competitor_analysis }

  -- Approval Workflow
  approval_status TEXT NOT NULL DEFAULT 'draft' CHECK (approval_status IN (
    'draft',
    'pending_review',
    'partially_approved', -- Some channels approved, others pending
    'approved',
    'rejected',
    'archived'
  )),
  channel_approvals JSONB DEFAULT '{}', -- { website: 'approved', blog: 'pending', ... }

  -- Production Engine Linkage
  production_engine_batch_id UUID, -- Link to Production Engine batch (future)
  exported_at TIMESTAMPTZ,
  published_channels TEXT[], -- Channels that have been published

  -- Brand Positioning Enforcement
  brand_voice_compliance BOOLEAN DEFAULT FALSE,
  positioning_validated BOOLEAN DEFAULT FALSE,
  cross_linking_rules JSONB, -- Brand-specific cross-linking strategy

  -- Truth Layer Compliance
  uncertainty_notes TEXT,
  data_sources TEXT[], -- Sources used to generate blueprint
  ai_confidence_score NUMERIC(3,2), -- 0.00-1.00
  requires_manual_review BOOLEAN DEFAULT TRUE,

  -- Audit Trail
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  rejected_reason TEXT,

  -- Performance Tracking (post-deployment)
  performance_metrics JSONB, -- { impressions, clicks, conversions, engagement_rate }

  CONSTRAINT valid_scores CHECK (
    difficulty_score IS NULL OR (difficulty_score >= 1 AND difficulty_score <= 10)
    AND impact_score IS NULL OR (impact_score >= 1 AND impact_score <= 10)
    AND effort_score IS NULL OR (effort_score >= 1 AND effort_score <= 10)
  )
);

-- Indexes
CREATE INDEX idx_campaign_blueprints_workspace ON campaign_blueprints(workspace_id);
CREATE INDEX idx_campaign_blueprints_brand ON campaign_blueprints(brand_slug);
CREATE INDEX idx_campaign_blueprints_topic ON campaign_blueprints(topic_id) WHERE topic_id IS NOT NULL;
CREATE INDEX idx_campaign_blueprints_status ON campaign_blueprints(approval_status);
CREATE INDEX idx_campaign_blueprints_type ON campaign_blueprints(blueprint_type);
CREATE INDEX idx_campaign_blueprints_priority ON campaign_blueprints(priority_score DESC NULLS LAST);
CREATE INDEX idx_campaign_blueprints_created ON campaign_blueprints(created_at DESC);

-- ============================================================================
-- 2. BLUEPRINT REVISIONS (Version History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_blueprint_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blueprint_id UUID NOT NULL REFERENCES campaign_blueprints(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  revision_number INTEGER NOT NULL,
  revision_note TEXT,

  -- Snapshot of blueprint at revision time
  blueprint_snapshot JSONB NOT NULL,

  -- Revision metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT unique_revision_number UNIQUE(blueprint_id, revision_number)
);

CREATE INDEX idx_blueprint_revisions_blueprint ON campaign_blueprint_revisions(blueprint_id);
CREATE INDEX idx_blueprint_revisions_created ON campaign_blueprint_revisions(created_at DESC);

-- ============================================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE campaign_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_blueprint_revisions ENABLE ROW LEVEL SECURITY;

-- Founder can manage all blueprints
CREATE POLICY campaign_blueprints_founder_policy ON campaign_blueprints
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = campaign_blueprints.workspace_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = campaign_blueprints.workspace_id
    )
  );

-- Service role for system operations
CREATE POLICY campaign_blueprints_service_policy ON campaign_blueprints
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Revisions policies
CREATE POLICY blueprint_revisions_founder_policy ON campaign_blueprint_revisions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = campaign_blueprint_revisions.workspace_id
    )
  );

CREATE POLICY blueprint_revisions_service_policy ON campaign_blueprint_revisions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Get blueprints by brand with filtering
CREATE OR REPLACE FUNCTION get_campaign_blueprints(
  p_workspace_id UUID,
  p_brand_slug TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  brand_slug TEXT,
  blueprint_title TEXT,
  blueprint_type TEXT,
  primary_objective TEXT,
  approval_status TEXT,
  priority_score NUMERIC,
  difficulty_score INTEGER,
  impact_score INTEGER,
  effort_score INTEGER,
  created_at TIMESTAMPTZ,
  channel_count INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cb.id,
    cb.brand_slug,
    cb.blueprint_title,
    cb.blueprint_type,
    cb.primary_objective,
    cb.approval_status,
    cb.priority_score,
    cb.difficulty_score,
    cb.impact_score,
    cb.effort_score,
    cb.created_at,
    (SELECT COUNT(*) FROM jsonb_object_keys(cb.channels)) as channel_count
  FROM campaign_blueprints cb
  WHERE cb.workspace_id = p_workspace_id
    AND (p_brand_slug IS NULL OR cb.brand_slug = p_brand_slug)
    AND (p_status IS NULL OR cb.approval_status = p_status)
    AND (p_type IS NULL OR cb.blueprint_type = p_type)
  ORDER BY cb.priority_score DESC NULLS LAST, cb.created_at DESC;
END;
$$;

-- Calculate priority score
CREATE OR REPLACE FUNCTION calculate_blueprint_priority(
  p_impact INTEGER,
  p_difficulty INTEGER,
  p_effort INTEGER
)
RETURNS NUMERIC(5,2)
LANGUAGE plpgsql IMMUTABLE
AS $$
BEGIN
  IF p_impact IS NULL OR p_difficulty IS NULL OR p_effort IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_difficulty + p_effort = 0 THEN
    RETURN 100.00;
  END IF;

  RETURN ROUND((p_impact::NUMERIC * 10) / (p_difficulty + p_effort), 2);
END;
$$;

-- Auto-update priority score on insert/update
CREATE OR REPLACE FUNCTION update_blueprint_priority()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.priority_score := calculate_blueprint_priority(
    NEW.impact_score,
    NEW.difficulty_score,
    NEW.effort_score
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_blueprint_priority
  BEFORE INSERT OR UPDATE OF impact_score, difficulty_score, effort_score
  ON campaign_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_blueprint_priority();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blueprint_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_blueprint_updated_at
  BEFORE UPDATE ON campaign_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_blueprint_updated_at();

-- Create revision on approval state change
CREATE OR REPLACE FUNCTION create_blueprint_revision()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_revision_number INTEGER;
BEGIN
  -- Only create revision if approval_status changed
  IF OLD.approval_status IS DISTINCT FROM NEW.approval_status THEN
    -- Get next revision number
    SELECT COALESCE(MAX(revision_number), 0) + 1
    INTO v_revision_number
    FROM campaign_blueprint_revisions
    WHERE blueprint_id = NEW.id;

    -- Insert revision
    INSERT INTO campaign_blueprint_revisions (
      blueprint_id,
      workspace_id,
      revision_number,
      revision_note,
      blueprint_snapshot,
      created_by
    ) VALUES (
      NEW.id,
      NEW.workspace_id,
      v_revision_number,
      'Status changed from ' || OLD.approval_status || ' to ' || NEW.approval_status,
      row_to_json(NEW)::JSONB,
      NEW.updated_by
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_blueprint_revision
  AFTER UPDATE ON campaign_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION create_blueprint_revision();

-- Get blueprint statistics by brand
CREATE OR REPLACE FUNCTION get_blueprint_stats(
  p_workspace_id UUID,
  p_brand_slug TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_blueprints', COUNT(*),
    'by_status', (
      SELECT json_object_agg(approval_status, cnt)
      FROM (
        SELECT approval_status, COUNT(*) as cnt
        FROM campaign_blueprints
        WHERE workspace_id = p_workspace_id
          AND (p_brand_slug IS NULL OR brand_slug = p_brand_slug)
        GROUP BY approval_status
      ) sub
    ),
    'by_type', (
      SELECT json_object_agg(blueprint_type, cnt)
      FROM (
        SELECT blueprint_type, COUNT(*) as cnt
        FROM campaign_blueprints
        WHERE workspace_id = p_workspace_id
          AND (p_brand_slug IS NULL OR brand_slug = p_brand_slug)
        GROUP BY blueprint_type
      ) sub
    ),
    'avg_priority_score', ROUND(AVG(priority_score), 2),
    'avg_impact_score', ROUND(AVG(impact_score), 2),
    'high_priority_count', COUNT(*) FILTER (WHERE priority_score >= 7.0),
    'pending_review_count', COUNT(*) FILTER (WHERE approval_status = 'pending_review')
  ) INTO v_result
  FROM campaign_blueprints
  WHERE workspace_id = p_workspace_id
    AND (p_brand_slug IS NULL OR brand_slug = p_brand_slug);

  RETURN v_result;
END;
$$;

-- Approve specific channel
CREATE OR REPLACE FUNCTION approve_blueprint_channel(
  p_blueprint_id UUID,
  p_channel TEXT,
  p_approved_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_channel_approvals JSONB;
  v_all_approved BOOLEAN;
BEGIN
  -- Get current channel approvals
  SELECT channel_approvals INTO v_channel_approvals
  FROM campaign_blueprints
  WHERE id = p_blueprint_id;

  -- Update channel approval
  v_channel_approvals := jsonb_set(
    COALESCE(v_channel_approvals, '{}'::JSONB),
    ARRAY[p_channel],
    '"approved"'::JSONB
  );

  -- Check if all channels are approved
  SELECT NOT EXISTS (
    SELECT 1
    FROM jsonb_each_text(v_channel_approvals)
    WHERE value != 'approved'
  ) INTO v_all_approved;

  -- Update blueprint
  UPDATE campaign_blueprints
  SET
    channel_approvals = v_channel_approvals,
    approval_status = CASE
      WHEN v_all_approved THEN 'approved'
      ELSE 'partially_approved'
    END,
    approved_at = CASE WHEN v_all_approved THEN NOW() ELSE approved_at END,
    approved_by = CASE WHEN v_all_approved THEN p_approved_by ELSE approved_by END,
    updated_by = p_approved_by
  WHERE id = p_blueprint_id;

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE campaign_blueprints IS 'Multi-channel campaign blueprints with structured content and approval workflows';
COMMENT ON TABLE campaign_blueprint_revisions IS 'Version history for campaign blueprints';
COMMENT ON FUNCTION get_campaign_blueprints IS 'Returns filtered list of campaign blueprints';
COMMENT ON FUNCTION calculate_blueprint_priority IS 'Calculates priority score: (impact * 10) / (difficulty + effort)';
COMMENT ON FUNCTION get_blueprint_stats IS 'Returns aggregated statistics for blueprints';
COMMENT ON FUNCTION approve_blueprint_channel IS 'Approves specific channel in blueprint and updates overall status';
