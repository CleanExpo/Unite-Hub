-- =====================================================
-- Migration: 282_convex_strategy_tables.sql
-- Description: CONVEX Marketing Intelligence Module Schema
-- Author: Orchestrator Agent
-- Created: 2025-11-27
-- =====================================================

-- =====================================================
-- TABLE: convex_strategies
-- Purpose: Store user-created marketing strategies
-- =====================================================

CREATE TABLE IF NOT EXISTS convex_strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    framework_id VARCHAR(100) NOT NULL,
    framework_category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    inputs JSONB NOT NULL DEFAULT '{}',
    outputs JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for convex_strategies
CREATE INDEX IF NOT EXISTS idx_convex_strategies_workspace ON convex_strategies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_strategies_framework ON convex_strategies(framework_id);
CREATE INDEX IF NOT EXISTS idx_convex_strategies_status ON convex_strategies(status);
CREATE INDEX IF NOT EXISTS idx_convex_strategies_created_by ON convex_strategies(created_by);
CREATE INDEX IF NOT EXISTS idx_convex_strategies_created_at ON convex_strategies(created_at DESC);

-- =====================================================
-- TABLE: convex_seo_scores
-- Purpose: Store SEO scoring results and history
-- =====================================================

CREATE TABLE IF NOT EXISTS convex_seo_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
    content_score INTEGER CHECK (content_score >= 0 AND content_score <= 100),
    authority_score INTEGER CHECK (authority_score >= 0 AND authority_score <= 100),
    ux_score INTEGER CHECK (ux_score >= 0 AND ux_score <= 100),
    details JSONB NOT NULL DEFAULT '{}',
    recommendations JSONB NOT NULL DEFAULT '[]',
    quick_wins JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for convex_seo_scores
CREATE INDEX IF NOT EXISTS idx_convex_seo_scores_workspace ON convex_seo_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_seo_scores_url ON convex_seo_scores(url);
CREATE INDEX IF NOT EXISTS idx_convex_seo_scores_created_at ON convex_seo_scores(created_at DESC);

-- =====================================================
-- TABLE: convex_content_scores
-- Purpose: Store content scoring results
-- =====================================================

CREATE TABLE IF NOT EXISTS convex_content_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    content_id UUID,
    content_type VARCHAR(50) NOT NULL DEFAULT 'general',
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    readability_score INTEGER CHECK (readability_score >= 0 AND readability_score <= 100),
    seo_score INTEGER CHECK (seo_score >= 0 AND seo_score <= 100),
    emotional_score INTEGER CHECK (emotional_score >= 0 AND emotional_score <= 100),
    conversion_score INTEGER CHECK (conversion_score >= 0 AND conversion_score <= 100),
    recommendations JSONB NOT NULL DEFAULT '[]',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for convex_content_scores
CREATE INDEX IF NOT EXISTS idx_convex_content_scores_workspace ON convex_content_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_content_scores_content_id ON convex_content_scores(content_id);
CREATE INDEX IF NOT EXISTS idx_convex_content_scores_created_at ON convex_content_scores(created_at DESC);

-- =====================================================
-- TABLE: convex_framework_usage
-- Purpose: Track framework usage analytics
-- =====================================================

CREATE TABLE IF NOT EXISTS convex_framework_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    framework_id VARCHAR(100) NOT NULL,
    framework_category VARCHAR(100) NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 1,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    average_score DECIMAL(5, 2),
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(workspace_id, framework_id)
);

