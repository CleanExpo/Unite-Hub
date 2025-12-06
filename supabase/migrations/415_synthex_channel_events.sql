/**
 * Phase B8: Synthex Real-Time Channel Analytics
 *
 * Creates tables and functions for real-time channel event tracking
 * and daily analytics aggregation.
 */

-- =====================================================
-- Table: synthex_channel_events
-- Real-time channel event tracking for analytics
-- =====================================================
create table if not exists synthex_channel_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  brand_id uuid references synthex_brands(id) on delete set null,
  campaign_id uuid references synthex_campaigns(id) on delete set null,

  -- Channel and event info
  channel text not null check (channel in ('email', 'sms', 'social', 'push', 'webhook', 'web', 'other')),
  event_type text not null check (event_type in ('send', 'delivery', 'open', 'click', 'conversion', 'bounce', 'unsubscribe', 'complaint', 'reply')),

  -- Aggregation support
  count int not null default 1,

  -- Additional context
  metadata jsonb default '{}',

  -- Timestamps
  occurred_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Performance indexes
drop index if exists idx_synthex_channel_events_tenant;
create index if not exists idx_synthex_channel_events_tenant on synthex_channel_events(tenant_id);
drop index if exists idx_synthex_channel_events_channel;
create index if not exists idx_synthex_channel_events_channel on synthex_channel_events(channel);
drop index if exists idx_synthex_channel_events_occurred;
create index if not exists idx_synthex_channel_events_occurred on synthex_channel_events(occurred_at desc);
drop index if exists idx_synthex_channel_events_tenant_channel;
create index if not exists idx_synthex_channel_events_tenant_channel on synthex_channel_events(tenant_id, channel, occurred_at desc);

-- Enable RLS
alter table synthex_channel_events enable row level security;

