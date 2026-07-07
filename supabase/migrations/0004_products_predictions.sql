-- Fase 2.5: productos y predicciones (placeholder), con RLS por empresa.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  sku text not null,
  stock_actual numeric not null default 0,
  ventas_historicas jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (company_id, sku)
);

create index if not exists products_company_id_idx on public.products (company_id);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  dias_hasta_quiebre integer,
  cantidad_sugerida integer,
  escenario text not null default 'base',
  generated_at timestamptz not null default now(),
  unique (product_id)
);

create index if not exists predictions_product_id_idx on public.predictions (product_id);

alter table public.products enable row level security;
alter table public.predictions enable row level security;

create policy "products_select_own"
  on public.products for select
  using (exists (
    select 1 from public.companies c
    where c.id = products.company_id and c.user_id = auth.uid()
  ));

create policy "products_insert_own"
  on public.products for insert
  with check (exists (
    select 1 from public.companies c
    where c.id = products.company_id and c.user_id = auth.uid()
  ));

create policy "products_update_own"
  on public.products for update
  using (exists (
    select 1 from public.companies c
    where c.id = products.company_id and c.user_id = auth.uid()
  ));

create policy "products_delete_own"
  on public.products for delete
  using (exists (
    select 1 from public.companies c
    where c.id = products.company_id and c.user_id = auth.uid()
  ));

create policy "predictions_select_own"
  on public.predictions for select
  using (exists (
    select 1 from public.products p
    join public.companies c on c.id = p.company_id
    where p.id = predictions.product_id and c.user_id = auth.uid()
  ));

create policy "predictions_insert_own"
  on public.predictions for insert
  with check (exists (
    select 1 from public.products p
    join public.companies c on c.id = p.company_id
    where p.id = predictions.product_id and c.user_id = auth.uid()
  ));

create policy "predictions_update_own"
  on public.predictions for update
  using (exists (
    select 1 from public.products p
    join public.companies c on c.id = p.company_id
    where p.id = predictions.product_id and c.user_id = auth.uid()
  ));

create policy "predictions_delete_own"
  on public.predictions for delete
  using (exists (
    select 1 from public.products p
    join public.companies c on c.id = p.company_id
    where p.id = predictions.product_id and c.user_id = auth.uid()
  ));
