-- Migration: Enterprise Foundation Tables
-- Phase 12 Week 1-2: Multi-workspace structure and enterprise permissions
-- Created: 2025-11-20

-- =============================================================================
-- ENTERPRISE ORGANIZATION SETTINGS
-- =============================================================================

-- Table: org_settings
-- Enterprise-level configuration for organizations
CREATE TABLE IF NOT EXISTS org_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'starter' CHECK (plan_type IN ('starter', 'professional', 'enterprise', 'custom')),
    max_workspaces INTEGER NOT NULL DEFAULT 1,
    max_users_per_workspace INTEGER NOT NULL DEFAULT 5,
    features JSONB NOT NULL DEFAULT '{}',
    billing_email TEXT,
    billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'annual')),
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id)
);

-- =============================================================================
-- WORKSPACE ROLES
-- =============================================================================

-- Table: workspace_roles
-- Defines available roles within workspaces
CREATE TABLE IF NOT EXISTS workspace_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default system roles
INSERT INTO workspace_roles (name, description, permissions, is_system_role) VALUES
('owner', 'Full control over workspace', '["*"]', TRUE),
('admin', 'Administrative access', '["read", "write", "delete", "manage_members", "manage_settings"]', TRUE),
('editor', 'Can edit content', '["read", "write", "delete"]', TRUE),
('viewer', 'Read-only access', '["read"]', TRUE),
('operator', 'Can execute automated tasks', '["read", "write", "execute"]', TRUE)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- WORKSPACE MEMBERS (Enhanced)
-- =============================================================================

-- Table: workspace_members
-- Maps users to workspaces with roles
CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES workspace_roles(id) ON DELETE SET NULL,
    role_name TEXT NOT NULL DEFAULT 'viewer',
    -- Keep FK reference to auth.users (allowed in migrations)
invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    permissions_override JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- =============================================================================
-- WORKSPACE SETTINGS
-- =============================================================================

-- Table: workspace_settings
-- Per-workspace configuration
CREATE TABLE IF NOT EXISTS workspace_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    default_domain TEXT,
    timezone TEXT DEFAULT 'UTC',
    notification_preferences JSONB DEFAULT '{}',
    integration_config JSONB DEFAULT '{}',
    ai_preferences JSONB DEFAULT '{}',
    branding JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id)
);

-- =============================================================================
-- ORG GRAPH AUDIT LOG
-- =============================================================================

