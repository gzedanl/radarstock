-- Pre-Fase 4 (P1.1): umbral de riesgo configurable por empresa, en vez
-- de los 5/14 días fijos que tenía calcRiesgo() en el dashboard.
alter table public.companies
  add column if not exists dias_alerta_alto integer not null default 5,
  add column if not exists dias_alerta_medio integer not null default 14;
