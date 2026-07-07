-- Fase 2.1: tabla companies + RLS
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Mi Empresa',
  plan text not null default 'trial',
  created_at timestamptz not null default now()
);

create index if not exists companies_user_id_idx on public.companies (user_id);

alter table public.companies enable row level security;

create policy "companies_select_own"
  on public.companies for select
  using (auth.uid() = user_id);

create policy "companies_insert_own"
  on public.companies for insert
  with check (auth.uid() = user_id);

create policy "companies_update_own"
  on public.companies for update
  using (auth.uid() = user_id);
