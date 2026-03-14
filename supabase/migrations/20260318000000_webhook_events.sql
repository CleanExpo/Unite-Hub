-- webhook_events: inbound webhook dedup/audit table
-- Tracks every WhatsApp + Paperclip inbound event for idempotent processing
create table if not exists public.webhook_events (
  id           uuid primary key default gen_random_uuid(),
  provider     text not null check (provider in ('whatsapp', 'paperclip')),
  event_id     text not null,
  event_type   text not null,
  payload      jsonb not null default '{}',
  status       text not null default 'pending'
               check (status in ('pending', 'processing', 'processed', 'failed')),
  attempts     integer not null default 0,
  error        text,
  processed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists idx_webhook_events_dedup
  on public.webhook_events (provider, event_id);

create index if not exists idx_webhook_events_status
  on public.webhook_events (status, created_at desc);

alter table public.webhook_events enable row level security;

drop policy if exists "service_role_full_access" on public.webhook_events;
create policy "service_role_full_access" on public.webhook_events
  for all using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop trigger if exists webhook_events_updated_at on public.webhook_events;
create trigger webhook_events_updated_at
  before update on public.webhook_events
  for each row execute function update_updated_at_column();
