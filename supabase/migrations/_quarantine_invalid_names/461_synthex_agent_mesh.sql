-- =====================================================
-- Migration 461: Synthex Multi-Agent Collaboration Mesh
-- Phase: D32 - MACM (Multi-Agent Collaboration Mesh)
-- =====================================================
-- Agent profiles, mesh links, events, tasks, and
-- collaborative workflows for autonomous agent systems
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

-- Agent capability types
CREATE TYPE synthex_agent_capability AS ENUM (
    'content_generation',
    'data_analysis',
    'customer_support',
    'email_processing',
    'social_media',
    'seo_optimization',
    'lead_scoring',
    'campaign_management',
    'reporting',
    'scheduling',
    'research',
    'translation',
    'summarization',
    'sentiment_analysis',
    'custom'
);

-- Agent status
CREATE TYPE synthex_agent_status AS ENUM (
    'active',
    'idle',
    'busy',
    'paused',
    'error',
    'offline',
    'maintenance'
);

-- Mesh link relationship types
CREATE TYPE synthex_mesh_relationship AS ENUM (
    'delegates_to',
    'supervises',
    'collaborates_with',
    'competes_with',
    'reports_to',
    'escalates_to',
    'backs_up',
    'validates',
    'triggers',
    'blocks',
    'custom'
);

-- Task status
CREATE TYPE synthex_mesh_task_status AS ENUM (
    'pending',
    'assigned',
    'in_progress',
    'awaiting_input',
    'completed',
    'failed',
    'cancelled',
    'escalated'
);

-- Event types
CREATE TYPE synthex_mesh_event_type AS ENUM (
    'task_created',
    'task_assigned',
    'task_started',
    'task_completed',
    'task_failed',
    'collaboration_started',
    'collaboration_ended',
    'handoff_initiated',
    'handoff_completed',
    'escalation',
    'feedback_received',
    'capability_updated',
    'status_changed',
    'error_occurred',
    'custom'
);

-- =====================================================
-- TABLE: synthex_agent_profiles
-- =====================================================
-- Agent definitions with capabilities and metadata

CREATE TABLE IF NOT EXISTS synthex_agent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Agent identification
    agent_name TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    agent_description TEXT,
    agent_version TEXT DEFAULT '1.0.0',

    -- Capabilities
    capabilities synthex_agent_capability[] DEFAULT '{}',
    skillset JSONB DEFAULT '{}',
    expertise_areas TEXT[] DEFAULT '{}',

    -- Configuration
    config JSONB DEFAULT '{}',
    model_settings JSONB DEFAULT '{}',
    rate_limits JSONB DEFAULT '{}',

    -- Status and health
    status synthex_agent_status NOT NULL DEFAULT 'idle',
    health_score NUMERIC(5,2) DEFAULT 100,
    last_health_check_at TIMESTAMPTZ,
    last_error TEXT,
    last_error_at TIMESTAMPTZ,

    -- Performance metrics
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    avg_task_duration_ms INTEGER DEFAULT 0,
    success_rate NUMERIC(5,4) DEFAULT 1.0,
    total_tokens_used BIGINT DEFAULT 0,
    total_cost NUMERIC(15,6) DEFAULT 0,

    -- Availability
    is_available BOOLEAN DEFAULT TRUE,
    max_concurrent_tasks INTEGER DEFAULT 5,
    current_tasks INTEGER DEFAULT 0,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE
);

-- Indexes for agent profiles
CREATE INDEX idx_agent_profiles_tenant ON synthex_agent_profiles(tenant_id);
CREATE INDEX idx_agent_profiles_type ON synthex_agent_profiles(tenant_id, agent_type);
CREATE INDEX idx_agent_profiles_status ON synthex_agent_profiles(tenant_id, status);
CREATE INDEX idx_agent_profiles_available ON synthex_agent_profiles(tenant_id, is_available, status) WHERE is_available = TRUE;
CREATE INDEX idx_agent_profiles_capabilities ON synthex_agent_profiles USING GIN(capabilities);
CREATE INDEX idx_agent_profiles_expertise ON synthex_agent_profiles USING GIN(expertise_areas);

-- RLS for agent profiles
ALTER TABLE synthex_agent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for agent profiles"
    ON synthex_agent_profiles
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_agent_mesh_links
-- =====================================================
-- Relationships between agents

