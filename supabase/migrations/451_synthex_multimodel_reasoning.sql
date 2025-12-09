-- =====================================================
-- Migration 451: Synthex Multi-Model AI Reasoning Engine
-- Phase D22: Multi-Model AI Reasoning
-- =====================================================
-- Orchestrates multiple AI models for complex reasoning
-- tasks with chain-of-thought traces and confidence scoring.
-- =====================================================

-- =====================================================
-- Table: synthex_library_reasoning_models
-- Available AI models for reasoning tasks
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reasoning_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Model Identity
    model_name TEXT NOT NULL,
    model_id TEXT NOT NULL, -- e.g. 'claude-sonnet-4-5-20250514'
    provider TEXT NOT NULL CHECK (provider IN (
        'anthropic', 'openai', 'google', 'openrouter', 'local'
    )),
    description TEXT,

    -- Capabilities
    capabilities TEXT[] DEFAULT '{}', -- ['reasoning', 'coding', 'analysis', 'creative']
    max_tokens INTEGER DEFAULT 4096,
    supports_streaming BOOLEAN DEFAULT true,
    supports_tools BOOLEAN DEFAULT true,
    supports_vision BOOLEAN DEFAULT false,

    -- Cost & Performance
    cost_per_1k_input NUMERIC(10,6) DEFAULT 0,
    cost_per_1k_output NUMERIC(10,6) DEFAULT 0,
    avg_latency_ms INTEGER,
    reliability_score NUMERIC(4,3) DEFAULT 1.0,

    -- Configuration
    default_temperature NUMERIC(3,2) DEFAULT 0.7,
    default_top_p NUMERIC(3,2) DEFAULT 1.0,
    system_prompt_template TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_primary BOOLEAN DEFAULT false,
    priority_order INTEGER DEFAULT 100,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: synthex_library_reasoning_chains
-- Configured reasoning chain definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reasoning_chains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Chain Identity
    chain_name TEXT NOT NULL,
    description TEXT,
    chain_type TEXT NOT NULL CHECK (chain_type IN (
        'sequential', 'parallel', 'branching', 'iterative', 'ensemble'
    )),

    -- Chain Configuration
    steps JSONB NOT NULL DEFAULT '[]', -- [{ model_id, role, prompt_template, output_key }]
    aggregation_strategy TEXT DEFAULT 'last' CHECK (aggregation_strategy IN (
        'first', 'last', 'merge', 'vote', 'weighted_vote', 'best_confidence'
    )),

    -- Fallback & Error Handling
    fallback_model_id UUID,
    max_retries INTEGER DEFAULT 2,
    timeout_seconds INTEGER DEFAULT 120,

    -- Quality Controls
    min_confidence_threshold NUMERIC(4,3) DEFAULT 0.5,
    require_consensus BOOLEAN DEFAULT false,
    consensus_threshold NUMERIC(4,3) DEFAULT 0.7,

    -- Usage
    use_count INTEGER DEFAULT 0,
    avg_execution_time_ms INTEGER,
    success_rate NUMERIC(4,3) DEFAULT 1.0,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT fk_fallback_model FOREIGN KEY (fallback_model_id)
        REFERENCES synthex_library_reasoning_models(id) ON DELETE SET NULL
);

-- =====================================================
-- Table: synthex_library_reasoning_logs
-- Execution logs for reasoning tasks
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reasoning_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Execution Context
    chain_id UUID,
    input_type TEXT NOT NULL, -- 'text', 'structured', 'multimodal'
    input_payload JSONB NOT NULL,

    -- Models Used
    models_used TEXT[] NOT NULL DEFAULT '{}',
    model_sequence JSONB, -- [{ model, step, tokens_in, tokens_out, latency_ms }]

    -- Output
    final_output JSONB,
    output_type TEXT, -- 'text', 'structured', 'decision', 'analysis'

    -- Reasoning Trace
    reasoning_trace JSONB, -- [{ step, thought, intermediate_output }]
    chain_of_thought TEXT,

    -- Quality Metrics
    confidence NUMERIC(4,3) DEFAULT 0.0,
    consensus_score NUMERIC(4,3),
    quality_score NUMERIC(4,3),

    -- Performance
    total_tokens_in INTEGER DEFAULT 0,
    total_tokens_out INTEGER DEFAULT 0,
    total_cost NUMERIC(10,6) DEFAULT 0,
    execution_time_ms INTEGER,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'timeout', 'cancelled'
    )),
    error_message TEXT,
    error_code TEXT,

    -- Context
    triggered_by UUID, -- user or system
    trigger_source TEXT, -- 'api', 'automation', 'scheduled', 'manual'
    context_data JSONB DEFAULT '{}',

    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT fk_chain FOREIGN KEY (chain_id)
        REFERENCES synthex_library_reasoning_chains(id) ON DELETE SET NULL
);

