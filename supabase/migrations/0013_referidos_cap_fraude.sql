-- Programa de referidos: control de fraude (revisión manual si un
-- mismo referente acumula 3+ convertidos en 30 días) + cap al 100% de
-- la factura mensual del referente con rollover del excedente a meses
-- futuros. Ver lib/referralCredit.ts para la matemática de cap/rollover
-- (vive en TypeScript, testeada con Vitest — no como función SQL, para
-- poder cubrirla con tests).

alter table referral_rewards drop constraint if exists referral_rewards_status_check;
alter table referral_rewards add constraint referral_rewards_status_check
  check (status in ('pendiente', 'revision_pendiente', 'aplicado'));

alter table referral_rewards
  add column if not exists monto_aplicado numeric not null default 0,
  add column if not exists mes_aplicacion date;

-- get_mis_referidos() (0012) solo devolvía si convirtió y el status —
-- ahora la página /referidos necesita también los montos para mostrar
-- "$X disponibles para tu próxima factura" (amount_clp - monto_aplicado
-- sumado sobre los premios en estado pendiente). Se recrea con drop +
-- create porque cambia la forma de la tabla que devuelve.
drop function if exists public.get_mis_referidos();

create function public.get_mis_referidos()
returns table (
  id uuid,
  name text,
  created_at timestamptz,
  convertido boolean,
  recompensa_status text,
  recompensa_monto integer,
  recompensa_monto_aplicado numeric
)
language sql
security definer set search_path = public
stable
as $$
  select
    c.id,
    c.name,
    c.created_at,
    (rr.id is not null) as convertido,
    rr.status as recompensa_status,
    rr.amount_clp as recompensa_monto,
    rr.monto_aplicado as recompensa_monto_aplicado
  from companies c
  left join referral_rewards rr on rr.referred_company_id = c.id
  where c.referred_by_company_id = (
    select id from companies where user_id = auth.uid()
  )
  order by c.created_at desc;
$$;

grant execute on function public.get_mis_referidos() to authenticated;
