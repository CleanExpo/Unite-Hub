-- Coach Reports schema for Macro Coaches (UNI-1510)
-- Stores AI-generated coaching briefs from Revenue, Build, Marketing, and Life coaches.

create table if not exists public.coach_reports (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references auth.users(id),
  coach_type text not null check (coach_type in ('revenue', 'build', 'marketing', 'life')),
  business_key text,
  report_date date not null default current_date,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  brief_markdown text,
  raw_data jsonb,
  metrics jsonb,
  input_tokens integer,
  output_tokens integer,
  model text,
  duration_ms integer,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coach_reports enable row level security;

drop policy if exists "founder_only" on public.coach_reports;
create policy "founder_only" on public.coach_reports
  for all using (founder_id = auth.uid());

-- Service role access for CRON jobs
drop policy if exists "coach_reports_service_role" on public.coach_reports;
create policy "coach_reports_service_role" on public.coach_reports
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists idx_coach_reports_date on public.coach_reports(report_date desc);
create index if not exists idx_coach_reports_type on public.coach_reports(coach_type, report_date desc);
create unique index if not exists idx_coach_reports_unique
  on public.coach_reports(coach_type, report_date, coalesce(business_key, '__all__'))
  where status != 'failed';

-- Auto-update updated_at on row changes
DROP TRIGGER IF EXISTS coach_reports_updated_at ON public.coach_reports;
CREATE TRIGGER coach_reports_updated_at
  BEFORE UPDATE ON public.coach_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
