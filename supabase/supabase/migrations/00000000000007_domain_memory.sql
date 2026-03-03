-- Domain Memory Migration
-- Creates tables for persistent agent memory across sessions
-- Implements Anthropic's domain memory pattern

-- Enable pgvector if not already enabled (should be from migration 00000000000002)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Core Domain Memories Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.domain_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Memory categorization
    domain TEXT NOT NULL CHECK (domain IN ('knowledge', 'preference', 'testing', 'debugging')),
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value JSONB NOT NULL,

    -- Semantic search
    embedding vector(1536),  -- OpenAI/Claude embedding dimension

    -- Relevance tracking
    relevance_score FLOAT DEFAULT 1.0 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    access_count INT DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,

    -- Lifecycle
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    -- Metadata
    source TEXT,
    tags JSONB DEFAULT '[]',

    -- Uniqueness constraint
    UNIQUE(user_id, domain, category, key)
);

-- ============================================================================
-- Specialized Tables for Complex Memory Types
-- ============================================================================

-- Domain Knowledge table (for structured knowledge entries)
CREATE TABLE IF NOT EXISTS public.domain_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    type TEXT NOT NULL CHECK (type IN (
        'architectural_decision',
        'pattern',
        'convention',
        'constraint',
        'dependency',
        'codebase_structure'
    )),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    context TEXT DEFAULT '',
    examples JSONB DEFAULT '[]',
    related_files JSONB DEFAULT '[]',
    related_features JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',

    -- Tracking
    confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    usage_count INT DEFAULT 0,
    created_by_session TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID,  -- NULL = global preferences

    coding_style JSONB DEFAULT '{}',
    communication JSONB DEFAULT '{}',
    workflow JSONB DEFAULT '{}',
    custom JSONB DEFAULT '{}',
    learned_corrections JSONB DEFAULT '[]',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, project_id)
);

-- Test Failure Patterns table
CREATE TABLE IF NOT EXISTS public.test_failure_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,

    error_signature TEXT NOT NULL,
    error_type TEXT NOT NULL CHECK (error_type IN ('build', 'runtime', 'test', 'type')),
    description TEXT NOT NULL,
    solutions JSONB DEFAULT '[]',

    occurrence_count INT DEFAULT 0,
    resolved_count INT DEFAULT 0,
    last_occurred TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Results table
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    session_id TEXT NOT NULL,
    feature_id TEXT,

    test_type TEXT NOT NULL CHECK (test_type IN ('unit', 'integration', 'e2e')),
    passed BOOLEAN NOT NULL,
    total_tests INT NOT NULL,
    passed_tests INT NOT NULL,
    failed_tests INT NOT NULL,
    skipped_tests INT DEFAULT 0,

    failures JSONB DEFAULT '[]',
    coverage FLOAT,
    duration_seconds FLOAT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Debugging Sessions table
CREATE TABLE IF NOT EXISTS public.debugging_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    session_id TEXT NOT NULL,
    feature_id TEXT,

    initial_error TEXT NOT NULL,
    error_type TEXT NOT NULL,
    stack_trace TEXT,
    affected_files JSONB DEFAULT '[]',

    hypotheses JSONB DEFAULT '[]',
    findings JSONB DEFAULT '[]',
    attempted_fixes JSONB DEFAULT '[]',
    current_hypothesis_id TEXT,

    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'resolved', 'blocked')),
    resolution TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Domain memories indexes
CREATE INDEX IF NOT EXISTS idx_domain_memories_user ON public.domain_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_memories_domain ON public.domain_memories(domain);
CREATE INDEX IF NOT EXISTS idx_domain_memories_category ON public.domain_memories(domain, category);
CREATE INDEX IF NOT EXISTS idx_domain_memories_tags ON public.domain_memories USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_domain_memories_created ON public.domain_memories(created_at DESC);

-- Vector similarity search index (IVFFlat for fast approximate search)
CREATE INDEX IF NOT EXISTS idx_domain_memories_embedding
    ON public.domain_memories
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Domain knowledge indexes
CREATE INDEX IF NOT EXISTS idx_domain_knowledge_project ON public.domain_knowledge(project_id);
CREATE INDEX IF NOT EXISTS idx_domain_knowledge_type ON public.domain_knowledge(type);
CREATE INDEX IF NOT EXISTS idx_domain_knowledge_tags ON public.domain_knowledge USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_domain_knowledge_created ON public.domain_knowledge(created_at DESC);

-- User preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_project ON public.user_preferences(project_id);

