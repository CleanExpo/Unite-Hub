-- Phase E4: Configuration & Secret Governance

create table if not exists security_config_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  key text not null,
  value text not null,
  is_secret boolean not null default false,
  scope text not null default 'global', -- e.g. global, synthex, unitehub
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists security_config_settings_tenant_key_scope_idx
  on security_config_settings (tenant_id, key, scope);

alter table security_config_settings enable row level security;

-- Basic RLS: future phases can refine by role
drop policy if exists "tenant_read_config" on security_config_settings;
create policy "tenant_read_config" on security_config_settings
  for select using (auth.uid() is not null);

drop policy if exists "tenant_write_config" on security_config_settings;
create policy "tenant_write_config" on security_config_settings
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create or replace function security_config_settings_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists security_config_settings_set_updated_at_trg on security_config_settings;
create trigger security_config_settings_set_updated_at_trg
before update on security_config_settings
for each row execute procedure security_config_settings_set_updated_at();
