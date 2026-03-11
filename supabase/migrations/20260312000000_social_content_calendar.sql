-- Migration: social_content_calendar
-- Phase 4: UNI-1517 Social OAuth + Content Calendar
-- Reuses existing social_channels table for OAuth tokens.
-- Adds business_key to social_channels and creates social_posts.

-- ============================================================
-- EXTEND social_channels: add business_key and profile columns
-- ============================================================
alter table public.social_channels
  add column if not exists business_key      text,
  add column if not exists handle            text,
  add column if not exists name              text,
  add column if not exists follower_count    integer default 0,
  add column if not exists profile_image_url text,
  add column if not exists last_synced_at    timestamptz;

-- ============================================================
-- TABLE: social_posts
-- Drafted, scheduled, and published cross-platform posts
-- ============================================================
create table if not exists public.social_posts (
  id                uuid primary key default gen_random_uuid(),
  founder_id        uuid not null references auth.users(id) on delete cascade,
  business_key      text not null,
  title             text,
  content           text not null,
  media_urls        text[]  default array[]::text[],
  platforms         text[]  not null default array[]::text[],
  status            text    not null default 'draft'
    check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  scheduled_at      timestamptz,
  published_at      timestamptz,
  platform_post_ids jsonb default '{}'::jsonb,
  error_message     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists social_channels_founder_business_idx
  on public.social_channels(founder_id, business_key);

create index if not exists social_posts_founder_id_idx
  on public.social_posts(founder_id);

create index if not exists social_posts_scheduled_idx
  on public.social_posts(scheduled_at)
  where status = 'scheduled';

create index if not exists social_posts_business_key_idx
  on public.social_posts(founder_id, business_key);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists social_posts_updated_at on public.social_posts;
create trigger social_posts_updated_at
  before update on public.social_posts
  for each row execute function public.handle_updated_at();

-- ============================================================
-- RLS: social_channels
-- ============================================================
alter table public.social_channels enable row level security;

drop policy if exists "social_channels_select" on public.social_channels;
create policy "social_channels_select" on public.social_channels
  for select using (auth.uid() = founder_id);

drop policy if exists "social_channels_insert" on public.social_channels;
create policy "social_channels_insert" on public.social_channels
  for insert with check (auth.uid() = founder_id);

drop policy if exists "social_channels_update" on public.social_channels;
create policy "social_channels_update" on public.social_channels
  for update using (auth.uid() = founder_id);

drop policy if exists "social_channels_delete" on public.social_channels;
create policy "social_channels_delete" on public.social_channels
  for delete using (auth.uid() = founder_id);

-- ============================================================
-- RLS: social_posts
-- ============================================================
alter table public.social_posts enable row level security;

drop policy if exists "social_posts_select" on public.social_posts;
create policy "social_posts_select" on public.social_posts
  for select using (auth.uid() = founder_id);

drop policy if exists "social_posts_insert" on public.social_posts;
create policy "social_posts_insert" on public.social_posts
  for insert with check (auth.uid() = founder_id);

drop policy if exists "social_posts_update" on public.social_posts;
create policy "social_posts_update" on public.social_posts
  for update using (auth.uid() = founder_id);

drop policy if exists "social_posts_delete" on public.social_posts;
create policy "social_posts_delete" on public.social_posts
  for delete using (auth.uid() = founder_id);
