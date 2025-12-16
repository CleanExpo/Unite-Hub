-- =====================================================
-- Migration 446: Synthex Governance & Audit Logging
-- Phase B43: Governance, Audit Logging & Export
-- =====================================================
-- Comprehensive audit logging for compliance,
-- activity tracking, and data export capabilities
-- =====================================================

-- =====================================================
-- Table: synthex_audit_logs
-- Main audit log table
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Actor
    user_id UUID,
    user_email TEXT,
    actor_type TEXT NOT NULL DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'api', 'automation', 'webhook')),
    -- Action
    action TEXT NOT NULL,
    action_category TEXT NOT NULL CHECK (action_category IN (
        'auth', 'contact', 'campaign', 'content', 'template',
        'automation', 'integration', 'settings', 'billing',
        'experiment', 'export', 'import', 'admin', 'api'
    )),
    -- Resource
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    resource_name TEXT,
    -- Details
    old_value JSONB,
    new_value JSONB,
    metadata JSONB DEFAULT '{}',
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_id TEXT,
    -- Status
    status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'pending')),
    error_message TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_audit_logs IS 'Comprehensive audit trail for all actions';
COMMENT ON COLUMN synthex_audit_logs.action IS 'Specific action performed (e.g., create, update, delete, send, export)';
COMMENT ON COLUMN synthex_audit_logs.action_category IS 'Category of action for filtering';
COMMENT ON COLUMN synthex_audit_logs.resource_type IS 'Type of resource affected (e.g., contact, campaign, template)';

-- =====================================================
-- Table: synthex_data_exports
-- Track data export requests
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_data_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    requested_by UUID NOT NULL,
    -- Export details
    export_type TEXT NOT NULL CHECK (export_type IN (
        'contacts', 'campaigns', 'analytics', 'audit_logs',
        'templates', 'automations', 'all_data', 'gdpr'
    )),
    format TEXT NOT NULL DEFAULT 'csv' CHECK (format IN ('csv', 'json', 'xlsx')),
    -- Filters
    filters JSONB DEFAULT '{}',
    date_range_start TIMESTAMPTZ,
    date_range_end TIMESTAMPTZ,
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
    -- File info
    file_path TEXT,
    file_size_bytes BIGINT,
    file_url TEXT,
    expires_at TIMESTAMPTZ,
    -- Progress
    total_records INT,
    processed_records INT DEFAULT 0,
    error_message TEXT,
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_data_exports IS 'Track data export requests and their status';
COMMENT ON COLUMN synthex_data_exports.export_type IS 'Type of data being exported';
COMMENT ON COLUMN synthex_data_exports.format IS 'Output format';

-- =====================================================
-- Table: synthex_retention_policies
-- Data retention configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Policy details
    name TEXT NOT NULL,
    description TEXT,
    resource_type TEXT NOT NULL,
    retention_days INT NOT NULL DEFAULT 365,
    -- Deletion behavior
    delete_action TEXT NOT NULL DEFAULT 'soft_delete' CHECK (delete_action IN ('soft_delete', 'hard_delete', 'archive', 'anonymize')),
    archive_destination TEXT,
    -- Schedule
    is_active BOOLEAN DEFAULT true,
    run_schedule TEXT DEFAULT '0 2 * * 0', -- Weekly at 2 AM Sunday
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    -- Stats
    last_run_deleted INT DEFAULT 0,
    total_deleted INT DEFAULT 0,
    -- Metadata
    created_by UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (tenant_id, resource_type)
);

COMMENT ON TABLE synthex_retention_policies IS 'Data retention and cleanup policies';

-- =====================================================
-- Table: synthex_compliance_records
-- GDPR/Privacy compliance tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Request details
    request_type TEXT NOT NULL CHECK (request_type IN (
        'access_request', 'deletion_request', 'portability_request',
        'consent_update', 'opt_out', 'rectification'
    )),
    requester_email TEXT NOT NULL,
    requester_contact_id UUID,
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'rejected', 'expired'
    )),
    -- Processing
    processed_by UUID,
    processed_at TIMESTAMPTZ,
    completion_notes TEXT,
    -- Data
    request_data JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    -- Deadlines
    deadline_at TIMESTAMPTZ,
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE synthex_compliance_records IS 'Track privacy and compliance requests';

