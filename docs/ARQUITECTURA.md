# RadarStock — Documentación del proyecto

Estado al 2026-07-07. Resume qué se ha construido hasta ahora, cómo encajan
las piezas y qué falta para las siguientes fases.

## 1. Qué es RadarStock

SaaS de predicción de demanda y detección de quiebres de stock para PYMEs
chilenas. No requiere ERP: la empresa sube un CSV de ventas históricas y en
minutos obtiene un dashboard con predicción de demanda, días hasta el
quiebre de cada SKU y cantidad sugerida a reponer.

## 2. Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript, todo en Server Components salvo lo interactivo |
| Estilos | Tailwind CSS con paleta propia (navy/panel/teal/amber) — ver `tailwind.config.ts` |
| Gráficos | Recharts (`PredictionChart.tsx`) |
| Parseo CSV | PapaParse, en el cliente (`CSVUploader.tsx`) |
| Íconos | lucide-react |
| Tipografías | Space Grotesk (títulos), Inter (cuerpo), JetBrains Mono (números), vía `next/font/google` |
| Auth + DB | Supabase (Postgres + Auth + RLS) |
| Pagos | Mercado Pago (suscripciones recurrentes / Preapproval API) |
| Email transaccional | SendGrid |
| Servicio ML | Backend separado `radarstock-ml/` (FastAPI, fuera de este repo) — Prophet / LSTM / Ensemble |

Este repositorio (`radarstock`) es el frontend + backend-for-frontend en
Next.js. El servicio de Machine Learning vive en un repo/servicio aparte y
se consume por HTTP.

## 3. Fases construidas

### Fase 1 — Landing + dashboard demo (UI sin backend)

- `app/page.tsx`: landing completa (hero con radar animado, problema,
  cómo funciona, contexto externo — clima/feriados/insumos —, diferenciales
  vs. ERP, pricing, CTA final).
- `components/RadarHero.tsx`: SVG animado de radar (barrido + blips) vía
  keyframes de Tailwind (`radar-sweep`, `blip-pulse`).
- `app/dashboard/page.tsx`: dashboard con KPIs, gráfico y tabla, con datos
  demo hardcodeados cuando no hay datos reales.
- `components/PredictionChart.tsx`: línea de tiempo real vs. predicción
  (base/optimista/pesimista) con Recharts.
- `components/ProductTable.tsx`: tabla de SKUs con nivel de riesgo
  (alto/medio/bajo) coloreado.
- `components/CSVUploader.tsx`: drag & drop, preview de las primeras 5
  filas y botón de guardado (en Fase 1 sin persistencia real).

### Fase 2 — Auth, empresas y planes (Supabase + Mercado Pago + emails)

**2.1 — Autenticación y modelo de empresa**
- `app/(auth)/login`, `app/(auth)/signup`, `app/(auth)/actions.ts`: server
  actions `signup`, `login`, `logout` sobre `supabase.auth`.
- `supabase/migrations/0001_companies.sql`: tabla `companies` (1 fila por
  usuario) con RLS por `user_id`.
- `supabase/migrations/0003_handle_new_user.sql`: en vez de crear la fila
  de `companies` desde el cliente (falla si la confirmación de email está
  activada, porque no hay sesión todavía), se crea vía **trigger** en
  `auth.users` (`handle_new_user`, `security definer`). Esto la hace
  robusta al flujo de confirmación de email.
- `middleware.ts` + `utils/supabase/middleware.ts`: refresca la sesión de
  Supabase en cada request y protege `/dashboard` y `/billing` —
  redirige a `/login` si no hay usuario.
- `utils/supabase/client.ts` / `server.ts` / `admin.ts`: tres clientes
  distintos — browser, server (con cookies, respeta RLS) y admin
  (service role, bypasea RLS, **solo** para contextos sin sesión de
  usuario como el webhook de Mercado Pago).

**2.2 — Modelo de planes**
- `lib/plans.ts`: catálogo de planes `starter` / `growth` / `enterprise`
  con precio en CLP (IVA incluido), límite de SKUs, límite de usuarios y
  si incluye alertas WhatsApp.
