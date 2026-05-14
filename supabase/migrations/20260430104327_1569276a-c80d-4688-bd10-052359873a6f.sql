-- Enum for app roles
create type public.app_role as enum ('admin', 'company');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Profiles updatable by owner"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

create policy "Profiles insertable by owner"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can read their own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can read all roles"
  on public.user_roles for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
  on public.user_roles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Companies (admin-managed registry)
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  status text not null default 'active' check (status in ('active','blocked')),
  registered_at timestamptz not null default now()
);

alter table public.companies enable row level security;

create policy "Admins manage companies"
  on public.companies for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Owner can read own company"
  on public.companies for select
  to authenticated
  using (owner_user_id = auth.uid());

-- Predictions
create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  employee_name text,
  department text,
  job_role text,
  risk_level text not null check (risk_level in ('high','medium','low')),
  confidence numeric not null,
  inputs jsonb not null default '{}'::jsonb,
  factors jsonb not null default '[]'::jsonb,
  ai_explanation text,
  created_at timestamptz not null default now()
);

alter table public.predictions enable row level security;

create policy "Users read own predictions"
  on public.predictions for select
  to authenticated
  using (user_id = auth.uid());

create policy "Admins read all predictions"
  on public.predictions for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Users insert own predictions"
  on public.predictions for insert
  to authenticated
  with check (user_id = auth.uid());

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;

  -- default role: company (admins are upgraded manually)
  insert into public.user_roles (user_id, role)
  values (new.id, 'company')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();