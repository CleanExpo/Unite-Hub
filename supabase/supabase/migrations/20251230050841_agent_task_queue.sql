-- Migration: Agent Task Queue
-- Purpose: Store tasks submitted to the agentic layer for execution
-- Created: 2025-12-30

BEGIN;

-- ============================================================================
-- Table: agent_task_queue
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_task_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Task details
    title TEXT NOT NULL CHECK (length(title) >= 3),
    description TEXT NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('feature', 'bug', 'refactor', 'docs', 'test')),
    priority INT NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')
    ),

    -- Agent assignment
    assigned_agent_id TEXT,
    assigned_agent_type TEXT CHECK (
        assigned_agent_type IS NULL OR
        assigned_agent_type IN ('frontend', 'backend', 'database', 'devops', 'general')
    ),

    -- Execution metadata
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    iterations INT DEFAULT 0,
    verification_status TEXT,
    pr_url TEXT,

    -- Results
    result JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,

    -- Audit
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_completion_time CHECK (
        completed_at IS NULL OR completed_at >= started_at
    ),
    CONSTRAINT valid_started_time CHECK (
        started_at IS NULL OR started_at >= created_at
    )
);

-- Indexes for common queries
CREATE INDEX idx_agent_task_queue_status ON public.agent_task_queue(status);
CREATE INDEX idx_agent_task_queue_created_at ON public.agent_task_queue(created_at DESC);
CREATE INDEX idx_agent_task_queue_priority ON public.agent_task_queue(priority DESC);
CREATE INDEX idx_agent_task_queue_created_by ON public.agent_task_queue(created_by)
    WHERE created_by IS NOT NULL;
CREATE INDEX idx_agent_task_queue_assigned_agent ON public.agent_task_queue(assigned_agent_id)
    WHERE assigned_agent_id IS NOT NULL;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE public.agent_task_queue ENABLE ROW LEVEL SECURITY;

-- Anyone can view pending and completed tasks
CREATE POLICY "Public can view tasks"
    ON public.agent_task_queue
    FOR SELECT
    USING (true);

-- Authenticated users can create tasks
CREATE POLICY "Authenticated users can create tasks"
    ON public.agent_task_queue
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
    ON public.agent_task_queue
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by);

-- Service role can update any task (for agent execution)
CREATE POLICY "Service role can update tasks"
    ON public.agent_task_queue
    FOR UPDATE
    TO service_role
    WITH CHECK (true);

-- ============================================================================
-- Triggers
-- ============================================================================

CREATE TRIGGER agent_task_queue_updated_at
    BEFORE UPDATE ON public.agent_task_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.agent_task_queue TO authenticated;
GRANT SELECT ON public.agent_task_queue TO anon;
GRANT ALL ON public.agent_task_queue TO service_role;

COMMIT;
