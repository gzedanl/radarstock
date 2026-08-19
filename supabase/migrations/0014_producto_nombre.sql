-- Nombre de producto opcional en el CSV — para una PYME es más fácil
-- reconocer "Jamón Serrano 100g" que un SKU. Si no viene, se sigue
-- mostrando el SKU (fallback en la UI, no acá).
alter table products
  add column if not exists nombre text;
