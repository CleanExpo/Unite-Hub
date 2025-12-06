-- =====================================================
-- Migration 440: Synthex Template Marketplace
-- Phase B34: Template Marketplace for Campaigns, Content, and Automations
-- =====================================================
-- Reusable template marketplace for emails, campaigns, automations,
-- and funnels that can be used across all brands and paying clients
-- =====================================================

-- Drop tables first (CASCADE handles policies and indexes)
DROP TABLE IF EXISTS synthex_template_usage CASCADE;
DROP TABLE IF EXISTS synthex_template_ratings CASCADE;
DROP TABLE IF EXISTS synthex_templates CASCADE;

-- =====================================================
-- Table: synthex_templates
-- Reusable templates for various content types
-- =====================================================
CREATE TABLE synthex_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,  -- NULL for global templates
    scope TEXT NOT NULL DEFAULT 'tenant' CHECK (scope IN ('global', 'agency', 'tenant')),
    type TEXT NOT NULL CHECK (type IN ('email', 'campaign', 'automation', 'journey', 'prompt', 'landing_page')),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    content JSONB NOT NULL DEFAULT '{}',
    preview_image_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_by UUID NOT NULL,
    version INT NOT NULL DEFAULT 1,
    parent_template_id UUID REFERENCES synthex_templates(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_templates IS 'Reusable templates for emails, campaigns, automations, journeys, prompts, and landing pages';
COMMENT ON COLUMN synthex_templates.scope IS 'Visibility scope: global (all users), agency (agency members), tenant (single tenant)';
COMMENT ON COLUMN synthex_templates.type IS 'Template type: email, campaign, automation, journey, prompt, landing_page';
COMMENT ON COLUMN synthex_templates.content IS 'JSON content structure specific to template type';
COMMENT ON COLUMN synthex_templates.parent_template_id IS 'Reference to original template if this is a clone';

-- =====================================================
-- Table: synthex_template_ratings
-- User ratings and feedback for templates
-- =====================================================
CREATE TABLE synthex_template_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES synthex_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(template_id, user_id)
);

COMMENT ON TABLE synthex_template_ratings IS 'User ratings and reviews for templates';
COMMENT ON COLUMN synthex_template_ratings.rating IS 'Rating from 1 to 5 stars';
COMMENT ON COLUMN synthex_template_ratings.helpful_count IS 'Number of users who found this review helpful';

