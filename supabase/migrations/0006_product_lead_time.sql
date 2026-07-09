-- Pre-Fase 4 (P2.2): lead time de reposición por producto, para que el
-- cálculo de riesgo descuente cuánto demora reponer stock y no solo
-- cuántos días quedan hasta el quiebre físico. Default 0 para no
-- cambiar el comportamiento de productos ya cargados.
alter table public.products
  add column if not exists lead_time_dias integer not null default 0;
