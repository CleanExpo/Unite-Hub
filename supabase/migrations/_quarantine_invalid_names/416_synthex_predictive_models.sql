/**
 * Phase B9: Synthex Predictive Intelligence + Send-Time Optimization
 *
 * Creates tables for predictive models and send-time optimization.
 */

-- =====================================================
-- Table: synthex_prediction_models
-- Stores AI model configurations and training metadata
-- =====================================================
create table if not exists synthex_prediction_models (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  brand_id uuid references synthex_brands(id) on delete set null,

  -- Model info
  model_type text not null check (model_type in ('send_time', 'engagement', 'churn', 'conversion', 'audience')),
  model_name text,
  model_version text default '1.0',

  -- Training metadata
  training_data_count int default 0,
  training_completed_at timestamp with time zone,
  accuracy_score numeric(5,4),
  feature_importance jsonb default '{}',

  -- Model configuration
  config jsonb default '{}',
  metadata jsonb default '{}',

  -- Status
  status text default 'draft' check (status in ('draft', 'training', 'active', 'deprecated', 'failed')),

  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Performance indexes
drop index if exists idx_synthex_prediction_models_tenant;
create index if not exists idx_synthex_prediction_models_tenant on synthex_prediction_models(tenant_id);
drop index if exists idx_synthex_prediction_models_type;
create index if not exists idx_synthex_prediction_models_type on synthex_prediction_models(model_type);
drop index if exists idx_synthex_prediction_models_status;
create index if not exists idx_synthex_prediction_models_status on synthex_prediction_models(status);

-- Enable RLS
alter table synthex_prediction_models enable row level security;

-- RLS Policies
drop policy if exists "prediction_models_select" on synthex_prediction_models;
create policy "prediction_models_select"
  on synthex_prediction_models for select
  using (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

drop policy if exists "prediction_models_insert" on synthex_prediction_models;
create policy "prediction_models_insert"
  on synthex_prediction_models for insert
  with check (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

drop policy if exists "prediction_models_update" on synthex_prediction_models;
create policy "prediction_models_update"
  on synthex_prediction_models for update
  using (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

drop policy if exists "prediction_models_delete" on synthex_prediction_models;
create policy "prediction_models_delete"
  on synthex_prediction_models for delete
  using (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

-- =====================================================
-- Table: synthex_predicted_send_times
-- Stores AI-predicted optimal send times
-- =====================================================
create table if not exists synthex_predicted_send_times (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  brand_id uuid references synthex_brands(id) on delete set null,
  audience_id uuid,  -- No FK constraint - audiences table may be added later
  model_id uuid references synthex_prediction_models(id) on delete set null,

  -- Predictions
  best_hour int check (best_hour >= 0 and best_hour <= 23),
  best_day text check (best_day in ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  best_timezone text default 'Australia/Sydney',

  -- Confidence and details
  confidence numeric(5,4) check (confidence >= 0 and confidence <= 1),
  reasoning text,

  -- Hour-by-hour scores (for heatmap)
  hourly_scores jsonb default '{}',  -- { "monday": [0.5, 0.6, ...], "tuesday": [...] }

  -- Alternative recommendations
  alternatives jsonb default '[]',  -- [{ "hour": 10, "day": "tuesday", "confidence": 0.75 }]

  -- Metadata
  data_points_analyzed int default 0,
  date_range_analyzed text,
  metadata jsonb default '{}',

  -- Timestamps
  generated_at timestamp with time zone default now(),
  expires_at timestamp with time zone default now() + interval '7 days'
);

-- Performance indexes
drop index if exists idx_synthex_predicted_send_times_tenant;
create index if not exists idx_synthex_predicted_send_times_tenant on synthex_predicted_send_times(tenant_id);
drop index if exists idx_synthex_predicted_send_times_generated;
create index if not exists idx_synthex_predicted_send_times_generated on synthex_predicted_send_times(generated_at desc);
drop index if exists idx_synthex_predicted_send_times_audience;
create index if not exists idx_synthex_predicted_send_times_audience on synthex_predicted_send_times(audience_id);

-- Enable RLS
alter table synthex_predicted_send_times enable row level security;

-- RLS Policies
drop policy if exists "predicted_send_times_select" on synthex_predicted_send_times;
create policy "predicted_send_times_select"
  on synthex_predicted_send_times for select
  using (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

drop policy if exists "predicted_send_times_insert" on synthex_predicted_send_times;
create policy "predicted_send_times_insert"
  on synthex_predicted_send_times for insert
  with check (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

drop policy if exists "predicted_send_times_delete" on synthex_predicted_send_times;
create policy "predicted_send_times_delete"
  on synthex_predicted_send_times for delete
  using (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

-- =====================================================
-- Table: synthex_engagement_predictions
-- Stores predicted engagement scores for contacts/audiences
-- =====================================================
create table if not exists synthex_engagement_predictions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  model_id uuid references synthex_prediction_models(id) on delete set null,

  -- Target
  email text,
  audience_id uuid,  -- No FK constraint - audiences table may be added later

  -- Predictions
  predicted_open_rate numeric(5,4),
  predicted_click_rate numeric(5,4),
  predicted_conversion_rate numeric(5,4),
  churn_risk_score numeric(5,4),

  -- Confidence
  confidence numeric(5,4),
  factors jsonb default '[]',

  -- Timestamps
  predicted_at timestamp with time zone default now(),
  expires_at timestamp with time zone default now() + interval '30 days'
);

-- Performance indexes
drop index if exists idx_synthex_engagement_predictions_tenant;
create index if not exists idx_synthex_engagement_predictions_tenant on synthex_engagement_predictions(tenant_id);
drop index if exists idx_synthex_engagement_predictions_email;
create index if not exists idx_synthex_engagement_predictions_email on synthex_engagement_predictions(email);

-- Enable RLS
alter table synthex_engagement_predictions enable row level security;

-- RLS Policies
drop policy if exists "engagement_predictions_select" on synthex_engagement_predictions;
create policy "engagement_predictions_select"
  on synthex_engagement_predictions for select
  using (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

drop policy if exists "engagement_predictions_insert" on synthex_engagement_predictions;
create policy "engagement_predictions_insert"
  on synthex_engagement_predictions for insert
  with check (
    auth.uid() in (
      select owner_user_id from synthex_tenants where id = tenant_id
    )
  );

-- =====================================================
-- Function: Get average engagement by hour/day
-- =====================================================
create or replace function synthex_engagement_by_hour_day(p_tenant_id uuid, p_days int default 90)
returns table(
  day_of_week text,
  hour_of_day int,
  total_events bigint,
  total_opens bigint,
  total_clicks bigint,
  avg_engagement_score numeric
) as $$
begin
  return query
  select
    to_char(e.occurred_at, 'Day') as day_of_week,
    extract(hour from e.occurred_at)::int as hour_of_day,
    count(*) as total_events,
    sum(case when e.event_type = 'open' then 1 else 0 end) as total_opens,
    sum(case when e.event_type = 'click' then 1 else 0 end) as total_clicks,
    avg(
      case e.event_type
        when 'open' then 3
        when 'click' then 5
        when 'conversion' then 20
        when 'reply' then 10
        else 1
      end
    )::numeric as avg_engagement_score
  from synthex_channel_events e
  where e.tenant_id = p_tenant_id
    and e.occurred_at >= current_date - p_days
  group by day_of_week, hour_of_day
  order by avg_engagement_score desc;
end;
$$ language plpgsql security definer;

-- Updated at trigger
create or replace function synthex_prediction_models_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_synthex_prediction_models_updated on synthex_prediction_models;
drop trigger if exists trg_synthex_prediction_models_updated on synthex_prediction_models;
create trigger trg_synthex_prediction_models_updated
  before update on synthex_prediction_models
  for each row execute function synthex_prediction_models_updated_at();
