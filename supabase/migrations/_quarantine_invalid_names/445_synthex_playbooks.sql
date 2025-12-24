-- =====================================================
-- Migration 445: Synthex Guided Playbooks & In-App Coach
-- Phase B42: Guided Playbooks & In-App Coach
-- =====================================================
-- Playbook system for guided marketing workflows,
-- onboarding journeys, and AI-powered in-app coaching
-- =====================================================

-- =====================================================
-- Table: synthex_playbooks
-- Main playbook definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
        'onboarding', 'lead_nurture', 'sales_enablement',
        'campaign_launch', 'content_creation', 'automation',
        'analytics', 'integration', 'general'
    )),
    difficulty TEXT NOT NULL DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    estimated_minutes INT DEFAULT 30,
    -- Scope: global = shared by all tenants, tenant = private
    scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'tenant')),
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    -- Prerequisites
    prerequisites TEXT[],
    -- Outcomes
    outcomes TEXT[],
    -- Metadata
    icon TEXT,
    cover_image_url TEXT,
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_playbooks IS 'Guided playbooks for marketing workflows';
COMMENT ON COLUMN synthex_playbooks.category IS 'Type of playbook';
COMMENT ON COLUMN synthex_playbooks.difficulty IS 'Skill level required';
COMMENT ON COLUMN synthex_playbooks.scope IS 'global for shared, tenant for private';

-- =====================================================
-- Table: synthex_playbook_steps
-- Individual steps within a playbook
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_playbook_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID NOT NULL REFERENCES synthex_playbooks(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    -- Step type
    step_type TEXT NOT NULL DEFAULT 'action' CHECK (step_type IN (
        'action', 'info', 'decision', 'integration', 'ai_task', 'verification'
    )),
    -- Content (markdown supported)
    content TEXT,
    -- Action configuration
    action_type TEXT,
    action_config JSONB DEFAULT '{}',
    -- Target URL or component
    target_url TEXT,
    target_selector TEXT,
    -- Completion criteria
    completion_type TEXT NOT NULL DEFAULT 'manual' CHECK (completion_type IN (
        'manual', 'auto', 'api_check', 'form_submit'
    )),
    completion_config JSONB DEFAULT '{}',
    -- Tips and hints
    tips TEXT[],
    -- Metadata
    is_optional BOOLEAN DEFAULT false,
    estimated_seconds INT DEFAULT 60,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_playbook_steps IS 'Steps within a playbook';
COMMENT ON COLUMN synthex_playbook_steps.step_type IS 'Type of step (action, info, decision, etc.)';
COMMENT ON COLUMN synthex_playbook_steps.action_type IS 'Specific action to perform';

-- =====================================================
-- Table: synthex_playbook_progress
-- User progress through playbooks
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_playbook_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    playbook_id UUID NOT NULL REFERENCES synthex_playbooks(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
        'not_started', 'in_progress', 'completed', 'skipped', 'abandoned'
    )),
    current_step_id UUID REFERENCES synthex_playbook_steps(id),
    completed_step_ids UUID[],
    skipped_step_ids UUID[],
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT now(),
    -- User notes and data collected
    notes JSONB DEFAULT '{}',
    form_data JSONB DEFAULT '{}',
    -- Stats
    total_time_seconds INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    UNIQUE (tenant_id, user_id, playbook_id)
);

COMMENT ON TABLE synthex_playbook_progress IS 'Tracks user progress through playbooks';

-- =====================================================
-- Table: synthex_coach_messages
-- AI coach messages and interactions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_coach_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    -- Context
    context_type TEXT NOT NULL DEFAULT 'general' CHECK (context_type IN (
        'general', 'playbook', 'campaign', 'analytics', 'onboarding', 'troubleshooting'
    )),
    context_ref TEXT,
    -- Message content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    -- AI model info
    model_used TEXT,
    tokens_used INT,
    -- Thread management
    thread_id UUID,
    parent_message_id UUID REFERENCES synthex_coach_messages(id),
    -- Rating
    rating INT CHECK (rating >= 1 AND rating <= 5),
    rating_feedback TEXT,
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_coach_messages IS 'AI coach conversation history';
COMMENT ON COLUMN synthex_coach_messages.context_type IS 'Where the coaching is happening';

