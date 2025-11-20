-- Migration: Enterprise Team Structures
-- Phase 12 Week 3-4: Hierarchical teams, business units, and advanced permissions
-- Created: 2025-11-20

-- =============================================================================
-- BUSINESS UNITS
-- =============================================================================

-- Table: business_units
-- Top-level organizational divisions
CREATE TABLE IF NOT EXISTS business_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES business_units(id) ON DELETE SET NULL,
    head_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, name)
);

-- Table: bu_workspaces
-- Maps business units to workspaces
CREATE TABLE IF NOT EXISTS bu_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bu_id UUID NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bu_id, workspace_id)
);

-- =============================================================================
-- TEAMS
-- =============================================================================

-- Table: teams
-- Teams within organizations (can span workspaces)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    bu_id UUID REFERENCES business_units(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    team_type TEXT DEFAULT 'standard' CHECK (team_type IN ('standard', 'project', 'department', 'cross_functional')),
    lead_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, name)
);

-- Table: team_roles
-- Defines roles within teams
CREATE TABLE IF NOT EXISTS team_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    can_manage_team BOOLEAN DEFAULT FALSE,
    can_assign_tasks BOOLEAN DEFAULT FALSE,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default team roles
INSERT INTO team_roles (name, description, permissions, can_manage_team, can_assign_tasks, is_system_role) VALUES
('team_lead', 'Team leader with full control', '["*"]', TRUE, TRUE, TRUE),
('team_admin', 'Team administrator', '["read", "write", "delete", "manage_members"]', TRUE, TRUE, TRUE),
('team_member', 'Standard team member', '["read", "write"]', FALSE, FALSE, TRUE),
('team_viewer', 'Read-only access to team', '["read"]', FALSE, FALSE, TRUE),
('team_contributor', 'Can contribute but not delete', '["read", "write"]', FALSE, TRUE, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Table: team_members
-- Maps users to teams with roles
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES team_roles(id) ON DELETE SET NULL,
    role_name TEXT NOT NULL DEFAULT 'team_member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Table: team_workspaces
-- Maps teams to workspaces they can access
CREATE TABLE IF NOT EXISTS team_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    access_level TEXT DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, workspace_id)
);

-- =============================================================================
-- ORG-LEVEL PERMISSIONS
-- =============================================================================

-- Table: org_roles
-- Organization-level roles with inheritance
CREATE TABLE IF NOT EXISTS org_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    inherits_from UUID REFERENCES org_roles(id) ON DELETE SET NULL,
    priority INTEGER DEFAULT 0,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default org roles with inheritance hierarchy
INSERT INTO org_roles (name, description, permissions, priority, is_system_role) VALUES
('ORG_OWNER', 'Full organization control', '["*"]', 100, TRUE),
('ORG_ADMIN', 'Administrative access', '["manage_workspaces", "manage_teams", "manage_members", "view_analytics", "manage_billing"]', 80, TRUE),
('ORG_ANALYST', 'Analytics and reporting access', '["view_analytics", "export_data", "create_reports"]', 40, TRUE),
('ORG_MEMBER', 'Basic organization member', '["view_org", "join_teams"]', 20, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Update inheritance after insert
UPDATE org_roles SET inherits_from = (SELECT id FROM org_roles WHERE name = 'ORG_ADMIN') WHERE name = 'ORG_OWNER';
UPDATE org_roles SET inherits_from = (SELECT id FROM org_roles WHERE name = 'ORG_MEMBER') WHERE name = 'ORG_ANALYST';

-- Table: user_org_roles
-- Assigns org-level roles to users
CREATE TABLE IF NOT EXISTS user_org_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES org_roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, org_id, role_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_business_units_org ON business_units(org_id);
CREATE INDEX IF NOT EXISTS idx_business_units_parent ON business_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_bu_workspaces_bu ON bu_workspaces(bu_id);
CREATE INDEX IF NOT EXISTS idx_bu_workspaces_workspace ON bu_workspaces(workspace_id);

CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(org_id);
CREATE INDEX IF NOT EXISTS idx_teams_bu ON teams(bu_id);
CREATE INDEX IF NOT EXISTS idx_teams_lead ON teams(lead_user_id);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);

CREATE INDEX IF NOT EXISTS idx_team_workspaces_team ON team_workspaces(team_id);
CREATE INDEX IF NOT EXISTS idx_team_workspaces_workspace ON team_workspaces(workspace_id);

CREATE INDEX IF NOT EXISTS idx_user_org_roles_user ON user_org_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_org ON user_org_roles(org_id);

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

