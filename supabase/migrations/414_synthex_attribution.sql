/**
 * Migration: 414_synthex_attribution.sql
 * Phase: B7 - Synthex Advanced Analytics + Attribution Engine
 *
 * Creates attribution tracking and engagement scoring tables.
 */

-- Attribution table
-- Tracks all user engagement events for attribution modeling
create table if not exists synthex_attribution (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  brand_id uuid references synthex_brands(id) on delete set null,
  campaign_id uuid references synthex_campaigns(id) on delete set null,
  schedule_id uuid references synthex_campaign_schedule(id) on delete set null,

  -- Event details
  step_index int,
  event_type text not null check (event_type in ('impression', 'open', 'click', 'conversion', 'unsubscribe', 'bounce', 'reply')),
  channel text not null check (channel in ('email', 'sms', 'social', 'push', 'webhook', 'web', 'other')),

  -- User/Contact tracking
  contact_id uuid,
  email text,
  phone text,
  external_user_id text,

  -- Attribution context
  source text, -- utm_source or referrer
  medium text, -- utm_medium
  content text, -- utm_content
  term text, -- utm_term

  -- Value tracking
  revenue numeric(12, 2) default 0,
  currency text default 'USD',

  -- Metadata
  metadata jsonb default '{}'::jsonb,
  ip_address text,
  user_agent text,

  -- Timestamps
  occurred_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Engagement scores table
-- Aggregated engagement scores per contact
create table if not exists synthex_engagement_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  brand_id uuid references synthex_brands(id) on delete set null,

  -- Contact identification
  contact_id uuid,
  email text,
  external_user_id text,

  -- Scores
  overall_score numeric(10, 2) default 0,
  email_score numeric(10, 2) default 0,
  sms_score numeric(10, 2) default 0,
  social_score numeric(10, 2) default 0,
  web_score numeric(10, 2) default 0,

  -- Counts
  total_events int default 0,
  impressions int default 0,
  opens int default 0,
  clicks int default 0,
  conversions int default 0,

  -- Revenue attribution
  total_revenue numeric(12, 2) default 0,

  -- Engagement tier
  tier text default 'cold' check (tier in ('cold', 'warming', 'warm', 'hot', 'champion')),

  -- Last activity
  last_event_type text,
  last_event_at timestamp with time zone,

  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Unique per tenant + contact identifier
  unique(tenant_id, email),
  unique(tenant_id, contact_id)
);

-- Campaign performance summary (pre-aggregated for fast reads)
create table if not exists synthex_campaign_performance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  campaign_id uuid not null references synthex_campaigns(id) on delete cascade,

  -- Date for time-series
  perf_date date not null default current_date,

  -- Event counts
  impressions int default 0,
  opens int default 0,
  clicks int default 0,
  conversions int default 0,
  unsubscribes int default 0,
  bounces int default 0,

  -- Revenue
  total_revenue numeric(12, 2) default 0,

  -- Rates (calculated)
  open_rate numeric(5, 2) default 0,
  click_rate numeric(5, 2) default 0,
  conversion_rate numeric(5, 2) default 0,
  bounce_rate numeric(5, 2) default 0,

  -- Unique engagement
  unique_opens int default 0,
  unique_clicks int default 0,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- One record per campaign per day
  unique(campaign_id, perf_date)
);

-- Indexes for performance
drop index if exists idx_attribution_tenant;
create index if not exists idx_attribution_tenant on synthex_attribution(tenant_id);
drop index if exists idx_attribution_campaign;
create index if not exists idx_attribution_campaign on synthex_attribution(campaign_id);
drop index if exists idx_attribution_event;
create index if not exists idx_attribution_event on synthex_attribution(event_type);
drop index if exists idx_attribution_occurred;
create index if not exists idx_attribution_occurred on synthex_attribution(occurred_at);
drop index if exists idx_attribution_channel;
create index if not exists idx_attribution_channel on synthex_attribution(channel);
drop index if exists idx_attribution_email;
create index if not exists idx_attribution_email on synthex_attribution(email) where email is not null;

