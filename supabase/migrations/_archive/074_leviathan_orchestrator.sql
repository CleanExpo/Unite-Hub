-- Migration: Leviathan Orchestrator
-- Phase 13 Week 7-8: Full orchestration system
-- Created: 2025-11-20

-- =============================================================================
-- LEVIATHAN RUNS
-- =============================================================================

-- Table: leviathan_runs
-- Complete orchestration run history
CREATE TABLE IF NOT EXISTS leviathan_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Run info
    name TEXT NOT NULL,
    description TEXT,
    run_type TEXT NOT NULL CHECK (run_type IN (
        'full', 'fabrication_only', 'deployment_only', 'social_only', 'health_check'
    )),

    -- Configuration
    config JSONB DEFAULT '{}',
    target_url TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'rolled_back', 'cancelled'
    )),

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Results
    result JSONB DEFAULT '{}',
    error_message TEXT,

    -- Linked entities
    deployment_id UUID,
    graph_id UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- LEVIATHAN RUN STEPS
-- =============================================================================

-- Table: leviathan_run_steps
-- Individual steps within a run
CREATE TABLE IF NOT EXISTS leviathan_run_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES leviathan_runs(id) ON DELETE CASCADE,

    -- Step info
    step_name TEXT NOT NULL,
    step_type TEXT NOT NULL CHECK (step_type IN (
        'fabrication', 'cloud_deploy', 'blogger_publish', 'gsite_create',
        'link_propagation', 'health_check', 'graph_update', 'rollback'
    )),
    step_order INTEGER NOT NULL,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'skipped', 'rolled_back'
    )),

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    -- Input/Output
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',

    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Rollback info
    rollback_data JSONB,
    can_rollback BOOLEAN DEFAULT FALSE,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- LEVIATHAN RUN ERRORS
-- =============================================================================

-- Table: leviathan_run_errors
-- Detailed error logging
CREATE TABLE IF NOT EXISTS leviathan_run_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES leviathan_runs(id) ON DELETE CASCADE,
    step_id UUID REFERENCES leviathan_run_steps(id) ON DELETE SET NULL,

    -- Error info
    error_type TEXT NOT NULL,
    error_code TEXT,
    error_message TEXT NOT NULL,
    stack_trace TEXT,

    -- Context
    context JSONB DEFAULT '{}',

    -- Severity
    severity TEXT DEFAULT 'error' CHECK (severity IN (
        'warning', 'error', 'critical'
    )),

    -- Resolution
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- LEVIATHAN HASH SIGNATURES
-- =============================================================================

-- Table: leviathan_hash_signatures
-- Content hash tracking for deduplication and verification
CREATE TABLE IF NOT EXISTS leviathan_hash_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES leviathan_runs(id) ON DELETE CASCADE,

    -- Hash info
    content_type TEXT NOT NULL CHECK (content_type IN (
        'html', 'og_image', 'schema', 'wrapper', 'blogger_post', 'gsite_page'
    )),
    hash_algorithm TEXT DEFAULT 'sha256',
    hash_value TEXT NOT NULL,

    -- Source
    source_url TEXT,
    source_id UUID,

    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXING HEALTH CHECKS
-- =============================================================================

-- Table: indexing_health_checks
-- Google indexing and SEO health monitoring
CREATE TABLE IF NOT EXISTS indexing_health_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    run_id UUID REFERENCES leviathan_runs(id) ON DELETE SET NULL,

    -- Target
    url TEXT NOT NULL,
    url_type TEXT NOT NULL CHECK (url_type IN (
        'cloud', 'blogger', 'gsite', 'money_site'
    )),

    -- Indexing status
    is_indexed BOOLEAN,
    indexed_at TIMESTAMPTZ,
    cache_date TIMESTAMPTZ,

    -- SEO signals
    has_og_image BOOLEAN,
    og_image_hash TEXT,
    has_schema BOOLEAN,
    schema_valid BOOLEAN,
    schema_errors TEXT[],

    -- Performance
    load_time_ms INTEGER,
    page_size_bytes INTEGER,

    -- Mobile
    mobile_friendly BOOLEAN,

    -- Overall health score (0-100)
    health_score INTEGER,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- DEPLOYMENT AUDIT LOG
-- =============================================================================

