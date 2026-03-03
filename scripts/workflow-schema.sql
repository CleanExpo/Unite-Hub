-- =============================================================================
-- Workflow Builder Database Schema
-- PostgreSQL 15 with pgvector
-- Scientific Luxury Design System Compliant
-- =============================================================================

-- =============================================================================
-- SECTION 1: Workflow ENUM Types
-- =============================================================================

-- Node types matching Scientific Luxury spectral colours
CREATE TYPE workflow_node_type AS ENUM (
    'start',        -- Cyan (#00F5FF) - workflow start
    'trigger',      -- Cyan (#00F5FF) - event trigger
    'end',          -- Grey (#6B7280) - workflow end
    'output',       -- Grey (#6B7280) - output nodes
    'llm',          -- Magenta (#FF00FF) - LLM call
    'agent',        -- Magenta (#FF00FF) - AI agent
    'tool',         -- Emerald (#00FF88) - tool execution
    'action',       -- Emerald (#00FF88) - actions
    'conditional',  -- Amber (#FFB800) - conditionals
    'logic',        -- Amber (#FFB800) - logic gates
    'loop',         -- Amber (#FFB800) - loops
    'knowledge',    -- Cyan (#00F5FF) - knowledge base
    'http',         -- Emerald (#00FF88) - HTTP calls
    'code',         -- Emerald (#00FF88) - code execution
    'verification'  -- Amber (#FFB800) - verification gates
);

-- Edge types for workflow connections
CREATE TYPE workflow_edge_type AS ENUM (
    'default',      -- Standard connection
    'true',         -- Conditional true branch
    'false',        -- Conditional false branch
    'success',      -- Success path
    'error',        -- Error path
    'item'          -- Loop item iteration
);

-- Execution status matching NodeVisualStatus
CREATE TYPE workflow_execution_status AS ENUM (
    'pending',      -- Grey - waiting to start
    'running',      -- Cyan - in progress
    'completed',    -- Emerald - success
    'failed',       -- Red - error
    'cancelled',    -- Grey - user cancelled
    'awaiting'      -- Amber - awaiting verification
);

-- =============================================================================
-- SECTION 2: Workflows Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(50) DEFAULT '1.0.0',
    is_published BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    variables JSONB DEFAULT '{}'::JSONB,
    skill_compatibility TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    published_at TIMESTAMPTZ,

    CONSTRAINT workflow_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Indexes for workflows
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_published ON workflows(is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_workflows_tags ON workflows USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_workflows_metadata ON workflows USING GIN (metadata);

-- Trigger for updated_at
CREATE TRIGGER workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 3: Workflow Nodes Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflow_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    type workflow_node_type NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT,
    position_x DECIMAL(10, 2) NOT NULL DEFAULT 0,
    position_y DECIMAL(10, 2) NOT NULL DEFAULT 0,
    config JSONB DEFAULT '{}'::JSONB,
    inputs JSONB DEFAULT '{}'::JSONB,
    outputs JSONB DEFAULT '{}'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT node_label_not_empty CHECK (LENGTH(TRIM(label)) > 0)
);

-- Indexes for workflow_nodes
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow_id ON workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_type ON workflow_nodes(type);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_config ON workflow_nodes USING GIN (config);

-- Trigger for updated_at
CREATE TRIGGER workflow_nodes_updated_at
    BEFORE UPDATE ON workflow_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 4: Workflow Edges Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflow_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    source_handle VARCHAR(100),
    target_handle VARCHAR(100),
    type workflow_edge_type DEFAULT 'default',
    condition TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Prevent self-loops
    CONSTRAINT no_self_loop CHECK (source_node_id != target_node_id)
);

-- Indexes for workflow_edges
CREATE INDEX IF NOT EXISTS idx_workflow_edges_workflow_id ON workflow_edges(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_source ON workflow_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_target ON workflow_edges(target_node_id);

-- =============================================================================
-- SECTION 5: Workflow Executions Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status workflow_execution_status DEFAULT 'pending',
    current_node_id UUID REFERENCES workflow_nodes(id) ON DELETE SET NULL,
    variables JSONB DEFAULT '{}'::JSONB,
    input_data JSONB DEFAULT '{}'::JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Duration in milliseconds (computed on completion)
    duration_ms INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN completed_at IS NOT NULL AND started_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
            ELSE NULL
        END
    ) STORED
);

-- Indexes for workflow_executions
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id ON workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created ON workflow_executions(created_at DESC);

-- =============================================================================
-- SECTION 6: Workflow Execution Logs Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflow_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES workflow_nodes(id) ON DELETE CASCADE,
    status workflow_execution_status NOT NULL,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for workflow_execution_logs
CREATE INDEX IF NOT EXISTS idx_execution_logs_execution_id ON workflow_execution_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_node_id ON workflow_execution_logs(node_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_status ON workflow_execution_logs(status);

-- =============================================================================
-- SECTION 7: Workflow Collaboration Table (for real-time sync)
-- =============================================================================

CREATE TABLE IF NOT EXISTS workflow_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'editor',
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    cursor_position JSONB,  -- For real-time cursor sync

    UNIQUE(workflow_id, user_id)
);

-- Indexes for workflow_collaborators
CREATE INDEX IF NOT EXISTS idx_workflow_collaborators_workflow ON workflow_collaborators(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_collaborators_user ON workflow_collaborators(user_id);

-- =============================================================================
-- SECTION 8: Update Schema Version
-- =============================================================================

INSERT INTO schema_version (version, description)
VALUES ('1.1.0-workflows', 'Add workflow builder tables')
ON CONFLICT (version) DO NOTHING;

-- =============================================================================
-- Schema Complete
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Workflow Builder schema complete!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Tables: workflows, workflow_nodes, workflow_edges,';
    RAISE NOTICE '        workflow_executions, workflow_execution_logs, workflow_collaborators';
    RAISE NOTICE 'ENUMs: workflow_node_type, workflow_edge_type, workflow_execution_status';
    RAISE NOTICE '=============================================================================';
END $$;
