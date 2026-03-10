create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'candidate' check (role in ('admin', 'hr', 'candidate')),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  company text not null,
  description text not null,
  salary_min integer,
  salary_max integer,
  location text,
  sphere text check (sphere in ('it','design','marketing','finance','hr','sales','legal','other')),
  experience_level text check (experience_level in ('junior','middle','senior','lead','any')),
  job_type text check (job_type in ('full-time','part-time','contract','freelance','internship')),
  format text check (format in ('remote','office','hybrid')),
  contract_type text check (contract_type in ('trud','gph','ip','selfemployed')),
  skills text[] default '{}',
  tags text[] default '{}',
  contact text,
  created_by uuid references public.users(id) on delete set null,
  visible boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  title text not null,
  bio text,
  sphere text check (sphere in ('it','design','marketing','finance','hr','sales','legal','other')),
  skills text[] default '{}',
  experience_years integer default 0,
  portfolio text,
  location text,
  expected_salary integer,
  format text check (format in ('remote','office','hybrid','any')),
  visible boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id integer primary key default 1 check (id = 1),
  telegram_autopost_enabled boolean not null default false,
  header_enabled boolean not null default true
);

insert into public.settings (id, telegram_autopost_enabled, header_enabled)
values (1, false, true) on conflict (id) do nothing;

-- RLS
alter table public.users    enable row level security;
alter table public.jobs     enable row level security;
alter table public.resumes  enable row level security;
alter table public.settings enable row level security;

create policy "users_select_own"   on public.users for select  using (auth.uid() = id);
create policy "users_update_own"   on public.users for update  using (auth.uid() = id);
create policy "jobs_select_visible" on public.jobs for select  using (visible = true);
create policy "jobs_select_own"    on public.jobs for select   using (auth.uid() = created_by);
create policy "jobs_insert_hr"     on public.jobs for insert   with check (auth.uid() = created_by and exists (select 1 from public.users where id = auth.uid() and role in ('hr','admin')));
create policy "jobs_update_own"    on public.jobs for update   using (auth.uid() = created_by);
create policy "jobs_admin_all"     on public.jobs for all      using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "resumes_select_vis" on public.resumes for select using (visible = true);
create policy "resumes_select_own" on public.resumes for select using (auth.uid() = user_id);
create policy "resumes_insert_own" on public.resumes for insert with check (auth.uid() = user_id);
create policy "resumes_update_own" on public.resumes for update using (auth.uid() = user_id);
create policy "resumes_admin_all"  on public.resumes for all   using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "settings_admin"     on public.settings for all  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
create policy "settings_read_auth" on public.settings for select using (auth.role() = 'authenticated');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role','candidate'));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

create index if not exists idx_jobs_visible    on public.jobs(visible);
create index if not exists idx_jobs_created_by on public.jobs(created_by);
create index if not exists idx_jobs_sphere     on public.jobs(sphere);
create index if not exists idx_jobs_created_at on public.jobs(created_at desc);
create index if not exists idx_resumes_visible on public.resumes(visible);
create index if not exists idx_resumes_user_id on public.resumes(user_id);
