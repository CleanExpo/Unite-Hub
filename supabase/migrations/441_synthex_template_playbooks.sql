-- =====================================================
-- Migration 441: Synthex Template Playbooks Enhancement
-- Phase B38: Template Marketplace & Playbooks
-- =====================================================
-- Extends template marketplace with playbook support,
-- funnel templates, and AI-assisted discovery
-- =====================================================

-- =====================================================
-- Table: synthex_template_content
-- Stores structured content blocks for templates
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_template_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES synthex_templates(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('email_body', 'landing_html', 'funnel_step', 'automation_node', 'prompt_system', 'prompt_user', 'settings', 'variables', 'assets')),
    sort_order INT NOT NULL DEFAULT 0,
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_template_content IS 'Structured content blocks for templates supporting complex multi-part templates';
COMMENT ON COLUMN synthex_template_content.content_type IS 'Type of content block';
COMMENT ON COLUMN synthex_template_content.payload IS 'JSON payload for this content block';

-- =====================================================
-- Table: synthex_template_recommendations
-- AI-generated template recommendations for goals
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_template_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    goal_description TEXT NOT NULL,
    stack_context JSONB DEFAULT '{}',
    recommended_template_ids UUID[] DEFAULT '{}',
    ai_reasoning TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_template_recommendations IS 'Stores AI-generated template recommendations based on user goals';

-- =====================================================
-- Add funnel type to templates if not exists
-- =====================================================
DO $$
BEGIN
    -- Check if 'funnel' is already in the check constraint
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'synthex_templates_type_check'
        AND pg_get_constraintdef(oid) LIKE '%funnel%'
    ) THEN
        -- Drop old constraint and add new one with funnel
        ALTER TABLE synthex_templates DROP CONSTRAINT IF EXISTS synthex_templates_type_check;
        ALTER TABLE synthex_templates ADD CONSTRAINT synthex_templates_type_check
            CHECK (type IN ('email', 'campaign', 'automation', 'journey', 'prompt', 'landing_page', 'funnel'));
    END IF;
END $$;

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_synthex_template_content_template ON synthex_template_content(template_id);
CREATE INDEX IF NOT EXISTS idx_synthex_template_content_type ON synthex_template_content(content_type);
CREATE INDEX IF NOT EXISTS idx_synthex_template_recommendations_tenant ON synthex_template_recommendations(tenant_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_template_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_template_recommendations ENABLE ROW LEVEL SECURITY;

-- Template content follows template visibility
CREATE POLICY "Template content follows template visibility"
    ON synthex_template_content FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM synthex_templates t
            WHERE t.id = template_id
            AND (
                (t.scope = 'global' AND t.is_public = true)
                OR t.tenant_id = current_setting('app.tenant_id', true)::uuid
                OR t.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Template content modifiable by template creator"
    ON synthex_template_content FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM synthex_templates t
            WHERE t.id = template_id AND t.created_by = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM synthex_templates t
            WHERE t.id = template_id AND t.created_by = auth.uid()
        )
    );

-- Recommendations scoped to tenant
CREATE POLICY "Template recommendations scoped to tenant"
    ON synthex_template_recommendations FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Function: Suggest templates for goal using AI context
