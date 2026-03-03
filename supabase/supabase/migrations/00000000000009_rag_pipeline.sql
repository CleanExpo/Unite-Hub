-- =============================================================================
-- Migration: RAG Pipeline System
-- Description: Document ingestion, chunking, and hybrid search for knowledge retrieval
-- =============================================================================

-- Document sources table
CREATE TABLE IF NOT EXISTS public.document_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,

    -- Source information
    source_type TEXT NOT NULL CHECK (source_type IN (
        'upload', 'url', 'google_drive', 'notion', 'confluence', 'github'
    )),
    source_uri TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT,
    file_size_bytes BIGINT,

    -- Processing state
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'archived'
    )),
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    processed_at TIMESTAMPTZ
);

-- Document chunks table (parent-child hierarchy)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.document_sources(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,

    -- Chunk hierarchy
    parent_chunk_id UUID REFERENCES public.document_chunks(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_level INT DEFAULT 0,  -- 0 = child (retrieval), 1 = parent (context)

    -- Content
    content TEXT NOT NULL,
    content_hash TEXT NOT NULL,  -- SHA256 for deduplication
    token_count INT,

    -- Embeddings
    embedding vector(1536),  -- OpenAI embeddings

    -- Full-text search
    content_tsvector tsvector,  -- For keyword search

    -- Metadata
    metadata JSONB DEFAULT '{}',
    heading_hierarchy TEXT[] DEFAULT '{}',

    -- Enrichment (optional LLM-powered)
    summary TEXT,
    entities JSONB DEFAULT '[]',
    keywords TEXT[] DEFAULT '{}',
    classification_tags TEXT[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    UNIQUE(source_id, chunk_index, chunk_level)
);

-- Pipeline runs (audit trail)
CREATE TABLE IF NOT EXISTS public.pipeline_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES public.document_sources(id) ON DELETE CASCADE NOT NULL,

    -- Pipeline configuration
    pipeline_config JSONB NOT NULL,

    -- Execution
    status TEXT DEFAULT 'running' CHECK (status IN (
        'running', 'completed', 'failed', 'cancelled'
    )),
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_seconds FLOAT,

    -- Results
    chunks_created INT DEFAULT 0,
    chunks_updated INT DEFAULT 0,
    chunks_failed INT DEFAULT 0,
    error_message TEXT,

    -- Metrics
    metrics JSONB DEFAULT '{}'
);

-- Search queries (for analytics)
CREATE TABLE IF NOT EXISTS public.search_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,

    query_text TEXT NOT NULL,
    query_embedding vector(1536),

    -- Search configuration
    search_type TEXT CHECK (search_type IN ('vector', 'keyword', 'hybrid')),
    filters JSONB DEFAULT '{}',

    -- Results
    result_chunk_ids UUID[] DEFAULT '{}',
    result_count INT,

    -- Feedback
    clicked_result_ids UUID[] DEFAULT '{}',
    feedback_score FLOAT,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Document sources
CREATE INDEX IF NOT EXISTS idx_document_sources_user ON public.document_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_document_sources_project ON public.document_sources(project_id);
CREATE INDEX IF NOT EXISTS idx_document_sources_status ON public.document_sources(status);
CREATE INDEX IF NOT EXISTS idx_document_sources_type ON public.document_sources(source_type);

-- Document chunks
CREATE INDEX IF NOT EXISTS idx_document_chunks_source ON public.document_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_project ON public.document_chunks(project_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_parent ON public.document_chunks(parent_chunk_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_hash ON public.document_chunks(content_hash);
CREATE INDEX IF NOT EXISTS idx_document_chunks_level ON public.document_chunks(chunk_level);

-- Vector similarity search (IVFFlat)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
    ON public.document_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Full-text search (GIN)
CREATE INDEX IF NOT EXISTS idx_document_chunks_fts
    ON public.document_chunks
    USING GIN(content_tsvector);

-- Metadata indexes
CREATE INDEX IF NOT EXISTS idx_document_chunks_metadata ON public.document_chunks USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_document_chunks_tags ON public.document_chunks USING GIN(classification_tags);

-- Pipeline runs
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_source ON public.pipeline_runs(source_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON public.pipeline_runs(status);

-- Search queries
CREATE INDEX IF NOT EXISTS idx_search_queries_user ON public.search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_project ON public.search_queries(project_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON public.search_queries(created_at DESC);

-- =============================================================================
-- Triggers
-- =============================================================================

-- Auto-update tsvector on content change
CREATE OR REPLACE FUNCTION update_content_tsvector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.content_tsvector := to_tsvector('english', NEW.content);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chunk_tsvector
    BEFORE INSERT OR UPDATE OF content
    ON public.document_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_content_tsvector();

-- Auto-update updated_at
CREATE TRIGGER update_document_sources_updated_at
    BEFORE UPDATE ON public.document_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_chunks_updated_at
    BEFORE UPDATE ON public.document_chunks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Hybrid Search Function
-- =============================================================================

CREATE OR REPLACE FUNCTION hybrid_search(
    query_text TEXT,
    query_embedding vector(1536),
    project_id_filter UUID,
    vector_weight FLOAT DEFAULT 0.6,
    keyword_weight FLOAT DEFAULT 0.4,
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    chunk_id UUID,
    source_id UUID,
    content TEXT,
    vector_score FLOAT,
    keyword_score FLOAT,
    combined_score FLOAT,
    metadata JSONB,
    heading_hierarchy TEXT[],
    summary TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH vector_results AS (
        SELECT
            id,
            source_id,
            content,
            metadata,
            heading_hierarchy,
            summary,
            1 - (embedding <=> query_embedding) AS score
        FROM public.document_chunks
        WHERE
            project_id = project_id_filter
            AND embedding IS NOT NULL
        ORDER BY embedding <=> query_embedding
        LIMIT match_count * 2
    ),
    keyword_results AS (
        SELECT
            id,
            source_id,
            content,
            metadata,
            heading_hierarchy,
            summary,
            ts_rank(content_tsvector, to_tsquery('english', query_text)) AS score
        FROM public.document_chunks
        WHERE
            project_id = project_id_filter
            AND content_tsvector @@ to_tsquery('english', query_text)
        ORDER BY score DESC
        LIMIT match_count * 2
    ),
    combined AS (
        SELECT
            COALESCE(v.id, k.id) AS id,
            COALESCE(v.source_id, k.source_id) AS source_id,
            COALESCE(v.content, k.content) AS content,
            COALESCE(v.metadata, k.metadata) AS metadata,
            COALESCE(v.heading_hierarchy, k.heading_hierarchy) AS heading_hierarchy,
            COALESCE(v.summary, k.summary) AS summary,
            COALESCE(v.score, 0) AS v_score,
            COALESCE(k.score, 0) AS k_score,
            (COALESCE(v.score, 0) * vector_weight + COALESCE(k.score, 0) * keyword_weight) AS combined
        FROM vector_results v
        FULL OUTER JOIN keyword_results k ON v.id = k.id
    )
    SELECT
        id, source_id, content, v_score, k_score, combined, metadata, heading_hierarchy, summary
    FROM combined
    WHERE combined > match_threshold
    ORDER BY combined DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- RLS Policies
-- =============================================================================

ALTER TABLE public.document_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role full access to document_sources"
    ON public.document_sources FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to document_chunks"
    ON public.document_chunks FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to pipeline_runs"
    ON public.pipeline_runs FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to search_queries"
    ON public.search_queries FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.document_sources IS 'Source documents (uploaded files, URLs, connectors)';
COMMENT ON TABLE public.document_chunks IS 'Chunked content with embeddings and full-text search';
COMMENT ON TABLE public.pipeline_runs IS 'Pipeline execution audit trail';
COMMENT ON TABLE public.search_queries IS 'Search query history for analytics';
COMMENT ON FUNCTION hybrid_search IS 'Combines vector and keyword search with weighted scoring';