CREATE TABLE IF NOT EXISTS synthex_agent_mesh_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Link endpoints
    source_agent_id UUID NOT NULL,
    target_agent_id UUID NOT NULL,

    -- Relationship
    relationship synthex_mesh_relationship NOT NULL,
    relationship_label TEXT,

    -- Link properties
    weight NUMERIC(5,4) DEFAULT 1.0,
    priority INTEGER DEFAULT 5,
    is_bidirectional BOOLEAN DEFAULT FALSE,

    -- Rules and conditions
    rules JSONB DEFAULT '[]',
    trigger_conditions JSONB DEFAULT '[]',
    delegation_policy JSONB DEFAULT '{}',

    -- Metrics
    total_interactions INTEGER DEFAULT 0,
    successful_interactions INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_source_agent FOREIGN KEY (source_agent_id)
        REFERENCES synthex_agent_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_target_agent FOREIGN KEY (target_agent_id)
        REFERENCES synthex_agent_profiles(id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_link CHECK (source_agent_id != target_agent_id)
);

-- Indexes for mesh links
CREATE INDEX idx_mesh_links_tenant ON synthex_agent_mesh_links(tenant_id);
CREATE INDEX idx_mesh_links_source ON synthex_agent_mesh_links(source_agent_id);
CREATE INDEX idx_mesh_links_target ON synthex_agent_mesh_links(target_agent_id);
CREATE INDEX idx_mesh_links_relationship ON synthex_agent_mesh_links(tenant_id, relationship);
CREATE INDEX idx_mesh_links_active ON synthex_agent_mesh_links(tenant_id, is_active) WHERE is_active = TRUE;
CREATE UNIQUE INDEX idx_mesh_links_unique ON synthex_agent_mesh_links(tenant_id, source_agent_id, target_agent_id, relationship);

-- RLS for mesh links
ALTER TABLE synthex_agent_mesh_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for mesh links"
    ON synthex_agent_mesh_links
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_agent_mesh_tasks
-- =====================================================
-- Tasks assigned to agents

CREATE TABLE IF NOT EXISTS synthex_agent_mesh_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Task identification
    task_name TEXT NOT NULL,
    task_type TEXT NOT NULL,
    task_description TEXT,

    -- Assignment
    assigned_agent_id UUID,
    created_by_agent_id UUID,
    delegated_from_task_id UUID,

    -- Task content
    input_data JSONB NOT NULL DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    context JSONB DEFAULT '{}',

    -- Priority and timing
    priority INTEGER DEFAULT 5,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    deadline_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Status
    status synthex_mesh_task_status NOT NULL DEFAULT 'pending',
    status_message TEXT,
    progress_percent INTEGER DEFAULT 0,

    -- Execution details
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    execution_log JSONB DEFAULT '[]',

    -- Performance
    duration_ms INTEGER,
    tokens_used INTEGER DEFAULT 0,
    cost NUMERIC(10,6) DEFAULT 0,

    -- Collaboration
    collaborating_agent_ids UUID[] DEFAULT '{}',
    requires_human_approval BOOLEAN DEFAULT FALSE,
    human_approved_at TIMESTAMPTZ,
    human_approved_by UUID,

    -- Source tracking
    source_type TEXT,
    source_id TEXT,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_assigned_agent FOREIGN KEY (assigned_agent_id)
        REFERENCES synthex_agent_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_created_by_agent FOREIGN KEY (created_by_agent_id)
        REFERENCES synthex_agent_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_delegated_from FOREIGN KEY (delegated_from_task_id)
        REFERENCES synthex_agent_mesh_tasks(id) ON DELETE SET NULL
);

-- Indexes for mesh tasks
CREATE INDEX idx_mesh_tasks_tenant ON synthex_agent_mesh_tasks(tenant_id);
CREATE INDEX idx_mesh_tasks_assigned ON synthex_agent_mesh_tasks(assigned_agent_id);
CREATE INDEX idx_mesh_tasks_status ON synthex_agent_mesh_tasks(tenant_id, status);
CREATE INDEX idx_mesh_tasks_priority ON synthex_agent_mesh_tasks(tenant_id, priority, scheduled_at);
CREATE INDEX idx_mesh_tasks_pending ON synthex_agent_mesh_tasks(tenant_id, status, scheduled_at) WHERE status IN ('pending', 'assigned');
CREATE INDEX idx_mesh_tasks_type ON synthex_agent_mesh_tasks(tenant_id, task_type);
CREATE INDEX idx_mesh_tasks_created ON synthex_agent_mesh_tasks(tenant_id, created_at DESC);

-- RLS for mesh tasks
ALTER TABLE synthex_agent_mesh_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for mesh tasks"
    ON synthex_agent_mesh_tasks
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_agent_mesh_events
-- =====================================================
-- Events and interactions in the mesh

