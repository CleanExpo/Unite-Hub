-- Migration 431: Synthex Admin Views - Global Admin & Cross-Tenant Reporting
-- Phase B25: Global Admin & Cross-Tenant Reporting
-- Created: 2025-12-06

-- =====================================================
-- SYNTHEX ADMINS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scope text NOT NULL CHECK (scope IN ('global', 'group', 'tenant')),
    tenant_ids uuid[] DEFAULT NULL, -- NULL for global, specific tenant IDs for group/tenant scope
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id) -- One admin record per user
);

-- Add indexes
DROP INDEX IF EXISTS idx_synthex_admins_user_id;
CREATE INDEX idx_synthex_admins_user_id ON synthex_admins(user_id);
DROP INDEX IF EXISTS idx_synthex_admins_scope;
CREATE INDEX idx_synthex_admins_scope ON synthex_admins(scope);
DROP INDEX IF EXISTS idx_synthex_admins_tenant_ids;
CREATE INDEX idx_synthex_admins_tenant_ids ON synthex_admins USING GIN(tenant_ids) WHERE tenant_ids IS NOT NULL;

-- Add update trigger
DROP TRIGGER IF EXISTS set_synthex_admins_updated_at ON synthex_admins;
CREATE TRIGGER set_synthex_admins_updated_at
    BEFORE UPDATE ON synthex_admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEW: Tenant Summary for Admin Console
-- =====================================================
CREATE OR REPLACE VIEW view_synthex_tenant_summary AS
SELECT
    t.id AS tenant_id,
    t.business_name,
    t.industry,
    t.region,
    t.status AS tenant_status,
    t.created_at AS tenant_created_at,

    -- Subscription info
    s.id AS subscription_id,
    s.status AS subscription_status,
    s.billing_period,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at,

    -- Plan info
    p.code AS plan_code,
    p.name AS plan_name,
    p.monthly_price_cents,
    p.yearly_price_cents,

    -- Team size
    (SELECT COUNT(*) FROM synthex_tenant_members WHERE tenant_id = t.id) AS team_member_count,

    -- Usage metrics (current month)
    COALESCE(
        (SELECT quantity FROM synthex_usage_records
         WHERE tenant_id = t.id
         AND metric = 'contacts'
         AND period_start >= date_trunc('month', now())
         ORDER BY period_start DESC LIMIT 1),
        0
    ) AS current_contacts,

    COALESCE(
        (SELECT quantity FROM synthex_usage_records
         WHERE tenant_id = t.id
         AND metric = 'emails_sent'
         AND period_start >= date_trunc('month', now())
         ORDER BY period_start DESC LIMIT 1),
        0
    ) AS current_emails_sent,

    COALESCE(
        (SELECT quantity FROM synthex_usage_records
         WHERE tenant_id = t.id
         AND metric = 'ai_calls'
         AND period_start >= date_trunc('month', now())
         ORDER BY period_start DESC LIMIT 1),
        0
    ) AS current_ai_calls,

    -- Activity indicators (last 30 days)
    -- Note: synthex_contacts table not yet created, using 0 as placeholder
    0 AS contacts_added_30d,

    COALESCE(
        (SELECT COUNT(*) FROM synthex_campaigns
         WHERE tenant_id = t.id
         AND created_at >= now() - interval '30 days'),
        0
    ) AS campaigns_created_30d

FROM synthex_tenants t
LEFT JOIN synthex_subscriptions s ON s.tenant_id = t.id
LEFT JOIN synthex_plans p ON p.id = s.plan_id;

COMMENT ON VIEW view_synthex_tenant_summary IS 'Admin view: comprehensive tenant overview with subscription, plan, and usage metrics';

