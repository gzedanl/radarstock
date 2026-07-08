# Pre-Fase 4 — Qué cerrar antes de seguir avanzando

**Estado: P0, P1 y P2.2/P2.3 implementados y con las migraciones
`0005`/`0006` ya aplicadas en producción (2026-07-08). P2.1
(multi-ubicación) queda diferido, según su propia recomendación más
abajo.**

Estado al 2026-07-08. Este documento junta dos fuentes: los pendientes que
ya habíamos identificado al cerrar la Fase 3 (ver `docs/ARQUITECTURA.md`,
sección 7) y los gaps que salieron de comparar RadarStock contra Netstock
(competidor de referencia en planificación de inventario). El objetivo es
decidir qué se cierra **antes** de arrancar Fase 4, en vez de acumular deuda
sobre una base que todavía tiene huecos visibles para el usuario.

Criterio de priorización: P0 son cosas que ya están rotas o mienten al
usuario (se arreglan sí o sí); P1 son mejoras de alto impacto y bajo costo
que se apoyan 100% en lo que ya existe; P2 son mejoras reales pero de mayor
alcance, donde vale la pena decidir a propósito si van antes o después de
Fase 4.

---

## P0 — Arreglar antes que nada

### ✅ P0.1 — KPIs del dashboard hardcodeados incluso con datos reales

**Problema:** en `app/dashboard/page.tsx`, el array `KPIS` fija
`"Valor de inventario": "$18.4M CLP"` y `"Precisión de predicción": "91%"`
sin importar si la empresa tiene productos reales cargados. Solo "SKUs en
riesgo" se calcula de verdad (`hasRealData ? String(skusEnRiesgo) : "3"`).
Un usuario real con su propio CSV cargado ve números de demo mezclados con
sus datos reales — esto no es una feature pendiente, es información falsa
mostrada como si fuera real.

**Propuesta:**
- "Valor de inventario": requiere precio unitario, que hoy no se captura en
  el CSV (`lib/csvProducts.ts` solo lee `sku`, `stock`, columnas de fecha).
  Opción rápida: sumar `stock_actual` como "unidades en inventario" en vez
  de un valor en CLP inventado, hasta que exista un campo de precio.
- "Precisión de predicción": no hay ground truth para calcularla todavía
  (necesitaría comparar predicciones pasadas contra ventas reales
  posteriores). Sacarla del dashboard mientras no exista el cálculo, en vez
  de mostrar un número inventado.
- Mientras no haya datos reales, seguir mostrando el estado demo pero
  **etiquetado explícitamente como demo** (ya existe el patrón en el texto
  de arriba: "Vista demo con datos de ejemplo").

**Esfuerzo:** S. **Archivos:** `app/dashboard/page.tsx`.

**Implementado:** con datos reales, los KPIs son "SKUs en riesgo",
"Unidades en inventario" (suma de `stock_actual`) y "SKUs monitoreados" —
los tres calculados de verdad. "Precisión de predicción" se sacó (no hay
ground truth para calcularla todavía). En modo demo se mantienen los
valores de ejemplo, pero cada card ahora muestra una etiqueta "Demo".

---

## P1 — Quick wins de alto impacto

Estos se apoyan en cálculos que ya existen (`predictPlaceholder.ts`,
`refreshPredictions.ts`, tabla `predictions`) — no requieren cambios de
esquema ni nuevas integraciones.

### ✅ P1.1 — Umbral de riesgo configurable

**Problema:** `calcRiesgo()` en `app/dashboard/page.tsx` fija el corte de
riesgo en 5 y 14 días para todos los productos de todas las empresas. Un
negocio con proveedores locales (reposición en 2 días) y uno con
importación (reposición en 45 días) necesitan umbrales distintos, y hoy no
hay forma de ajustarlo.

**Propuesta:**
- Agregar `dias_alerta_alto` / `dias_alerta_medio` a `companies` (default
  5/14, para no romper el comportamiento actual).
- Un control simple en `/dashboard` o `/billing` para editarlos.
- `calcRiesgo()` pasa a leer esos valores en vez de la constante fija.