-- Test failure patterns indexes
CREATE INDEX IF NOT EXISTS idx_test_failure_patterns_project ON public.test_failure_patterns(project_id);
CREATE INDEX IF NOT EXISTS idx_test_failure_patterns_signature ON public.test_failure_patterns(error_signature);
CREATE INDEX IF NOT EXISTS idx_test_failure_patterns_type ON public.test_failure_patterns(error_type);

-- Test results indexes
CREATE INDEX IF NOT EXISTS idx_test_results_project ON public.test_results(project_id);
CREATE INDEX IF NOT EXISTS idx_test_results_session ON public.test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_test_results_feature ON public.test_results(feature_id);
CREATE INDEX IF NOT EXISTS idx_test_results_created ON public.test_results(created_at DESC);

-- Debugging sessions indexes
CREATE INDEX IF NOT EXISTS idx_debugging_sessions_project ON public.debugging_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_debugging_sessions_session ON public.debugging_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_debugging_sessions_status ON public.debugging_sessions(status);
CREATE INDEX IF NOT EXISTS idx_debugging_sessions_created ON public.debugging_sessions(created_at DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.domain_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_failure_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debugging_sessions ENABLE ROW LEVEL SECURITY;

-- Domain memories policies
CREATE POLICY "Users can manage their own domain memories"
    ON public.domain_memories
    FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access to domain_memories"
    ON public.domain_memories
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Domain knowledge policies
CREATE POLICY "Users can manage domain knowledge"
    ON public.domain_knowledge
    FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access to domain_knowledge"
    ON public.domain_knowledge
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- User preferences policies
CREATE POLICY "Users can manage own preferences"
    ON public.user_preferences
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to user_preferences"
    ON public.user_preferences
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Test patterns/results policies (project-level access)
CREATE POLICY "Service role full access to test_failure_patterns"
    ON public.test_failure_patterns
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to test_results"
    ON public.test_results
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to debugging_sessions"
    ON public.debugging_sessions
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Triggers
-- ============================================================================

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_domain_memories_updated_at
    BEFORE UPDATE ON public.domain_memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domain_knowledge_updated_at
    BEFORE UPDATE ON public.domain_knowledge
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_failure_patterns_updated_at
    BEFORE UPDATE ON public.test_failure_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_debugging_sessions_updated_at
    BEFORE UPDATE ON public.debugging_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to increment access count on memory retrieval
CREATE OR REPLACE FUNCTION increment_memory_access(memory_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.domain_memories
    SET
        access_count = access_count + 1,
        last_accessed_at = NOW()
    WHERE id = memory_id;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar memories using vector search
CREATE OR REPLACE FUNCTION find_similar_memories(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_domain TEXT DEFAULT NULL,
    filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    domain TEXT,
    category TEXT,
    key TEXT,
    value JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dm.id,
        dm.domain,
        dm.category,
        dm.key,
        dm.value,
        1 - (dm.embedding <=> query_embedding) AS similarity
    FROM public.domain_memories dm
    WHERE
        (filter_domain IS NULL OR dm.domain = filter_domain)
        AND (filter_user_id IS NULL OR dm.user_id = filter_user_id)
        AND dm.embedding IS NOT NULL
        AND 1 - (dm.embedding <=> query_embedding) > match_threshold
    ORDER BY dm.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to prune stale memories
CREATE OR REPLACE FUNCTION prune_stale_memories(
    min_relevance FLOAT DEFAULT 0.3,
    max_age_days INT DEFAULT 90
)
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM public.domain_memories
    WHERE
        relevance_score < min_relevance
        OR (expires_at IS NOT NULL AND expires_at < NOW())
        OR (created_at < NOW() - INTERVAL '1 day' * max_age_days AND access_count = 0);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE public.domain_memories IS 'Core domain memory storage with vector search';
COMMENT ON TABLE public.domain_knowledge IS 'Project-specific knowledge entries';
COMMENT ON TABLE public.user_preferences IS 'User coding and workflow preferences';
COMMENT ON TABLE public.test_failure_patterns IS 'Recurring test failure patterns and solutions';
COMMENT ON TABLE public.test_results IS 'Test execution history';
COMMENT ON TABLE public.debugging_sessions IS 'Multi-session debugging context';

COMMENT ON FUNCTION find_similar_memories IS 'Semantic search for similar memories using vector embeddings';
COMMENT ON FUNCTION prune_stale_memories IS 'Remove low-relevance or expired memories';
COMMENT ON FUNCTION increment_memory_access IS 'Track memory access for relevance scoring';
