-- Phase B13: Synthex Automated Lead Nurturing Workflows
-- Migration: 420_synthex_automation_core.sql
-- Creates automation workflows and execution tracking tables

-- ============================================
-- Automation Workflows Table
-- ============================================
create table if not exists synthex_automation_workflows (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  name text not null,
  description text,
  -- Trigger configuration: { type: 'lead_score_threshold', threshold: 80 }
  -- Types: lead_score_threshold, churn_risk_high, tag_added, stage_change, manual
  trigger jsonb not null default '{}',
  -- Actions array: [{ type: 'send_email', template: 'welcome' }, { type: 'wait', seconds: 86400 }]
  -- Types: send_email, add_tag, remove_tag, update_score, wait, webhook, notify
  actions jsonb not null default '[]',
  is_active boolean default true,
  -- Stats
  total_runs int default 0,
  successful_runs int default 0,
  failed_runs int default 0,
  last_run_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Automation Runs Table (Execution Log)
-- ============================================
create table if not exists synthex_automation_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references synthex_automation_workflows(id) on delete cascade,
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  contact_id uuid references synthex_audience_contacts(id) on delete set null,
  -- Trigger context that started this run
  trigger_context jsonb default '{}',
  -- Execution payload (variables, etc.)
  payload jsonb default '{}',
  -- Status: pending, running, completed, failed, cancelled
  status text default 'pending',
  -- Current action index (for resumable workflows)
  current_action_index int default 0,
  -- Results of each action
  action_results jsonb default '[]',
  -- Error details if failed
  error text,
  error_details jsonb,
  -- Timing
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Automation Action Templates
-- ============================================
create table if not exists synthex_automation_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  name text not null,
  description text,
  -- Template type: email, sms, webhook
  template_type text not null default 'email',
  -- Subject line (for email)
  subject text,
  -- Body content with variable placeholders {{contact.name}}
  body text,
  -- HTML body (for email)
  html_body text,
  -- Metadata
  metadata jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Indexes for Performance
-- ============================================
drop index if exists idx_automation_workflows_tenant;
create index if not exists idx_automation_workflows_tenant
  on synthex_automation_workflows(tenant_id);
drop index if exists idx_automation_workflows_active;
create index if not exists idx_automation_workflows_active
  on synthex_automation_workflows(tenant_id, is_active) where is_active = true;

drop index if exists idx_automation_runs_workflow;
create index if not exists idx_automation_runs_workflow
  on synthex_automation_runs(workflow_id);
drop index if exists idx_automation_runs_tenant;
create index if not exists idx_automation_runs_tenant
  on synthex_automation_runs(tenant_id);
drop index if exists idx_automation_runs_contact;
create index if not exists idx_automation_runs_contact
  on synthex_automation_runs(contact_id);
drop index if exists idx_automation_runs_status;
create index if not exists idx_automation_runs_status
  on synthex_automation_runs(status);
drop index if exists idx_automation_runs_pending;
create index if not exists idx_automation_runs_pending
  on synthex_automation_runs(tenant_id, status) where status = 'pending';

drop index if exists idx_automation_templates_tenant;
create index if not exists idx_automation_templates_tenant
  on synthex_automation_templates(tenant_id);

-- ============================================
-- Row Level Security
-- ============================================
alter table synthex_automation_workflows enable row level security;
alter table synthex_automation_runs enable row level security;
alter table synthex_automation_templates enable row level security;

-- Workflow policies
drop policy if exists "synthex_automation_workflows_select" on synthex_automation_workflows;
create policy "synthex_automation_workflows_select"
  on synthex_automation_workflows for select
  using (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

drop policy if exists "synthex_automation_workflows_insert" on synthex_automation_workflows;
create policy "synthex_automation_workflows_insert"
  on synthex_automation_workflows for insert
  with check (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

drop policy if exists "synthex_automation_workflows_update" on synthex_automation_workflows;
create policy "synthex_automation_workflows_update"
  on synthex_automation_workflows for update
  using (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

drop policy if exists "synthex_automation_workflows_delete" on synthex_automation_workflows;
create policy "synthex_automation_workflows_delete"
  on synthex_automation_workflows for delete
  using (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

-- Run policies
drop policy if exists "synthex_automation_runs_select" on synthex_automation_runs;
create policy "synthex_automation_runs_select"
  on synthex_automation_runs for select
  using (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

drop policy if exists "synthex_automation_runs_insert" on synthex_automation_runs;
create policy "synthex_automation_runs_insert"
  on synthex_automation_runs for insert
  with check (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

drop policy if exists "synthex_automation_runs_update" on synthex_automation_runs;
create policy "synthex_automation_runs_update"
  on synthex_automation_runs for update
  using (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

-- Template policies
drop policy if exists "synthex_automation_templates_select" on synthex_automation_templates;
create policy "synthex_automation_templates_select"
  on synthex_automation_templates for select
  using (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

drop policy if exists "synthex_automation_templates_insert" on synthex_automation_templates;
create policy "synthex_automation_templates_insert"
  on synthex_automation_templates for insert
  with check (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

drop policy if exists "synthex_automation_templates_update" on synthex_automation_templates;
create policy "synthex_automation_templates_update"
  on synthex_automation_templates for update
  using (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

drop policy if exists "synthex_automation_templates_delete" on synthex_automation_templates;
create policy "synthex_automation_templates_delete"
  on synthex_automation_templates for delete
  using (
    tenant_id in (
      select id from synthex_tenants where owner_user_id = auth.uid()
    )
  );

-- ============================================
-- Updated At Trigger
-- ============================================
create or replace function update_synthex_automation_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_automation_workflows_updated_at on synthex_automation_workflows;
create trigger trigger_automation_workflows_updated_at
  before update on synthex_automation_workflows
  for each row execute function update_synthex_automation_updated_at();

drop trigger if exists trigger_automation_runs_updated_at on synthex_automation_runs;
create trigger trigger_automation_runs_updated_at
  before update on synthex_automation_runs
  for each row execute function update_synthex_automation_updated_at();

drop trigger if exists trigger_automation_templates_updated_at on synthex_automation_templates;
create trigger trigger_automation_templates_updated_at
  before update on synthex_automation_templates
  for each row execute function update_synthex_automation_updated_at();
