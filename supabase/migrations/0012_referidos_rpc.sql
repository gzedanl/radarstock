-- 0011 solo dejaba a cada empresa ver su propia fila (companies_select_own),
-- así que un `select ... from companies where referred_by_company_id = X`
-- desde el cliente no devolvía nada para las empresas referidas por otro.
-- Esta función corre con privilegios del dueño (bypasea RLS) pero solo
-- expone los campos necesarios para la página /referidos — no toda la
-- fila de la empresa referida (plan, trial_ends_at, etc. quedan ocultos).
create or replace function public.get_mis_referidos()
returns table (
  id uuid,
  name text,
  created_at timestamptz,
  convertido boolean,
  recompensa_status text
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
    rr.status as recompensa_status
  from companies c
  left join referral_rewards rr on rr.referred_company_id = c.id
  where c.referred_by_company_id = (
    select id from companies where user_id = auth.uid()
  )
  order by c.created_at desc;
$$;

grant execute on function public.get_mis_referidos() to authenticated;
