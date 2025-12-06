-- Migration 430: Synthex Template Packs & Cross-Business Playbooks
-- Phase B24: Reusable Templates for Emails, Campaigns, Automations & Segments
-- Created: 2025-12-06

-- =====================================================
-- SYNTHEX TEMPLATE PACKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_template_packs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_tenant_id uuid REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    category text NOT NULL CHECK (category IN ('welcome', 'promo', 'drip', 'seo', 'nurture', 're-engagement', 'event', 'other')),
    visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared', 'global')),
    tags text[] DEFAULT ARRAY[]::text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    -- owner_tenant_id is nullable for global packs
    CONSTRAINT owner_required_for_private CHECK (
        (visibility = 'private' AND owner_tenant_id IS NOT NULL) OR
        (visibility IN ('shared', 'global'))
    )
);

-- Add indexes
DROP INDEX IF EXISTS idx_synthex_template_packs_owner;
DROP INDEX IF EXISTS idx_synthex_template_packs_category;
DROP INDEX IF EXISTS idx_synthex_template_packs_visibility;
DROP INDEX IF EXISTS idx_synthex_template_packs_tags;
CREATE INDEX idx_synthex_template_packs_owner ON synthex_template_packs(owner_tenant_id) WHERE owner_tenant_id IS NOT NULL;
CREATE INDEX idx_synthex_template_packs_category ON synthex_template_packs(category);
CREATE INDEX idx_synthex_template_packs_visibility ON synthex_template_packs(visibility);
CREATE INDEX idx_synthex_template_packs_tags ON synthex_template_packs USING GIN(tags);

-- Add update trigger
DROP TRIGGER IF EXISTS set_synthex_template_packs_updated_at ON synthex_template_packs;
CREATE TRIGGER set_synthex_template_packs_updated_at
    BEFORE UPDATE ON synthex_template_packs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SYNTHEX TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pack_id uuid NOT NULL REFERENCES synthex_template_packs(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('email', 'campaign', 'automation', 'segment', 'prompt', 'form', 'landing_page')),
    name text NOT NULL,
    description text,
    content jsonb NOT NULL DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes
DROP INDEX IF EXISTS idx_synthex_templates_pack_id;
DROP INDEX IF EXISTS idx_synthex_templates_type;
CREATE INDEX idx_synthex_templates_pack_id ON synthex_templates(pack_id);
CREATE INDEX idx_synthex_templates_type ON synthex_templates(type);

-- Add update trigger
DROP TRIGGER IF EXISTS set_synthex_templates_updated_at ON synthex_templates;
CREATE TRIGGER set_synthex_templates_updated_at
    BEFORE UPDATE ON synthex_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SYNTHEX TEMPLATE USAGE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_template_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    template_id uuid NOT NULL REFERENCES synthex_templates(id) ON DELETE CASCADE,
    used_at timestamptz NOT NULL DEFAULT now(),
    context jsonb DEFAULT '{}'::jsonb
);

-- Add indexes
DROP INDEX IF EXISTS idx_synthex_template_usage_tenant;
DROP INDEX IF EXISTS idx_synthex_template_usage_template;
DROP INDEX IF EXISTS idx_synthex_template_usage_used_at;
CREATE INDEX idx_synthex_template_usage_tenant ON synthex_template_usage(tenant_id);
CREATE INDEX idx_synthex_template_usage_template ON synthex_template_usage(template_id);
CREATE INDEX idx_synthex_template_usage_used_at ON synthex_template_usage(used_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Synthex Template Packs: Visibility-based access
ALTER TABLE synthex_template_packs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Anyone can view global template packs" ON synthex_template_packs;
DROP POLICY IF EXISTS "Tenant can view own private template packs" ON synthex_template_packs;
DROP POLICY IF EXISTS "Anyone can view shared template packs" ON synthex_template_packs;
DROP POLICY IF EXISTS "Tenant admins can create template packs" ON synthex_template_packs;
DROP POLICY IF EXISTS "Tenant admins can update own template packs" ON synthex_template_packs;
DROP POLICY IF EXISTS "Tenant admins can delete own template packs" ON synthex_template_packs;

-- Global packs are readable by all authenticated users
CREATE POLICY "Anyone can view global template packs"
    ON synthex_template_packs FOR SELECT
    USING (visibility = 'global');

-- Private packs are only visible to owner tenant
CREATE POLICY "Tenant can view own private template packs"
    ON synthex_template_packs FOR SELECT
    USING (
        visibility = 'private' AND
        owner_tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members WHERE user_id = auth.uid()
        )
    );

