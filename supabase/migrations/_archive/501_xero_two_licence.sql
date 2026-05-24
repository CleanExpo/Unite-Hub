-- Migration 501: Xero Two-Licence Architecture for Founder
-- CARSI holds the Xero developer app. Two licence groups with separate OAuth tokens.
--
-- NOTE: This is a SEPARATE system from the workspace-level xero_tokens table (migration 050).
-- The xero_tokens table serves workspace users. These tables serve the founder only.
-- Tables are service_role-only via RLS — no workspace_id required (founder-level system).

BEGIN;

-- CARSI's Xero developer app credentials (one row, shared by both licences)
-- client_secret is stored as-is; add pgp_sym_encrypt via service layer when vault key is configured
CREATE TABLE IF NOT EXISTS xero_oauth_app (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      text NOT NULL,
  client_secret  text NOT NULL,  -- plain text for now; pgp_sym_encrypt via service layer when Supabase vault key is configured
  redirect_uri   text NOT NULL DEFAULT 'https://unite-group.in/api/founder/xero/callback',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Two rows: one per licence group
-- carsi  → CARSI, RestoreAssist, Unite-Group, ATO, Synthex (5 tenants)
-- dr_nrpg → Disaster Recovery, NRPG (2 tenants)
CREATE TABLE IF NOT EXISTS xero_licence_tokens (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  licence_name   text NOT NULL UNIQUE CHECK (licence_name IN ('carsi', 'dr_nrpg')),
  access_token   text,   -- plain text; encrypt with pgp_sym_encrypt when vault key is configured
  refresh_token  text,   -- plain text; encrypt with pgp_sym_encrypt when vault key is configured
  token_set_json jsonb,  -- full token set from xero-node for easy restoration
  expires_at     timestamptz,
  connected_at   timestamptz,
  status         text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'expired', 'error', 'disconnected')),
  error_message  text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- Insert default rows for both licences so they always exist
INSERT INTO xero_licence_tokens (licence_name) VALUES ('carsi'), ('dr_nrpg')
ON CONFLICT (licence_name) DO NOTHING;

-- Maps business key → specific Xero tenant within its licence group
-- CRITICAL: sync must NOT be enabled until the user confirms this mapping via the setup UI
CREATE TABLE IF NOT EXISTS xero_business_tenants (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_key    text NOT NULL UNIQUE,  -- 'unite-group', 'restore-assist', 'disaster-recovery', 'nrpg', 'carsi', 'ato', 'synthex'
  licence_id      uuid REFERENCES xero_licence_tokens(id) ON DELETE CASCADE,
  xero_tenant_id  text NOT NULL,
  xero_org_name   text,
  sync_enabled    boolean NOT NULL DEFAULT false,  -- must be explicitly enabled AFTER user confirms mapping
  last_synced_at  timestamptz,
  mapped_at       timestamptz DEFAULT now(),
  confirmed_at    timestamptz  -- set when user clicks confirm in setup UI
);

-- Sync log — one row per sync run per business
CREATE TABLE IF NOT EXISTS xero_sync_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_key    text NOT NULL,
  sync_type       text NOT NULL DEFAULT 'invoices',
  records_synced  int DEFAULT 0,
  errors          jsonb DEFAULT '[]'::jsonb,
  started_at      timestamptz DEFAULT now(),
  completed_at    timestamptz
);

-- RLS: service role only (no user-level access — founder system, bypasses workspace isolation)
ALTER TABLE xero_oauth_app ENABLE ROW LEVEL SECURITY;
ALTER TABLE xero_licence_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE xero_business_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE xero_sync_log ENABLE ROW LEVEL SECURITY;

-- Only service_role can access these tables
CREATE POLICY xero_app_service_only ON xero_oauth_app
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY xero_licence_service_only ON xero_licence_tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY xero_tenants_service_only ON xero_business_tenants
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY xero_log_service_only ON xero_sync_log
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_xero_business_tenants_key     ON xero_business_tenants(business_key);
CREATE INDEX IF NOT EXISTS idx_xero_business_tenants_licence ON xero_business_tenants(licence_id);
CREATE INDEX IF NOT EXISTS idx_xero_sync_log_business        ON xero_sync_log(business_key);
CREATE INDEX IF NOT EXISTS idx_xero_sync_log_started         ON xero_sync_log(started_at DESC);

COMMIT;