**Esfuerzo:** M (migración + UI + query). **Archivos:**
`supabase/migrations/`, `app/dashboard/page.tsx`, nuevo componente de
configuración.

**Implementado:** `supabase/migrations/0005_risk_thresholds.sql` agrega
`dias_alerta_alto`/`dias_alerta_medio` a `companies` (default 5/14, no
rompe nada existente). `app/dashboard/actions.ts` expone la server action
`updateRiskThresholds`, y `components/RiskThresholdSettings.tsx` es el
formulario para editarlos desde el dashboard. `calcRiesgo()` ahora recibe
los umbrales de la empresa en vez de la constante fija.

### ✅ P1.2 — Exportar la reposición sugerida

**Problema:** `predictions.cantidad_sugerida` ya se calcula por SKU (vía ML
o el placeholder), pero no hay forma de sacar esa información del
dashboard. El usuario tendría que copiar a mano fila por fila para armar un
pedido a su proveedor.

**Propuesta:** botón "Exportar reposición" en `ProductTable.tsx` que baje
un CSV con `sku, stock_actual, cantidad_sugerida, dias_hasta_quiebre` de
los productos con riesgo alto/medio — listo para mandarlo a un proveedor o
pegarlo en Excel.

**Esfuerzo:** S. **Archivos:** `components/ProductTable.tsx`, o un endpoint
nuevo `app/api/products/export`.

**Implementado:** botón "Exportar reposición" en `ProductTable.tsx`
(ahora client component), genera el CSV en el navegador a partir de los
productos con riesgo alto/medio — sin endpoint nuevo.

### ✅ P1.3 — Dashboard "exception-first"

**Problema:** `ProductTable` lista todos los SKUs sin priorizar. Con 50+
SKUs cargados, encontrar los 3 que realmente necesitan atención hoy
requiere escanear toda la tabla.

**Propuesta:** ordenar por defecto por riesgo (alto → medio → bajo) y por
`dias_hasta_quiebre` ascendente dentro de cada grupo; agregar un resumen
arriba de la tabla tipo "3 SKUs en riesgo alto — revisa estos primero" con
link de scroll a la tabla ya filtrada. No requiere UI nueva compleja, es
ordenar + un resumen.

**Esfuerzo:** S. **Archivos:** `app/dashboard/page.tsx`,
`components/ProductTable.tsx`.

**Implementado:** `app/dashboard/page.tsx` ordena los productos por
riesgo (alto → medio → bajo) y luego por `dias_hasta_quiebre` ascendente,
y muestra un resumen "N SKUs en riesgo alto — revísalos primero" arriba
de la tabla.

---

## P2 — Mayor alcance, decidir a propósito

Estos sí valen la pena, pero cambian el modelo de datos o agregan un
concepto nuevo. Recomendación: **evaluar caso a caso si bloquean Fase 4 o
si pueden ir en paralelo/después**, no meterlos todos a la fuerza antes de
avanzar.

### P2.1 — Multi-ubicación (bodega/sucursal)

**Problema:** `products.stock_actual` es un solo número. Cualquier PYME con
más de un local u bodega no puede representar su inventario real hoy —
tiene que sumar todo en un solo número, perdiendo la info de dónde está
cada unidad.

**Propuesta:** agregar `location` a `products` (o una tabla
`product_stock_by_location`), y que el CSV acepte una columna opcional de
ubicación. El cálculo de riesgo seguiría siendo por SKU total, pero el
detalle por ubicación se muestra en la tabla.

**Esfuerzo:** L — toca el esquema, el parser de CSV, el upload, el
dashboard y las predicciones. **Recomendación:** evaluar cuántos usuarios
reales lo piden antes de invertir aquí; no es bloqueante para Fase 4.

### ✅ P2.2 — Lead time de proveedor en el cálculo de riesgo

**Problema:** `dias_hasta_quiebre` (tanto en `predictPlaceholder.ts` como
lo que devuelva el servicio ML) no descuenta cuánto demora reponer stock.
Un producto con 10 días hasta el quiebre y un proveedor que demora 15 días
en entregar está en riesgo real hoy, pero el sistema lo muestra como
"riesgo bajo".