-- Table: deployment_audit_log
-- Comprehensive audit trail for all deployment actions
CREATE TABLE IF NOT EXISTS deployment_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    run_id UUID REFERENCES leviathan_runs(id) ON DELETE SET NULL,
    step_id UUID REFERENCES leviathan_run_steps(id) ON DELETE SET NULL,

    -- Action info
    action_type TEXT NOT NULL,
    action_target TEXT,
    action_result TEXT CHECK (action_result IN (
        'success', 'failure', 'partial', 'skipped'
    )),

    -- Details
    details JSONB DEFAULT '{}',

    -- Variants and seeds
    variant_index INTEGER,
    seed INTEGER,
    randomisation_output JSONB,

    -- Links created
    links_created INTEGER DEFAULT 0,
    link_details JSONB,

    -- Cloud assets
    assets_uploaded INTEGER DEFAULT 0,
    asset_details JSONB,

    -- Timing
    action_timestamp TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER,

    -- Actor
    actor_type TEXT DEFAULT 'system' CHECK (actor_type IN (
        'system', 'user', 'scheduled', 'webhook'
    )),
    actor_id TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_leviathan_runs_org ON leviathan_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_leviathan_runs_status ON leviathan_runs(status);
CREATE INDEX IF NOT EXISTS idx_leviathan_runs_type ON leviathan_runs(run_type);
CREATE INDEX IF NOT EXISTS idx_leviathan_runs_created ON leviathan_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leviathan_run_steps_run ON leviathan_run_steps(run_id);
CREATE INDEX IF NOT EXISTS idx_leviathan_run_steps_status ON leviathan_run_steps(status);
CREATE INDEX IF NOT EXISTS idx_leviathan_run_steps_type ON leviathan_run_steps(step_type);

CREATE INDEX IF NOT EXISTS idx_leviathan_run_errors_run ON leviathan_run_errors(run_id);
CREATE INDEX IF NOT EXISTS idx_leviathan_run_errors_step ON leviathan_run_errors(step_id);
CREATE INDEX IF NOT EXISTS idx_leviathan_run_errors_severity ON leviathan_run_errors(severity);

CREATE INDEX IF NOT EXISTS idx_leviathan_hash_signatures_run ON leviathan_hash_signatures(run_id);
CREATE INDEX IF NOT EXISTS idx_leviathan_hash_signatures_hash ON leviathan_hash_signatures(hash_value);

CREATE INDEX IF NOT EXISTS idx_indexing_health_checks_org ON indexing_health_checks(org_id);
CREATE INDEX IF NOT EXISTS idx_indexing_health_checks_url ON indexing_health_checks(url);
CREATE INDEX IF NOT EXISTS idx_indexing_health_checks_run ON indexing_health_checks(run_id);

CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_org ON deployment_audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_run ON deployment_audit_log(run_id);
CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_action ON deployment_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_deployment_audit_log_timestamp ON deployment_audit_log(action_timestamp DESC);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE leviathan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leviathan_run_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE leviathan_run_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE leviathan_hash_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexing_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_audit_log ENABLE ROW LEVEL SECURITY;

-- leviathan_runs policies
CREATE POLICY "Users can view their org's runs"
ON leviathan_runs FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their org's runs"
ON leviathan_runs FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- leviathan_run_steps policies
CREATE POLICY "Users can view their run steps"
ON leviathan_run_steps FOR SELECT
USING (
    run_id IN (
        SELECT id FROM leviathan_runs
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage their run steps"
ON leviathan_run_steps FOR ALL
USING (
    run_id IN (
        SELECT id FROM leviathan_runs
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

-- leviathan_run_errors policies
CREATE POLICY "Users can view their run errors"
ON leviathan_run_errors FOR SELECT
USING (
    run_id IN (
        SELECT id FROM leviathan_runs
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage their run errors"
ON leviathan_run_errors FOR ALL
USING (
    run_id IN (
        SELECT id FROM leviathan_runs
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

-- leviathan_hash_signatures policies
CREATE POLICY "Users can view their hash signatures"
ON leviathan_hash_signatures FOR SELECT
USING (
    run_id IN (
        SELECT id FROM leviathan_runs
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can manage their hash signatures"
ON leviathan_hash_signatures FOR ALL
USING (
    run_id IN (
        SELECT id FROM leviathan_runs
        WHERE org_id IN (
            SELECT org_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    )
);

-- indexing_health_checks policies
CREATE POLICY "Users can view their health checks"
ON indexing_health_checks FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their health checks"
ON indexing_health_checks FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- deployment_audit_log policies
CREATE POLICY "Users can view their audit logs"
ON deployment_audit_log FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their audit logs"
ON deployment_audit_log FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS update_leviathan_runs_updated_at ON leviathan_runs;
CREATE TRIGGER update_leviathan_runs_updated_at
    BEFORE UPDATE ON leviathan_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE leviathan_runs IS 'Complete orchestration run history';
COMMENT ON TABLE leviathan_run_steps IS 'Individual steps within orchestration runs';
COMMENT ON TABLE leviathan_run_errors IS 'Detailed error logging for runs';
COMMENT ON TABLE leviathan_hash_signatures IS 'Content hash tracking for verification';
COMMENT ON TABLE indexing_health_checks IS 'Google indexing and SEO health monitoring';
COMMENT ON TABLE deployment_audit_log IS 'Comprehensive audit trail for deployments';
