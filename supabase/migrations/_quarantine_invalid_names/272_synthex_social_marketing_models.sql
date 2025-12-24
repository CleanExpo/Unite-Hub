-- 272_synthex_social_marketing_models.sql
-- Social playbooks, decision moments, and visual inspiration models for Synthex.social

begin;

-- SOCIAL PLAYBOOKS
create table if not exists public.social_playbooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.contacts(id) on delete set null,
  name text not null,
  description text,
  primary_goal text,
  primary_persona text,
  platforms text[] default '{}',
  status text not null default 'draft', -- draft | active | archived
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_social_playbooks_workspace
  on public.social_playbooks(workspace_id);

create index if not exists idx_social_playbooks_client
  on public.social_playbooks(client_id);

-- SOCIAL ASSETS
create table if not exists public.social_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  playbook_id uuid not null references public.social_playbooks(id) on delete cascade,
  platform text not null, -- youtube | tiktok | instagram | facebook | linkedin | shorts | reels
  asset_type text not null, -- video | image | carousel | script | caption | thumbnail
  title text,
  hook text,
  script_outline text,
  thumbnail_concept text,
  metadata jsonb default '{}'::jsonb,
  status text not null default 'draft',
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_social_assets_playbook
  on public.social_assets(playbook_id);

create index if not exists idx_social_assets_workspace_platform
  on public.social_assets(workspace_id, platform);

-- DECISION MOMENT MAPS
create table if not exists public.decision_moment_maps (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  client_id uuid references public.contacts(id) on delete set null,
  name text not null,
  description text,
  funnel_stage text not null default 'full', -- full | awareness | consideration | conversion | retention
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_decision_moment_maps_workspace
  on public.decision_moment_maps(workspace_id);

-- DECISION ASSETS
create table if not exists public.decision_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  map_id uuid not null references public.decision_moment_maps(id) on delete cascade,
  moment_key text not null, -- e.g. awareness_problem, consideration_comparison, etc.
  problem_statement text,
  objection text,
  required_proof text,
  recommended_asset_type text,
  linked_asset_id uuid references public.social_assets(id) on delete set null,
  channel text, -- email | social | landing_page | ad | sms
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_decision_assets_map
  on public.decision_assets(map_id);

-- VISUAL DEMO ENTRIES
create table if not exists public.visual_demo_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  slug text not null unique,
  title text not null,
  category text not null, -- hero | section | card | gallery | social
  persona text, -- trade | agency | consultant | etc.
  description text,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_visual_demo_entries_category
  on public.visual_demo_entries(category);

create index if not exists idx_visual_demo_entries_persona
  on public.visual_demo_entries(persona);

-- MARKETING FUNNEL BLUEPRINTS
create table if not exists public.marketing_funnel_blueprints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  template_type text not null, -- lead_gen | nurture | launch | evergreen
  stages jsonb not null default '[]'::jsonb,
  persona text,
  industry text,
  is_template boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_marketing_funnel_blueprints_workspace
  on public.marketing_funnel_blueprints(workspace_id);

-- BASIC RLS (workspace isolation)
alter table public.social_playbooks enable row level security;
alter table public.social_assets enable row level security;
alter table public.decision_moment_maps enable row level security;
alter table public.decision_assets enable row level security;
alter table public.visual_demo_entries enable row level security;
alter table public.marketing_funnel_blueprints enable row level security;

-- RLS Policies for social_playbooks
create policy "social_playbooks_select" on public.social_playbooks
  for select using (auth.uid() is not null);

create policy "social_playbooks_insert" on public.social_playbooks
  for insert with check (auth.uid() is not null);

create policy "social_playbooks_update" on public.social_playbooks
  for update using (auth.uid() is not null);

create policy "social_playbooks_delete" on public.social_playbooks
  for delete using (auth.uid() is not null);

-- RLS Policies for social_assets
create policy "social_assets_select" on public.social_assets
  for select using (auth.uid() is not null);

create policy "social_assets_insert" on public.social_assets
  for insert with check (auth.uid() is not null);

create policy "social_assets_update" on public.social_assets
  for update using (auth.uid() is not null);

create policy "social_assets_delete" on public.social_assets
  for delete using (auth.uid() is not null);

-- RLS Policies for decision_moment_maps
create policy "decision_moment_maps_select" on public.decision_moment_maps
  for select using (auth.uid() is not null);

create policy "decision_moment_maps_insert" on public.decision_moment_maps
  for insert with check (auth.uid() is not null);

create policy "decision_moment_maps_update" on public.decision_moment_maps
  for update using (auth.uid() is not null);

create policy "decision_moment_maps_delete" on public.decision_moment_maps
  for delete using (auth.uid() is not null);

-- RLS Policies for decision_assets
create policy "decision_assets_select" on public.decision_assets
  for select using (auth.uid() is not null);

create policy "decision_assets_insert" on public.decision_assets
  for insert with check (auth.uid() is not null);

create policy "decision_assets_update" on public.decision_assets
  for update using (auth.uid() is not null);

create policy "decision_assets_delete" on public.decision_assets
  for delete using (auth.uid() is not null);

-- RLS Policies for visual_demo_entries (public read for gallery)
create policy "visual_demo_entries_select" on public.visual_demo_entries
  for select using (true);

create policy "visual_demo_entries_insert" on public.visual_demo_entries
  for insert with check (auth.uid() is not null);

create policy "visual_demo_entries_update" on public.visual_demo_entries
  for update using (auth.uid() is not null);

create policy "visual_demo_entries_delete" on public.visual_demo_entries
  for delete using (auth.uid() is not null);

-- RLS Policies for marketing_funnel_blueprints
create policy "marketing_funnel_blueprints_select" on public.marketing_funnel_blueprints
  for select using (auth.uid() is not null);

create policy "marketing_funnel_blueprints_insert" on public.marketing_funnel_blueprints
  for insert with check (auth.uid() is not null);

create policy "marketing_funnel_blueprints_update" on public.marketing_funnel_blueprints
  for update using (auth.uid() is not null);

create policy "marketing_funnel_blueprints_delete" on public.marketing_funnel_blueprints
  for delete using (auth.uid() is not null);

-- Updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add update triggers
create trigger update_social_playbooks_updated_at
  before update on public.social_playbooks
  for each row execute function public.update_updated_at_column();

create trigger update_social_assets_updated_at
  before update on public.social_assets
  for each row execute function public.update_updated_at_column();

create trigger update_decision_moment_maps_updated_at
  before update on public.decision_moment_maps
  for each row execute function public.update_updated_at_column();

create trigger update_decision_assets_updated_at
  before update on public.decision_assets
  for each row execute function public.update_updated_at_column();

create trigger update_visual_demo_entries_updated_at
  before update on public.visual_demo_entries
  for each row execute function public.update_updated_at_column();

create trigger update_marketing_funnel_blueprints_updated_at
  before update on public.marketing_funnel_blueprints
  for each row execute function public.update_updated_at_column();

commit;
