-- Guardian Z07: Meta Integration & Success Toolkit
-- ===================================================
-- Adds tenant-scoped integration configs and meta-only webhooks for Z-series artefacts
-- (readiness, uplift, editions, reports, adoption, lifecycle)
--
-- CRITICAL DESIGN CONSTRAINTS:
-- 1. All payloads MUST be meta-only and PII-free (scores, counts, IDs, labels only)
-- 2. No core logs, raw payloads, or Guardian auth/rule data may be embedded
-- 3. Integration scopes limited to Z-series domains: readiness, uplift, editions, executive_reports, adoption, lifecycle
-- 4. RLS enforces strict tenant isolation; no cross-tenant data leakage possible
-- 5. Webhooks are asynchronous, meta-only events for CS/BI consumption
-- 6. No modifications to core G/H/I/X tables or Guardian runtime behaviour

CREATE TABLE IF NOT EXISTS guardian_meta_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  integration_key TEXT NOT NULL,
  -- e.g. 'cs_tool', 'bi_dashboard', 'slack_success', 'internal_data_warehouse'
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL,
  -- e.g. { webhook_url: 'https://...', headers: { 'Authorization': '...' }, field_mappings: {...} }
  scopes TEXT[] NOT NULL,
  -- allowed values: 'readiness', 'uplift', 'editions', 'executive_reports', 'adoption', 'lifecycle'
  last_synced_at TIMESTAMPTZ NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT integration_key_unique UNIQUE (tenant_id, integration_key),
  CONSTRAINT valid_scopes CHECK (
    scopes <@ ARRAY['readiness', 'uplift', 'editions', 'executive_reports', 'adoption', 'lifecycle']::TEXT[]
  ),
  CONSTRAINT config_not_empty CHECK (config IS NOT NULL AND config <> '{}'::jsonb)
);

-- Index for efficient tenant + integration lookup
CREATE INDEX idx_guardian_meta_integrations_tenant_key
ON guardian_meta_integrations(tenant_id, integration_key);

CREATE INDEX idx_guardian_meta_integrations_tenant_enabled
ON guardian_meta_integrations(tenant_id, is_enabled);

-- RLS Policies for guardian_meta_integrations
ALTER TABLE guardian_meta_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_read_integrations" ON guardian_meta_integrations;
CREATE POLICY "tenant_read_integrations" ON guardian_meta_integrations
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_insert_integrations" ON guardian_meta_integrations;
CREATE POLICY "tenant_insert_integrations" ON guardian_meta_integrations
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_update_integrations" ON guardian_meta_integrations;
CREATE POLICY "tenant_update_integrations" ON guardian_meta_integrations
FOR UPDATE USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_delete_integrations" ON guardian_meta_integrations;
CREATE POLICY "tenant_delete_integrations" ON guardian_meta_integrations
FOR DELETE USING (tenant_id = get_current_workspace_id());

-- ===================================================
-- Webhook Events Table
-- ===================================================

CREATE TABLE IF NOT EXISTS guardian_meta_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  integration_id UUID NOT NULL REFERENCES guardian_meta_integrations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  -- allowed: 'readiness_updated', 'uplift_plan_created', 'uplift_plan_updated',
  --          'edition_fit_computed', 'executive_report_created', 'adoption_scores_computed',
  --          'meta_lifecycle_run_completed', 'test'
  payload JSONB NOT NULL,
  -- strictly meta-only: { event_type: string, scope: string, timestamp: ISO8601, scores: {...}, counts: {...}, ids: [...] }
  -- NO raw logs, raw event data, or PII
  status TEXT NOT NULL DEFAULT 'pending',
  -- status: 'pending', 'delivered', 'failed', 'discarded'
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMPTZ NULL,
  last_error TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('pending', 'delivered', 'failed', 'discarded')),
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'readiness_updated', 'uplift_plan_created', 'uplift_plan_updated',
    'edition_fit_computed', 'executive_report_created', 'adoption_scores_computed',
    'meta_lifecycle_run_completed', 'test'
  ))
);

-- Indexes for efficient webhook processing
CREATE INDEX idx_guardian_meta_webhook_events_tenant_status
ON guardian_meta_webhook_events(tenant_id, status, created_at DESC);

CREATE INDEX idx_guardian_meta_webhook_events_integration
ON guardian_meta_webhook_events(integration_id);

CREATE INDEX idx_guardian_meta_webhook_events_pending
ON guardian_meta_webhook_events(created_at) WHERE status IN ('pending', 'failed');

-- RLS Policies for guardian_meta_webhook_events
ALTER TABLE guardian_meta_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_read_webhook_events" ON guardian_meta_webhook_events;
CREATE POLICY "tenant_read_webhook_events" ON guardian_meta_webhook_events
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_insert_webhook_events" ON guardian_meta_webhook_events;
CREATE POLICY "tenant_insert_webhook_events" ON guardian_meta_webhook_events
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_update_webhook_events" ON guardian_meta_webhook_events;
CREATE POLICY "tenant_update_webhook_events" ON guardian_meta_webhook_events
FOR UPDATE USING (tenant_id = get_current_workspace_id());

-- ===================================================
-- Migration Summary
-- ===================================================
-- Tables: 2 (guardian_meta_integrations, guardian_meta_webhook_events)
-- Indexes: 5 (optimized for tenant, integration lookup, and webhook delivery)
-- RLS Policies: 7 (full tenant isolation)
--
-- Design Notes:
-- 1. guardian_meta_integrations: Tenant-scoped config for external integrations
--    - integration_key: unique identifier (e.g., 'cs_tool_salesforce', 'bi_dashboard_tableau')
--    - config JSONB: flexible storage for webhook URL, auth headers, field mappings
--    - scopes TEXT[]: array of allowed meta domains this integration can access
--    - is_enabled: boolean to toggle without deleting config
--
-- 2. guardian_meta_webhook_events: Append-only log of Z-series meta events queued for delivery
--    - payload: strictly meta-only (no raw logs, no PII, no core Guardian data)
--    - status: tracks delivery lifecycle (pending → delivered/failed/discarded)
--    - attempt_count: retry limit to prevent infinite loops
--    - last_error: diagnostic info for ops/debugging (no PII)
--
-- 3. RLS on both tables ensures tenant_id = get_current_workspace_id()
--    - Cross-tenant webhook delivery impossible
--    - Integrations only visible to their own tenant
--
-- 4. No modifications to G/H/I/X core tables (alerts, incidents, rules, network data, etc.)
--    - Z07 is meta-only; reads from Z01–Z06 and exposes via safe integrations