**Propuesta:** agregar `lead_time_dias` a `products` (opcional, default 0
para no romper nada), y que el riesgo se calcule sobre
`dias_hasta_quiebre - lead_time_dias` en vez de solo `dias_hasta_quiebre`.

**Esfuerzo:** M. **Archivos:** migración, `lib/csvProducts.ts`,
`app/dashboard/page.tsx`. **Recomendación:** este es el gap más importante
de los P2 — el cálculo actual puede estar subestimando el riesgo real de
forma sistemática. Vale la pena priorizarlo por delante de multi-ubicación.

**Implementado:** `supabase/migrations/0006_product_lead_time.sql` agrega
`lead_time_dias` a `products` (default 0). `lib/csvProducts.ts` acepta una
columna opcional `lead_time` / `lead_time_dias` / `tiempo_entrega`. El
riesgo en `app/dashboard/page.tsx` se calcula sobre
`dias_hasta_quiebre - lead_time_dias`; la columna de la tabla sigue
mostrando el día de quiebre real, sin ajustar, para no confundir.

### ✅ P2.3 — What-if simple sobre el gráfico

**Problema:** `PredictionChart` muestra base/optimista/pesimista fijos
(±15% hardcodeado en `lib/buildChartData.ts`). No hay forma de que el
usuario pruebe "¿qué pasa si vendo 30% más por una promoción?".

**Propuesta:** un slider sobre el gráfico existente que multiplique la
proyección en el cliente (sin tocar el backend) — pura UI sobre datos que
ya están en pantalla.

**Esfuerzo:** S/M. **Archivos:** `components/PredictionChart.tsx`.
**Recomendación:** bajo costo, pero de menor impacto que P1 — puede ir
después de Fase 4 sin problema.

**Implementado:** `PredictionChart.tsx` agrega un slider (0.5x–1.5x) que
escala en el cliente solo los puntos futuros (`real === null`) de
base/optimista/pesimista — no toca el backend ni el modelo.

---

## Ya identificado (de `docs/ARQUITECTURA.md`, sección 7) — no duplicar

Estos siguen pendientes y no se repiten en detalle acá:

- Backend ML real (`radarstock-ml/`) desplegado — `lib/mlService.ts` ya
  está listo para consumirlo.
- Señales externas (clima, feriados, commodities) — hoy solo en el copy de
  marketing de la landing.
- Alertas por WhatsApp — anunciadas en `lib/plans.ts`, sin integración.
- Crons: `sendTrialEndingEmail` sin llamar, y recálculo periódico de
  predicciones vía `POST /api/predictions`.
- Gestión de suscripción en `/billing` (cancelar, cambiar de plan).

## Fuera de alcance por ahora

- **Integraciones a ERPs** (lo que hace fuerte a Netstock): contradice el
  diferenciador actual de RadarStock ("sin ERP, self-service el mismo
  día"). Tiene sentido solo si en el futuro se apunta a empresas más
  grandes que ya usan un ERP — no antes de Fase 4.
- **Clasificación ABC/XYZ de SKUs**: útil pero depende de tener valor
  unitario por producto (mismo bloqueo que el KPI de "valor de
  inventario" en P0.1) — retomar junto con eso.

---

## Secuencia recomendada

1. ~~**P0.1** — arreglar los KPIs falsos~~ ✅
2. ~~**P1.1, P1.2, P1.3**~~ ✅
3. ~~**P2.2** (lead time)~~ ✅ — se adelantó también **P2.3** (what-if),
   por ser independiente y de bajo costo.
4. ~~Correr las migraciones `0005` y `0006` en Supabase~~ ✅ — aplicadas
   en producción el 2026-07-08.
5. Recién ahí, Fase 4.
6. **P2.1** (multi-ubicación) queda diferido — evaluar con feedback de
   usuarios reales una vez que haya tráfico, no bloquea Fase 4.
