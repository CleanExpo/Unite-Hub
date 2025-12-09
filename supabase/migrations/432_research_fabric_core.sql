-- =====================================================
-- Migration 432: Research Fabric Core
-- Phase D03: Research Fabric v1
-- =====================================================
-- Internal research agent data model for AI-powered
-- research workflows, document analysis, and knowledge
-- synthesis using Anthropic tools and MCP.
-- =====================================================

-- =====================================================
-- Table: research_projects
-- Container for research initiatives
-- =====================================================
CREATE TABLE IF NOT EXISTS research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Project Identity
    name TEXT NOT NULL,
    description TEXT,
    objective TEXT, -- What we're trying to learn
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'active', 'paused', 'completed', 'archived'
    )),
    -- Research Parameters
    sources TEXT[] DEFAULT ARRAY['web', 'docs'], -- web, docs, academic, news, social
    focus_keywords TEXT[],
    exclude_keywords TEXT[],
    -- Scope
    domain TEXT, -- industry/topic domain
    time_horizon TEXT CHECK (time_horizon IN (
        'current', 'last_week', 'last_month', 'last_quarter', 'last_year', 'all_time'
    )),
    geographic_scope TEXT[], -- e.g., ['Australia', 'US']
    -- Scheduling
    auto_refresh BOOLEAN DEFAULT false,
    refresh_frequency TEXT CHECK (refresh_frequency IN (
        'hourly', 'daily', 'weekly', 'monthly', 'manual'
    )),
    next_refresh_at TIMESTAMPTZ,
    last_refresh_at TIMESTAMPTZ,
    -- Results
    findings_count INT DEFAULT 0,
    insights_count INT DEFAULT 0,
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE research_projects IS 'Container for research initiatives and their parameters';
COMMENT ON COLUMN research_projects.sources IS 'Data sources to include: web, docs, academic, news, social';

-- =====================================================
-- Table: research_queries
-- Individual research queries within a project
-- =====================================================
CREATE TABLE IF NOT EXISTS research_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    -- Query Details
    query TEXT NOT NULL,
    query_type TEXT DEFAULT 'general' CHECK (query_type IN (
        'general', 'competitor', 'market', 'technical', 'trend', 'sentiment', 'citation'
    )),
    -- Execution
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'cancelled'
    )),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INT,
    -- Results
    result_count INT DEFAULT 0,
    result_summary TEXT,
    raw_results JSONB DEFAULT '[]', -- Array of search results
    -- AI Processing
    ai_analysis TEXT, -- AI-generated analysis
    ai_confidence NUMERIC CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    -- Error Handling
    error_message TEXT,
    retry_count INT DEFAULT 0,
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE research_queries IS 'Individual research queries executed within projects';
COMMENT ON COLUMN research_queries.raw_results IS 'Array of raw search/research results';

-- =====================================================
-- Table: research_findings
-- Extracted insights from research
-- =====================================================
CREATE TABLE IF NOT EXISTS research_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID REFERENCES research_projects(id) ON DELETE CASCADE,
    query_id UUID REFERENCES research_queries(id) ON DELETE SET NULL,
    -- Finding Details
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT, -- Full extracted content
    finding_type TEXT DEFAULT 'insight' CHECK (finding_type IN (
        'insight', 'fact', 'trend', 'opportunity', 'threat', 'quote', 'statistic', 'recommendation'
    )),
    -- Relevance & Quality
    relevance_score NUMERIC DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    confidence_score NUMERIC DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    -- Source Information
    source_url TEXT,
    source_title TEXT,
    source_domain TEXT,
    source_date TIMESTAMPTZ,
    -- Categorization
    topics TEXT[],
    entities TEXT[], -- Named entities mentioned
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    -- Review Status
    is_reviewed BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    is_actionable BOOLEAN DEFAULT false,
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE research_findings IS 'Extracted insights and findings from research queries';
COMMENT ON COLUMN research_findings.relevance_score IS 'AI-assessed relevance to project objective (0-1)';

-- =====================================================
-- Table: research_documents
-- Uploaded documents for analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS research_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID REFERENCES research_projects(id) ON DELETE SET NULL,
    -- Document Identity
    name TEXT NOT NULL,
    file_path TEXT, -- Storage path
    file_url TEXT, -- Accessible URL
    file_type TEXT, -- pdf, docx, txt, etc.
    file_size_bytes BIGINT,
    -- Processing
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    processed_at TIMESTAMPTZ,
    -- Extracted Content
    extracted_text TEXT,
    page_count INT,
    word_count INT,
    -- AI Analysis
    ai_summary TEXT,
    key_points JSONB DEFAULT '[]', -- Array of key points
    entities JSONB DEFAULT '{}', -- Named entities
    topics TEXT[],
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE research_documents IS 'Uploaded documents for AI-powered analysis';
COMMENT ON COLUMN research_documents.key_points IS 'Array of AI-extracted key points';