-- =====================================================
CREATE OR REPLACE FUNCTION get_templates_for_goal(
    p_goal_keywords TEXT[],
    p_type TEXT DEFAULT NULL,
    p_limit INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    type TEXT,
    category TEXT,
    tags TEXT[],
    relevance_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.description,
        t.type,
        t.category,
        t.tags,
        -- Calculate relevance based on tag overlap and keyword matching
        (
            COALESCE(array_length(ARRAY(SELECT unnest(t.tags) INTERSECT SELECT unnest(p_goal_keywords)), 1), 0) * 2.0 +
            CASE WHEN t.name ILIKE '%' || array_to_string(p_goal_keywords, '%') || '%' THEN 1.0 ELSE 0.0 END +
            CASE WHEN t.description ILIKE '%' || array_to_string(p_goal_keywords, '%') || '%' THEN 0.5 ELSE 0.0 END
        )::NUMERIC AS relevance_score
    FROM synthex_templates t
    WHERE t.is_public = true
      AND t.scope = 'global'
      AND (p_type IS NULL OR t.type = p_type)
      AND (
          t.tags && p_goal_keywords
          OR t.name ILIKE '%' || array_to_string(p_goal_keywords, '%') || '%'
          OR t.description ILIKE '%' || array_to_string(p_goal_keywords, '%') || '%'
      )
    ORDER BY relevance_score DESC, t.is_featured DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_synthex_template_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_template_content_updated ON synthex_template_content;
CREATE TRIGGER trg_synthex_template_content_updated
    BEFORE UPDATE ON synthex_template_content
    FOR EACH ROW EXECUTE FUNCTION update_synthex_template_content_timestamp();

-- =====================================================
-- Seed funnel templates
-- =====================================================
INSERT INTO synthex_templates (
    tenant_id, scope, type, name, description, category, tags,
    content, is_public, is_featured, created_by
) VALUES
(
    NULL, 'global', 'funnel', 'Lead Magnet Funnel',
    'Complete funnel for capturing leads with a free resource offer',
    'lead_generation', ARRAY['lead', 'magnet', 'funnel', 'landing', 'email'],
    '{
        "steps": [
            {"type": "landing_page", "name": "Opt-in Page", "template": "lead_magnet_optin"},
            {"type": "thank_you", "name": "Thank You Page", "template": "lead_magnet_thanks"},
            {"type": "email", "name": "Delivery Email", "template": "lead_magnet_delivery"},
            {"type": "email", "name": "Follow Up 1", "delay_days": 2, "template": "lead_magnet_followup1"},
            {"type": "email", "name": "Follow Up 2", "delay_days": 5, "template": "lead_magnet_followup2"}
        ],
        "variables": ["lead_magnet_name", "lead_magnet_url", "company_name"]
    }',
    true, true, '00000000-0000-0000-0000-000000000000'
),
(
    NULL, 'global', 'funnel', 'Webinar Registration Funnel',
    'End-to-end funnel for webinar registrations and follow-up',
    'webinar', ARRAY['webinar', 'registration', 'funnel', 'event'],
    '{
        "steps": [
            {"type": "landing_page", "name": "Registration Page", "template": "webinar_register"},
            {"type": "thank_you", "name": "Confirmation Page", "template": "webinar_confirmed"},
            {"type": "email", "name": "Confirmation Email", "template": "webinar_confirm_email"},
            {"type": "email", "name": "Reminder 1", "delay_days": -1, "template": "webinar_reminder1"},
            {"type": "email", "name": "Day-of Reminder", "delay_hours": -2, "template": "webinar_dayof"},
            {"type": "email", "name": "Replay Email", "delay_hours": 2, "template": "webinar_replay"}
        ],
        "variables": ["webinar_title", "webinar_date", "webinar_url", "host_name"]
    }',
    true, true, '00000000-0000-0000-0000-000000000000'
),
(
    NULL, 'global', 'funnel', 'Product Sales Funnel',
    'High-converting sales funnel with upsells and downsells',
    'sales', ARRAY['sales', 'product', 'upsell', 'funnel', 'ecommerce'],
    '{
        "steps": [
            {"type": "landing_page", "name": "Sales Page", "template": "product_sales"},
            {"type": "checkout", "name": "Checkout", "template": "product_checkout"},
            {"type": "upsell", "name": "Upsell Offer", "template": "product_upsell"},
            {"type": "downsell", "name": "Downsell Offer", "template": "product_downsell"},
            {"type": "thank_you", "name": "Order Confirmation", "template": "product_thanks"},
            {"type": "email", "name": "Order Confirmation Email", "template": "order_confirm"}
        ],
        "variables": ["product_name", "product_price", "upsell_name", "upsell_price"]
    }',
    true, false, '00000000-0000-0000-0000-000000000000'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Grants
-- =====================================================
GRANT ALL ON synthex_template_content TO authenticated;
GRANT ALL ON synthex_template_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION get_templates_for_goal(TEXT[], TEXT, INT) TO authenticated;