-- Table: org_graph_audit
-- Tracks changes to org/workspace structure
CREATE TABLE IF NOT EXISTS org_graph_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
    -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN (
        'workspace_created', 'workspace_deleted', 'workspace_archived',
        'member_added', 'member_removed', 'role_changed',
        'settings_updated', 'plan_changed'
    )),
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_org_settings_org ON org_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_org_settings_plan ON org_settings(plan_type);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON workspace_members(role_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_active ON workspace_members(is_active);

CREATE INDEX IF NOT EXISTS idx_workspace_settings_workspace ON workspace_settings(workspace_id);

CREATE INDEX IF NOT EXISTS idx_org_graph_audit_org ON org_graph_audit(org_id);
CREATE INDEX IF NOT EXISTS idx_org_graph_audit_workspace ON org_graph_audit(workspace_id);
CREATE INDEX IF NOT EXISTS idx_org_graph_audit_created ON org_graph_audit(created_at DESC);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- org_settings policies
ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org settings"
ON org_settings FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Org admins can update settings"
ON org_settings FOR UPDATE
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- workspace_roles policies
ALTER TABLE workspace_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roles"
ON workspace_roles FOR SELECT
USING (true);

-- workspace_members policies
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspace members"
ON workspace_members FOR SELECT
USING (
    workspace_id IN (
        SELECT w.id FROM workspaces w
        JOIN user_organizations uo ON uo.org_id = w.org_id
        WHERE uo.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can insert workspace members"
ON workspace_members FOR INSERT
WITH CHECK (
    workspace_id IN (
        SELECT wm.workspace_id FROM workspace_members wm
        WHERE wm.user_id = auth.uid() AND wm.role_name IN ('owner', 'admin')
    )
);

CREATE POLICY "Admins can update workspace members"
ON workspace_members FOR UPDATE
USING (
    workspace_id IN (
        SELECT wm.workspace_id FROM workspace_members wm
        WHERE wm.user_id = auth.uid() AND wm.role_name IN ('owner', 'admin')
    )
);

CREATE POLICY "Admins can delete workspace members"
ON workspace_members FOR DELETE
USING (
    workspace_id IN (
        SELECT wm.workspace_id FROM workspace_members wm
        WHERE wm.user_id = auth.uid() AND wm.role_name IN ('owner', 'admin')
    )
);

-- workspace_settings policies
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace settings"
ON workspace_settings FOR SELECT
USING (
    workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND is_active = TRUE
    )
);

CREATE POLICY "Admins can update workspace settings"
ON workspace_settings FOR UPDATE
USING (
    workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE user_id = auth.uid() AND role_name IN ('owner', 'admin')
    )
);

-- org_graph_audit policies
ALTER TABLE org_graph_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON org_graph_audit FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "System can insert audit logs"
ON org_graph_audit FOR INSERT
WITH CHECK (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Trigger for updated_at
CREATE TRIGGER update_org_settings_updated_at
    BEFORE UPDATE ON org_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at
    BEFORE UPDATE ON workspace_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_settings_updated_at
    BEFORE UPDATE ON workspace_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function: Get user's accessible workspaces
CREATE OR REPLACE FUNCTION get_user_workspaces(p_user_id UUID)
RETURNS TABLE (
    workspace_id UUID,
    workspace_name TEXT,
    org_id UUID,
    org_name TEXT,
    role_name TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id AS workspace_id,
        w.name AS workspace_name,
        o.id AS org_id,
        o.name AS org_name,
        wm.role_name,
        wm.is_active
    FROM workspace_members wm
    JOIN workspaces w ON w.id = wm.workspace_id
    JOIN organizations o ON o.id = w.org_id
    WHERE wm.user_id = p_user_id AND wm.is_active = TRUE
    ORDER BY o.name, w.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user has permission in workspace
CREATE OR REPLACE FUNCTION check_workspace_permission(
    p_user_id UUID,
    p_workspace_id UUID,
    p_permission TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_permissions JSONB;
    v_override JSONB;
BEGIN
    -- Get role permissions and override
    SELECT wr.permissions, wm.permissions_override
    INTO v_permissions, v_override
    FROM workspace_members wm
    LEFT JOIN workspace_roles wr ON wr.id = wm.role_id
    WHERE wm.user_id = p_user_id
      AND wm.workspace_id = p_workspace_id
      AND wm.is_active = TRUE;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check override first
    IF v_override IS NOT NULL AND v_override ? p_permission THEN
        RETURN (v_override->p_permission)::boolean;
    END IF;

    -- Check role permissions
    IF v_permissions ? '*' THEN
        RETURN TRUE;
    END IF;

    RETURN v_permissions ? p_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get org workspace count
CREATE OR REPLACE FUNCTION get_org_workspace_count(p_org_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM workspaces
        WHERE org_id = p_org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE org_settings IS 'Enterprise-level settings and plan configuration for organizations';
COMMENT ON TABLE workspace_roles IS 'Available roles and permissions for workspace members';
COMMENT ON TABLE workspace_members IS 'Maps users to workspaces with roles and permissions';
COMMENT ON TABLE workspace_settings IS 'Per-workspace configuration and preferences';
COMMENT ON TABLE org_graph_audit IS 'Audit trail for organizational structure changes';

COMMENT ON FUNCTION get_user_workspaces IS 'Returns all workspaces accessible to a user';
COMMENT ON FUNCTION check_workspace_permission IS 'Checks if user has specific permission in workspace';
COMMENT ON FUNCTION get_org_workspace_count IS 'Returns total workspace count for an organization';