-- =====================================================
-- Table: synthex_api_keys
-- API key management for programmatic access
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    -- Key details
    name TEXT NOT NULL,
    description TEXT,
    key_prefix TEXT NOT NULL, -- First 8 chars for identification
    key_hash TEXT NOT NULL, -- Full key hash
    -- Permissions
    permissions TEXT[] DEFAULT ARRAY['read'],
    allowed_origins TEXT[],
    rate_limit_per_minute INT DEFAULT 60,
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    usage_count BIGINT DEFAULT 0,
    -- Expiry
    expires_at TIMESTAMPTZ,
    -- Metadata
    created_by UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID
);

COMMENT ON TABLE synthex_api_keys IS 'API keys for programmatic access';
COMMENT ON COLUMN synthex_api_keys.key_prefix IS 'First 8 characters for display';
COMMENT ON COLUMN synthex_api_keys.key_hash IS 'SHA-256 hash of the full key';

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_synthex_audit_logs_tenant ON synthex_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_audit_logs_user ON synthex_audit_logs(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_synthex_audit_logs_action ON synthex_audit_logs(tenant_id, action_category);
CREATE INDEX IF NOT EXISTS idx_synthex_audit_logs_resource ON synthex_audit_logs(tenant_id, resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_synthex_audit_logs_created ON synthex_audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_audit_logs_status ON synthex_audit_logs(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_synthex_data_exports_tenant ON synthex_data_exports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_data_exports_status ON synthex_data_exports(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_synthex_data_exports_user ON synthex_data_exports(tenant_id, requested_by);

CREATE INDEX IF NOT EXISTS idx_synthex_retention_policies_tenant ON synthex_retention_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_retention_policies_active ON synthex_retention_policies(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_synthex_compliance_records_tenant ON synthex_compliance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_compliance_records_status ON synthex_compliance_records(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_synthex_compliance_records_email ON synthex_compliance_records(requester_email);

CREATE INDEX IF NOT EXISTS idx_synthex_api_keys_tenant ON synthex_api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_api_keys_prefix ON synthex_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_synthex_api_keys_active ON synthex_api_keys(tenant_id, is_active) WHERE is_active = true;

-- =====================================================
-- Row Level Security
-- =====================================================
ALTER TABLE synthex_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_api_keys ENABLE ROW LEVEL SECURITY;

-- Audit logs scoped to tenant
CREATE POLICY "Audit logs scoped to tenant"
    ON synthex_audit_logs FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Data exports scoped to tenant
CREATE POLICY "Data exports scoped to tenant"
    ON synthex_data_exports FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Retention policies scoped to tenant
CREATE POLICY "Retention policies scoped to tenant"
    ON synthex_retention_policies FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Compliance records scoped to tenant
CREATE POLICY "Compliance records scoped to tenant"
    ON synthex_compliance_records FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- API keys scoped to tenant
CREATE POLICY "API keys scoped to tenant"
    ON synthex_api_keys FOR ALL
    USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================
-- Function: Log audit event
-- =====================================================
CREATE OR REPLACE FUNCTION log_audit_event(
    p_tenant_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_action_category TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT DEFAULT NULL,
    p_resource_name TEXT DEFAULT NULL,
    p_old_value JSONB DEFAULT NULL,
    p_new_value JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_status TEXT DEFAULT 'success'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO synthex_audit_logs (
        tenant_id, user_id, action, action_category,
        resource_type, resource_id, resource_name,
        old_value, new_value, metadata, status
    )
    VALUES (
        p_tenant_id, p_user_id, p_action, p_action_category,
        p_resource_type, p_resource_id, p_resource_name,
        p_old_value, p_new_value, p_metadata, p_status
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Get audit summary
-- =====================================================
CREATE OR REPLACE FUNCTION get_audit_summary(
    p_tenant_id UUID,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    total_events BIGINT,
    events_by_category JSONB,
    events_by_status JSONB,
    top_users JSONB,
    events_by_day JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH date_range AS (
        SELECT now() - (p_days || ' days')::interval AS start_date
    ),
    events AS (
        SELECT *
        FROM synthex_audit_logs al, date_range dr
        WHERE al.tenant_id = p_tenant_id
          AND al.created_at >= dr.start_date
    ),
    by_category AS (
        SELECT jsonb_object_agg(action_category, cnt) AS data
        FROM (
            SELECT action_category, COUNT(*) as cnt
            FROM events
            GROUP BY action_category
        ) sub
    ),
    by_status AS (
        SELECT jsonb_object_agg(status, cnt) AS data
        FROM (
            SELECT status, COUNT(*) as cnt
            FROM events
            GROUP BY status
        ) sub
    ),
    by_user AS (
        SELECT jsonb_agg(jsonb_build_object('user_id', user_id, 'count', cnt)) AS data
        FROM (
            SELECT user_id, COUNT(*) as cnt
            FROM events
            WHERE user_id IS NOT NULL
            GROUP BY user_id
            ORDER BY cnt DESC
            LIMIT 10
        ) sub
    ),
    by_day AS (
        SELECT jsonb_agg(jsonb_build_object('date', day, 'count', cnt)) AS data
        FROM (
            SELECT DATE(created_at) as day, COUNT(*) as cnt
            FROM events
            GROUP BY DATE(created_at)
            ORDER BY day DESC
        ) sub
    )
    SELECT
        (SELECT COUNT(*) FROM events) AS total_events,
        COALESCE((SELECT data FROM by_category), '{}'::jsonb) AS events_by_category,
        COALESCE((SELECT data FROM by_status), '{}'::jsonb) AS events_by_status,
        COALESCE((SELECT data FROM by_user), '[]'::jsonb) AS top_users,
        COALESCE((SELECT data FROM by_day), '[]'::jsonb) AS events_by_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Triggers for automatic audit logging
-- =====================================================

-- Audit trigger for campaigns
CREATE OR REPLACE FUNCTION audit_campaign_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event(
            NEW.tenant_id,
            NEW.created_by,
            'create',
            'campaign',
            'campaign',
            NEW.id::TEXT,
            NEW.name,
            NULL,
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            NEW.tenant_id,
            NULL,
            'update',
            'campaign',
            'campaign',
            NEW.id::TEXT,
            NEW.name,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event(
            OLD.tenant_id,
            NULL,
            'delete',
            'campaign',
            'campaign',
            OLD.id::TEXT,
            OLD.name,
            to_jsonb(OLD),
            NULL
        );
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to synthex_campaigns if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'synthex_campaigns') THEN
        DROP TRIGGER IF EXISTS trg_audit_campaigns ON synthex_campaigns;
        CREATE TRIGGER trg_audit_campaigns
            AFTER INSERT OR UPDATE OR DELETE ON synthex_campaigns
            FOR EACH ROW EXECUTE FUNCTION audit_campaign_changes();
    END IF;
END $$;

-- =====================================================
-- Triggers
-- =====================================================
CREATE OR REPLACE FUNCTION update_audit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_synthex_retention_policies_updated ON synthex_retention_policies;
CREATE TRIGGER trg_synthex_retention_policies_updated
    BEFORE UPDATE ON synthex_retention_policies
    FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();

DROP TRIGGER IF EXISTS trg_synthex_compliance_records_updated ON synthex_compliance_records;
CREATE TRIGGER trg_synthex_compliance_records_updated
    BEFORE UPDATE ON synthex_compliance_records
    FOR EACH ROW EXECUTE FUNCTION update_audit_timestamp();

-- =====================================================
-- Grants
-- =====================================================
GRANT ALL ON synthex_audit_logs TO authenticated;
GRANT ALL ON synthex_data_exports TO authenticated;
GRANT ALL ON synthex_retention_policies TO authenticated;
GRANT ALL ON synthex_compliance_records TO authenticated;
GRANT ALL ON synthex_api_keys TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event(UUID, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_summary(UUID, INT) TO authenticated;
