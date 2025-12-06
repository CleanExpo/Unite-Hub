-- Phase B20: Synthex Integration Hub & Channel Connectors
-- Migration: 426_synthex_integrations_core.sql
-- Creates tables for external integrations, auth secrets, and events

-- ============================================
-- Synthex Integrations Table
-- Core integration connection records
-- ============================================
create table if not exists synthex_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  -- Integration metadata
  provider text not null, -- resend, gmail, sendgrid, facebook, linkedin, x, twilio
  channel text not null, -- email, social, sms, etc.
  display_name text,
  -- Connection status
  status text default 'disconnected', -- disconnected, connected, error
  last_connected_at timestamptz,
  last_error text,
  error_count int default 0,
  -- Configuration (non-sensitive)
  config jsonb default '{}',
  -- Metadata
  metadata jsonb default '{}',
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique constraint: one integration per provider per tenant
create unique index if not exists idx_synthex_integrations_unique
  on synthex_integrations(tenant_id, provider);

-- Index for querying by status and channel
drop index if exists idx_synthex_integrations_status;
create index if not exists idx_synthex_integrations_status
  on synthex_integrations(tenant_id, status);

drop index if exists idx_synthex_integrations_channel;
create index if not exists idx_synthex_integrations_channel
  on synthex_integrations(tenant_id, channel);

-- ============================================
-- Synthex Integration Secrets Table
-- OAuth tokens and credentials (encrypted)
-- ============================================
create table if not exists synthex_integration_secrets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  integration_id uuid not null references synthex_integrations(id) on delete cascade,
  -- Auth type
  auth_type text not null, -- oauth2, api_key, basic_auth
  -- OAuth2 tokens
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  token_type text,
  scopes text[],
  -- API Key
  api_key text,
  api_secret text,
  -- Basic Auth
  username text,
  password text,
  -- Metadata
  metadata jsonb default '{}',
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique constraint: one secret record per integration
create unique index if not exists idx_synthex_integration_secrets_unique
  on synthex_integration_secrets(integration_id);

-- Index for querying by tenant
drop index if exists idx_synthex_integration_secrets_tenant;
create index if not exists idx_synthex_integration_secrets_tenant
  on synthex_integration_secrets(tenant_id);

-- ============================================
-- Synthex Integration Events Table
-- Event log for integration activities
-- ============================================
create table if not exists synthex_integration_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  integration_id uuid not null references synthex_integrations(id) on delete cascade,
  -- Event details
  event_type text not null, -- connected, disconnected, refresh_token, api_call, error
  event_status text, -- success, failure, warning
  -- Payload (for debugging)
  payload jsonb default '{}',
  error_message text,
  -- Metadata
  user_agent text,
  ip_address text,
  -- Timestamp
  created_at timestamptz default now()
);

-- Index for querying events by integration and type
drop index if exists idx_synthex_integration_events_integration;
create index if not exists idx_synthex_integration_events_integration
  on synthex_integration_events(integration_id, created_at desc);

drop index if exists idx_synthex_integration_events_type;
create index if not exists idx_synthex_integration_events_type
  on synthex_integration_events(tenant_id, event_type, created_at desc);

drop index if exists idx_synthex_integration_events_status;
create index if not exists idx_synthex_integration_events_status
  on synthex_integration_events(tenant_id, event_status, created_at desc);

-- ============================================
-- Updated_at Triggers
-- ============================================
create or replace function synthex_update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_synthex_integrations_updated_at on synthex_integrations;
create trigger update_synthex_integrations_updated_at
  before update on synthex_integrations
  for each row
  execute function synthex_update_updated_at_column();

drop trigger if exists update_synthex_integration_secrets_updated_at on synthex_integration_secrets;
create trigger update_synthex_integration_secrets_updated_at
  before update on synthex_integration_secrets
  for each row
  execute function synthex_update_updated_at_column();

-- ============================================
-- Row Level Security
-- ============================================
alter table synthex_integrations enable row level security;
alter table synthex_integration_secrets enable row level security;
alter table synthex_integration_events enable row level security;

-- Integrations policies
drop policy if exists "synthex_integrations_select" on synthex_integrations;
create policy "synthex_integrations_select"
  on synthex_integrations for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_integrations_insert" on synthex_integrations;
create policy "synthex_integrations_insert"
  on synthex_integrations for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_integrations_update" on synthex_integrations;
create policy "synthex_integrations_update"
  on synthex_integrations for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_integrations_delete" on synthex_integrations;
create policy "synthex_integrations_delete"
  on synthex_integrations for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Integration Secrets policies (READ-ONLY for users, service role for writes)
drop policy if exists "synthex_integration_secrets_select" on synthex_integration_secrets;
create policy "synthex_integration_secrets_select"
  on synthex_integration_secrets for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Only service role can insert/update/delete secrets (for security)
-- Users will interact through API endpoints that use service role

-- Integration Events policies
drop policy if exists "synthex_integration_events_select" on synthex_integration_events;
create policy "synthex_integration_events_select"
  on synthex_integration_events for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_integration_events_insert" on synthex_integration_events;
create policy "synthex_integration_events_insert"
  on synthex_integration_events for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- ============================================
-- Comments
-- ============================================
comment on table synthex_integrations is 'Synthex integration connection records';
comment on table synthex_integration_secrets is 'OAuth tokens and API credentials (sensitive)';
comment on table synthex_integration_events is 'Event log for integration activities';
