-- Bug: handle_new_user() (0003) nunca seteaba trial_ends_at, así que
-- isTrialExpired() (que exige !!trialEndsAt) siempre daba false — el
-- bloqueo de trial vencido del PR #28 nunca se activaba para clientes
-- reales, solo en pruebas donde se seteó la columna a mano.
--
-- Se decidió un trial de 14 días.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.companies (user_id, name, plan, trial_ends_at)
  values (new.id, 'Mi Empresa', 'trial', now() + interval '14 days');
  return new;
end;
$$;

-- Backfill: empresas ya existentes en trial que quedaron sin fecha de
-- vencimiento. Se les da un trial de 14 días completo a partir de hoy
-- (no desde su created_at original) para no cortarle el acceso de
-- golpe a nadie que esté evaluando el producto ahora mismo.
update public.companies
set trial_ends_at = now() + interval '14 days'
where plan = 'trial' and trial_ends_at is null;