-- =====================================================
-- Table: synthex_template_usage
-- Track template usage for analytics
-- =====================================================
CREATE TABLE synthex_template_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES synthex_templates(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'clone', 'use', 'favorite')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_template_usage IS 'Usage tracking for templates (views, clones, uses)';

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX idx_synthex_templates_scope_type ON synthex_templates(scope, type);
CREATE INDEX idx_synthex_templates_tenant ON synthex_templates(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_synthex_templates_category ON synthex_templates(category) WHERE category IS NOT NULL;
CREATE INDEX idx_synthex_templates_public ON synthex_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_synthex_templates_featured ON synthex_templates(is_featured) WHERE is_featured = true;
CREATE INDEX idx_synthex_templates_tags ON synthex_templates USING GIN (tags);
CREATE INDEX idx_synthex_template_ratings_template ON synthex_template_ratings(template_id);
CREATE INDEX idx_synthex_template_ratings_user ON synthex_template_ratings(user_id);
CREATE INDEX idx_synthex_template_usage_template ON synthex_template_usage(template_id);
CREATE INDEX idx_synthex_template_usage_tenant ON synthex_template_usage(tenant_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_template_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_template_usage ENABLE ROW LEVEL SECURITY;

-- Templates: visible based on scope and public flag
CREATE POLICY "Templates visible based on scope"
    ON synthex_templates FOR SELECT
    USING (
        -- Global public templates visible to all
        (scope = 'global' AND is_public = true)
        -- Own tenant's templates
        OR tenant_id = current_setting('app.tenant_id', true)::uuid
        -- Own created templates
        OR created_by = auth.uid()
    );

-- Templates: insert/update only own templates
CREATE POLICY "Templates modifiable by creator"
    ON synthex_templates FOR ALL
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Ratings: users can manage their own ratings
CREATE POLICY "Template ratings by users"
    ON synthex_template_ratings FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Usage: tenant can see their own usage
CREATE POLICY "Template usage tracking"
    ON synthex_template_usage FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Helper function: Get template with stats
-- =====================================================
CREATE OR REPLACE FUNCTION get_template_with_stats(p_template_id UUID)
RETURNS TABLE (
    template_id UUID,
    avg_rating NUMERIC,
    rating_count BIGINT,
    usage_count BIGINT,
    clone_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id AS template_id,
        COALESCE(AVG(r.rating)::NUMERIC(3,2), 0) AS avg_rating,
        COUNT(DISTINCT r.id) AS rating_count,
        COUNT(DISTINCT u.id) FILTER (WHERE u.action = 'use') AS usage_count,
        COUNT(DISTINCT u.id) FILTER (WHERE u.action = 'clone') AS clone_count
    FROM synthex_templates t
    LEFT JOIN synthex_template_ratings r ON r.template_id = t.id
    LEFT JOIN synthex_template_usage u ON u.template_id = t.id
    WHERE t.id = p_template_id
    GROUP BY t.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper function: Get popular templates
-- =====================================================
CREATE OR REPLACE FUNCTION get_popular_templates(
    p_type TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    type TEXT,
    category TEXT,
    avg_rating NUMERIC,
    usage_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.description,
        t.type,
        t.category,
        COALESCE(AVG(r.rating)::NUMERIC(3,2), 0) AS avg_rating,
        COUNT(DISTINCT u.id) FILTER (WHERE u.action IN ('use', 'clone')) AS usage_count
    FROM synthex_templates t
    LEFT JOIN synthex_template_ratings r ON r.template_id = t.id
    LEFT JOIN synthex_template_usage u ON u.template_id = t.id
    WHERE t.is_public = true
      AND t.scope = 'global'
      AND (p_type IS NULL OR t.type = p_type)
      AND (p_category IS NULL OR t.category = p_category)
    GROUP BY t.id, t.name, t.description, t.type, t.category
    ORDER BY usage_count DESC, avg_rating DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_synthex_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_templates_updated ON synthex_templates;
CREATE TRIGGER trg_synthex_templates_updated
    BEFORE UPDATE ON synthex_templates
    FOR EACH ROW EXECUTE FUNCTION update_synthex_template_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_template_ratings_updated ON synthex_template_ratings;
CREATE TRIGGER trg_synthex_template_ratings_updated
    BEFORE UPDATE ON synthex_template_ratings
    FOR EACH ROW EXECUTE FUNCTION update_synthex_template_timestamp();

-- =====================================================
-- Seed some global templates
-- =====================================================
INSERT INTO synthex_templates (
    tenant_id, scope, type, name, description, category, tags,
    content, is_public, is_featured, created_by
) VALUES
(
    NULL, 'global', 'email', 'Welcome Email',
    'A warm welcome email for new subscribers with brand introduction',
    'onboarding', ARRAY['welcome', 'onboarding', 'introduction'],
    '{
        "subject": "Welcome to {{company_name}}!",
        "preheader": "We''re excited to have you with us",
        "body": "<h1>Welcome, {{first_name}}!</h1><p>Thank you for joining {{company_name}}. We''re thrilled to have you on board.</p>",
        "variables": ["company_name", "first_name"]
    }',
    true, true, '00000000-0000-0000-0000-000000000000'
),
(
    NULL, 'global', 'email', 'Monthly Newsletter',
    'Professional newsletter template for regular updates',
    'newsletter', ARRAY['newsletter', 'monthly', 'updates'],
    '{
        "subject": "{{company_name}} Monthly Update - {{month}}",
        "preheader": "Here''s what''s new this month",
        "body": "<h1>{{month}} Updates</h1><p>Hello {{first_name}},</p><p>Here are the highlights from this month...</p>",
        "variables": ["company_name", "first_name", "month"]
    }',
    true, false, '00000000-0000-0000-0000-000000000000'
),
(
    NULL, 'global', 'campaign', 'Product Launch',
    'Complete email sequence for launching a new product',
    'product', ARRAY['launch', 'product', 'announcement'],
    '{
        "steps": [
            {"day": 0, "type": "email", "template": "teaser"},
            {"day": 3, "type": "email", "template": "announcement"},
            {"day": 5, "type": "email", "template": "reminder"},
            {"day": 7, "type": "email", "template": "last_chance"}
        ],
        "variables": ["product_name", "launch_date", "offer_url"]
    }',
    true, true, '00000000-0000-0000-0000-000000000000'
),
(
    NULL, 'global', 'automation', 'Cart Abandonment',
    'Automated sequence to recover abandoned shopping carts',
    'ecommerce', ARRAY['cart', 'abandonment', 'recovery', 'ecommerce'],
    '{
        "trigger": "cart_abandoned",
        "delay_minutes": 60,
        "steps": [
            {"type": "email", "delay_hours": 1, "template": "reminder"},
            {"type": "email", "delay_hours": 24, "template": "incentive"},
            {"type": "email", "delay_hours": 72, "template": "final"}
        ],
        "exit_conditions": ["purchased", "unsubscribed"]
    }',
    true, true, '00000000-0000-0000-0000-000000000000'
),
(
    NULL, 'global', 'journey', 'Customer Onboarding',
    'Multi-step journey for new customer onboarding',
    'onboarding', ARRAY['onboarding', 'journey', 'new_customer'],
    '{
        "entry_trigger": "customer_signup",
        "stages": [
            {"name": "Welcome", "duration_days": 1},
            {"name": "Setup", "duration_days": 3},
            {"name": "First Success", "duration_days": 7},
            {"name": "Engagement", "duration_days": 14}
        ],
        "touchpoints": ["email", "in_app", "push"]
    }',
    true, false, '00000000-0000-0000-0000-000000000000'
),
(
    NULL, 'global', 'prompt', 'Email Subject Generator',
    'AI prompt for generating compelling email subject lines',
    'copywriting', ARRAY['ai', 'subject', 'email', 'copywriting'],
    '{
        "system": "You are an expert email copywriter specializing in high-converting subject lines.",
        "prompt": "Generate 5 compelling email subject lines for {{purpose}}. The target audience is {{audience}}. Tone should be {{tone}}. Each subject line should be under 50 characters.",
        "variables": ["purpose", "audience", "tone"],
        "output_format": "numbered_list"
    }',
    true, true, '00000000-0000-0000-0000-000000000000'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT ALL ON synthex_templates TO authenticated;
GRANT ALL ON synthex_template_ratings TO authenticated;
GRANT ALL ON synthex_template_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_template_with_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_popular_templates(TEXT, TEXT, INT) TO authenticated;