-- =====================================================
-- Table: research_knowledge_base
-- Synthesized knowledge from research
-- =====================================================
CREATE TABLE IF NOT EXISTS research_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Knowledge Item
    topic TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'summary' CHECK (content_type IN (
        'summary', 'definition', 'process', 'comparison', 'timeline', 'faq', 'custom'
    )),
    -- Source Attribution
    source_project_ids UUID[],
    source_finding_ids UUID[],
    source_document_ids UUID[],
    citation_count INT DEFAULT 0,
    -- Quality & Freshness
    confidence_score NUMERIC DEFAULT 0.5,
    last_validated_at TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT false,
    -- Usage
    view_count INT DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,
    -- Categorization
    tags TEXT[],
    related_topics TEXT[],
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE research_knowledge_base IS 'Synthesized knowledge items from research activities';
COMMENT ON COLUMN research_knowledge_base.source_finding_ids IS 'Findings that contributed to this knowledge';

-- =====================================================
-- Table: research_agent_runs
-- Track research agent execution history
-- =====================================================
CREATE TABLE IF NOT EXISTS research_agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    project_id UUID REFERENCES research_projects(id) ON DELETE SET NULL,
    -- Run Details
    run_type TEXT DEFAULT 'manual' CHECK (run_type IN (
        'manual', 'scheduled', 'triggered', 'background'
    )),
    trigger_source TEXT, -- e.g., 'user', 'schedule', 'webhook'
    -- Execution
    status TEXT DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'cancelled'
    )),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms INT,
    -- Work Done
    queries_executed INT DEFAULT 0,
    findings_created INT DEFAULT 0,
    documents_processed INT DEFAULT 0,
    -- AI Usage
    ai_model TEXT,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    estimated_cost_usd NUMERIC,
    -- Results
    summary TEXT,
    error_message TEXT,
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE research_agent_runs IS 'Execution history for research agent runs';
COMMENT ON COLUMN research_agent_runs.estimated_cost_usd IS 'Estimated API cost for the run';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_research_projects_tenant ON research_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_research_projects_status ON research_projects(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_research_projects_auto_refresh ON research_projects(auto_refresh, next_refresh_at)
    WHERE auto_refresh = true;

CREATE INDEX IF NOT EXISTS idx_research_queries_tenant ON research_queries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_research_queries_project ON research_queries(project_id);
CREATE INDEX IF NOT EXISTS idx_research_queries_status ON research_queries(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_research_findings_tenant ON research_findings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_research_findings_project ON research_findings(project_id);
CREATE INDEX IF NOT EXISTS idx_research_findings_starred ON research_findings(tenant_id, is_starred)
    WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_research_findings_type ON research_findings(tenant_id, finding_type);

CREATE INDEX IF NOT EXISTS idx_research_documents_tenant ON research_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_research_documents_project ON research_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_research_documents_status ON research_documents(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_research_knowledge_tenant ON research_knowledge_base(tenant_id);
CREATE INDEX IF NOT EXISTS idx_research_knowledge_topic ON research_knowledge_base(tenant_id, topic);

CREATE INDEX IF NOT EXISTS idx_research_runs_tenant ON research_agent_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_research_runs_project ON research_agent_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_research_runs_status ON research_agent_runs(tenant_id, status);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_agent_runs ENABLE ROW LEVEL SECURITY;

-- Projects scoped to tenant
CREATE POLICY "Research projects scoped to tenant"
    ON research_projects FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Queries scoped to tenant
CREATE POLICY "Research queries scoped to tenant"
    ON research_queries FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Findings scoped to tenant
CREATE POLICY "Research findings scoped to tenant"
    ON research_findings FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Documents scoped to tenant
CREATE POLICY "Research documents scoped to tenant"
    ON research_documents FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Knowledge base scoped to tenant
CREATE POLICY "Research knowledge scoped to tenant"
    ON research_knowledge_base FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Agent runs scoped to tenant
CREATE POLICY "Research agent runs scoped to tenant"
    ON research_agent_runs FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_research_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_research_projects_updated ON research_projects;
CREATE TRIGGER trg_research_projects_updated
    BEFORE UPDATE ON research_projects
    FOR EACH ROW EXECUTE FUNCTION update_research_timestamp();

DROP TRIGGER IF EXISTS trg_research_knowledge_updated ON research_knowledge_base;
CREATE TRIGGER trg_research_knowledge_updated
    BEFORE UPDATE ON research_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_research_timestamp();

-- =====================================================
-- Grants
-- =====================================================
GRANT ALL ON research_projects TO authenticated;
GRANT ALL ON research_queries TO authenticated;
GRANT ALL ON research_findings TO authenticated;
GRANT ALL ON research_documents TO authenticated;
GRANT ALL ON research_knowledge_base TO authenticated;
GRANT ALL ON research_agent_runs TO authenticated;