CREATE TABLE IF NOT EXISTS synthex_agent_mesh_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Event source
    agent_id UUID,
    task_id UUID,
    link_id UUID,

    -- Event details
    event_type synthex_mesh_event_type NOT NULL,
    event_name TEXT,
    event_description TEXT,

    -- Event data
    payload JSONB DEFAULT '{}',
    context JSONB DEFAULT '{}',

    -- Related entities
    related_agent_ids UUID[] DEFAULT '{}',
    related_task_ids UUID[] DEFAULT '{}',

    -- Metadata
    severity TEXT DEFAULT 'info',
    tags TEXT[] DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_agent FOREIGN KEY (agent_id)
        REFERENCES synthex_agent_profiles(id) ON DELETE SET NULL,
    CONSTRAINT fk_task FOREIGN KEY (task_id)
        REFERENCES synthex_agent_mesh_tasks(id) ON DELETE SET NULL,
    CONSTRAINT fk_link FOREIGN KEY (link_id)
        REFERENCES synthex_agent_mesh_links(id) ON DELETE SET NULL
);

-- Indexes for mesh events
CREATE INDEX idx_mesh_events_tenant ON synthex_agent_mesh_events(tenant_id);
CREATE INDEX idx_mesh_events_agent ON synthex_agent_mesh_events(agent_id);
CREATE INDEX idx_mesh_events_task ON synthex_agent_mesh_events(task_id);
CREATE INDEX idx_mesh_events_type ON synthex_agent_mesh_events(tenant_id, event_type);
CREATE INDEX idx_mesh_events_created ON synthex_agent_mesh_events(tenant_id, created_at DESC);

-- RLS for mesh events
ALTER TABLE synthex_agent_mesh_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for mesh events"
    ON synthex_agent_mesh_events
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- TABLE: synthex_agent_mesh_workflows
-- =====================================================
-- Predefined multi-agent workflows

CREATE TABLE IF NOT EXISTS synthex_agent_mesh_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- Workflow identification
    workflow_name TEXT NOT NULL,
    workflow_description TEXT,
    workflow_type TEXT NOT NULL,

    -- Workflow definition
    steps JSONB NOT NULL DEFAULT '[]',
    agent_assignments JSONB DEFAULT '{}',
    conditions JSONB DEFAULT '[]',
    error_handling JSONB DEFAULT '{}',

    -- Configuration
    is_parallel BOOLEAN DEFAULT FALSE,
    timeout_minutes INTEGER DEFAULT 60,
    retry_policy JSONB DEFAULT '{}',

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_template BOOLEAN DEFAULT FALSE,

    -- Metrics
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    avg_duration_ms INTEGER DEFAULT 0,

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,

    CONSTRAINT fk_tenant FOREIGN KEY (tenant_id)
        REFERENCES synthex_tenants(id) ON DELETE CASCADE
);

-- Indexes for mesh workflows
CREATE INDEX idx_mesh_workflows_tenant ON synthex_agent_mesh_workflows(tenant_id);
CREATE INDEX idx_mesh_workflows_type ON synthex_agent_mesh_workflows(tenant_id, workflow_type);
CREATE INDEX idx_mesh_workflows_active ON synthex_agent_mesh_workflows(tenant_id, is_active) WHERE is_active = TRUE;

-- RLS for mesh workflows
ALTER TABLE synthex_agent_mesh_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for mesh workflows"
    ON synthex_agent_mesh_workflows
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function: Get available agents for a capability
CREATE OR REPLACE FUNCTION get_available_agents(
    p_tenant_id UUID,
    p_capability synthex_agent_capability
)
RETURNS SETOF synthex_agent_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM synthex_agent_profiles
    WHERE tenant_id = p_tenant_id
      AND is_available = TRUE
      AND status IN ('active', 'idle')
      AND current_tasks < max_concurrent_tasks
      AND p_capability = ANY(capabilities)
    ORDER BY
        success_rate DESC,
        current_tasks ASC,
        avg_task_duration_ms ASC
    LIMIT 10;
END;
$$;

