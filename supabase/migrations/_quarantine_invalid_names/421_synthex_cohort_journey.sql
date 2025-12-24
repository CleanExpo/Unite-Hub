-- Phase B14: Synthex Cohort-Based Journey Analysis
-- Migration: 421_synthex_cohort_journey.sql
-- Creates cohort definitions, journey tracking, and journey events tables

-- ============================================
-- Cohorts Table (Audience Segments)
-- ============================================
create table if not exists synthex_cohorts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  name text not null,
  description text,
  -- Rule definition for cohort membership
  -- Examples: { "type": "score_above", "threshold": 80 }
  --           { "type": "tag_contains", "tag": "enterprise" }
  --           { "type": "stage_in", "stages": ["decision", "retention"] }
  --           { "type": "composite", "operator": "and", "rules": [...] }
  rule jsonb not null default '{}',
  -- Cohort settings
  is_dynamic boolean default true, -- Auto-update membership
  refresh_interval_hours int default 24,
  last_evaluated_at timestamptz,
  -- Stats
  member_count int default 0,
  avg_score numeric(5,2) default 0,
  -- Metadata
  color text, -- For UI display
  icon text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Cohort Memberships (Contact <-> Cohort)
-- ============================================
create table if not exists synthex_cohort_members (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references synthex_cohorts(id) on delete cascade,
  contact_id uuid not null references synthex_audience_contacts(id) on delete cascade,
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  -- Membership metadata
  joined_at timestamptz default now(),
  score_at_join int default 0,
  -- Rule match details
  match_reason jsonb default '{}',
  -- Status
  is_active boolean default true,
  left_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Unique constraint
  unique(cohort_id, contact_id)
);

-- ============================================
-- Journeys Table (Contact Journey Tracking)
-- ============================================
create table if not exists synthex_journeys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  cohort_id uuid references synthex_cohorts(id) on delete set null,
  contact_id uuid not null references synthex_audience_contacts(id) on delete cascade,
  -- Current state
  current_stage text not null default 'awareness',
  stage_score int default 0,
  total_score int default 0,
  -- Journey path
  stages_visited text[] default array['awareness'],
  stage_history jsonb default '[]', -- [{stage, entered_at, exited_at, score}]
  -- Velocity metrics
  days_in_current_stage int default 0,
  avg_days_per_stage numeric(5,2),
  velocity_score numeric(5,2), -- Higher = faster progression
  -- Predictions
  predicted_next_stage text,
  predicted_conversion_date timestamptz,
  conversion_probability numeric(5,4),
  -- Status
  is_active boolean default true,
  completed_at timestamptz,
  dropped_at timestamptz,
  drop_reason text,
  -- Timestamps
  entered_at timestamptz default now(),
  last_activity_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Journey Events Table (Activity Log)
-- ============================================
create table if not exists synthex_journey_events (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references synthex_journeys(id) on delete cascade,
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  contact_id uuid references synthex_audience_contacts(id) on delete set null,
  -- Event details
  event_type text not null, -- stage_enter, stage_exit, score_change, action_taken, milestone
  event_source text, -- email, web, automation, manual
  -- Payload
  payload jsonb default '{}',
  -- Score impact
  score_delta int default 0,
  new_total_score int,
  -- Stage context
  from_stage text,
  to_stage text,
  -- Timestamps
  occurred_at timestamptz default now(),
  created_at timestamptz default now()
);

-- ============================================
-- Journey Milestones (Key Events)
-- ============================================
create table if not exists synthex_journey_milestones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  name text not null,
  description text,
  -- Milestone definition
  stage text not null, -- Which stage this milestone belongs to
  trigger_type text not null, -- score_threshold, event_count, time_elapsed, custom
  trigger_config jsonb not null default '{}',
  -- Rewards/Actions
  score_bonus int default 0,
  tag_to_add text,
  automation_to_trigger uuid, -- FK to synthex_automation_workflows
  -- Display
  icon text,
  color text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Journey Analytics Snapshots
-- ============================================
create table if not exists synthex_journey_analytics (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  cohort_id uuid references synthex_cohorts(id) on delete set null,
  -- Snapshot date
  snapshot_date date not null default current_date,
  -- Stage distribution
  stage_distribution jsonb default '{}', -- {awareness: 50, consideration: 30, ...}
  -- Flow metrics
  total_journeys int default 0,
  active_journeys int default 0,
  completed_journeys int default 0,
  dropped_journeys int default 0,
  -- Conversion metrics
  conversion_rate numeric(5,4),
  avg_journey_duration_days numeric(8,2),
  -- Stage transition rates
  stage_transitions jsonb default '{}', -- {awareness_to_consideration: 0.65, ...}
  -- Bottleneck analysis
  bottleneck_stages text[],
  drop_off_stages text[],
  -- Velocity
  avg_velocity_score numeric(5,2),
  -- Created
  created_at timestamptz default now(),
  -- Unique per tenant/cohort/date
  unique(tenant_id, cohort_id, snapshot_date)
);

-- ============================================
-- Indexes for Performance
-- ============================================
drop index if exists idx_cohorts_tenant;
create index if not exists idx_cohorts_tenant on synthex_cohorts(tenant_id);
drop index if exists idx_cohort_members_cohort;
create index if not exists idx_cohort_members_cohort on synthex_cohort_members(cohort_id);
drop index if exists idx_cohort_members_contact;
create index if not exists idx_cohort_members_contact on synthex_cohort_members(contact_id);
drop index if exists idx_cohort_members_tenant;
create index if not exists idx_cohort_members_tenant on synthex_cohort_members(tenant_id);

