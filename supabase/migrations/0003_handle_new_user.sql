-- Fase 2.1 (fix): crea la fila de companies vía trigger en auth.users,
-- en vez de depender del insert desde el cliente. Esto funciona sin
-- importar si la confirmación de email está activada (en ese caso el
-- signup no deja sesión activa todavía, y el insert directo desde el
-- cliente falla contra RLS).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.companies (user_id, name, plan)
  values (new.id, 'Mi Empresa', 'trial');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
