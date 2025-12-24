-- Phase B15: Synthex Revenue Attribution by Journey Stage
-- Migration: 422_synthex_revenue_attribution.sql
-- Creates revenue events tracking and stage-based attribution tables

-- ============================================
-- Revenue Events Table
-- ============================================
create table if not exists synthex_revenue_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  contact_id uuid references synthex_audience_contacts(id) on delete set null,
  campaign_id uuid, -- Can reference campaign if exists
  journey_id uuid references synthex_journeys(id) on delete set null,
  -- Attribution
  channel text not null, -- email, organic, paid, referral, direct, social
  stage text, -- awareness, consideration, decision, retention, advocacy
  touchpoint_type text, -- first_touch, last_touch, linear, time_decay, position_based
  -- Revenue
  amount numeric(12,2) not null,
  currency text default 'AUD',
  -- Event context
  event_type text default 'conversion', -- conversion, refund, upsell, subscription
  order_id text, -- External order reference
  product_sku text,
  product_name text,
  quantity int default 1,
  -- Metadata
  metadata jsonb default '{}',
  -- Timestamps
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================
-- Stage Revenue Daily Aggregates
-- ============================================
create table if not exists synthex_stage_revenue_daily (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  cohort_id uuid references synthex_cohorts(id) on delete set null,
  -- Dimensions
  date date not null,
  stage text not null,
  channel text,
  -- Metrics
  revenue numeric(12,2) not null default 0,
  refunds numeric(12,2) not null default 0,
  net_revenue numeric(12,2) not null default 0,
  conversions int not null default 0,
  avg_order_value numeric(12,2),
  -- Attribution breakdown
  first_touch_revenue numeric(12,2) default 0,
  last_touch_revenue numeric(12,2) default 0,
  linear_revenue numeric(12,2) default 0,
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Unique constraint for upserts
  unique(tenant_id, date, stage, channel)
);

-- ============================================
-- Channel Attribution Summary
-- ============================================
create table if not exists synthex_channel_attribution (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  -- Time period
  period_start date not null,
  period_end date not null,
  -- Channel metrics
  channel text not null,
  total_revenue numeric(12,2) default 0,
  total_conversions int default 0,
  first_touch_conversions int default 0,
  last_touch_conversions int default 0,
  assisted_conversions int default 0,
  -- Efficiency
  cost numeric(12,2) default 0,
  roas numeric(8,4), -- Return on ad spend
  cac numeric(12,2), -- Customer acquisition cost
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(tenant_id, period_start, period_end, channel)
);

-- ============================================
-- Revenue Forecasts (AI-Generated)
-- ============================================
create table if not exists synthex_revenue_forecasts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  cohort_id uuid references synthex_cohorts(id) on delete set null,
  -- Forecast period
  forecast_date date not null,
  forecast_type text default 'daily', -- daily, weekly, monthly
  -- Predictions
  predicted_revenue numeric(12,2),
  predicted_conversions int,
  confidence_lower numeric(12,2),
  confidence_upper numeric(12,2),
  confidence_level numeric(5,4) default 0.95,
  -- Model info
  model_version text,
  features_used jsonb default '[]',
  -- Timestamps
  generated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================
-- Indexes for Performance
-- ============================================
drop index if exists idx_revenue_events_tenant;
create index if not exists idx_revenue_events_tenant
  on synthex_revenue_events(tenant_id);
drop index if exists idx_revenue_events_contact;
create index if not exists idx_revenue_events_contact
  on synthex_revenue_events(contact_id);
drop index if exists idx_revenue_events_journey;
create index if not exists idx_revenue_events_journey
  on synthex_revenue_events(journey_id);
drop index if exists idx_revenue_events_stage;
create index if not exists idx_revenue_events_stage
  on synthex_revenue_events(stage);
drop index if exists idx_revenue_events_channel;
create index if not exists idx_revenue_events_channel
  on synthex_revenue_events(channel);
drop index if exists idx_revenue_events_occurred;
create index if not exists idx_revenue_events_occurred
  on synthex_revenue_events(occurred_at);
