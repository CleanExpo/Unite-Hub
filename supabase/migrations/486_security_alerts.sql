-- Phase E6: Security Alerts & Signal Layer

create table if not exists security_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  type text not null,
  severity text not null check (severity in ('info','low','medium','high','critical')),
  message text not null,
  source text,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by uuid
);

create index if not exists security_alerts_tenant_severity_idx
  on security_alerts (tenant_id, severity, created_at desc);

alter table security_alerts enable row level security;

drop policy if exists "tenant_read_alerts" on security_alerts;
create policy "tenant_read_alerts" on security_alerts
  for select using (auth.uid() is not null);

drop policy if exists "tenant_write_alerts" on security_alerts;
create policy "tenant_write_alerts" on security_alerts
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