-- business_units policies
ALTER TABLE business_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's business units"
ON business_units FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage business units"
ON business_units FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- teams policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org's teams"
ON teams FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Team leads and admins can manage teams"
ON teams FOR ALL
USING (
    lead_user_id = auth.uid() OR
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- team_members policies
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members"
ON team_members FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM teams t
        JOIN user_organizations uo ON uo.org_id = t.org_id
        WHERE t.id = team_id
          AND uo.user_id = auth.uid()
    )
);

CREATE POLICY "Team leads can manage members"
ON team_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM teams t
        WHERE t.id = team_id
          AND t.lead_user_id = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM team_members tm2
        WHERE tm2.team_id = team_id
          AND tm2.user_id = auth.uid()
          AND tm2.role_name IN ('team_lead', 'team_admin')
    )
);

-- user_org_roles policies
ALTER TABLE user_org_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org roles"
ON user_org_roles FOR SELECT
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage org roles"
ON user_org_roles FOR ALL
USING (
    org_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function: Get user's teams
CREATE OR REPLACE FUNCTION get_user_teams(p_user_id UUID, p_org_id UUID DEFAULT NULL)
RETURNS TABLE (
    out_team_id UUID,
    out_team_name TEXT,
    out_org_id UUID,
    out_bu_id UUID,
    out_role_name TEXT,
    out_is_lead BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.name,
        t.org_id,
        t.bu_id,
        tm.role_name,
        t.lead_user_id = p_user_id
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.user_id = p_user_id
      AND tm.is_active = TRUE
      AND t.is_active = TRUE
      AND (p_org_id IS NULL OR t.org_id = p_org_id)
    ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get effective org permissions (with inheritance)
CREATE OR REPLACE FUNCTION get_effective_org_permissions(p_user_id UUID, p_org_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_permissions JSONB := '[]'::JSONB;
    v_role_id UUID;
    v_inherited_permissions JSONB;
BEGIN
    -- Get user's org roles
    FOR v_role_id IN
        SELECT uor.role_id FROM user_org_roles uor
        WHERE uor.user_id = p_user_id
          AND uor.org_id = p_org_id
          AND uor.is_active = TRUE
          AND (uor.expires_at IS NULL OR uor.expires_at > NOW())
    LOOP
        -- Get role permissions with inheritance
        WITH RECURSIVE role_chain AS (
            SELECT id, permissions, inherits_from
            FROM org_roles WHERE id = v_role_id
            UNION ALL
            SELECT r.id, r.permissions, r.inherits_from
            FROM org_roles r
            JOIN role_chain rc ON r.id = rc.inherits_from
        )
        SELECT jsonb_agg(DISTINCT elem)
        INTO v_inherited_permissions
        FROM role_chain, jsonb_array_elements(permissions) AS elem;

        -- Merge permissions
        v_permissions := v_permissions || COALESCE(v_inherited_permissions, '[]'::JSONB);
    END LOOP;

    -- Remove duplicates and return
    SELECT jsonb_agg(DISTINCT elem)
    INTO v_permissions
    FROM jsonb_array_elements(v_permissions) AS elem;

    RETURN COALESCE(v_permissions, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check team membership
CREATE OR REPLACE FUNCTION is_team_member(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = p_user_id
          AND tm.team_id = p_team_id
          AND tm.is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get BU hierarchy (recursive)
CREATE OR REPLACE FUNCTION get_bu_hierarchy(p_bu_id UUID)
RETURNS TABLE (
    out_bu_id UUID,
    out_bu_name TEXT,
    out_parent_id UUID,
    out_depth INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE bu_tree AS (
        SELECT id, name, parent_id, 0 AS tree_depth
        FROM business_units WHERE id = p_bu_id
        UNION ALL
        SELECT bu.id, bu.name, bu.parent_id, bt.tree_depth + 1
        FROM business_units bu
        JOIN bu_tree bt ON bu.parent_id = bt.id
    )
    SELECT bt.id, bt.name, bt.parent_id, bt.tree_depth FROM bu_tree bt ORDER BY bt.tree_depth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER update_business_units_updated_at
    BEFORE UPDATE ON business_units
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE business_units IS 'Top-level organizational divisions with hierarchical structure';
COMMENT ON TABLE teams IS 'Teams within organizations, optionally scoped to business units';
COMMENT ON TABLE team_roles IS 'Roles and permissions available within teams';
COMMENT ON TABLE team_members IS 'User membership in teams with role assignment';
COMMENT ON TABLE org_roles IS 'Organization-level roles with inheritance hierarchy';
COMMENT ON TABLE user_org_roles IS 'Assignment of org-level roles to users';

COMMENT ON FUNCTION get_user_teams IS 'Returns all teams a user belongs to';
COMMENT ON FUNCTION get_effective_org_permissions IS 'Returns merged permissions from all org roles with inheritance';
COMMENT ON FUNCTION get_bu_hierarchy IS 'Returns business unit hierarchy tree';
