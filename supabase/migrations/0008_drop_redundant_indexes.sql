-- Escalabilidad (1.000 usuarios concurrentes): estos dos índices son
-- duplicados exactos de índices que ya existen vía restricciones unique,
-- y solo agregan costo de escritura en cada insert/update de products y
-- predictions sin ningún beneficio de lectura.
--
-- products_company_id_idx: redundante con el índice que ya crea
-- `unique (company_id, sku)` en 0004 — un B-tree sobre (company_id, sku)
-- ya sirve cualquier filtro por company_id solo (regla de prefijo), y
-- de paso resuelve gratis el `order by sku` que hace el dashboard.
--
-- predictions_product_id_idx: redundante con el índice que ya crea
-- `unique (product_id)` en 0004 — es el mismo índice dos veces.
drop index if exists public.products_company_id_idx;
drop index if exists public.predictions_product_id_idx;
