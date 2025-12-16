-- =====================================================
-- Migration 430: Founder Cognitive Twin Core
-- Phase D01: Founder Cognitive Twin Kernel
-- =====================================================
-- Secure, internal Founder Cognitive Twin data model
-- centralizing founder profile, principles, preferences,
-- and playbooks for use by Synthex and Unite-Hub agents.
-- =====================================================

-- =====================================================
-- Table: founder_profile
-- Singleton per tenant - core founder identity
-- =====================================================
CREATE TABLE IF NOT EXISTS founder_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE, -- Singleton per tenant
    -- Core Identity
    name TEXT,
    title TEXT,
    bio TEXT,
    avatar_url TEXT,
    -- Business Context
    company_name TEXT,
    company_stage TEXT CHECK (company_stage IN (
        'idea', 'pre_seed', 'seed', 'series_a', 'series_b',
        'series_c', 'growth', 'mature', 'exit'
    )),
    industry TEXT,
    target_market TEXT,
    -- Vision & Mission
    vision_statement TEXT,
    mission_statement TEXT,
    core_values TEXT[],
    -- Communication Style
    communication_style TEXT CHECK (communication_style IN (
        'formal', 'casual', 'direct', 'diplomatic', 'technical', 'storytelling'
    )),
    preferred_tone TEXT,
    -- AI Personalization
    ai_context JSONB DEFAULT '{}', -- Extended context for AI interactions
    learning_preferences JSONB DEFAULT '{}',
    decision_style TEXT CHECK (decision_style IN (
        'data_driven', 'intuitive', 'collaborative', 'autonomous'
    )),
    -- Status
    is_active BOOLEAN DEFAULT true,
    onboarding_completed BOOLEAN DEFAULT false,
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE founder_profile IS 'Core founder identity and context for AI personalization';
COMMENT ON COLUMN founder_profile.ai_context IS 'Extended context for AI-powered interactions and personalization';
COMMENT ON COLUMN founder_profile.learning_preferences IS 'How the founder prefers to learn and receive information';

-- =====================================================
-- Table: founder_principles
-- Core principles and beliefs that guide decisions
-- =====================================================
CREATE TABLE IF NOT EXISTS founder_principles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Principle Details
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
        'leadership', 'product', 'culture', 'customer', 'growth',
        'operations', 'finance', 'marketing', 'sales', 'general'
    )),
    -- Priority & Context
    priority INT DEFAULT 50 CHECK (priority >= 1 AND priority <= 100),
    applies_to TEXT[], -- e.g., ['hiring', 'product_decisions', 'customer_support']
    -- Example & Rationale
    example TEXT,
    rationale TEXT,
    -- AI Usage
    use_in_ai_responses BOOLEAN DEFAULT true,
    ai_weight NUMERIC DEFAULT 1.0 CHECK (ai_weight >= 0 AND ai_weight <= 2),
    -- Status
    is_active BOOLEAN DEFAULT true,
    -- Metadata
    source TEXT, -- Where this principle came from (book, experience, mentor)
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE founder_principles IS 'Core principles and beliefs that guide AI and team decisions';
COMMENT ON COLUMN founder_principles.ai_weight IS 'Weight multiplier for AI consideration (0-2)';

-- =====================================================
-- Table: founder_preferences
-- Operational preferences for system behavior
-- =====================================================
CREATE TABLE IF NOT EXISTS founder_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Preference Details
    key TEXT NOT NULL,
    value JSONB NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
        'communication', 'notifications', 'ai_behavior', 'automation',
        'reporting', 'privacy', 'integrations', 'ui', 'general'
    )),
    -- Description & Help
    label TEXT,
    description TEXT,
    -- Validation
    value_type TEXT DEFAULT 'string' CHECK (value_type IN (
        'string', 'number', 'boolean', 'array', 'object', 'enum'
    )),
    allowed_values JSONB, -- For enum types
    default_value JSONB,
    -- Metadata
    is_sensitive BOOLEAN DEFAULT false,
    requires_restart BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tenant_id, key)
);

COMMENT ON TABLE founder_preferences IS 'Operational preferences controlling system and AI behavior';
COMMENT ON COLUMN founder_preferences.is_sensitive IS 'Whether this preference contains sensitive data';

-- =====================================================
-- Table: founder_playbooks
-- Reusable decision frameworks and workflows
-- =====================================================
CREATE TABLE IF NOT EXISTS founder_playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Playbook Identity
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
        'hiring', 'sales', 'marketing', 'product', 'customer_success',
        'operations', 'crisis', 'growth', 'partnerships', 'general'
    )),
    -- Playbook Content
    trigger_conditions JSONB DEFAULT '[]', -- When to suggest this playbook
    steps JSONB NOT NULL DEFAULT '[]', -- Ordered array of step objects
    success_criteria JSONB DEFAULT '[]', -- How to know when complete
    -- Context
    when_to_use TEXT,
    when_not_to_use TEXT,
    estimated_duration TEXT, -- e.g., "2-4 hours", "1 week"
    difficulty TEXT CHECK (difficulty IN ('simple', 'moderate', 'complex')),
    -- AI Integration
    ai_can_execute BOOLEAN DEFAULT false, -- Can AI run this autonomously?
    ai_guidance_level TEXT DEFAULT 'suggest' CHECK (ai_guidance_level IN (
        'suggest', 'guide', 'execute', 'disabled'
    )),
    -- Usage Stats
    times_used INT DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    average_success_score NUMERIC,
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false, -- System-provided template
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tenant_id, slug)
);

