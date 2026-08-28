-- Registro de addons vendidos manualmente (usuarios extra, agente
-- IA por WhatsApp) para clientes que pagan fuera del flujo automático
-- de Mercado Pago (ej. transferencia directa). Es solo un registro
-- para control comercial/facturación — hoy la cuenta sigue siendo
-- 1 usuario por empresa (no hay login de equipo) y el agente de
-- WhatsApp todavía no está construido, así que estas columnas no
-- desbloquean funcionalidad nueva por sí solas.
alter table public.companies
  add column if not exists usuarios_extra integer not null default 0
    check (usuarios_extra >= 0),
  add column if not exists agente_whatsapp boolean not null default false;
