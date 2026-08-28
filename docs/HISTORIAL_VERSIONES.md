# RadarStock — Historial de versiones

Registro cronológico de todo lo construido en `radarstock` (frontend +
backend-for-frontend) y `radarstock-ml` (servicio de predicción), desde
el commit inicial hasta hoy. Reconstruido a partir del log de commits
real de ambos repos (`git log`), no de memoria — las fechas y números
de PR son los que quedaron en git/GitHub.

Este documento es el **qué y cuándo**. Para el **cómo** (arquitectura,
modelo de datos, decisiones de diseño) ver `ARQUITECTURA.md`; para el
plan Corporate en detalle, `PLAN_CORPORATE.md`; para el roadmap
pre-Fase 4 ítem por ítem, `ROADMAP_PRE_FASE_4.md`.

---

## v1.0 — MVP inicial (2026-07-06)

**Commit:** `50eb0dc` — *Initial commit: RadarStock MVP (Fases 1-3)*

Primera versión funcional completa, en un solo commit:

- **Fase 1 — Landing + dashboard demo:** landing con hero animado
  (`RadarHero`, radar SVG con barrido y blips), sección de problema,
  cómo funciona, contexto externo, comparación vs. ERP, pricing. Dashboard
  con KPIs, gráfico de predicción (Recharts) y tabla de productos por
  riesgo — con datos demo hardcodeados.
- **Fase 2 — Auth, empresas y planes:** signup/login/logout vía Supabase
  Auth con server actions; tabla `companies` (1 fila por usuario, creada
  por trigger en `auth.users` para sobrevivir la confirmación de email)
  con RLS; catálogo de planes (Starter/Growth/Enterprise); suscripciones
  recurrentes vía Mercado Pago Preapproval API con verificación HMAC-SHA256
  del webhook; emails transaccionales (SendGrid) que nunca rompen el
  flujo si fallan; persistencia real de productos y predicciones
  (parseo de CSV ancho, upsert con truncado por límite de plan).
- **Fase 3 — Integración ML:** cliente HTTP hacia `radarstock-ml` con
  timeout de 8s y fallback a un cálculo placeholder si el servicio no
  responde — nunca se deja caer una predicción.

## v1.1 — Roadmap pre-Fase 4 + Fase 4 completa (2026-07-09, mañana)

**Commit:** `11defbe` — *Documentación de arquitectura + roadmap y mejoras pre-Fase 4*

Un solo commit que documenta y resuelve, de una vez, lo priorizado
antes de pasar a Fase 4 (ver `ROADMAP_PRE_FASE_4.md`):

- **P0.1** — reemplaza los KPIs hardcodeados del dashboard por valores
  reales (o demo marcados explícitamente como tal).
- **P1.1** — umbral de riesgo configurable por empresa (antes fijo en
  5/14 días).
- **P1.2** — exportar la reposición sugerida a CSV.
- **P1.3** — dashboard exception-first (ordenado por riesgo, no por SKU).
- **P2.2** — lead time de proveedor descontado en el cálculo de riesgo.
- **P2.3** — slider what-if en el gráfico de predicción.

Seguido, en la misma jornada, por la Fase 4 propiamente tal:

| Commit | Qué |
|---|---|
| `1396f33` | Captura `rubro`/`comuna` por empresa y los conecta al servicio ML (ajustes de demanda por clima/feriados/insumos que ya existían en `radarstock-ml` pero nunca se activaban) |
| `8a2f8a7` | Cron diario de alertas de stock por email (`lib/risk.ts` extraído para que el cron y el dashboard usen exactamente el mismo cálculo) |
| `e073e90` | Cron diario de recálculo de predicciones |
| `48d4062` | Keep-alive del servicio ML movido de GitHub Actions (nunca disparó solo) a Vercel Cron |
| `18ebdc6` | Cancelación de suscripción en `/billing` |
| `ab240f5` | `ARQUITECTURA.md` actualizado con el detalle completo de Fase 4 |
| `c6de505` | Domain Authentication de SendGrid resuelto (SPF/DKIM vía DNS de SiteGround) — mejora entregabilidad de emails |

## v1.2 — Repricing, seguridad, Next.js 15 y SEO/GEO (2026-07-09, tarde)

| Commit | Qué |
|---|---|
| `63b3c25` | Rebaja de precios con recálculo de unit-economics, y traspaso explícito de IVA + comisión de Mercado Pago al precio final (`lib/plans.ts`: `priceNetoClp` → `getPriceConIva()` → `getPriceMercadoPago()`) |
| `ecff8c6` | Hardening de seguridad: comparaciones de secretos en tiempo constante (`crypto.timingSafeEqual`), escape de HTML en emails con datos del usuario |
| `a43c518` | Migración a Next.js 15.5.20 + React 19 (resuelve todos los CVEs de la rama 14.x sin necesidad de saltar a Next 16); adopción correcta de las Dynamic APIs async (`cookies()`, `searchParams`) |
| `19b9587` | Fundamentos de SEO/GEO: metadata completa, imagen OG generada a medida, `sitemap.ts`, `robots.ts`, JSON-LD `SoftwareApplication`, `llms.txt` |

## v1.3 — Plan Corporate, pulido de landing y Ley 21.719 (2026-07-09, noche)

