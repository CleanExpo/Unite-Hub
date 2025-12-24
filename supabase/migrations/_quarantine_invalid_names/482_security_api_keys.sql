-- Phase E2: API Key & Secret Management

create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  hashed_key text not null,
  scopes text[] default array[]::text[],
  last_used_at timestamptz,
  created_at timestamptz default now(),
  revoked_at timestamptz
);

alter table api_keys enable row level security;

drop policy if exists "tenant_can_see_own_keys" on api_keys;
create policy "tenant_can_see_own_keys" on api_keys
  for select using (auth.uid() is not null);

drop policy if exists "tenant_can_insert_keys" on api_keys;
create policy "tenant_can_insert_keys" on api_keys
  for insert with check (true);

drop policy if exists "tenant_can_update_keys" on api_keys;
create policy "tenant_can_update_keys" on api_keys
  for update using (true) with check (true);
