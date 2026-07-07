-- Fase 2.2: modelo de planes
alter table public.companies
  add column if not exists plan_status text not null default 'active',
  add column if not exists mp_preapproval_id text,
  add column if not exists trial_ends_at timestamptz;