| PR | Qué |
|---|---|
| [#13](https://github.com/gzedanl/radarstock/pull/13) | Plan Corporate: sin Mercado Pago, formulario "Conversemos" que manda un lead por email a `comercial@radarstock.cl` (`CorporatePlanCard`, `app/api/contact-sales`, honeypot + validación) |
| [#14](https://github.com/gzedanl/radarstock/pull/14) | Fix: los CTAs de la landing llevaban a `/login` en vez de `/signup` para visitantes sin cuenta (`/dashboard` está detrás de auth, no hay demo pública) |
| [#15](https://github.com/gzedanl/radarstock/pull/15) | Captura real del dashboard (no ilustración) agregada a la landing, con marco de navegador |
| [#16](https://github.com/gzedanl/radarstock/pull/16) | Fix: superposición del header en mobile (≤390px) |
| [#17](https://github.com/gzedanl/radarstock/pull/17) | `PLAN_CORPORATE.md`: comparación feature-por-feature de los 4 planes, qué está construido vs. no, y rango de precio objetivo |
| [#18](https://github.com/gzedanl/radarstock/pull/18) | Cumplimiento Ley 21.719: `/privacidad`, `/terminos`, checkbox de consentimiento en signup y en el formulario Corporate (validado también server-side) |

## v1.4 — Escalabilidad para 1.000 usuarios concurrentes (2026-07-14)

Auditoría de escalabilidad (detección de cuellos de botella) seguida de
los dos fixes de mayor prioridad, en ambos repos:

| Repo | PR | Qué |
|---|---|---|
| `radarstock-ml` | [#3](https://github.com/gzedanl/radarstock-ml/pull/3) | Cache de predicciones por SKU (TTL 6h) — evita reentrenar Prophet/LSTM desde cero en reintentos o recálculos sobre datos sin cambios |
| `radarstock-ml` | [#4](https://github.com/gzedanl/radarstock-ml/pull/4) | Cola de predicciones (Redis + RQ): `/predict` encola y responde `202` de inmediato en vez de bloquear entrenando; un worker aparte (`worker.py`) procesa y escribe el resultado directo en Supabase — escalar el cómputo pesado es correr más workers |
| `radarstock` | [#19](https://github.com/gzedanl/radarstock/pull/19) | Límite de concurrencia (`mapWithConcurrency`, máx. 5 en vuelo) en las llamadas al servicio ML, más `maxDuration=300` en las rutas que antes no lo tenían |
| `radarstock` | [#20](https://github.com/gzedanl/radarstock/pull/20) | Integración de la cola del lado de Next.js (`callMlPredict` tri-estado: sync/queued/unavailable) + eliminación de 2 índices de Postgres duplicados |

Verificado end-to-end contra un Redis real levantado para la ocasión
(no solo mockeado) — ver el detalle técnico en el PR #4.

## v1.5 — Auditoría de seguridad Supabase (sin cambios de código)

Auditoría completa a pedido: RLS habilitado y policies en las 3 tablas
(`companies`, `products`, `predictions`), columnas sensibles, secretos
hardcodeados (verificado con un test empírico de fuga al bundle del
cliente), Storage y Edge Functions. **No se encontró nada que corregir**
— el proyecto tenía RLS completo desde su primera migración. Sin PR
asociado porque no hubo cambios que aplicar.

## v1.6 — Presentaciones comerciales (2026-07-22)

**PR:** [#21](https://github.com/gzedanl/radarstock/pull/21) — *Agregar 2 presentaciones comerciales*

- `/propuesta` (7 slides) y `/propuesta-corporate` (6 slides): páginas
  tipo slide-deck con scroll-snap e indicador de progreso, pensadas
  para mandar por link directo a prospectos — no aparecen en ningún
  link del sitio ni se indexan (`robots.ts` + `metadata.robots` por
  página).
- `components/DashboardProof.tsx` y `components/SlideCounter.tsx`
  extraídos como componentes compartidos (la captura del dashboard
  con marco de navegador ahora la reutilizan la landing y ambas
  presentaciones).
- La presentación Corporate embebe el formulario real de
  `CorporatePlanCard` (no un `mailto`) — el prospecto puede escribir
  sin salir de la página.

---

## Hitos sin cambios de código

- **Dominio propio:** `radarstock.cl` / `www.radarstock.cl` conectado a
  Vercel, DNS gestionado en SiteGround.
- **Valorización del software y del negocio:** ejercicio de costo de
  reemplazo (horas-hombre a tarifa de mercado) y de valorización
  pre-ingresos (método Berkus adaptado) — ver conversación, sin
  artefacto en el repo.
- **Resumen técnico para planificación SEO:** stack, renderizado,
  manejo de metadata, sitemap/robots, deploy y rutas — snapshot de
  estado, sin cambios de código.

## Qué falta (no construido todavía)

- Alertas por WhatsApp (anunciadas en el copy de Growth/Enterprise).
- Cron para `sendTrialEndingEmail` (la función existe, nada la llama).
- Upgrade/downgrade de plan sin cobro duplicado.
- Multi-ubicación (bodega/sucursal) — diferido a propósito.
- Predicción por país de origen para importadores (plan Corporate) —
  a desarrollar junto al primer cliente que lo necesite, ver
  `PLAN_CORPORATE.md`.
- Worker de la cola de predicciones (`radarstock-ml/worker.py`)
  desplegado en Render — el código está mergeado, pero requiere crear
  el Background Worker service + Redis add-on manualmente en el
  dashboard de Render.
