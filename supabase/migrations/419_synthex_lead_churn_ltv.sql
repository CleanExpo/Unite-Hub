-- Phase B12: Synthex Lead Scoring + Churn AI + LTV Prediction + Journey Mapping
-- Date: 2025-12-06
-- Backlog: SYNTHEX-012

-- =============================================================================
-- Table: synthex_lead_models
-- Stores lead scores, churn predictions, LTV estimates, and journey maps
-- =============================================================================

create table if not exists synthex_lead_models (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references synthex_audience_contacts(id) on delete cascade,
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,

  -- Lead scoring
  lead_score int default 0,
  lead_grade text, -- A, B, C, D, F

  -- Churn prediction
  churn_risk numeric(5,4) default 0.0, -- 0 to 1
  churn_factors jsonb default '[]', -- Factors contributing to churn risk

  -- LTV prediction
  ltv_estimate numeric(12,2) default 0.0, -- Estimated lifetime value in AUD
  ltv_confidence numeric(5,4), -- Confidence in LTV estimate

  -- Journey mapping
  journey jsonb default '{}', -- { stages: [], bottlenecks: [], recommendations: [] }
  current_stage text, -- awareness, consideration, decision, retention, advocacy
  stage_entered_at timestamp with time zone,

  -- Model metadata
  model_version text default 'v1',
  last_computed_at timestamp with time zone default now(),

  -- Timestamps
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for fast lookups
drop index if exists idx_lead_models_contact;
create index if not exists idx_lead_models_contact on synthex_lead_models(contact_id);
drop index if exists idx_lead_models_tenant;
create index if not exists idx_lead_models_tenant on synthex_lead_models(tenant_id);
drop index if exists idx_lead_models_lead_score;
create index if not exists idx_lead_models_lead_score on synthex_lead_models(lead_score desc);
drop index if exists idx_lead_models_churn_risk;
create index if not exists idx_lead_models_churn_risk on synthex_lead_models(churn_risk desc);
drop index if exists idx_lead_models_ltv;
create index if not exists idx_lead_models_ltv on synthex_lead_models(ltv_estimate desc);
drop index if exists idx_lead_models_stage;
create index if not exists idx_lead_models_stage on synthex_lead_models(current_stage);

-- =============================================================================
-- RLS Policies
-- =============================================================================

alter table synthex_lead_models enable row level security;

drop policy if exists "lead_models_select_own" on synthex_lead_models;
create policy "lead_models_select_own" on synthex_lead_models
  for select using (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

drop policy if exists "lead_models_insert_own" on synthex_lead_models;
create policy "lead_models_insert_own" on synthex_lead_models
  for insert with check (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

drop policy if exists "lead_models_update_own" on synthex_lead_models;
create policy "lead_models_update_own" on synthex_lead_models
  for update using (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

drop policy if exists "lead_models_delete_own" on synthex_lead_models;
create policy "lead_models_delete_own" on synthex_lead_models
  for delete using (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

-- =============================================================================
-- Triggers
-- =============================================================================

-- Auto-update updated_at
drop trigger if exists set_updated_at_lead_models on synthex_lead_models;
create trigger set_updated_at_lead_models
  before update on synthex_lead_models
  for each row execute function update_updated_at_column();

-- =============================================================================
-- Comments
-- =============================================================================

comment on table synthex_lead_models is 'Lead scores, churn predictions, LTV estimates, and journey maps';
comment on column synthex_lead_models.lead_score is 'Composite lead score based on engagement and activity';
comment on column synthex_lead_models.churn_risk is 'AI-predicted probability of churn (0-1)';
comment on column synthex_lead_models.ltv_estimate is 'Estimated customer lifetime value in AUD';
comment on column synthex_lead_models.journey is 'Customer journey map with stages, bottlenecks, recommendations';