- `supabase/migrations/0002_plans.sql`: agrega `plan_status`,
  `mp_preapproval_id`, `trial_ends_at` a `companies`.
- `lib/getCompanyPlan.ts`: trae el plan de la empresa del usuario actual y
  calcula si el trial expiró. Si el plan no se reconoce, cae a los
  límites de Starter (`FALLBACK_LIMITS`) en vez de romper.
- `components/PlanBanner.tsx`: banner de aviso en el dashboard cuando el
  plan no está activo o el trial expiró, con link a `/billing`.

**2.3 — Suscripciones con Mercado Pago**
- `lib/mercadopago.ts`: cliente `PreApproval` del SDK oficial.
- `app/api/mercadopago/create-preapproval/route.ts`: crea una
  suscripción recurrente (Preapproval) en CLP para el plan elegido,
  asociada a la empresa vía `external_reference`. `back_url` siempre usa
  `NEXT_PUBLIC_APP_URL` porque Mercado Pago exige HTTPS público (no acepta
  `localhost`).
- `app/api/webhooks/mercadopago/route.ts`: recibe el webhook,
  **verifica la firma HMAC-SHA256** siguiendo el manifest oficial de
  Mercado Pago (`id:...;request-id:...;ts:...;`) con
  `crypto.timingSafeEqual` antes de tocar el body, busca el detalle de la
  preapproval, mapea su estado (`authorized`→`active`,
  `paused`→`paused`, `cancelled`→`cancelled`) y actualiza `companies` con
  el cliente admin (sin sesión de usuario, porque es un webhook externo).
  Detecta activaciones nuevas para disparar el email de bienvenida al plan.
- `app/billing/page.tsx`: página de planes con botón "Suscribirme" que
  llama al endpoint de creación de preapproval y redirige al
  `init_point` de Mercado Pago.

**2.4 — Emails transaccionales (SendGrid)**
- `lib/email.ts`: `sendWelcomeEmail`, `sendPlanActivatedEmail`,
  `sendTrialEndingEmail` (esta última lista para un cron futuro, aún no
  conectada). Todas usan un wrapper `sendEmailSafe` que **nunca lanza** —
  solo loguea si falla, para no romper signup ni el webhook de pagos por
  un problema de SendGrid.

**2.5 — Productos y predicciones (persistencia real)**
- `supabase/migrations/0004_products_predictions.sql`: tablas `products`
  (SKU, stock actual, historial de ventas como JSONB) y `predictions`
  (días hasta quiebre, cantidad sugerida, escenario), ambas con RLS
  que verifica la empresa dueña vía join.
- `lib/csvProducts.ts`: parsea filas de CSV "anchas" (una columna `sku`,
  una `stock`, y una columna por fecha con las ventas de ese día) a un
  formato normalizado.
- `app/api/products/upload/route.ts`: guarda los productos parseados
  (`upsert` por `company_id + sku`), **trunca según el límite de SKUs del
  plan** de la empresa, y dispara el recálculo de predicciones.
- `CSVUploader.tsx` ahora persiste de verdad: guarda en la API, muestra
  mensaje de truncado si aplica, y refresca la página (`router.refresh()`)
  para que el dashboard muestre datos reales en vez de demo.
- `app/dashboard/page.tsx`: si la empresa tiene productos guardados,
  reemplaza los datos demo por los reales (KPIs, tabla, gráfico vía
  `lib/buildChartData.ts`, que agrega ventas por fecha y proyecta un
  placeholder a 15 días).

### Fase 3 — Integración con el servicio de Machine Learning

- `lib/mlService.ts`: cliente HTTP hacia `radarstock-ml/` (`POST /predict`)
  con timeout de 8s y autenticación por header `X-Internal-Token`.
  **Nunca lanza**: si el servicio no está disponible o responde con
  error, devuelve `null` y quien llama decide el fallback — el dashboard
  no debe romperse porque el servicio ML esté caído.
- `lib/predictPlaceholder.ts`: cálculo simple (promedio de ventas diarias
  proyectado) usado solo como fallback.