-- Function: Assign task to best agent
CREATE OR REPLACE FUNCTION assign_task_to_agent(
    p_task_id UUID,
    p_agent_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update task
    UPDATE synthex_agent_mesh_tasks
    SET assigned_agent_id = p_agent_id,
        status = 'assigned',
        updated_at = NOW()
    WHERE id = p_task_id;

    -- Update agent task count
    UPDATE synthex_agent_profiles
    SET current_tasks = current_tasks + 1,
        status = CASE
            WHEN current_tasks + 1 >= max_concurrent_tasks THEN 'busy'::synthex_agent_status
            ELSE 'active'::synthex_agent_status
        END,
        last_active_at = NOW(),
        updated_at = NOW()
    WHERE id = p_agent_id;

    RETURN TRUE;
END;
$$;

-- Function: Complete task
CREATE OR REPLACE FUNCTION complete_agent_task(
    p_task_id UUID,
    p_output_data JSONB,
    p_duration_ms INTEGER,
    p_tokens_used INTEGER,
    p_cost NUMERIC
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_id UUID;
BEGIN
    -- Get assigned agent
    SELECT assigned_agent_id INTO v_agent_id
    FROM synthex_agent_mesh_tasks
    WHERE id = p_task_id;

    -- Update task
    UPDATE synthex_agent_mesh_tasks
    SET status = 'completed',
        output_data = p_output_data,
        duration_ms = p_duration_ms,
        tokens_used = p_tokens_used,
        cost = p_cost,
        completed_at = NOW(),
        progress_percent = 100,
        updated_at = NOW()
    WHERE id = p_task_id;

    -- Update agent metrics
    IF v_agent_id IS NOT NULL THEN
        UPDATE synthex_agent_profiles
        SET current_tasks = GREATEST(0, current_tasks - 1),
            tasks_completed = tasks_completed + 1,
            total_tokens_used = total_tokens_used + p_tokens_used,
            total_cost = total_cost + p_cost,
            avg_task_duration_ms = (avg_task_duration_ms * tasks_completed + p_duration_ms) / (tasks_completed + 1),
            success_rate = (tasks_completed + 1)::NUMERIC / NULLIF(tasks_completed + tasks_failed + 1, 0),
            status = 'active'::synthex_agent_status,
            last_active_at = NOW(),
            updated_at = NOW()
        WHERE id = v_agent_id;
    END IF;

    RETURN TRUE;
END;
$$;

-- Function: Get mesh statistics
CREATE OR REPLACE FUNCTION get_agent_mesh_stats(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stats JSONB;
    v_total_agents INTEGER;
    v_active_agents INTEGER;
    v_total_links INTEGER;
    v_total_tasks INTEGER;
    v_pending_tasks INTEGER;
    v_completed_tasks INTEGER;
    v_failed_tasks INTEGER;
    v_total_workflows INTEGER;
BEGIN
    -- Count agents
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('active', 'idle', 'busy'))
    INTO v_total_agents, v_active_agents
    FROM synthex_agent_profiles
    WHERE tenant_id = p_tenant_id;

    -- Count links
    SELECT COUNT(*) INTO v_total_links
    FROM synthex_agent_mesh_links
    WHERE tenant_id = p_tenant_id AND is_active = TRUE;

    -- Count tasks
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE status IN ('pending', 'assigned')),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'failed')
    INTO v_total_tasks, v_pending_tasks, v_completed_tasks, v_failed_tasks
    FROM synthex_agent_mesh_tasks
    WHERE tenant_id = p_tenant_id;

    -- Count workflows
    SELECT COUNT(*) INTO v_total_workflows
    FROM synthex_agent_mesh_workflows
    WHERE tenant_id = p_tenant_id AND is_active = TRUE;

    v_stats := jsonb_build_object(
        'total_agents', v_total_agents,
        'active_agents', v_active_agents,
        'total_links', v_total_links,
        'total_tasks', v_total_tasks,
        'pending_tasks', v_pending_tasks,
        'completed_tasks', v_completed_tasks,
        'failed_tasks', v_failed_tasks,
        'total_workflows', v_total_workflows,
        'task_success_rate', CASE WHEN v_completed_tasks + v_failed_tasks > 0
            THEN v_completed_tasks::NUMERIC / (v_completed_tasks + v_failed_tasks)
            ELSE 1.0 END
    );

    RETURN v_stats;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Update timestamps
CREATE OR REPLACE FUNCTION update_agent_mesh_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_agent_profiles_updated
    BEFORE UPDATE ON synthex_agent_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_mesh_timestamp();

CREATE TRIGGER trg_mesh_links_updated
    BEFORE UPDATE ON synthex_agent_mesh_links
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_mesh_timestamp();

CREATE TRIGGER trg_mesh_tasks_updated
    BEFORE UPDATE ON synthex_agent_mesh_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_mesh_timestamp();

CREATE TRIGGER trg_mesh_workflows_updated
    BEFORE UPDATE ON synthex_agent_mesh_workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_mesh_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE synthex_agent_profiles IS 'Agent definitions with capabilities and performance metrics';
COMMENT ON TABLE synthex_agent_mesh_links IS 'Relationships and delegation rules between agents';
COMMENT ON TABLE synthex_agent_mesh_tasks IS 'Tasks assigned to agents with status tracking';
COMMENT ON TABLE synthex_agent_mesh_events IS 'Events and interactions in the agent mesh';
COMMENT ON TABLE synthex_agent_mesh_workflows IS 'Predefined multi-agent workflows';

COMMENT ON FUNCTION get_available_agents IS 'Find available agents with a specific capability';
COMMENT ON FUNCTION assign_task_to_agent IS 'Assign a task to an agent';
COMMENT ON FUNCTION complete_agent_task IS 'Mark a task as completed and update agent metrics';
COMMENT ON FUNCTION get_agent_mesh_stats IS 'Get overall mesh statistics';
