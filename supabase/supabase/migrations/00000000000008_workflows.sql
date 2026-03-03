-- =============================================================================
-- Migration: Visual Workflows System
-- Description: Store workflow definitions and execution state for visual workflow builder
-- =============================================================================

-- Workflow definitions table
CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Workflow metadata
    name TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',

    -- Visual workflow definition (JSON)
    definition JSONB NOT NULL,

    -- Status
    is_published BOOLEAN DEFAULT FALSE,
    is_template BOOLEAN DEFAULT FALSE,

    -- Compatibility with skills system
    skill_compatibility TEXT[] DEFAULT '{}',

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Workflow executions table
CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Execution state
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'running',
        'completed',
        'failed',
        'cancelled'
    )),

    -- Runtime context
    variables JSONB DEFAULT '{}',
    current_node_id TEXT,
    completed_nodes TEXT[] DEFAULT '{}',
    failed_nodes TEXT[] DEFAULT '{}',
    node_outputs JSONB DEFAULT '{}',

    -- Logs and errors
    logs JSONB DEFAULT '[]',
    error TEXT,

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Workflows indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_is_published ON public.workflows(is_published);
CREATE INDEX IF NOT EXISTS idx_workflows_is_template ON public.workflows(is_template);
CREATE INDEX IF NOT EXISTS idx_workflows_tags ON public.workflows USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON public.workflows(created_at DESC);

-- Workflow executions indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id ON public.workflow_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_started_at ON public.workflow_executions(started_at DESC);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;

-- Workflows RLS Policies
CREATE POLICY "Users can view own workflows"
    ON public.workflows FOR SELECT
    USING (auth.uid() = user_id OR is_published = TRUE);

CREATE POLICY "Users can create workflows"
    ON public.workflows FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workflows"
    ON public.workflows FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workflows"
    ON public.workflows FOR DELETE
    USING (auth.uid() = user_id);

-- Service role full access to workflows
CREATE POLICY "Service role has full workflows access"
    ON public.workflows FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Workflow executions RLS Policies
CREATE POLICY "Users can view own executions"
    ON public.workflow_executions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create executions"
    ON public.workflow_executions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own executions"
    ON public.workflow_executions FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role full access to executions
CREATE POLICY "Service role has full executions access"
    ON public.workflow_executions FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- =============================================================================
-- Triggers
-- =============================================================================

CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_executions_updated_at
    BEFORE UPDATE ON public.workflow_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Enable Realtime
-- =============================================================================

-- Enable Realtime for workflow_executions (for live updates during execution)
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_executions;

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE public.workflows IS 'Visual workflow definitions with node-based canvas';
COMMENT ON TABLE public.workflow_executions IS 'Runtime execution state for workflows with real-time updates';
COMMENT ON COLUMN public.workflows.definition IS 'Complete workflow JSON: nodes, edges, variables';
COMMENT ON COLUMN public.workflow_executions.logs IS 'Execution logs as JSON array for streaming';
COMMENT ON COLUMN public.workflow_executions.node_outputs IS 'Outputs from each executed node';
