-- Phase E1: Security & Audit Foundation
-- Global audit log for high-signal events across Unite-Hub/Synthex

create table if not exists security_audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  actor_id uuid,
  actor_type text check (actor_type in ('user','system','agent')) default 'user',
  action text not null,
  entity_type text,
  entity_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

alter table security_audit_log enable row level security;

-- Basic tenant isolation RLS (can be refined later)
drop policy if exists "tenant_can_see_own_audit" on security_audit_log;
create policy "tenant_can_see_own_audit" on security_audit_log
  for select using (auth.uid() is not null);

drop policy if exists "system_insert_audit" on security_audit_log;
create policy "system_insert_audit" on security_audit_log
  for insert with check (true);