-- =====================================================
-- VIEW: Health Summary for Admin Console
-- =====================================================
CREATE OR REPLACE VIEW view_synthex_health_summary AS
SELECT
    t.id AS tenant_id,
    t.business_name,
    t.status AS tenant_status,

    -- Subscription health
    s.status AS subscription_status,
    s.current_period_end,
    CASE
        WHEN s.current_period_end < now() THEN true
        ELSE false
    END AS subscription_expired,

    -- Activity health (last 7 days)
    -- Note: synthex_contacts table not yet created, using 0 as placeholder
    0 AS recent_contacts,

    COALESCE(
        (SELECT COUNT(*) FROM synthex_campaigns
         WHERE tenant_id = t.id
         AND created_at >= now() - interval '7 days'),
        0
    ) AS recent_campaigns,

    -- Last activity timestamp
    GREATEST(
        t.created_at,
        COALESCE((SELECT MAX(created_at) FROM synthex_campaigns WHERE tenant_id = t.id), t.created_at),
        COALESCE((SELECT MAX(last_updated_at) FROM synthex_usage_records WHERE tenant_id = t.id), t.created_at)
    ) AS last_activity_at,

    -- Health score (0-100)
    CASE
        -- Suspended or churned = 0
        WHEN t.status IN ('suspended', 'churned') THEN 0

        -- No recent activity (30+ days) = 20
        WHEN COALESCE((SELECT MAX(created_at) FROM synthex_campaigns WHERE tenant_id = t.id), t.created_at)
            < now() - interval '30 days' THEN 20

        -- Active subscription + recent activity = 100
        WHEN s.status = 'active'
        AND COALESCE((SELECT MAX(created_at) FROM synthex_campaigns WHERE tenant_id = t.id), t.created_at)
            >= now() - interval '7 days' THEN 100

        -- Trial with activity = 80
        WHEN s.status = 'trial'
        AND COALESCE((SELECT MAX(created_at) FROM synthex_campaigns WHERE tenant_id = t.id), t.created_at)
            >= now() - interval '7 days' THEN 80

        -- Past due = 40
        WHEN s.status = 'past_due' THEN 40

        -- Default = 60
        ELSE 60
    END AS health_score

FROM synthex_tenants t
LEFT JOIN synthex_subscriptions s ON s.tenant_id = t.id;

COMMENT ON VIEW view_synthex_health_summary IS 'Admin view: tenant health scoring based on activity, subscription status, and engagement';

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Synthex Admins: Only admins can view admin records
ALTER TABLE synthex_admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only global admins can view all admin records" ON synthex_admins;
CREATE POLICY "Only global admins can view all admin records"
    ON synthex_admins FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM synthex_admins
            WHERE user_id = auth.uid() AND scope = 'global'
        )
    );

DROP POLICY IF EXISTS "Service role can manage admin records" ON synthex_admins;
CREATE POLICY "Service role can manage admin records"
    ON synthex_admins FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Views: No direct RLS (will be accessed via service role in API)
-- Access control enforced in adminService.ts based on synthex_admins table

-- =====================================================
-- HELPER FUNCTION: Check Admin Authorization
-- =====================================================
CREATE OR REPLACE FUNCTION check_admin_authorization(
    p_user_id uuid,
    p_tenant_id uuid DEFAULT NULL
)
RETURNS TABLE(
    is_authorized boolean,
    scope text,
    tenant_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_scope text;
    v_admin_tenant_ids uuid[];
BEGIN
    -- Get admin record
    SELECT a.scope, a.tenant_ids
    INTO v_admin_scope, v_admin_tenant_ids
    FROM synthex_admins a
    WHERE a.user_id = p_user_id;

    -- If no admin record, not authorized
    IF v_admin_scope IS NULL THEN
        RETURN QUERY SELECT false, NULL::text, NULL::uuid[];
        RETURN;
    END IF;

    -- Global admins can access everything
    IF v_admin_scope = 'global' THEN
        RETURN QUERY SELECT true, v_admin_scope, v_admin_tenant_ids;
        RETURN;
    END IF;

    -- Group/tenant admins need specific tenant check
    IF p_tenant_id IS NOT NULL THEN
        IF p_tenant_id = ANY(v_admin_tenant_ids) THEN
            RETURN QUERY SELECT true, v_admin_scope, v_admin_tenant_ids;
            RETURN;
        ELSE
            RETURN QUERY SELECT false, v_admin_scope, v_admin_tenant_ids;
            RETURN;
        END IF;
    END IF;

    -- Default: authorized but no specific tenant
    RETURN QUERY SELECT true, v_admin_scope, v_admin_tenant_ids;
END;
$$;

COMMENT ON FUNCTION check_admin_authorization IS 'Check if user is authorized as admin and get their scope/tenant access';

-- =====================================================
-- HELPER FUNCTION: Get Tenant IDs for Admin
-- =====================================================
CREATE OR REPLACE FUNCTION get_admin_tenant_ids(p_user_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_scope text;
    v_tenant_ids uuid[];
BEGIN
    -- Get admin scope and tenant IDs
    SELECT scope, tenant_ids
    INTO v_scope, v_tenant_ids
    FROM synthex_admins
    WHERE user_id = p_user_id;

    -- If global admin, return all tenant IDs
    IF v_scope = 'global' THEN
        RETURN ARRAY(SELECT id FROM synthex_tenants);
    END IF;

    -- Otherwise return restricted tenant IDs
    RETURN v_tenant_ids;
END;
$$;

COMMENT ON FUNCTION get_admin_tenant_ids IS 'Get list of tenant IDs accessible to admin user';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE synthex_admins IS 'Synthex admin users with global, group, or tenant-level access';