COMMENT ON TABLE founder_playbooks IS 'Reusable decision frameworks and workflows for the founder';
COMMENT ON COLUMN founder_playbooks.ai_can_execute IS 'Whether AI agents can execute this playbook autonomously';
COMMENT ON COLUMN founder_playbooks.steps IS 'JSON array of step objects with title, description, actions, etc.';

-- =====================================================
-- Table: founder_settings
-- D02 Control Center settings
-- =====================================================
CREATE TABLE IF NOT EXISTS founder_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE, -- Singleton per tenant
    -- Synthex Automation Controls
    synthex_automation_enabled BOOLEAN DEFAULT true,
    ai_content_generation_enabled BOOLEAN DEFAULT true,
    predictive_send_time_enabled BOOLEAN DEFAULT true,
    auto_segmentation_enabled BOOLEAN DEFAULT true,
    -- Notification Controls
    daily_digest_enabled BOOLEAN DEFAULT true,
    weekly_report_enabled BOOLEAN DEFAULT true,
    real_time_alerts_enabled BOOLEAN DEFAULT true,
    alert_channels TEXT[] DEFAULT ARRAY['email', 'in_app'],
    -- AI Behavior Controls
    ai_autonomy_level TEXT DEFAULT 'suggest' CHECK (ai_autonomy_level IN (
        'disabled', 'suggest', 'confirm', 'autonomous'
    )),
    ai_learning_enabled BOOLEAN DEFAULT true,
    ai_personalization_level TEXT DEFAULT 'high' CHECK (ai_personalization_level IN (
        'none', 'low', 'medium', 'high'
    )),
    -- Research Fabric Controls
    research_auto_run BOOLEAN DEFAULT false,
    research_sources TEXT[] DEFAULT ARRAY['web', 'docs'],
    -- Extended Settings
    extended_settings JSONB DEFAULT '{}',
    -- Metadata
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE founder_settings IS 'Founder control settings for Synthex and AI behavior';
COMMENT ON COLUMN founder_settings.ai_autonomy_level IS 'How much autonomy AI agents have';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_founder_profile_tenant ON founder_profile(tenant_id);

CREATE INDEX IF NOT EXISTS idx_founder_principles_tenant ON founder_principles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_founder_principles_category ON founder_principles(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_founder_principles_active ON founder_principles(tenant_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_founder_preferences_tenant ON founder_preferences(tenant_id);
CREATE INDEX IF NOT EXISTS idx_founder_preferences_key ON founder_preferences(tenant_id, key);
CREATE INDEX IF NOT EXISTS idx_founder_preferences_category ON founder_preferences(tenant_id, category);

CREATE INDEX IF NOT EXISTS idx_founder_playbooks_tenant ON founder_playbooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_founder_playbooks_slug ON founder_playbooks(tenant_id, slug);
CREATE INDEX IF NOT EXISTS idx_founder_playbooks_category ON founder_playbooks(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_founder_playbooks_active ON founder_playbooks(tenant_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_founder_settings_tenant ON founder_settings(tenant_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE founder_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_principles ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_settings ENABLE ROW LEVEL SECURITY;

-- Profile scoped to tenant
CREATE POLICY "Founder profile scoped to tenant"
    ON founder_profile FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Principles scoped to tenant
CREATE POLICY "Founder principles scoped to tenant"
    ON founder_principles FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Preferences scoped to tenant
CREATE POLICY "Founder preferences scoped to tenant"
    ON founder_preferences FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Playbooks scoped to tenant
CREATE POLICY "Founder playbooks scoped to tenant"
    ON founder_playbooks FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Settings scoped to tenant
CREATE POLICY "Founder settings scoped to tenant"
    ON founder_settings FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_founder_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_founder_profile_updated ON founder_profile;
CREATE TRIGGER trg_founder_profile_updated
    BEFORE UPDATE ON founder_profile
    FOR EACH ROW EXECUTE FUNCTION update_founder_timestamp();

DROP TRIGGER IF EXISTS trg_founder_principles_updated ON founder_principles;
CREATE TRIGGER trg_founder_principles_updated
    BEFORE UPDATE ON founder_principles
    FOR EACH ROW EXECUTE FUNCTION update_founder_timestamp();

DROP TRIGGER IF EXISTS trg_founder_preferences_updated ON founder_preferences;
CREATE TRIGGER trg_founder_preferences_updated
    BEFORE UPDATE ON founder_preferences
    FOR EACH ROW EXECUTE FUNCTION update_founder_timestamp();

DROP TRIGGER IF EXISTS trg_founder_playbooks_updated ON founder_playbooks;
CREATE TRIGGER trg_founder_playbooks_updated
    BEFORE UPDATE ON founder_playbooks
    FOR EACH ROW EXECUTE FUNCTION update_founder_timestamp();

DROP TRIGGER IF EXISTS trg_founder_settings_updated ON founder_settings;
CREATE TRIGGER trg_founder_settings_updated
    BEFORE UPDATE ON founder_settings
    FOR EACH ROW EXECUTE FUNCTION update_founder_timestamp();

-- =====================================================
-- Grants
-- =====================================================
GRANT ALL ON founder_profile TO authenticated;
GRANT ALL ON founder_principles TO authenticated;
GRANT ALL ON founder_preferences TO authenticated;
GRANT ALL ON founder_playbooks TO authenticated;
GRANT ALL ON founder_settings TO authenticated;
