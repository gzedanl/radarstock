# Plan Corporate — features y diferenciación de precio

Estado al 2026-07-10. Documento interno (no es copy de marketing): define qué
distingue al plan Corporate de los otros tres, qué de eso ya está construido
vs. qué falta, y el rango de precio objetivo para la conversación comercial.

## 1. Por qué existe un 4to plan

Los tres planes self-service (Starter/Growth/Enterprise) están pensados para
PYMEs que se suscriben solas vía Mercado Pago, sin intervención humana. Un
cliente como **Grupo Soprodi SA** (importador de legumes/granos desde
múltiples países, ~USD 20MM/mes de facturación) no encaja ahí por dos
motivos:

- Necesita una feature que hoy no existe en ningún plan: predicción de
  variables por **país de origen** (precio de commodities, riesgo
  logístico/cambiario, estacionalidad de cosecha) para decidir de dónde
  importar, no solo cuánto reponer.
- El monto que puede pagar y el nivel de servicio que espera (SLA,
  onboarding asistido, soporte dedicado) no tienen sentido en un flujo de
  autoservicio con checkout de tarjeta.

Por eso Corporate no tiene precio público ni botón de pago — ver
`components/CorporatePlanCard.tsx` — y en vez de eso muestra "Conversemos",
que manda un lead a `comercial@radarstock.cl` (`app/api/contact-sales`,
`lib/email.ts::sendCorporateLeadEmail`).

## 2. Comparación de planes

| | Starter | Growth | Enterprise | Corporate |
|---|---|---|---|---|
| Precio (CLP/mes, con IVA + comisión MP) | $122.528 | $306.338 | $673.959 | A medida (ver §4) |
| Precio neto | $99.990 | $249.990 | $549.990 | Objetivo: $2.000.000–$2.500.000 |
| SKUs monitoreados | 200 | 1.000 | Ilimitados | Ilimitados |
| Usuarios | 1 | 5 | Ilimitados | Ilimitados |
| Motor de predicción | Prophet | Ensemble (Prophet + LSTM) | Ensemble + contexto macroeconómico | Ensemble + contexto macro **+ país de origen** |
| Alertas | Email | Email (WhatsApp planeado) | Email (WhatsApp planeado) | Email + canal a definir con el cliente |
| Soporte | Self-service | Self-service | Prioritario (best-effort) | Dedicado, con SLA contractual |
| Onboarding | Autoservicio (sube su CSV) | Autoservicio | Autoservicio | Asistido (integración de datos con el equipo del cliente) |
| Forma de pago | Mercado Pago (recurrente) | Mercado Pago (recurrente) | Mercado Pago (recurrente) | Facturación directa / transferencia, a negociar |
| Contrato | Ninguno (cancela cuando quiera) | Ninguno | Ninguno | Contrato con SLA y permanencia a definir |

> Nota: "Alertas WhatsApp" aparece en el copy de Growth/Enterprise en la
> landing pero **no está implementado todavía** — `sendStockAlertEmail` en
> `lib/email.ts` solo manda email. Si se cierra un cliente Corporate que
> lo pida, hay que construirlo antes de prometerlo en el contrato.

## 3. Qué distingue a Corporate, feature por feature

### 3.1 Predicción por país de origen — no construido

Es el diferenciador real frente a Enterprise. Hoy `radarstock-ml` ajusta
demanda por `rubro` y `comuna` (clima, feriados chilenos, precio de
commodities vía los `RUBRO_COMMODITIES`/`RUBROS_SENSIBLES_CLIMA` del
backend), pero **no existe ningún concepto de país de origen** en el
schema ni en el motor de predicción. Para un importador tipo Soprodi
("porotos, arroz, granos... países árabes incluidos") esto implicaría como
mínimo:

- Campo `pais_origen` por SKU o por lote de compra (schema nuevo en
  `products` o tabla aparte, ya que un SKU puede tener múltiples orígenes
  en el tiempo).
- Fuente de datos externa por país: precio de commodity agrícola, tipo de
  cambio, y probablemente algún proxy de riesgo logístico (tiempo de
  tránsito, estacionalidad de cosecha en el hemisferio de origen).
- Ajuste en el motor de predicción (`radarstock-ml`) análogo al que ya
  existe para clima/feriados, pero indexado por país en vez de por comuna.

**No se debe prometer como "ya construido"** en ninguna conversación
comercial — es lo primero que hay que validar con el cliente (qué fuente de
datos usa hoy, qué países maneja, qué decisión quiere tomar con la
predicción) antes de estimar el esfuerzo real.

### 3.2 Onboarding y soporte dedicado — parcialmente construido

La infraestructura de datos (CSV upload, predicciones, alertas) ya sirve
para cualquier volumen de SKUs sin cambios de código — `maxSkus: Infinity`
ya existe en Enterprise. Lo que falta es proceso, no código: alguien del
equipo acompañando la carga inicial de datos y respondiendo consultas con
un SLA de respuesta definido. No requiere desarrollo, sí requiere
capacidad humana (de ahí el ticket de precio: financia tiempo de soporte,
no solo infraestructura).

### 3.3 SLA a medida — no construido (proceso + posible feature)

Un SLA real (ej. "predicciones actualizadas antes de las 9am" o "99.5% de
uptime del servicio de alertas") requiere monitoreo que hoy no existe:
no hay dashboard de estado ni alertas internas si el cron de
`refresh-predictions` o el servicio ML fallan silenciosamente. Antes de
comprometer un SLA en contrato, construir al menos alertas internas de
fallo de los crons (`app/api/cron/*`).

### 3.4 Facturación directa sin Mercado Pago — construido

Esto ya está resuelto por diseño: Corporate nunca pasa por
`create-preapproval`, así que no hay comisión de Mercado Pago que
traspasar (la razón original por la que se armó `getPriceMercadoPago()` no
aplica acá). Queda pendiente solo el proceso administrativo (facturación,
medio de pago) que es 100% offline, fuera del código.

## 4. Precio objetivo

Rango de referencia para la conversación comercial: **$2.000.000 –
$2.500.000 CLP neto/mes**. Es ~4–4.5x el precio de Enterprise
($549.990 neto), justificado por:

- Es un salto grande, pero para un cliente con la facturación de Soprodi
  (~USD 20MM/mes) representa ~0,01% de sus ingresos — el ancla de precio
  no es la barrera, la barrera es demostrar que la predicción por país de
  origen resuelve un problema real de decisión de compra.
- El monto financia trabajo que no es self-service: integración de datos,
  soporte dedicado, y eventualmente el desarrollo de la feature de país de
  origen (§3.1), que hoy no existe.

No hay que fijar un número único: al ser "a medida", el precio final se
ajusta según SKUs reales, países de origen a cubrir, y alcance de
integración — el rango de arriba es el piso de negociación, no una
tarifa publicada.

## 5. Próximos pasos si se cierra un cliente Corporate

1. Validar con el cliente qué decisión quiere tomar con "predicción por
   país de origen" antes de diseñar el schema (§3.1) — evitar construir
   sin validar, como ya se decidió para esta feature en general.
2. Definir el SLA real que se puede sostener y qué monitoreo interno hace
   falta antes de comprometerlo por contrato (§3.3).
3. Si el cliente pide alertas por WhatsApp, construirlas antes de
   prometerlas — hoy no existen (nota en §2).
4. Acordar el proceso de facturación directa (fuera del código de este
   repo).