-- Shared packs: readable by all (future: could add authorization table)
CREATE POLICY "Anyone can view shared template packs"
    ON synthex_template_packs FOR SELECT
    USING (visibility = 'shared');

-- Tenant owners/admins can insert their own packs
CREATE POLICY "Tenant admins can create template packs"
    ON synthex_template_packs FOR INSERT
    WITH CHECK (
        owner_tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Tenant owners/admins can update their own packs
CREATE POLICY "Tenant admins can update own template packs"
    ON synthex_template_packs FOR UPDATE
    USING (
        owner_tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Tenant owners/admins can delete their own packs
CREATE POLICY "Tenant admins can delete own template packs"
    ON synthex_template_packs FOR DELETE
    USING (
        owner_tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Synthex Templates: Inherit visibility from pack
ALTER TABLE synthex_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view templates from accessible packs" ON synthex_templates;
DROP POLICY IF EXISTS "Tenant admins can create templates in own packs" ON synthex_templates;
DROP POLICY IF EXISTS "Tenant admins can update templates in own packs" ON synthex_templates;
DROP POLICY IF EXISTS "Tenant admins can delete templates in own packs" ON synthex_templates;

-- Users can view templates from packs they have access to
CREATE POLICY "Users can view templates from accessible packs"
    ON synthex_templates FOR SELECT
    USING (
        pack_id IN (
            SELECT id FROM synthex_template_packs
            WHERE visibility = 'global'
               OR visibility = 'shared'
               OR (visibility = 'private' AND owner_tenant_id IN (
                   SELECT tenant_id FROM synthex_tenant_members WHERE user_id = auth.uid()
               ))
        )
    );

-- Tenant admins can insert templates into their own packs
CREATE POLICY "Tenant admins can create templates in own packs"
    ON synthex_templates FOR INSERT
    WITH CHECK (
        pack_id IN (
            SELECT id FROM synthex_template_packs
            WHERE owner_tenant_id IN (
                SELECT tenant_id FROM synthex_tenant_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- Tenant admins can update templates in their own packs
CREATE POLICY "Tenant admins can update templates in own packs"
    ON synthex_templates FOR UPDATE
    USING (
        pack_id IN (
            SELECT id FROM synthex_template_packs
            WHERE owner_tenant_id IN (
                SELECT tenant_id FROM synthex_tenant_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- Tenant admins can delete templates in their own packs
CREATE POLICY "Tenant admins can delete templates in own packs"
    ON synthex_templates FOR DELETE
    USING (
        pack_id IN (
            SELECT id FROM synthex_template_packs
            WHERE owner_tenant_id IN (
                SELECT tenant_id FROM synthex_tenant_members
                WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
            )
        )
    );

-- Synthex Template Usage: Tenant isolation
ALTER TABLE synthex_template_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their tenant template usage" ON synthex_template_usage;
DROP POLICY IF EXISTS "Service role can record template usage" ON synthex_template_usage;

-- Users can view their tenant's usage records
CREATE POLICY "Users can view their tenant template usage"
    ON synthex_template_usage FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM synthex_tenant_members WHERE user_id = auth.uid()
        )
    );

-- Service role can insert usage records
CREATE POLICY "Service role can record template usage"
    ON synthex_template_usage FOR INSERT
    WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- SEED DATA: Global Template Packs
-- =====================================================

-- Welcome Series Pack
INSERT INTO synthex_template_packs (owner_tenant_id, name, description, category, visibility, tags) VALUES
(
    NULL,
    'Welcome Series - Standard',
    'Complete welcome email sequence for new subscribers',
    'welcome',
    'global',
    ARRAY['welcome', 'onboarding', 'email-series']
);

-- Promotional Pack
INSERT INTO synthex_template_packs (owner_tenant_id, name, description, category, visibility, tags) VALUES
(
    NULL,
    'Promotional Campaign Starter',
    'Ready-to-use promotional email templates',
    'promo',
    'global',
    ARRAY['promotion', 'sale', 'discount']
);

-- Drip Campaign Pack
INSERT INTO synthex_template_packs (owner_tenant_id, name, description, category, visibility, tags) VALUES
(
    NULL,
    'Lead Nurture - 30 Days',
    '30-day lead nurturing drip campaign',
    'drip',
    'global',
    ARRAY['nurture', 'drip', 'lead-gen']
);

-- SEO Content Pack
INSERT INTO synthex_template_packs (owner_tenant_id, name, description, category, visibility, tags) VALUES
(
    NULL,
    'SEO Content Templates',
    'Blog post and landing page templates optimized for SEO',
    'seo',
    'global',
    ARRAY['seo', 'content', 'blog']
);

-- =====================================================
-- SEED DATA: Sample Templates
-- =====================================================

-- Get pack IDs for seeding templates
DO $$
DECLARE
    v_welcome_pack_id uuid;
    v_promo_pack_id uuid;
    v_drip_pack_id uuid;
    v_seo_pack_id uuid;
BEGIN
    -- Get pack IDs
    SELECT id INTO v_welcome_pack_id FROM synthex_template_packs WHERE name = 'Welcome Series - Standard';
    SELECT id INTO v_promo_pack_id FROM synthex_template_packs WHERE name = 'Promotional Campaign Starter';
    SELECT id INTO v_drip_pack_id FROM synthex_template_packs WHERE name = 'Lead Nurture - 30 Days';
    SELECT id INTO v_seo_pack_id FROM synthex_template_packs WHERE name = 'SEO Content Templates';

    -- Welcome Series Templates
    INSERT INTO synthex_templates (pack_id, type, name, description, content, metadata) VALUES
    (
        v_welcome_pack_id,
        'email',
        'Welcome Email - Day 1',
        'Initial welcome email with brand introduction',
        '{
            "subject": "Welcome to {{company_name}}! Here''s what to expect 👋",
            "preheader": "We''re excited to have you join our community",
            "body_html": "<p>Hi {{first_name}},</p><p>Welcome to {{company_name}}! We''re thrilled to have you as part of our community.</p><p>Here''s what you can expect from us:</p><ul><li>Weekly tips and insights</li><li>Exclusive offers and early access</li><li>A community that cares</li></ul><p>We''re here to help you succeed.</p><p>Cheers,<br>The {{company_name}} Team</p>",
            "variables": ["company_name", "first_name"]
        }'::jsonb,
        '{"send_delay_hours": 0, "position": 1}'::jsonb
    ),
    (
        v_welcome_pack_id,
        'email',
        'Welcome Email - Day 3',
        'Follow-up with resources and next steps',
        '{
            "subject": "{{first_name}}, here are your next steps 🚀",
            "preheader": "Get the most out of {{company_name}}",
            "body_html": "<p>Hi {{first_name}},</p><p>Now that you''ve had a few days to explore, we wanted to share some resources to help you get the most out of {{company_name}}:</p><ul><li><a href=\"{{resource_1_url}}\">Getting Started Guide</a></li><li><a href=\"{{resource_2_url}}\">Video Tutorials</a></li><li><a href=\"{{resource_3_url}}\">Community Forum</a></li></ul><p>Questions? Just hit reply!</p><p>Best,<br>The {{company_name}} Team</p>",
            "variables": ["company_name", "first_name", "resource_1_url", "resource_2_url", "resource_3_url"]
        }'::jsonb,
        '{"send_delay_hours": 72, "position": 2}'::jsonb
    );

    -- Promotional Templates
    INSERT INTO synthex_templates (pack_id, type, name, description, content, metadata) VALUES
    (
        v_promo_pack_id,
        'email',
        'Flash Sale Announcement',
        'Urgent sale announcement email',
        '{
            "subject": "⚡ Flash Sale: {{discount}}% Off - {{hours_left}} Hours Left!",
            "preheader": "Don''t miss out on this limited-time offer",
            "body_html": "<p>Hi {{first_name}},</p><p><strong>{{hours_left}} hours left!</strong></p><p>Get {{discount}}% off everything in our store. Use code: <strong>{{promo_code}}</strong> at checkout.</p><p><a href=\"{{shop_url}}\">Shop Now →</a></p><p>Hurry, this offer ends {{end_date}}!</p>",
            "variables": ["first_name", "discount", "hours_left", "promo_code", "shop_url", "end_date"]
        }'::jsonb,
        '{"urgency_level": "high", "recommended_send_time": "morning"}'::jsonb
    );

    -- Drip Campaign Templates
    INSERT INTO synthex_templates (pack_id, type, name, description, content, metadata) VALUES
    (
        v_drip_pack_id,
        'campaign',
        '30-Day Lead Nurture Campaign',
        'Complete 30-day automated nurture sequence',
        '{
            "name": "30-Day Lead Nurture",
            "trigger": "tag_added",
            "trigger_value": "lead",
            "steps": [
                {"type": "email", "template_ref": "welcome_day_1", "delay_hours": 0},
                {"type": "email", "template_ref": "value_prop_day_3", "delay_hours": 72},
                {"type": "email", "template_ref": "case_study_day_7", "delay_hours": 168},
                {"type": "email", "template_ref": "social_proof_day_14", "delay_hours": 336},
                {"type": "email", "template_ref": "offer_day_30", "delay_hours": 720}
            ]
        }'::jsonb,
        '{"total_duration_days": 30, "email_count": 5}'::jsonb
    );

    -- SEO Content Templates
    INSERT INTO synthex_templates (pack_id, type, name, description, content, metadata) VALUES
    (
        v_seo_pack_id,
        'prompt',
        'SEO Blog Post Generator',
        'AI prompt for generating SEO-optimized blog posts',
        '{
            "prompt": "Write a comprehensive SEO-optimized blog post about {{topic}}. Target keyword: {{keyword}}. Include:\n\n1. Compelling H1 title with keyword\n2. Meta description (150-160 chars)\n3. Introduction with keyword in first paragraph\n4. 3-5 H2 subheadings with semantic variations\n5. 1500-2000 words total\n6. Conclusion with CTA\n7. Internal linking opportunities\n\nTone: {{tone}}\nAudience: {{target_audience}}",
            "variables": ["topic", "keyword", "tone", "target_audience"],
            "model_config": {
                "model": "claude-sonnet-4-5-20250929",
                "max_tokens": 4000,
                "temperature": 0.7
            }
        }'::jsonb,
        '{"output_type": "markdown", "estimated_length": "1500-2000 words"}'::jsonb
    );

END $$;

-- =====================================================
-- HELPER FUNCTION: Clone Template to Tenant
-- =====================================================
CREATE OR REPLACE FUNCTION clone_template_to_tenant(
    p_template_id uuid,
    p_target_tenant_id uuid,
    p_customizations jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_original_template synthex_templates;
    v_original_pack synthex_template_packs;
    v_new_pack_id uuid;
    v_new_template_id uuid;
    v_pack_name_suffix text;
BEGIN
    -- Fetch original template
    SELECT * INTO v_original_template
    FROM synthex_templates
    WHERE id = p_template_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found: %', p_template_id;
    END IF;

    -- Fetch original pack
    SELECT * INTO v_original_pack
    FROM synthex_template_packs
    WHERE id = v_original_template.pack_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template pack not found: %', v_original_template.pack_id;
    END IF;

    -- Check if tenant already has a cloned pack
    v_pack_name_suffix := ' (Customized)';

    SELECT id INTO v_new_pack_id
    FROM synthex_template_packs
    WHERE owner_tenant_id = p_target_tenant_id
      AND name = v_original_pack.name || v_pack_name_suffix;

    -- Create new pack if doesn't exist
    IF v_new_pack_id IS NULL THEN
        INSERT INTO synthex_template_packs (
            owner_tenant_id,
            name,
            description,
            category,
            visibility,
            tags,
            metadata
        ) VALUES (
            p_target_tenant_id,
            v_original_pack.name || v_pack_name_suffix,
            'Customized from: ' || COALESCE(v_original_pack.description, v_original_pack.name),
            v_original_pack.category,
            'private',
            v_original_pack.tags,
            jsonb_build_object(
                'cloned_from_pack_id', v_original_pack.id,
                'cloned_at', now()
            )
        )
        RETURNING id INTO v_new_pack_id;
    END IF;

    -- Clone template with customizations
    INSERT INTO synthex_templates (
        pack_id,
        type,
        name,
        description,
        content,
        metadata
    ) VALUES (
        v_new_pack_id,
        v_original_template.type,
        COALESCE(p_customizations->>'name', v_original_template.name),
        COALESCE(p_customizations->>'description', v_original_template.description),
        COALESCE(
            (p_customizations->'content')::jsonb,
            v_original_template.content
        ),
        v_original_template.metadata || jsonb_build_object(
            'cloned_from_template_id', v_original_template.id,
            'cloned_at', now()
        )
    )
    RETURNING id INTO v_new_template_id;

    -- Record usage
    INSERT INTO synthex_template_usage (tenant_id, template_id, context)
    VALUES (
        p_target_tenant_id,
        p_template_id,
        jsonb_build_object('action', 'clone', 'cloned_template_id', v_new_template_id)
    );

    RETURN v_new_template_id;
END;
$$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE synthex_template_packs IS 'Synthex template packs - reusable collections of templates';
COMMENT ON TABLE synthex_templates IS 'Synthex templates - individual email, campaign, automation templates';
COMMENT ON TABLE synthex_template_usage IS 'Synthex template usage tracking';
COMMENT ON FUNCTION clone_template_to_tenant IS 'Clone a global/shared template to a tenant-specific customizable copy';
