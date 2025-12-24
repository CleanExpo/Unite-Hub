-- Phase B16: Synthex Predictive Lead Routing Engine
-- Migration: 423_synthex_lead_routing.sql
-- Creates tables for lead routing recommendations, decisions, and owner preferences

-- ============================================
-- Lead Routing Log Table
-- Stores all routing recommendations and decisions
-- ============================================
create table if not exists synthex_lead_routing_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  lead_id uuid not null references synthex_audience_contacts(id) on delete cascade,
  -- Routing recommendation
  recommended_owner text, -- User ID or name of recommended owner
  previous_owner text, -- Who owned it before (if any)
  priority_score numeric(5,2) not null default 50, -- 0-100 priority score
  recommended_channel text, -- email, phone, sms, meeting, etc.
  -- AI reasoning
  reason text, -- Short explanation of why this routing
  confidence numeric(5,4), -- 0-1 confidence score
  factors jsonb default '[]', -- Array of factors considered
  -- Context at time of routing
  lead_score_at_time numeric(5,2),
  churn_risk_at_time numeric(5,4),
  journey_stage_at_time text,
  -- Decision tracking
  decision_status text default 'pending', -- pending, accepted, rejected, modified
  actual_owner text, -- Who actually got assigned
  decided_by text, -- User who made the decision
  decided_at timestamptz,
  -- Metadata
  model_version text default 'v1',
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================
-- Lead Owner Preferences Table
-- Stores per-owner routing preferences
-- ============================================
create table if not exists synthex_lead_owner_preferences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  owner_id text not null, -- User identifier
  owner_name text,
  -- Capacity limits
  max_leads_per_day int default 10,
  max_active_leads int default 50,
  current_active_leads int default 0,
  -- Preferences
  preferred_industries text[] default '{}',
  preferred_stages text[] default '{}', -- awareness, consideration, decision, etc.
  preferred_channels text[] default '{}', -- email, phone, sms, meeting
  preferred_lead_score_min numeric(5,2) default 0,
  preferred_lead_score_max numeric(5,2) default 100,
  -- Availability
  is_active boolean default true,
  availability_hours jsonb default '{}', -- { monday: { start: "09:00", end: "17:00" }, ... }
  timezone text default 'Australia/Sydney',
  -- Performance metrics (updated periodically)
  avg_response_time_hours numeric(8,2),
  conversion_rate numeric(5,4),
  leads_assigned_30d int default 0,
  leads_converted_30d int default 0,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Unique constraint
  unique(tenant_id, owner_id)
);

-- ============================================
-- Routing Rules Table
-- Configurable routing rules per tenant
-- ============================================
create table if not exists synthex_lead_routing_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  name text not null,
  description text,
  priority int default 0, -- Higher priority rules evaluated first
  is_active boolean default true,
  -- Rule conditions (jsonb for flexibility)
  conditions jsonb not null default '[]', -- Array of { field, operator, value }
  -- Action
  action text not null default 'assign', -- assign, tag, notify, escalate
  action_config jsonb default '{}', -- { owner_id, tags, channel, etc. }
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Indexes for Performance
-- ============================================
drop index if exists idx_lead_routing_log_tenant;
create index if not exists idx_lead_routing_log_tenant
  on synthex_lead_routing_log(tenant_id);
drop index if exists idx_lead_routing_log_lead;
create index if not exists idx_lead_routing_log_lead
  on synthex_lead_routing_log(lead_id);
drop index if exists idx_lead_routing_log_status;
create index if not exists idx_lead_routing_log_status
  on synthex_lead_routing_log(decision_status);
drop index if exists idx_lead_routing_log_created;
create index if not exists idx_lead_routing_log_created
  on synthex_lead_routing_log(created_at);
drop index if exists idx_lead_routing_log_owner;
create index if not exists idx_lead_routing_log_owner
  on synthex_lead_routing_log(recommended_owner);

drop index if exists idx_lead_owner_prefs_tenant;
create index if not exists idx_lead_owner_prefs_tenant
  on synthex_lead_owner_preferences(tenant_id);
drop index if exists idx_lead_owner_prefs_owner;
create index if not exists idx_lead_owner_prefs_owner
  on synthex_lead_owner_preferences(owner_id);
drop index if exists idx_lead_owner_prefs_active;
create index if not exists idx_lead_owner_prefs_active
  on synthex_lead_owner_preferences(is_active);

drop index if exists idx_lead_routing_rules_tenant;
create index if not exists idx_lead_routing_rules_tenant
  on synthex_lead_routing_rules(tenant_id);
drop index if exists idx_lead_routing_rules_priority;
create index if not exists idx_lead_routing_rules_priority
  on synthex_lead_routing_rules(priority desc);

-- ============================================
-- Row Level Security
-- ============================================
alter table synthex_lead_routing_log enable row level security;
alter table synthex_lead_owner_preferences enable row level security;
alter table synthex_lead_routing_rules enable row level security;

-- Routing log policies
drop policy if exists "synthex_lead_routing_log_select" on synthex_lead_routing_log;
create policy "synthex_lead_routing_log_select"
  on synthex_lead_routing_log for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_lead_routing_log_insert" on synthex_lead_routing_log;
create policy "synthex_lead_routing_log_insert"
  on synthex_lead_routing_log for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_lead_routing_log_update" on synthex_lead_routing_log;
create policy "synthex_lead_routing_log_update"
  on synthex_lead_routing_log for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_lead_routing_log_delete" on synthex_lead_routing_log;
create policy "synthex_lead_routing_log_delete"
  on synthex_lead_routing_log for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Owner preferences policies
drop policy if exists "synthex_lead_owner_prefs_select" on synthex_lead_owner_preferences;
create policy "synthex_lead_owner_prefs_select"
  on synthex_lead_owner_preferences for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_lead_owner_prefs_insert" on synthex_lead_owner_preferences;
create policy "synthex_lead_owner_prefs_insert"
  on synthex_lead_owner_preferences for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_lead_owner_prefs_update" on synthex_lead_owner_preferences;
create policy "synthex_lead_owner_prefs_update"
  on synthex_lead_owner_preferences for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_lead_owner_prefs_delete" on synthex_lead_owner_preferences;
create policy "synthex_lead_owner_prefs_delete"
  on synthex_lead_owner_preferences for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Routing rules policies
drop policy if exists "synthex_lead_routing_rules_select" on synthex_lead_routing_rules;
create policy "synthex_lead_routing_rules_select"
  on synthex_lead_routing_rules for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_lead_routing_rules_insert" on synthex_lead_routing_rules;
create policy "synthex_lead_routing_rules_insert"
  on synthex_lead_routing_rules for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_lead_routing_rules_update" on synthex_lead_routing_rules;
create policy "synthex_lead_routing_rules_update"
  on synthex_lead_routing_rules for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_lead_routing_rules_delete" on synthex_lead_routing_rules;
create policy "synthex_lead_routing_rules_delete"
  on synthex_lead_routing_rules for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- ============================================
-- Updated At Trigger
-- ============================================
drop trigger if exists trigger_lead_owner_prefs_updated_at on synthex_lead_owner_preferences;
create trigger trigger_lead_owner_prefs_updated_at
  before update on synthex_lead_owner_preferences
  for each row execute function update_synthex_automation_updated_at();

drop trigger if exists trigger_lead_routing_rules_updated_at on synthex_lead_routing_rules;
create trigger trigger_lead_routing_rules_updated_at
  before update on synthex_lead_routing_rules
  for each row execute function update_synthex_automation_updated_at();
