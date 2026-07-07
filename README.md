# RadarStock

SaaS de predicción de demanda y detección de quiebres de stock para PYMEs
chilenas. A diferencia de soluciones enterprise, no requiere ERP: sube un
CSV/Excel de tus ventas y en minutos tienes tu radar de inventario
funcionando.

## Stack (Fase 1)

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** con paleta propia (navy/panel/teal/amber, ver
  `tailwind.config.ts`)
- **Recharts** para gráficos de predicción
- **PapaParse** para lectura de CSV en el cliente
- **lucide-react** para íconos
- Fuentes vía `next/font/google`: Space Grotesk (headlines), Inter (cuerpo),
  JetBrains Mono (números)

Fases posteriores agregarán Supabase (auth + DB), Mercado Pago (suscripciones)
y un backend FastAPI separado (`radarstock-ml/`) para los modelos de
predicción (Prophet, LSTM, Ensemble).

## Estructura

```
app/
  page.tsx                  landing
  dashboard/page.tsx        dashboard con datos demo
  api/predictions/route.ts  API skeleton (GET/POST demo)
components/
  RadarHero.tsx             radar SVG animado (hero)
  PredictionChart.tsx       gráfico Recharts real vs. predicción
  ProductTable.tsx          tabla de productos con riesgo
  CSVUploader.tsx           drag & drop + preview de CSV
```

## Cómo correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Ver `.env.example` — en Fase 1 no se requiere ninguna.
