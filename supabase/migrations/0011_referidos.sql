-- Programa de referidos: cada empresa tiene un código propio para
-- compartir. Si un cliente nuevo se registra con ese código y paga su
-- primer plan (no solo se registra — evita farmear el premio con
-- cuentas trial), se genera un premio de $30.000 a favor de quien
-- refirió. El premio queda como crédito interno pendiente de aplicar
-- a mano por el equipo comercial (Mercado Pago no soporta descuentos
-- de un solo ciclo sobre una suscripción recurrente sin manipular la
-- preapproval, algo que ya vimos que conviene evitar).
alter table companies
  add column if not exists referral_code text
    generated always as (upper(substr(id::text, 1, 8))) stored,
  add column if not exists referred_by_company_id uuid
    references companies (id) on delete set null;

create unique index if not exists companies_referral_code_idx
  on companies (referral_code);

create table if not exists referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_company_id uuid not null references companies (id) on delete cascade,
  -- unique: una empresa referida solo genera un premio una vez, la
  -- primera vez que paga — reactivaciones posteriores no generan otro.
  referred_company_id uuid not null unique references companies (id) on delete cascade,
  amount_clp integer not null default 30000,
  status text not null default 'pendiente' check (status in ('pendiente', 'aplicado')),
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

alter table referral_rewards enable row level security;

create policy "select_own_referral_rewards"
  on referral_rewards for select
  using (
    referrer_company_id in (select id from companies where user_id = auth.uid())
  );

-- Actualiza el trigger de creación de empresa (0003, 0010) para
-- resolver el código de referido recibido en el signup (viaja en
-- raw_user_meta_data, seteado por supabase.auth.signUp({ options:
-- { data: { referral_code } } })) contra la empresa dueña de ese código.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  referrer_id uuid;
begin
  select id into referrer_id
  from public.companies
  where referral_code = upper(coalesce(new.raw_user_meta_data->>'referral_code', ''))
  limit 1;

  insert into public.companies (
    user_id, name, plan, trial_ends_at, referred_by_company_id
  )
  values (
    new.id, 'Mi Empresa', 'trial', now() + interval '14 days', referrer_id
  );
  return new;
end;
$$;
