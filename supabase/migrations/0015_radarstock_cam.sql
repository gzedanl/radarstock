-- RadarStock Cam — Fase 1: conteo físico de inventario por cámara,
-- comparado contra products.stock_actual (el que ya mantiene el CSV/
-- predictor). No se deriva de compras-ventas del SII: la integración
-- SII (0009+) solo trae documentos a nivel de folio, sin detalle de
-- líneas por SKU — deriva Stock Teórico = Compras-Ventas del SII
-- requeriría "Fase 2" (parseo de XML de cada DTE + reconciliación de
-- SKUs del proveedor), que queda fuera de este alcance.

-- Código de barras → producto. Un producto puede tener más de un
-- código (ej. unidad vs. caja de 12), y unidades_por_escaneo permite
-- que un solo escaneo sume más de 1 unidad de stock.
create table if not exists barcodes_map (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  codigo_barras text not null,
  unidades_por_escaneo integer not null default 1 check (unidades_por_escaneo > 0),
  created_at timestamptz not null default now(),
  unique (company_id, codigo_barras)
);

create index if not exists barcodes_map_company_id_idx on barcodes_map (company_id);
create index if not exists barcodes_map_product_id_idx on barcodes_map (product_id);

-- Una sesión de conteo físico.
create table if not exists physical_audits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  user_id uuid not null references auth.users (id),
  iniciado_en timestamptz not null default now(),
  finalizado_en timestamptz,
  estado text not null default 'en_progreso'
    check (estado in ('en_progreso', 'finalizada', 'cancelada'))
);

create index if not exists physical_audits_company_id_idx on physical_audits (company_id);

-- Cada producto contado dentro de una auditoría. stock_teorico se
-- copia de products.stock_actual al momento del conteo (no al momento
-- de cerrar la auditoría), para que la merma refleje lo que el
-- sistema creía tener cuando arrancó el conteo físico, no después.
create table if not exists audit_items (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references physical_audits (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  stock_teorico numeric not null,
  stock_contado numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (audit_id, product_id)
);

create index if not exists audit_items_audit_id_idx on audit_items (audit_id);

-- Stock real confirmado por el último conteo físico cerrado — separado
-- de stock_actual (el que reporta el CSV/ERP) para no perder de dónde
-- viene cada número. lib/refreshPredictions.ts decide cuál usar.
alter table products
  add column if not exists stock_actual_real numeric,
  add column if not exists stock_actual_real_actualizado_en timestamptz;

alter table barcodes_map enable row level security;
alter table physical_audits enable row level security;
alter table audit_items enable row level security;

create policy "barcodes_map_select_own"
  on barcodes_map for select
  using (exists (
    select 1 from companies c
    where c.id = barcodes_map.company_id and c.user_id = auth.uid()
  ));

create policy "barcodes_map_insert_own"
  on barcodes_map for insert
  with check (exists (
    select 1 from companies c
    where c.id = barcodes_map.company_id and c.user_id = auth.uid()
  ));

create policy "physical_audits_select_own"
  on physical_audits for select
  using (exists (
    select 1 from companies c
    where c.id = physical_audits.company_id and c.user_id = auth.uid()
  ));

create policy "physical_audits_insert_own"
  on physical_audits for insert
  with check (exists (
    select 1 from companies c
    where c.id = physical_audits.company_id and c.user_id = auth.uid()
  ));

create policy "physical_audits_update_own"
  on physical_audits for update
  using (exists (
    select 1 from companies c
    where c.id = physical_audits.company_id and c.user_id = auth.uid()
  ));

create policy "audit_items_select_own"
  on audit_items for select
  using (exists (
    select 1 from physical_audits pa
    join companies c on c.id = pa.company_id
    where pa.id = audit_items.audit_id and c.user_id = auth.uid()
  ));

create policy "audit_items_insert_own"
  on audit_items for insert
  with check (exists (
    select 1 from physical_audits pa
    join companies c on c.id = pa.company_id
    where pa.id = audit_items.audit_id and c.user_id = auth.uid()
  ));

create policy "audit_items_update_own"
  on audit_items for update
  using (exists (
    select 1 from physical_audits pa
    join companies c on c.id = pa.company_id
    where pa.id = audit_items.audit_id and c.user_id = auth.uid()
  ));
