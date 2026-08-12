-- Integración SII, Fase 1: sincronización de documentos tributarios
-- (RCV compras y ventas) a nivel de documento, vía API Gateway
-- (apigateway.cl) — mismo proveedor y patrón ya probado en producción
-- en otro proyecto (PayOrbit). Las credenciales SII (RUT + clave) nunca
-- se persisten en ninguna tabla; solo viajan en memoria durante el
-- request de sincronización (ver lib/sii.ts).
--
-- Esta fase NO incluye detalle de líneas/SKU por documento (eso
-- requiere descargar y parsear el XML de cada DTE, más un paso de
-- reconciliación contra el catálogo de productos del tenant — fase 2).
-- Sirve para auditoría de compras/ventas y como base para features
-- futuras (ej. cadencia de compra por proveedor).
create table if not exists public.sii_documentos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  tipo text not null check (tipo in ('compra', 'venta')),
  folio text not null,
  rut_contraparte text,
  razon_social_contraparte text,
  fecha_emision date,
  periodo text not null,
  monto numeric(14, 2),
  estado_sii text,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  unique (company_id, tipo, folio, periodo)
);

create index if not exists sii_documentos_company_id_idx
  on public.sii_documentos (company_id);

-- Log de cada corrida de sincronización, para mostrar historial/estado
-- en el panel y depurar sin tener que revisar logs del servidor.
create table if not exists public.sii_sincronizaciones (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  periodo text not null,
  estado text not null check (estado in ('ok', 'error')),
  compras_sincronizadas integer not null default 0,
  ventas_sincronizadas integer not null default 0,
  mensaje_error text,
  created_at timestamptz not null default now()
);

create index if not exists sii_sincronizaciones_company_id_idx
  on public.sii_sincronizaciones (company_id);

alter table public.sii_documentos enable row level security;
alter table public.sii_sincronizaciones enable row level security;

create policy "sii_documentos_select_own"
  on public.sii_documentos for select
  using (exists (
    select 1 from public.companies c
    where c.id = sii_documentos.company_id and c.user_id = auth.uid()
  ));

create policy "sii_documentos_insert_own"
  on public.sii_documentos for insert
  with check (exists (
    select 1 from public.companies c
    where c.id = sii_documentos.company_id and c.user_id = auth.uid()
  ));

-- Necesaria para que el upsert (re-sincronizar un período ya cargado)
-- funcione bajo RLS: un upsert con conflicto es un insert + update.
create policy "sii_documentos_update_own"
  on public.sii_documentos for update
  using (exists (
    select 1 from public.companies c
    where c.id = sii_documentos.company_id and c.user_id = auth.uid()
  ));

create policy "sii_sincronizaciones_select_own"
  on public.sii_sincronizaciones for select
  using (exists (
    select 1 from public.companies c
    where c.id = sii_sincronizaciones.company_id and c.user_id = auth.uid()
  ));

create policy "sii_sincronizaciones_insert_own"
  on public.sii_sincronizaciones for insert
  with check (exists (
    select 1 from public.companies c
    where c.id = sii_sincronizaciones.company_id and c.user_id = auth.uid()
  ));