- `lib/refreshPredictions.ts`: orquesta el recálculo por producto —
  intenta el servicio ML real primero; si falla y el producto **ya tenía**
  una predicción guardada, la deja intacta (no la pisa con un cálculo
  falso-fresco); si el producto es nuevo sin predicción previa, usa el
  placeholder para no dejarlo sin nada.
- `app/api/predictions/route.ts`: `GET` para leer las predicciones
  guardadas de la empresa; `POST` para forzar un recálculo completo sin
  volver a subir el CSV (pensado para un botón "actualizar" o un cron
  futuro).
- El upload de CSV (`app/api/products/upload/route.ts`) ya llama a este
  flujo automáticamente después de guardar los productos.
- `ProductTable.tsx` muestra una etiqueta "no actualizada hoy" cuando la
  predicción mostrada no es de hoy (el servicio ML no respondió y se
  está mostrando la última guardada).

## 4. Modelo de datos (Supabase / Postgres)

```
auth.users (Supabase)
  └─ trigger on_auth_user_created → crea 1 fila en companies

companies
  id, user_id, name, plan, plan_status, mp_preapproval_id,
  trial_ends_at, created_at
  RLS: solo el dueño (auth.uid() = user_id)

products
  id, company_id, sku, stock_actual, ventas_historicas (jsonb),
  created_at — unique(company_id, sku)
  RLS: vía join a companies.user_id

predictions
  id, product_id, dias_hasta_quiebre, cantidad_sugerida, escenario,
  generated_at — unique(product_id)
  RLS: vía join products → companies.user_id
```

Todas las tablas tienen Row Level Security activado; ningún dato de una
empresa es visible para otra, ni siquiera con la anon key.

## 5. Variables de entorno (`.env.example`)

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente Supabase (browser + server, respeta RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cliente admin, solo server-only, usado por el webhook de MP |
| `MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET` | Mercado Pago: crear preapprovals y verificar firma del webhook |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app (back_url de MP, links en emails) |
| `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` | Envío de emails transaccionales |
| `ML_SERVICE_URL` / `INTERNAL_SERVICE_TOKEN` | Conexión al backend ML (`radarstock-ml/`), token compartido entre ambos servicios |

## 6. Decisiones de diseño relevantes

- **Nunca romper el flujo principal por un servicio externo caído**: el
  servicio ML, SendGrid y el propio recálculo de predicciones están
  diseñados para degradar con gracia (fallback o no-op) en vez de lanzar
  errores que tumben signup, upload o el dashboard.
- **RLS como límite de seguridad real**, no solo filtros en la app: toda
  tabla de datos de negocio tiene políticas que verifican la empresa
  dueña, incluso para las relaciones (`predictions` vía `products`).
- **Verificación de firma antes de parsear el body** en el webhook de
  Mercado Pago, con comparación en tiempo constante
  (`crypto.timingSafeEqual`) para evitar timing attacks.
- **Precios en CLP con IVA incluido** como precio final al cliente; la
  comisión de Mercado Pago se trata como costo operativo interno, nunca
  se traspasa como cargo aparte.
- **Gating de features por plan** centralizado en `lib/plans.ts` +
  `lib/getCompanyPlan.ts`, con fallback a límites Starter para planes no
  reconocidos o en trial.

## 7. Qué falta (próximas fases)

- Backend ML (`radarstock-ml/`) real con Prophet / LSTM / Ensemble —
  hoy `lib/mlService.ts` ya está listo para consumirlo, solo falta que el
  servicio exista y esté desplegado.
- Señales externas prometidas en la landing (clima, feriados chilenos,
  precios de commodities) — aún no hay integración, solo está en el copy
  de marketing.
- Alertas por WhatsApp (el plan Growth/Enterprise ya lo anuncia en
  `lib/plans.ts`, falta la integración).
- Cron para `sendTrialEndingEmail` (la función ya existe en `lib/email.ts`
  pero nada la llama todavía) y para recalcular predicciones
  periódicamente vía `POST /api/predictions`.
- Página de gestión de suscripción (cancelar, cambiar de plan) — hoy
  `/billing` solo permite suscribirse, no gestionar una suscripción
  existente.