-- =====================================================
-- Table: synthex_coach_tips
-- Proactive tips and suggestions from the coach
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_coach_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    -- Targeting
    trigger_type TEXT NOT NULL CHECK (trigger_type IN (
        'page_view', 'action', 'milestone', 'time_based', 'metric_threshold', 'first_time'
    )),
    trigger_config JSONB NOT NULL DEFAULT '{}',
    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    cta_text TEXT,
    cta_url TEXT,
    -- Display
    display_type TEXT NOT NULL DEFAULT 'tooltip' CHECK (display_type IN (
        'tooltip', 'modal', 'banner', 'sidebar', 'inline'
    )),
    target_selector TEXT,
    priority INT DEFAULT 50,
    -- Control
    is_dismissible BOOLEAN DEFAULT true,
    max_impressions INT DEFAULT 3,
    cooldown_hours INT DEFAULT 24,
    -- Scope
    scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'tenant')),
    is_active BOOLEAN DEFAULT true,
    -- Dates
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_coach_tips IS 'Proactive tips and suggestions';
COMMENT ON COLUMN synthex_coach_tips.trigger_type IS 'What triggers this tip';

-- =====================================================
-- Table: synthex_coach_tip_impressions
-- Track tip views and dismissals
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_coach_tip_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tip_id UUID NOT NULL REFERENCES synthex_coach_tips(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('viewed', 'dismissed', 'clicked', 'completed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_coach_tip_impressions IS 'Tracks tip interactions';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_synthex_playbooks_tenant ON synthex_playbooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_playbooks_category ON synthex_playbooks(category);
CREATE INDEX IF NOT EXISTS idx_synthex_playbooks_scope ON synthex_playbooks(scope);
CREATE INDEX IF NOT EXISTS idx_synthex_playbooks_slug ON synthex_playbooks(slug);
CREATE INDEX IF NOT EXISTS idx_synthex_playbooks_featured ON synthex_playbooks(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_synthex_playbook_steps_playbook ON synthex_playbook_steps(playbook_id);
CREATE INDEX IF NOT EXISTS idx_synthex_playbook_steps_order ON synthex_playbook_steps(playbook_id, step_order);

CREATE INDEX IF NOT EXISTS idx_synthex_playbook_progress_tenant ON synthex_playbook_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_playbook_progress_user ON synthex_playbook_progress(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_synthex_playbook_progress_playbook ON synthex_playbook_progress(playbook_id);
CREATE INDEX IF NOT EXISTS idx_synthex_playbook_progress_status ON synthex_playbook_progress(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_synthex_coach_messages_tenant ON synthex_coach_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_coach_messages_user ON synthex_coach_messages(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_synthex_coach_messages_thread ON synthex_coach_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_synthex_coach_messages_created ON synthex_coach_messages(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_coach_tips_tenant ON synthex_coach_tips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_coach_tips_trigger ON synthex_coach_tips(trigger_type);
CREATE INDEX IF NOT EXISTS idx_synthex_coach_tips_active ON synthex_coach_tips(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_synthex_coach_tip_impressions_tip ON synthex_coach_tip_impressions(tip_id);
CREATE INDEX IF NOT EXISTS idx_synthex_coach_tip_impressions_user ON synthex_coach_tip_impressions(tenant_id, user_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_playbook_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_playbook_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_coach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_coach_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_coach_tip_impressions ENABLE ROW LEVEL SECURITY;

-- Playbooks: global + tenant-specific
CREATE POLICY "Playbooks visible to tenant or global"
    ON synthex_playbooks FOR SELECT
    USING (
        scope = 'global'
        OR tenant_id = current_setting('app.tenant_id', true)::uuid
    );

CREATE POLICY "Playbooks writable by tenant"
    ON synthex_playbooks FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Steps follow playbook access
CREATE POLICY "Steps follow playbook access"
    ON synthex_playbook_steps FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM synthex_playbooks p
            WHERE p.id = playbook_id
            AND (p.scope = 'global' OR p.tenant_id = current_setting('app.tenant_id', true)::uuid)
        )
    );

-- Progress scoped to tenant
CREATE POLICY "Progress scoped to tenant"
    ON synthex_playbook_progress FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Coach messages scoped to tenant
CREATE POLICY "Coach messages scoped to tenant"
    ON synthex_coach_messages FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tips: global + tenant-specific
CREATE POLICY "Tips visible to tenant or global"
    ON synthex_coach_tips FOR SELECT
    USING (
        scope = 'global'
        OR tenant_id = current_setting('app.tenant_id', true)::uuid
    );

CREATE POLICY "Tips writable by tenant"
    ON synthex_coach_tips FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Tip impressions scoped to tenant
CREATE POLICY "Tip impressions scoped to tenant"
    ON synthex_coach_tip_impressions FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Function: Get recommended playbooks for user
-- =====================================================
CREATE OR REPLACE FUNCTION get_recommended_playbooks(
    p_tenant_id UUID,
    p_user_id UUID,
    p_limit INT DEFAULT 5
)
RETURNS TABLE (
    playbook_id UUID,
    playbook_name TEXT,
    category TEXT,
    difficulty TEXT,
    estimated_minutes INT,
    progress_status TEXT,
    completion_percentage INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS playbook_id,
        p.name AS playbook_name,
        p.category,
        p.difficulty,
        p.estimated_minutes,
        COALESCE(pr.status, 'not_started') AS progress_status,
        CASE
            WHEN pr.status = 'completed' THEN 100
            WHEN pr.completed_step_ids IS NULL THEN 0
            ELSE (
                SELECT ROUND(
                    (COALESCE(array_length(pr.completed_step_ids, 1), 0)::NUMERIC /
                     NULLIF(COUNT(*), 0)) * 100
                )::INT
                FROM synthex_playbook_steps s
                WHERE s.playbook_id = p.id
            )
        END AS completion_percentage
    FROM synthex_playbooks p
    LEFT JOIN synthex_playbook_progress pr
        ON pr.playbook_id = p.id
        AND pr.tenant_id = p_tenant_id
        AND pr.user_id = p_user_id
    WHERE p.is_active = true
        AND (p.scope = 'global' OR p.tenant_id = p_tenant_id)
        AND (pr.status IS NULL OR pr.status NOT IN ('completed', 'abandoned'))
    ORDER BY
        p.is_featured DESC,
        CASE p.difficulty
            WHEN 'beginner' THEN 1
            WHEN 'intermediate' THEN 2
            WHEN 'advanced' THEN 3
        END,
        p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Update playbook progress
-- =====================================================
CREATE OR REPLACE FUNCTION update_playbook_progress(
    p_tenant_id UUID,
    p_user_id UUID,
    p_playbook_id UUID,
    p_step_id UUID,
    p_action TEXT -- 'complete', 'skip', 'start'
)
RETURNS JSONB AS $$
DECLARE
    v_progress synthex_playbook_progress%ROWTYPE;
    v_next_step_id UUID;
    v_total_steps INT;
    v_completed_steps INT;
BEGIN
    -- Get or create progress record
    INSERT INTO synthex_playbook_progress (tenant_id, user_id, playbook_id, status, started_at)
    VALUES (p_tenant_id, p_user_id, p_playbook_id, 'in_progress', now())
    ON CONFLICT (tenant_id, user_id, playbook_id) DO NOTHING;

    SELECT * INTO v_progress
    FROM synthex_playbook_progress
    WHERE tenant_id = p_tenant_id
      AND user_id = p_user_id
      AND playbook_id = p_playbook_id;

    -- Update based on action
    IF p_action = 'complete' THEN
        UPDATE synthex_playbook_progress
        SET
            completed_step_ids = array_append(
                COALESCE(completed_step_ids, ARRAY[]::UUID[]),
                p_step_id
            ),
            last_activity_at = now(),
            status = 'in_progress'
        WHERE id = v_progress.id
          AND NOT (p_step_id = ANY(COALESCE(completed_step_ids, ARRAY[]::UUID[])));
    ELSIF p_action = 'skip' THEN
        UPDATE synthex_playbook_progress
        SET
            skipped_step_ids = array_append(
                COALESCE(skipped_step_ids, ARRAY[]::UUID[]),
                p_step_id
            ),
            last_activity_at = now()
        WHERE id = v_progress.id
          AND NOT (p_step_id = ANY(COALESCE(skipped_step_ids, ARRAY[]::UUID[])));
    END IF;

    -- Get next step
    SELECT s.id INTO v_next_step_id
    FROM synthex_playbook_steps s
    WHERE s.playbook_id = p_playbook_id
      AND NOT (s.id = ANY(COALESCE(v_progress.completed_step_ids, ARRAY[]::UUID[])))
      AND NOT (s.id = ANY(COALESCE(v_progress.skipped_step_ids, ARRAY[]::UUID[])))
    ORDER BY s.step_order
    LIMIT 1;

    -- Update current step
    UPDATE synthex_playbook_progress
    SET current_step_id = v_next_step_id
    WHERE id = v_progress.id;

    -- Check if completed
    SELECT COUNT(*) INTO v_total_steps
    FROM synthex_playbook_steps
    WHERE playbook_id = p_playbook_id
      AND is_optional = false;

    SELECT COALESCE(array_length(completed_step_ids, 1), 0) INTO v_completed_steps
    FROM synthex_playbook_progress
    WHERE id = v_progress.id;

    IF v_next_step_id IS NULL OR v_completed_steps >= v_total_steps THEN
        UPDATE synthex_playbook_progress
        SET status = 'completed', completed_at = now()
        WHERE id = v_progress.id;
    END IF;

    -- Return updated progress
    RETURN jsonb_build_object(
        'progress_id', v_progress.id,
        'next_step_id', v_next_step_id,
        'completed_steps', v_completed_steps,
        'total_steps', v_total_steps,
        'is_completed', v_next_step_id IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_playbook_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_playbooks_updated ON synthex_playbooks;
CREATE TRIGGER trg_synthex_playbooks_updated
    BEFORE UPDATE ON synthex_playbooks
    FOR EACH ROW EXECUTE FUNCTION update_playbook_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_coach_tips_updated ON synthex_coach_tips;
CREATE TRIGGER trg_synthex_coach_tips_updated
    BEFORE UPDATE ON synthex_coach_tips
    FOR EACH ROW EXECUTE FUNCTION update_playbook_timestamp();

-- =====================================================
-- Grants
-- =====================================================
GRANT ALL ON synthex_playbooks TO authenticated;
GRANT ALL ON synthex_playbook_steps TO authenticated;
GRANT ALL ON synthex_playbook_progress TO authenticated;
GRANT ALL ON synthex_coach_messages TO authenticated;
GRANT ALL ON synthex_coach_tips TO authenticated;
GRANT ALL ON synthex_coach_tip_impressions TO authenticated;
GRANT EXECUTE ON FUNCTION get_recommended_playbooks(UUID, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_playbook_progress(UUID, UUID, UUID, UUID, TEXT) TO authenticated;

-- =====================================================
-- Seed: Default playbooks
-- =====================================================
INSERT INTO synthex_playbooks (id, name, slug, description, category, difficulty, estimated_minutes, scope, is_featured, outcomes, icon, tags)
VALUES
    (
        gen_random_uuid(),
        'Getting Started with Synthex',
        'getting-started',
        'Learn the basics of Synthex and set up your first campaign in under 30 minutes.',
        'onboarding',
        'beginner',
        30,
        'global',
        true,
        ARRAY['Understand the Synthex dashboard', 'Set up your first brand', 'Create your first email campaign'],
        'rocket',
        ARRAY['onboarding', 'beginner', 'quick-start']
    ),
    (
        gen_random_uuid(),
        'Lead Nurture Sequence Builder',
        'lead-nurture-builder',
        'Create an effective lead nurturing email sequence step by step.',
        'lead_nurture',
        'intermediate',
        45,
        'global',
        true,
        ARRAY['Design a 5-email nurture sequence', 'Set up triggers and delays', 'Configure personalization'],
        'mail',
        ARRAY['lead-nurture', 'email', 'automation']
    ),
    (
        gen_random_uuid(),
        'Campaign Launch Checklist',
        'campaign-launch-checklist',
        'Everything you need to check before launching a marketing campaign.',
        'campaign_launch',
        'beginner',
        20,
        'global',
        false,
        ARRAY['Verify email deliverability', 'Test all links', 'Review analytics tracking'],
        'check-circle',
        ARRAY['campaign', 'checklist', 'launch']
    ),
    (
        gen_random_uuid(),
        'A/B Testing Mastery',
        'ab-testing-mastery',
        'Learn how to run effective A/B tests and interpret results.',
        'analytics',
        'advanced',
        60,
        'global',
        false,
        ARRAY['Set up proper test hypotheses', 'Calculate statistical significance', 'Implement winning variants'],
        'flask-conical',
        ARRAY['testing', 'analytics', 'optimization']
    )
ON CONFLICT DO NOTHING;