drop index if exists idx_journeys_tenant;
create index if not exists idx_journeys_tenant on synthex_journeys(tenant_id);
drop index if exists idx_journeys_cohort;
create index if not exists idx_journeys_cohort on synthex_journeys(cohort_id);
drop index if exists idx_journeys_contact;
create index if not exists idx_journeys_contact on synthex_journeys(contact_id);
drop index if exists idx_journeys_stage;
create index if not exists idx_journeys_stage on synthex_journeys(current_stage);
drop index if exists idx_journeys_active;
create index if not exists idx_journeys_active on synthex_journeys(tenant_id, is_active) where is_active = true;

drop index if exists idx_journey_events_journey;
create index if not exists idx_journey_events_journey on synthex_journey_events(journey_id);
drop index if exists idx_journey_events_tenant;
create index if not exists idx_journey_events_tenant on synthex_journey_events(tenant_id);
drop index if exists idx_journey_events_type;
create index if not exists idx_journey_events_type on synthex_journey_events(event_type);
drop index if exists idx_journey_events_occurred;
create index if not exists idx_journey_events_occurred on synthex_journey_events(occurred_at);

drop index if exists idx_journey_milestones_tenant;
create index if not exists idx_journey_milestones_tenant on synthex_journey_milestones(tenant_id);
drop index if exists idx_journey_milestones_stage;
create index if not exists idx_journey_milestones_stage on synthex_journey_milestones(stage);

drop index if exists idx_journey_analytics_tenant;
create index if not exists idx_journey_analytics_tenant on synthex_journey_analytics(tenant_id);
drop index if exists idx_journey_analytics_date;
create index if not exists idx_journey_analytics_date on synthex_journey_analytics(snapshot_date);

-- ============================================
-- Row Level Security
-- ============================================
alter table synthex_cohorts enable row level security;
alter table synthex_cohort_members enable row level security;
alter table synthex_journeys enable row level security;
alter table synthex_journey_events enable row level security;
alter table synthex_journey_milestones enable row level security;
alter table synthex_journey_analytics enable row level security;

-- Cohorts policies
drop policy if exists "synthex_cohorts_select" on synthex_cohorts;
create policy "synthex_cohorts_select" on synthex_cohorts for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_cohorts_insert" on synthex_cohorts;
create policy "synthex_cohorts_insert" on synthex_cohorts for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_cohorts_update" on synthex_cohorts;
create policy "synthex_cohorts_update" on synthex_cohorts for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_cohorts_delete" on synthex_cohorts;
create policy "synthex_cohorts_delete" on synthex_cohorts for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Cohort members policies
drop policy if exists "synthex_cohort_members_select" on synthex_cohort_members;
create policy "synthex_cohort_members_select" on synthex_cohort_members for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_cohort_members_insert" on synthex_cohort_members;
create policy "synthex_cohort_members_insert" on synthex_cohort_members for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_cohort_members_update" on synthex_cohort_members;
create policy "synthex_cohort_members_update" on synthex_cohort_members for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_cohort_members_delete" on synthex_cohort_members;
create policy "synthex_cohort_members_delete" on synthex_cohort_members for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Journeys policies
drop policy if exists "synthex_journeys_select" on synthex_journeys;
create policy "synthex_journeys_select" on synthex_journeys for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_journeys_insert" on synthex_journeys;
create policy "synthex_journeys_insert" on synthex_journeys for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_journeys_update" on synthex_journeys;
create policy "synthex_journeys_update" on synthex_journeys for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_journeys_delete" on synthex_journeys;
create policy "synthex_journeys_delete" on synthex_journeys for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Journey events policies
drop policy if exists "synthex_journey_events_select" on synthex_journey_events;
create policy "synthex_journey_events_select" on synthex_journey_events for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_journey_events_insert" on synthex_journey_events;
create policy "synthex_journey_events_insert" on synthex_journey_events for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Milestones policies
drop policy if exists "synthex_journey_milestones_select" on synthex_journey_milestones;
create policy "synthex_journey_milestones_select" on synthex_journey_milestones for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_journey_milestones_insert" on synthex_journey_milestones;
create policy "synthex_journey_milestones_insert" on synthex_journey_milestones for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_journey_milestones_update" on synthex_journey_milestones;
create policy "synthex_journey_milestones_update" on synthex_journey_milestones for update
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_journey_milestones_delete" on synthex_journey_milestones;
create policy "synthex_journey_milestones_delete" on synthex_journey_milestones for delete
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- Analytics policies
drop policy if exists "synthex_journey_analytics_select" on synthex_journey_analytics;
create policy "synthex_journey_analytics_select" on synthex_journey_analytics for select
  using (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));
drop policy if exists "synthex_journey_analytics_insert" on synthex_journey_analytics;
create policy "synthex_journey_analytics_insert" on synthex_journey_analytics for insert
  with check (tenant_id in (select id from synthex_tenants where owner_user_id = auth.uid()));

-- ============================================
-- Updated At Triggers
-- ============================================
drop trigger if exists trigger_cohorts_updated_at on synthex_cohorts;
create trigger trigger_cohorts_updated_at
  before update on synthex_cohorts
  for each row execute function update_synthex_automation_updated_at();

drop trigger if exists trigger_cohort_members_updated_at on synthex_cohort_members;
create trigger trigger_cohort_members_updated_at
  before update on synthex_cohort_members
  for each row execute function update_synthex_automation_updated_at();

drop trigger if exists trigger_journeys_updated_at on synthex_journeys;
create trigger trigger_journeys_updated_at
  before update on synthex_journeys
  for each row execute function update_synthex_automation_updated_at();

drop trigger if exists trigger_journey_milestones_updated_at on synthex_journey_milestones;
create trigger trigger_journey_milestones_updated_at
  before update on synthex_journey_milestones
  for each row execute function update_synthex_automation_updated_at();