-- Indexes for convex_framework_usage
CREATE INDEX IF NOT EXISTS idx_convex_framework_usage_workspace ON convex_framework_usage(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_framework_usage_framework ON convex_framework_usage(framework_id);
CREATE INDEX IF NOT EXISTS idx_convex_framework_usage_count ON convex_framework_usage(usage_count DESC);

-- =====================================================
-- TABLE: convex_execution_logs
-- Purpose: Log strategy execution history
-- =====================================================

CREATE TABLE IF NOT EXISTS convex_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    strategy_id UUID REFERENCES convex_strategies(id) ON DELETE SET NULL,
    template_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    inputs JSONB NOT NULL DEFAULT '{}',
    outputs JSONB NOT NULL DEFAULT '{}',
    error_message TEXT,
    execution_time_ms INTEGER,
    -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for convex_execution_logs
CREATE INDEX IF NOT EXISTS idx_convex_execution_logs_workspace ON convex_execution_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_execution_logs_strategy ON convex_execution_logs(strategy_id);
CREATE INDEX IF NOT EXISTS idx_convex_execution_logs_status ON convex_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_convex_execution_logs_created_at ON convex_execution_logs(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all CONVEX tables
ALTER TABLE convex_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE convex_seo_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE convex_content_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE convex_framework_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE convex_execution_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies: convex_strategies
-- =====================================================

-- Users can view strategies in their workspace
CREATE POLICY "Users can view own workspace strategies"
    ON convex_strategies FOR SELECT
    USING (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- Users can create strategies in their workspace
CREATE POLICY "Users can create strategies in own workspace"
    ON convex_strategies FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- Users can update strategies in their workspace
CREATE POLICY "Users can update own workspace strategies"
    ON convex_strategies FOR UPDATE
    USING (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- Users can delete strategies in their workspace
CREATE POLICY "Users can delete own workspace strategies"
    ON convex_strategies FOR DELETE
    USING (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- =====================================================
-- RLS Policies: convex_seo_scores
-- =====================================================

CREATE POLICY "Users can view own workspace SEO scores"
    ON convex_seo_scores FOR SELECT
    USING (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create SEO scores in own workspace"
    ON convex_seo_scores FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- =====================================================
-- RLS Policies: convex_content_scores
-- =====================================================

CREATE POLICY "Users can view own workspace content scores"
    ON convex_content_scores FOR SELECT
    USING (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create content scores in own workspace"
    ON convex_content_scores FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- =====================================================
-- RLS Policies: convex_framework_usage
-- =====================================================

CREATE POLICY "Users can view own workspace framework usage"
    ON convex_framework_usage FOR SELECT
    USING (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can upsert framework usage in own workspace"
    ON convex_framework_usage FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update framework usage in own workspace"
    ON convex_framework_usage FOR UPDATE
    USING (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- =====================================================
-- RLS Policies: convex_execution_logs
-- =====================================================

CREATE POLICY "Users can view own workspace execution logs"
    ON convex_execution_logs FOR SELECT
    USING (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create execution logs in own workspace"
    ON convex_execution_logs FOR INSERT
    WITH CHECK (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update execution logs in own workspace"
    ON convex_execution_logs FOR UPDATE
    USING (
        workspace_id IN (
            SELECT w.id FROM workspaces w
            JOIN user_organizations uo ON w.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS: Auto-update timestamps
-- =====================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION convex_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS convex_strategies_updated_at ON convex_strategies;
CREATE TRIGGER convex_strategies_updated_at
    BEFORE UPDATE ON convex_strategies
    FOR EACH ROW EXECUTE FUNCTION convex_update_timestamp();

DROP TRIGGER IF EXISTS convex_framework_usage_updated_at ON convex_framework_usage;
CREATE TRIGGER convex_framework_usage_updated_at
    BEFORE UPDATE ON convex_framework_usage
    FOR EACH ROW EXECUTE FUNCTION convex_update_timestamp();

-- =====================================================
-- FUNCTIONS: Helper functions for CONVEX module
-- =====================================================

-- Function to increment framework usage
CREATE OR REPLACE FUNCTION convex_increment_framework_usage(
    p_workspace_id UUID,
    p_framework_id VARCHAR(100),
    p_framework_category VARCHAR(100),
    p_score INTEGER DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO convex_framework_usage (
        workspace_id,
        framework_id,
        framework_category,
        usage_count,
        average_score,
        last_used_at
    ) VALUES (
        p_workspace_id,
        p_framework_id,
        p_framework_category,
        1,
        p_score,
        NOW()
    )
    ON CONFLICT (workspace_id, framework_id)
    DO UPDATE SET
        usage_count = convex_framework_usage.usage_count + 1,
        average_score = CASE
            WHEN p_score IS NOT NULL THEN
                (COALESCE(convex_framework_usage.average_score, 0) *
                 convex_framework_usage.usage_count + p_score) /
                (convex_framework_usage.usage_count + 1)
            ELSE convex_framework_usage.average_score
        END,
        last_used_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get strategy statistics for a workspace
CREATE OR REPLACE FUNCTION convex_get_workspace_stats(p_workspace_id UUID)
RETURNS TABLE (
    total_strategies BIGINT,
    active_strategies BIGINT,
    avg_strategy_score DECIMAL(5, 2),
    total_seo_analyses BIGINT,
    avg_seo_score DECIMAL(5, 2),
    top_framework_id VARCHAR(100),
    top_framework_usage BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM convex_strategies WHERE workspace_id = p_workspace_id),
        (SELECT COUNT(*) FROM convex_strategies WHERE workspace_id = p_workspace_id AND status = 'active'),
        (SELECT AVG(score)::DECIMAL(5, 2) FROM convex_strategies WHERE workspace_id = p_workspace_id),
        (SELECT COUNT(*) FROM convex_seo_scores WHERE workspace_id = p_workspace_id),
        (SELECT AVG(overall_score)::DECIMAL(5, 2) FROM convex_seo_scores WHERE workspace_id = p_workspace_id),
        (SELECT framework_id FROM convex_framework_usage WHERE workspace_id = p_workspace_id ORDER BY usage_count DESC LIMIT 1),
        (SELECT usage_count FROM convex_framework_usage WHERE workspace_id = p_workspace_id ORDER BY usage_count DESC LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE convex_strategies IS 'CONVEX marketing strategies created by users';
COMMENT ON TABLE convex_seo_scores IS 'SEO scoring results using CONVEX methodology';
COMMENT ON TABLE convex_content_scores IS 'Content scoring results using CONVEX methodology';
COMMENT ON TABLE convex_framework_usage IS 'Analytics for framework usage patterns';
COMMENT ON TABLE convex_execution_logs IS 'Execution history for strategy templates';

COMMENT ON FUNCTION convex_increment_framework_usage IS 'Increments usage count and updates average score for a framework';
COMMENT ON FUNCTION convex_get_workspace_stats IS 'Returns aggregate statistics for CONVEX usage in a workspace';