-- RLS Policies
drop policy if exists "channel_events_select" on synthex_channel_events;
create policy "channel_events_select"
  on synthex_channel_events for select
  using (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

drop policy if exists "channel_events_insert" on synthex_channel_events;
create policy "channel_events_insert"
  on synthex_channel_events for insert
  with check (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

drop policy if exists "channel_events_delete" on synthex_channel_events;
create policy "channel_events_delete"
  on synthex_channel_events for delete
  using (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

-- =====================================================
-- Table: synthex_channel_daily_stats
-- Pre-aggregated daily channel statistics
-- =====================================================
create table if not exists synthex_channel_daily_stats (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  brand_id uuid references synthex_brands(id) on delete set null,

  -- Date and channel
  stats_date date not null,
  channel text not null check (channel in ('email', 'sms', 'social', 'push', 'webhook', 'web', 'other')),

  -- Event counts
  sends int default 0,
  deliveries int default 0,
  opens int default 0,
  clicks int default 0,
  conversions int default 0,
  bounces int default 0,
  unsubscribes int default 0,
  complaints int default 0,
  replies int default 0,

  -- Calculated rates (stored for fast reads)
  delivery_rate numeric(5,2) default 0,
  open_rate numeric(5,2) default 0,
  click_rate numeric(5,2) default 0,
  conversion_rate numeric(5,2) default 0,
  bounce_rate numeric(5,2) default 0,

  -- Revenue
  total_revenue numeric(12,2) default 0,

  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Unique constraint for upsert
  unique(tenant_id, brand_id, stats_date, channel)
);

-- Performance indexes
drop index if exists idx_synthex_channel_daily_stats_tenant;
create index if not exists idx_synthex_channel_daily_stats_tenant on synthex_channel_daily_stats(tenant_id);
drop index if exists idx_synthex_channel_daily_stats_date;
create index if not exists idx_synthex_channel_daily_stats_date on synthex_channel_daily_stats(stats_date desc);
drop index if exists idx_synthex_channel_daily_stats_lookup;
create index if not exists idx_synthex_channel_daily_stats_lookup on synthex_channel_daily_stats(tenant_id, stats_date, channel);

-- Enable RLS
alter table synthex_channel_daily_stats enable row level security;

-- RLS Policies
drop policy if exists "channel_daily_stats_select" on synthex_channel_daily_stats;
create policy "channel_daily_stats_select"
  on synthex_channel_daily_stats for select
  using (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

drop policy if exists "channel_daily_stats_insert" on synthex_channel_daily_stats;
create policy "channel_daily_stats_insert"
  on synthex_channel_daily_stats for insert
  with check (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

drop policy if exists "channel_daily_stats_update" on synthex_channel_daily_stats;
create policy "channel_daily_stats_update"
  on synthex_channel_daily_stats for update
  using (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

-- =====================================================
-- Function: synthex_daily_channel_summary
-- Aggregates channel events by date for a tenant
-- =====================================================
create or replace function synthex_daily_channel_summary(p_tenant_id uuid, p_days int default 30)
returns table(
  stats_date date,
  channel text,
  sends bigint,
  deliveries bigint,
  opens bigint,
  clicks bigint,
  conversions bigint,
  bounces bigint
) as $$
begin
  return query
  select
    date(e.occurred_at) as stats_date,
    e.channel,
    sum(case when e.event_type = 'send' then e.count else 0 end) as sends,
    sum(case when e.event_type = 'delivery' then e.count else 0 end) as deliveries,
    sum(case when e.event_type = 'open' then e.count else 0 end) as opens,
    sum(case when e.event_type = 'click' then e.count else 0 end) as clicks,
    sum(case when e.event_type = 'conversion' then e.count else 0 end) as conversions,
    sum(case when e.event_type = 'bounce' then e.count else 0 end) as bounces
  from synthex_channel_events e
  where e.tenant_id = p_tenant_id
    and e.occurred_at >= current_date - p_days
  group by date(e.occurred_at), e.channel
  order by date(e.occurred_at) asc, e.channel;
end;
$$ language plpgsql security definer;

-- =====================================================
-- Function: synthex_channel_totals
-- Gets total counts per channel for a tenant
-- =====================================================
create or replace function synthex_channel_totals(p_tenant_id uuid, p_days int default 30)
returns table(
  channel text,
  total_events bigint,
  total_sends bigint,
  total_opens bigint,
  total_clicks bigint,
  total_conversions bigint
) as $$
begin
  return query
  select
    e.channel,
    sum(e.count) as total_events,
    sum(case when e.event_type = 'send' then e.count else 0 end) as total_sends,
    sum(case when e.event_type = 'open' then e.count else 0 end) as total_opens,
    sum(case when e.event_type = 'click' then e.count else 0 end) as total_clicks,
    sum(case when e.event_type = 'conversion' then e.count else 0 end) as total_conversions
  from synthex_channel_events e
  where e.tenant_id = p_tenant_id
    and e.occurred_at >= current_date - p_days
  group by e.channel
  order by total_events desc;
end;
$$ language plpgsql security definer;

-- =====================================================
-- Function: synthex_aggregate_daily_stats
-- Aggregates raw events into daily stats (for cron job)
-- =====================================================
create or replace function synthex_aggregate_daily_stats(p_date date default current_date - 1)
returns int as $$
declare
  v_count int := 0;
begin
  insert into synthex_channel_daily_stats (
    tenant_id, brand_id, stats_date, channel,
    sends, deliveries, opens, clicks, conversions, bounces, unsubscribes, complaints, replies
  )
  select
    tenant_id,
    brand_id,
    date(occurred_at) as stats_date,
    channel,
    sum(case when event_type = 'send' then count else 0 end) as sends,
    sum(case when event_type = 'delivery' then count else 0 end) as deliveries,
    sum(case when event_type = 'open' then count else 0 end) as opens,
    sum(case when event_type = 'click' then count else 0 end) as clicks,
    sum(case when event_type = 'conversion' then count else 0 end) as conversions,
    sum(case when event_type = 'bounce' then count else 0 end) as bounces,
    sum(case when event_type = 'unsubscribe' then count else 0 end) as unsubscribes,
    sum(case when event_type = 'complaint' then count else 0 end) as complaints,
    sum(case when event_type = 'reply' then count else 0 end) as replies
  from synthex_channel_events
  where date(occurred_at) = p_date
  group by tenant_id, brand_id, date(occurred_at), channel
  on conflict (tenant_id, brand_id, stats_date, channel)
  do update set
    sends = excluded.sends,
    deliveries = excluded.deliveries,
    opens = excluded.opens,
    clicks = excluded.clicks,
    conversions = excluded.conversions,
    bounces = excluded.bounces,
    unsubscribes = excluded.unsubscribes,
    complaints = excluded.complaints,
    replies = excluded.replies,
    updated_at = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$ language plpgsql security definer;

-- Updated at trigger for daily stats
create or replace function synthex_channel_daily_stats_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_synthex_channel_daily_stats_updated on synthex_channel_daily_stats;
drop trigger if exists trg_synthex_channel_daily_stats_updated on synthex_channel_daily_stats;
create trigger trg_synthex_channel_daily_stats_updated
  before update on synthex_channel_daily_stats
  for each row execute function synthex_channel_daily_stats_updated_at();
