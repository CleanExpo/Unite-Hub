-- Phase E3: Permission Matrix & Policy Registry

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  created_at timestamptz default now()
);

create table if not exists role_permissions (
  role_id uuid references roles(id) on delete cascade,
  permission_id uuid references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists role_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  role_id uuid references roles(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz default now()
);

alter table roles enable row level security;
alter table role_assignments enable row level security;

drop policy if exists "tenant_can_see_own_roles" on roles;
create policy "tenant_can_see_own_roles" on roles
  for select using (auth.uid() is not null);

drop policy if exists "tenant_can_manage_roles" on roles;
create policy "tenant_can_manage_roles" on roles
  for all using (true) with check (true);

drop policy if exists "tenant_can_manage_role_assignments" on role_assignments;
create policy "tenant_can_manage_role_assignments" on role_assignments
  for all using (true) with check (true);
