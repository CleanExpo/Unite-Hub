/**
 * Synthex Agent Memory
 *
 * Stores key-value pairs for agent context and memory across sessions.
 * Enables persistent agent state for context-aware responses.
 *
 * Phase: B4 - Synthex Agent Automation
 */

-- Agent memory table
create table if not exists synthex_agent_memory (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  brand_id uuid references synthex_brands(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Memory key-value storage
  key text not null,
  value jsonb not null,

  -- Memory metadata
  memory_type text not null default 'general' check (memory_type in ('general', 'preference', 'context', 'goal', 'task', 'feedback')),
  expires_at timestamp with time zone, -- Optional expiration for temporary context
  access_count integer default 0, -- Track how often this memory is accessed
  last_accessed_at timestamp with time zone,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  -- Ensure unique keys per tenant/user
  constraint unique_synthex_memory_key unique(tenant_id, user_id, key)
);

-- Agent task queue for autonomous operations
create table if not exists synthex_agent_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references synthex_tenants(id) on delete cascade,
  brand_id uuid references synthex_brands(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Task definition
  task_type text not null check (task_type in ('content_generation', 'campaign_creation', 'seo_analysis', 'email_draft', 'custom')),
  description text not null,
  parameters jsonb, -- Task-specific parameters

  -- Task status
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'cancelled')),
  priority integer default 5 check (priority between 1 and 10), -- 1 = highest

  -- Results
  result jsonb, -- Task output
  error_message text,

  -- Timing
  scheduled_at timestamp with time zone,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes for performance
drop index if exists idx_synthex_agent_memory_tenant_user;
create index if not exists idx_synthex_agent_memory_tenant_user on synthex_agent_memory(tenant_id, user_id);
drop index if exists idx_synthex_agent_memory_key;
create index if not exists idx_synthex_agent_memory_key on synthex_agent_memory(key);
drop index if exists idx_synthex_agent_memory_type;
create index if not exists idx_synthex_agent_memory_type on synthex_agent_memory(memory_type);
drop index if exists idx_synthex_agent_tasks_tenant;
create index if not exists idx_synthex_agent_tasks_tenant on synthex_agent_tasks(tenant_id);
drop index if exists idx_synthex_agent_tasks_status;
create index if not exists idx_synthex_agent_tasks_status on synthex_agent_tasks(status);
drop index if exists idx_synthex_agent_tasks_scheduled;
create index if not exists idx_synthex_agent_tasks_scheduled on synthex_agent_tasks(scheduled_at) where status = 'pending';

-- Updated at trigger for memory
create or replace function update_synthex_agent_memory_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_synthex_agent_memory_updated_at on synthex_agent_memory;
create trigger trigger_synthex_agent_memory_updated_at
  before update on synthex_agent_memory
  for each row execute function update_synthex_agent_memory_updated_at();

-- Updated at trigger for tasks
drop trigger if exists trigger_synthex_agent_tasks_updated_at on synthex_agent_tasks;
create trigger trigger_synthex_agent_tasks_updated_at
  before update on synthex_agent_tasks
  for each row execute function update_synthex_agent_memory_updated_at();

-- Enable RLS
alter table synthex_agent_memory enable row level security;
alter table synthex_agent_tasks enable row level security;

-- RLS Policies for agent memory
drop policy if exists "synthex_agent_memory_select" on synthex_agent_memory;
create policy "synthex_agent_memory_select" on synthex_agent_memory
  for select using (auth.uid() = user_id);

drop policy if exists "synthex_agent_memory_insert" on synthex_agent_memory;
create policy "synthex_agent_memory_insert" on synthex_agent_memory
  for insert with check (auth.uid() = user_id);

drop policy if exists "synthex_agent_memory_update" on synthex_agent_memory;
create policy "synthex_agent_memory_update" on synthex_agent_memory
  for update using (auth.uid() = user_id);

drop policy if exists "synthex_agent_memory_delete" on synthex_agent_memory;
create policy "synthex_agent_memory_delete" on synthex_agent_memory
  for delete using (auth.uid() = user_id);

-- RLS Policies for agent tasks
drop policy if exists "synthex_agent_tasks_select" on synthex_agent_tasks;
create policy "synthex_agent_tasks_select" on synthex_agent_tasks
  for select using (auth.uid() = user_id);

drop policy if exists "synthex_agent_tasks_insert" on synthex_agent_tasks;
create policy "synthex_agent_tasks_insert" on synthex_agent_tasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "synthex_agent_tasks_update" on synthex_agent_tasks;
create policy "synthex_agent_tasks_update" on synthex_agent_tasks
  for update using (auth.uid() = user_id);

drop policy if exists "synthex_agent_tasks_delete" on synthex_agent_tasks;
create policy "synthex_agent_tasks_delete" on synthex_agent_tasks
  for delete using (auth.uid() = user_id);

-- Comments
comment on table synthex_agent_memory is 'Stores persistent agent memory and context for Synthex AI features';
comment on table synthex_agent_tasks is 'Queue for autonomous agent tasks in Synthex';