drop index if exists idx_revenue_events_tenant_date;
create index if not exists idx_revenue_events_tenant_date
  on synthex_revenue_events(tenant_id, occurred_at);

drop index if exists idx_stage_revenue_tenant;
create index if not exists idx_stage_revenue_tenant
  on synthex_stage_revenue_daily(tenant_id);
drop index if exists idx_stage_revenue_date;
create index if not exists idx_stage_revenue_date
  on synthex_stage_revenue_daily(date);
drop index if exists idx_stage_revenue_stage;
create index if not exists idx_stage_revenue_stage
  on synthex_stage_revenue_daily(stage);
drop index if exists idx_stage_revenue_tenant_date;
create index if not exists idx_stage_revenue_tenant_date
  on synthex_stage_revenue_daily(tenant_id, date);

drop index if exists idx_channel_attribution_tenant;
create index if not exists idx_channel_attribution_tenant
  on synthex_channel_attribution(tenant_id);
drop index if exists idx_channel_attribution_period;
create index if not exists idx_channel_attribution_period
  on synthex_channel_attribution(period_start, period_end);

drop index if exists idx_revenue_forecasts_tenant;
create index if not exists idx_revenue_forecasts_tenant
  on synthex_revenue_forecasts(tenant_id);
drop index if exists idx_revenue_forecasts_date;
create index if not exists idx_revenue_forecasts_date
  on synthex_revenue_forecasts(forecast_date);

-- ============================================
-- Row Level Security
-- ============================================
alter table synthex_revenue_events enable row level security;
alter table synthex_stage_revenue_daily enable row level security;
alter table synthex_channel_attribution enable row level security;
alter table synthex_revenue_forecasts enable row level security;

-- Revenue events policies
drop policy if exists "synthex_revenue_events_select" on synthex_revenue_events;
create policy "synthex_revenue_events_select"
  on synthex_revenue_events for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_revenue_events_insert" on synthex_revenue_events;
create policy "synthex_revenue_events_insert"
  on synthex_revenue_events for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_revenue_events_update" on synthex_revenue_events;
create policy "synthex_revenue_events_update"
  on synthex_revenue_events for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_revenue_events_delete" on synthex_revenue_events;
create policy "synthex_revenue_events_delete"
  on synthex_revenue_events for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Stage revenue policies
drop policy if exists "synthex_stage_revenue_select" on synthex_stage_revenue_daily;
create policy "synthex_stage_revenue_select"
  on synthex_stage_revenue_daily for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_stage_revenue_insert" on synthex_stage_revenue_daily;
create policy "synthex_stage_revenue_insert"
  on synthex_stage_revenue_daily for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_stage_revenue_update" on synthex_stage_revenue_daily;
create policy "synthex_stage_revenue_update"
  on synthex_stage_revenue_daily for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Channel attribution policies
drop policy if exists "synthex_channel_attribution_select" on synthex_channel_attribution;
create policy "synthex_channel_attribution_select"
  on synthex_channel_attribution for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_channel_attribution_insert" on synthex_channel_attribution;
create policy "synthex_channel_attribution_insert"
  on synthex_channel_attribution for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_channel_attribution_update" on synthex_channel_attribution;
create policy "synthex_channel_attribution_update"
  on synthex_channel_attribution for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Forecasts policies
drop policy if exists "synthex_revenue_forecasts_select" on synthex_revenue_forecasts;
create policy "synthex_revenue_forecasts_select"
  on synthex_revenue_forecasts for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

drop policy if exists "synthex_revenue_forecasts_insert" on synthex_revenue_forecasts;
create policy "synthex_revenue_forecasts_insert"
  on synthex_revenue_forecasts for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- ============================================
-- Updated At Trigger
-- ============================================
drop trigger if exists trigger_stage_revenue_updated_at on synthex_stage_revenue_daily;
create trigger trigger_stage_revenue_updated_at
  before update on synthex_stage_revenue_daily
  for each row execute function update_synthex_automation_updated_at();

drop trigger if exists trigger_channel_attribution_updated_at on synthex_channel_attribution;
create trigger trigger_channel_attribution_updated_at
  before update on synthex_channel_attribution
  for each row execute function update_synthex_automation_updated_at();
