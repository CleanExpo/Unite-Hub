-- =====================================================
-- Migration 438: Synthex Agency Workspaces
-- Phase B32: Agency Multi-Workspace + Brand Switcher
-- =====================================================
-- Allows agencies to manage multiple client workspaces (tenants)
-- from a single Synthex account with portfolio overview
-- =====================================================

-- Drop tables first (CASCADE handles policies and indexes)
DROP TABLE IF EXISTS synthex_agency_active_tenant CASCADE;
DROP TABLE IF EXISTS synthex_agency_memberships CASCADE;
DROP TABLE IF EXISTS synthex_agency_clients CASCADE;
DROP TABLE IF EXISTS synthex_agency_accounts CASCADE;

-- =====================================================
-- Table: synthex_agency_accounts
-- Top-level agency entities that can manage multiple tenants
-- =====================================================
CREATE TABLE synthex_agency_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_agency_accounts IS 'Agency accounts that can manage multiple client tenants';
COMMENT ON COLUMN synthex_agency_accounts.owner_user_id IS 'Primary owner of the agency';
COMMENT ON COLUMN synthex_agency_accounts.settings IS 'Agency-level settings (branding, defaults, etc.)';

-- =====================================================
-- Table: synthex_agency_clients
-- Links tenants to agencies as managed clients
-- =====================================================
CREATE TABLE synthex_agency_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES synthex_agency_accounts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    label TEXT NOT NULL,
    primary_domain TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(agency_id, tenant_id)
);

COMMENT ON TABLE synthex_agency_clients IS 'Client tenants managed by an agency';
COMMENT ON COLUMN synthex_agency_clients.label IS 'Display name for the client within the agency';
COMMENT ON COLUMN synthex_agency_clients.primary_domain IS 'Main domain associated with this client';
COMMENT ON COLUMN synthex_agency_clients.status IS 'Client status: active, paused, or archived';

-- =====================================================
-- Table: synthex_agency_memberships
-- Maps users to agencies with roles
-- =====================================================
CREATE TABLE synthex_agency_memberships (
    user_id UUID NOT NULL,
    agency_id UUID NOT NULL REFERENCES synthex_agency_accounts(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, agency_id)
);

COMMENT ON TABLE synthex_agency_memberships IS 'User memberships in agencies with role-based access';
COMMENT ON COLUMN synthex_agency_memberships.role IS 'User role: owner, admin, member, or viewer';
COMMENT ON COLUMN synthex_agency_memberships.permissions IS 'Additional granular permissions';

-- =====================================================
-- Table: synthex_agency_active_tenant
-- Tracks the currently active tenant for each user
-- =====================================================
CREATE TABLE synthex_agency_active_tenant (
    user_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    agency_id UUID REFERENCES synthex_agency_accounts(id) ON DELETE SET NULL,
    switched_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_agency_active_tenant IS 'Current active tenant context for each user';
COMMENT ON COLUMN synthex_agency_active_tenant.tenant_id IS 'Currently selected tenant for the user session';

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX idx_synthex_agency_clients_agency ON synthex_agency_clients(agency_id);
CREATE INDEX idx_synthex_agency_clients_tenant ON synthex_agency_clients(tenant_id);
CREATE INDEX idx_synthex_agency_clients_status ON synthex_agency_clients(status);
CREATE INDEX idx_synthex_agency_memberships_agency ON synthex_agency_memberships(agency_id);
CREATE INDEX idx_synthex_agency_active_tenant_user ON synthex_agency_active_tenant(user_id);

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_agency_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_agency_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_agency_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_agency_active_tenant ENABLE ROW LEVEL SECURITY;

-- Agency accounts: visible to members only
CREATE POLICY "Agency accounts visible to members"
    ON synthex_agency_accounts FOR ALL
    USING (
        id IN (
            SELECT agency_id FROM synthex_agency_memberships
            WHERE user_id = auth.uid()
        )
        OR owner_user_id = auth.uid()
    );

-- Agency clients: visible to agency members
CREATE POLICY "Agency clients visible to agency members"
    ON synthex_agency_clients FOR ALL
    USING (
        agency_id IN (
            SELECT agency_id FROM synthex_agency_memberships
            WHERE user_id = auth.uid()
        )
    );

-- Agency memberships: users can see their own memberships
CREATE POLICY "Agency memberships visible to user"
    ON synthex_agency_memberships FOR ALL
    USING (user_id = auth.uid());

-- Active tenant: users can manage their own active tenant
CREATE POLICY "Users can update their active tenant"
    ON synthex_agency_active_tenant FOR ALL
    USING (user_id = auth.uid());

-- =====================================================
-- Helper function: Get user's agencies with client counts
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_agencies_with_stats(p_user_id UUID)
RETURNS TABLE (
    agency_id UUID,
    agency_name TEXT,
    role TEXT,
    client_count BIGINT,
    active_client_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id AS agency_id,
        a.name AS agency_name,
        m.role,
        COUNT(c.id) AS client_count,
        COUNT(c.id) FILTER (WHERE c.status = 'active') AS active_client_count
    FROM synthex_agency_accounts a
    JOIN synthex_agency_memberships m ON m.agency_id = a.id
    LEFT JOIN synthex_agency_clients c ON c.agency_id = a.id
    WHERE m.user_id = p_user_id
    GROUP BY a.id, a.name, m.role
    ORDER BY a.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_synthex_agency_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_agency_accounts_updated ON synthex_agency_accounts;
CREATE TRIGGER trg_synthex_agency_accounts_updated
    BEFORE UPDATE ON synthex_agency_accounts
    FOR EACH ROW EXECUTE FUNCTION update_synthex_agency_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_agency_clients_updated ON synthex_agency_clients;
CREATE TRIGGER trg_synthex_agency_clients_updated
    BEFORE UPDATE ON synthex_agency_clients
    FOR EACH ROW EXECUTE FUNCTION update_synthex_agency_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_agency_memberships_updated ON synthex_agency_memberships;
CREATE TRIGGER trg_synthex_agency_memberships_updated
    BEFORE UPDATE ON synthex_agency_memberships
    FOR EACH ROW EXECUTE FUNCTION update_synthex_agency_timestamp();

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT ALL ON synthex_agency_accounts TO authenticated;
GRANT ALL ON synthex_agency_clients TO authenticated;
GRANT ALL ON synthex_agency_memberships TO authenticated;
GRANT ALL ON synthex_agency_active_tenant TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_agencies_with_stats(UUID) TO authenticated;
