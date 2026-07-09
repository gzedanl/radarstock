-- Fase 4 (paso 3): rubro y comuna por empresa. El backend ML
-- (radarstock-ml) ya soporta ajustar la demanda por clima/feriados y
-- generar alertas de insumos usando estos dos campos, pero el frontend
-- nunca los capturaba ni los enviaba — quedaban sin usarse. Nullable:
-- una empresa sin rubro/comuna simplemente no recibe esos ajustes.
alter table public.companies
  add column if not exists rubro text,
  add column if not exists comuna text;
