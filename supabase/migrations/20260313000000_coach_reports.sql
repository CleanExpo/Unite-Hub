-- Coach Reports schema for Macro Coaches (UNI-1510)
-- Stores AI-generated coaching briefs from Revenue, Build, Marketing, and Life coaches.

create table public.coach_reports (
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
create policy "founder_only" on public.coach_reports
  for all using (founder_id = auth.uid());

create index idx_coach_reports_date on public.coach_reports(report_date desc);
create index idx_coach_reports_type on public.coach_reports(coach_type, report_date desc);
create unique index idx_coach_reports_unique
  on public.coach_reports(coach_type, report_date, coalesce(business_key, '__all__'))
  where status != 'failed';