drop index if exists idx_engagement_tenant;
create index if not exists idx_engagement_tenant on synthex_engagement_scores(tenant_id);
drop index if exists idx_engagement_tier;
create index if not exists idx_engagement_tier on synthex_engagement_scores(tier);
drop index if exists idx_engagement_score;
create index if not exists idx_engagement_score on synthex_engagement_scores(overall_score desc);
drop index if exists idx_engagement_email;
create index if not exists idx_engagement_email on synthex_engagement_scores(email) where email is not null;

drop index if exists idx_perf_tenant;
create index if not exists idx_perf_tenant on synthex_campaign_performance(tenant_id);
drop index if exists idx_perf_campaign;
create index if not exists idx_perf_campaign on synthex_campaign_performance(campaign_id);
drop index if exists idx_perf_date;
create index if not exists idx_perf_date on synthex_campaign_performance(perf_date);

-- Updated_at triggers
drop trigger if exists update_engagement_scores_timestamp on synthex_engagement_scores;
create trigger update_engagement_scores_timestamp
  before update on synthex_engagement_scores
  for each row execute function update_updated_at_column();

drop trigger if exists update_campaign_performance_timestamp on synthex_campaign_performance;
create trigger update_campaign_performance_timestamp
  before update on synthex_campaign_performance
  for each row execute function update_updated_at_column();

-- RLS Policies
alter table synthex_attribution enable row level security;
alter table synthex_engagement_scores enable row level security;
alter table synthex_campaign_performance enable row level security;

-- Attribution policies
drop policy if exists "attribution_select" on synthex_attribution;
create policy "attribution_select" on synthex_attribution
  for select using (
    exists (
      select 1 from synthex_tenants
      where id = synthex_attribution.tenant_id
      and owner_user_id = auth.uid()
    )
  );

drop policy if exists "attribution_insert" on synthex_attribution;
create policy "attribution_insert" on synthex_attribution
  for insert with check (
    exists (
      select 1 from synthex_tenants
      where id = synthex_attribution.tenant_id
      and owner_user_id = auth.uid()
    )
  );

-- Engagement scores policies
drop policy if exists "engagement_select" on synthex_engagement_scores;
create policy "engagement_select" on synthex_engagement_scores
  for select using (
    exists (
      select 1 from synthex_tenants
      where id = synthex_engagement_scores.tenant_id
      and owner_user_id = auth.uid()
    )
  );

drop policy if exists "engagement_insert" on synthex_engagement_scores;
create policy "engagement_insert" on synthex_engagement_scores
  for insert with check (
    exists (
      select 1 from synthex_tenants
      where id = synthex_engagement_scores.tenant_id
      and owner_user_id = auth.uid()
    )
  );

drop policy if exists "engagement_update" on synthex_engagement_scores;
create policy "engagement_update" on synthex_engagement_scores
  for update using (
    exists (
      select 1 from synthex_tenants
      where id = synthex_engagement_scores.tenant_id
      and owner_user_id = auth.uid()
    )
  );

-- Campaign performance policies
drop policy if exists "performance_select" on synthex_campaign_performance;
create policy "performance_select" on synthex_campaign_performance
  for select using (
    exists (
      select 1 from synthex_tenants
      where id = synthex_campaign_performance.tenant_id
      and owner_user_id = auth.uid()
    )
  );

drop policy if exists "performance_insert" on synthex_campaign_performance;
create policy "performance_insert" on synthex_campaign_performance
  for insert with check (
    exists (
      select 1 from synthex_tenants
      where id = synthex_campaign_performance.tenant_id
      and owner_user_id = auth.uid()
    )
  );

drop policy if exists "performance_update" on synthex_campaign_performance;
create policy "performance_update" on synthex_campaign_performance
  for update using (
    exists (
      select 1 from synthex_tenants
      where id = synthex_campaign_performance.tenant_id
      and owner_user_id = auth.uid()
    )
  );

-- Comments
comment on table synthex_attribution is 'Tracks all user engagement events for attribution modeling';
comment on table synthex_engagement_scores is 'Aggregated engagement scores per contact';
comment on table synthex_campaign_performance is 'Pre-aggregated campaign performance metrics by date';