-- =====================================================
-- Table: synthex_library_reasoning_prompts
-- Reusable prompt templates for reasoning
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reasoning_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Prompt Identity
    prompt_name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'analysis', 'synthesis', 'evaluation', 'generation',
        'classification', 'extraction', 'summarization', 'reasoning'
    )),

    -- Template
    system_prompt TEXT,
    user_prompt_template TEXT NOT NULL,
    output_schema JSONB, -- JSON schema for structured output

    -- Variables
    required_variables TEXT[] DEFAULT '{}',
    optional_variables TEXT[] DEFAULT '{}',
    variable_defaults JSONB DEFAULT '{}',

    -- Settings
    recommended_model TEXT,
    recommended_temperature NUMERIC(3,2),
    max_output_tokens INTEGER,

    -- Usage
    use_count INTEGER DEFAULT 0,
    avg_quality_score NUMERIC(4,3),

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Table: synthex_library_reasoning_cache
-- Cache for repeated reasoning queries
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reasoning_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Cache Key
    input_hash TEXT NOT NULL,
    chain_id UUID,
    model_id TEXT,

    -- Cached Result
    cached_output JSONB NOT NULL,
    confidence NUMERIC(4,3),

    -- Cache Metadata
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(tenant_id, input_hash, chain_id)
);

-- =====================================================
-- Table: synthex_library_reasoning_feedback
-- User feedback on reasoning outputs
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_library_reasoning_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Reference
    reasoning_log_id UUID NOT NULL,

    -- Feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type TEXT CHECK (feedback_type IN (
        'accurate', 'inaccurate', 'helpful', 'unhelpful',
        'incomplete', 'wrong_format', 'other'
    )),
    feedback_text TEXT,
    corrected_output JSONB,

    -- Context
    provided_by UUID,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT fk_reasoning_log FOREIGN KEY (reasoning_log_id)
        REFERENCES synthex_library_reasoning_logs(id) ON DELETE CASCADE
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_reasoning_models_tenant
    ON synthex_library_reasoning_models(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_models_provider
    ON synthex_library_reasoning_models(provider, is_active);
CREATE INDEX IF NOT EXISTS idx_reasoning_models_capabilities
    ON synthex_library_reasoning_models USING GIN(capabilities);

CREATE INDEX IF NOT EXISTS idx_reasoning_chains_tenant
    ON synthex_library_reasoning_chains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_chains_type
    ON synthex_library_reasoning_chains(chain_type, is_active);

CREATE INDEX IF NOT EXISTS idx_reasoning_logs_tenant
    ON synthex_library_reasoning_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_logs_chain
    ON synthex_library_reasoning_logs(chain_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_logs_status
    ON synthex_library_reasoning_logs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_reasoning_logs_created
    ON synthex_library_reasoning_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reasoning_prompts_tenant
    ON synthex_library_reasoning_prompts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_prompts_category
    ON synthex_library_reasoning_prompts(category, is_active);

CREATE INDEX IF NOT EXISTS idx_reasoning_cache_lookup
    ON synthex_library_reasoning_cache(tenant_id, input_hash);
CREATE INDEX IF NOT EXISTS idx_reasoning_cache_expires
    ON synthex_library_reasoning_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_reasoning_feedback_log
    ON synthex_library_reasoning_feedback(reasoning_log_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_library_reasoning_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_reasoning_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_reasoning_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_reasoning_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_reasoning_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_library_reasoning_feedback ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
CREATE POLICY "tenant_isolation" ON synthex_library_reasoning_models
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_reasoning_chains
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_reasoning_logs
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_reasoning_prompts
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_reasoning_cache
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON synthex_library_reasoning_feedback
    FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Functions
-- =====================================================

-- Function: Update reasoning chain stats after execution
CREATE OR REPLACE FUNCTION update_reasoning_chain_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND NEW.chain_id IS NOT NULL THEN
        UPDATE synthex_library_reasoning_chains
        SET
            use_count = use_count + 1,
            avg_execution_time_ms = COALESCE(
                (avg_execution_time_ms * use_count + NEW.execution_time_ms) / (use_count + 1),
                NEW.execution_time_ms
            ),
            success_rate = (
                SELECT COUNT(*) FILTER (WHERE status = 'completed')::numeric /
                       NULLIF(COUNT(*), 0)
                FROM synthex_library_reasoning_logs
                WHERE chain_id = NEW.chain_id
            ),
            updated_at = now()
        WHERE id = NEW.chain_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_reasoning_chain_stats
    AFTER UPDATE ON synthex_library_reasoning_logs
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_reasoning_chain_stats();

-- Function: Clean expired cache entries
CREATE OR REPLACE FUNCTION clean_reasoning_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM synthex_library_reasoning_cache
    WHERE expires_at < now();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate input hash for caching
CREATE OR REPLACE FUNCTION calculate_reasoning_hash(
    p_input JSONB,
    p_chain_id UUID DEFAULT NULL,
    p_model_id TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        sha256(
            (COALESCE(p_input::text, '') ||
             COALESCE(p_chain_id::text, '') ||
             COALESCE(p_model_id, ''))::bytea
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- Default Data: Pre-configured Models
-- =====================================================
-- Note: These are inserted per-tenant on first use
-- Default models are defined in the service layer

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE synthex_library_reasoning_models IS 'Available AI models for multi-model reasoning';
COMMENT ON TABLE synthex_library_reasoning_chains IS 'Configured reasoning chain workflows';
COMMENT ON TABLE synthex_library_reasoning_logs IS 'Execution logs for reasoning tasks';
COMMENT ON TABLE synthex_library_reasoning_prompts IS 'Reusable prompt templates';
COMMENT ON TABLE synthex_library_reasoning_cache IS 'Cache for repeated reasoning queries';
COMMENT ON TABLE synthex_library_reasoning_feedback IS 'User feedback on reasoning outputs';
