-- Phase E5: Session & Device Security

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid not null,
  device_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  revoked_at timestamptz
);

create table if not exists trusted_devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid not null,
  device_key text not null,
  label text,
  created_at timestamptz default now(),
  revoked_at timestamptz
);

create index if not exists user_sessions_user_idx on user_sessions (user_id);
create index if not exists trusted_devices_user_idx on trusted_devices (user_id);

alter table user_sessions enable row level security;
alter table trusted_devices enable row level security;

drop policy if exists "tenant_read_sessions" on user_sessions;
create policy "tenant_read_sessions" on user_sessions
  for select using (auth.uid() is not null);

drop policy if exists "tenant_write_sessions" on user_sessions;
create policy "tenant_write_sessions" on user_sessions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "tenant_read_trusted_devices" on trusted_devices;
create policy "tenant_read_trusted_devices" on trusted_devices
  for select using (auth.uid() is not null);

drop policy if exists "tenant_write_trusted_devices" on trusted_devices;
create policy "tenant_write_trusted_devices" on trusted_devices
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create or replace function user_sessions_set_last_seen()
returns trigger as $$
begin
  new.last_seen_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_sessions_set_last_seen_trg on user_sessions;
create trigger user_sessions_set_last_seen_trg
before update on user_sessions
for each row execute procedure user_sessions_set_last_seen();
