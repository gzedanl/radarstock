import type { Metadata } from "next";
import Link from "next/link";
import { Check, Radar, Upload, BellRing, TrendingUp } from "lucide-react";
import Logo from "@/components/Logo";
import RadarHero from "@/components/RadarHero";
import DashboardProof from "@/components/DashboardProof";
import SlideCounter from "@/components/SlideCounter";
import { PLANS, getPriceMercadoPago, type PlanId } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Propuesta — RadarStock",
  description: "Qué es RadarStock y sus planes.",
  robots: { index: false, follow: false },
};

const PLAN_FEATURES: Record<PlanId, string[]> = {
  starter: [
    "Hasta 200 SKUs monitoreados",
    "1 usuario",
    "Predicción base (Prophet)",
    "Alertas por email",
  ],
  growth: [
    "Hasta 1.000 SKUs monitoreados",
    "5 usuarios",
    "Predicción Ensemble (Prophet + LSTM)",
    "Alertas por email y WhatsApp",
  ],
  enterprise: [
    "SKUs ilimitados",
    "Usuarios ilimitados",
    "Predicción Ensemble + contexto macroeconómico",
    "Soporte prioritario",
  ],
};

const SLIDES = [
  "Portada",
  "El problema",
  "Cómo funciona",
  "El producto",
  "Motor de predicción",
  "Planes",
  "Empezar",
];

export default function PropuestaPage() {
  return (
    <main className="h-screen snap-y snap-proximity overflow-y-scroll scroll-smooth">
      <SlideCounter labels={SLIDES} />

      {/* 1. Portada */}
      <section className="flex min-h-screen snap-start flex-col justify-between px-6 py-10 md:px-16">
        <Logo className="h-8 w-auto" />
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-start justify-center gap-8 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="font-mono text-sm uppercase tracking-widest text-teal">
              Propuesta
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-text-high md:text-5xl">
              Anticipa los quiebres de stock antes de que te cuesten ventas
            </h1>
            <p className="mt-6 max-w-lg text-lg text-text-medium">
              RadarStock predice tu demanda y detecta riesgo de quiebre o
              sobre-stock, SKU por SKU, sin necesidad de un ERP.
            </p>
          </div>
          <div className="w-full max-w-xs md:max-w-sm">
            <RadarHero />
          </div>
        </div>
        <p className="font-mono text-xs text-text-medium">
          radarstock.cl · desliza para ver la propuesta
        </p>
      </section>

      {/* 2. El problema */}
      <section className="flex min-h-screen snap-start flex-col justify-center px-6 py-16 md:px-16">
        <div className="mx-auto w-full max-w-4xl">
          <p className="font-mono text-sm uppercase tracking-widest text-amber">
            El problema
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-text-high md:text-4xl">
            El inventario mal calculado le cuesta caro a las PYMEs
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <p className="text-text-medium">
                Los quiebres de stock hacen que pierdas ventas frente a
                clientes que ya estaban listos para comprar.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <p className="text-text-medium">
                El sobre-stock inmoviliza capital de trabajo en productos que
                no rotan al ritmo esperado.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <p className="text-text-medium">
                Sin visibilidad predictiva, las decisiones de reposición se
                toman a ciegas o con Excel manual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cómo funciona */}
      <section className="flex min-h-screen snap-start flex-col justify-center px-6 py-16 md:px-16">
        <div className="mx-auto w-full max-w-4xl">
          <p className="font-mono text-sm uppercase tracking-widest text-teal">
            Cómo funciona
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-text-high md:text-4xl">
            De tu historial de ventas a la alerta accionable
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-panel-raised text-teal">
                <Upload size={22} />
              </div>
              <h3 className="font-display text-lg text-text-high">
                Sube tus datos
              </h3>
              <p className="text-sm text-text-medium">
                Un CSV con SKU, stock y ventas históricas. Sin integraciones
                complejas para empezar.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-panel-raised text-teal">
                <TrendingUp size={22} />
              </div>
              <h3 className="font-display text-lg text-text-high">
                El motor predice
              </h3>
              <p className="text-sm text-text-medium">
                Prophet, LSTM y Ensemble generan la demanda proyectada a 30
                días, con escenario base, optimista y pesimista.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-panel-raised text-teal">
                <BellRing size={22} />
              </div>
              <h3 className="font-display text-lg text-text-high">
                Actúas antes del quiebre
              </h3>
              <p className="text-sm text-text-medium">
                Alertas automáticas y cantidad sugerida de reposición,
                priorizadas por nivel de riesgo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. El producto */}
      <section className="flex min-h-screen snap-start flex-col justify-center px-6 py-10 md:px-16">
        <div className="mx-auto w-full max-w-4xl">
          <p className="font-mono text-sm uppercase tracking-widest text-teal">
            Prueba, no promesa
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-text-high md:text-4xl">
            Así se ve tu radar de inventario
          </h2>
          <p className="mt-4 max-w-2xl text-text-medium">
            KPIs en tiempo real, predicción de ventas vs. demanda proyectada,
            y la tabla de productos priorizada por nivel de riesgo.
          </p>
          <div className="mt-6">
            <DashboardProof />
          </div>
        </div>
      </section>

      {/* 5. Motor de predicción */}
      <section className="flex min-h-screen snap-start flex-col justify-center px-6 py-16 md:px-16">
        <div className="mx-auto w-full max-w-4xl">
          <p className="font-mono text-sm uppercase tracking-widest text-amber">
            Motor de predicción
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-text-high md:text-4xl">
            No es un promedio con esteroides
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <Radar size={22} className="text-teal" />
              <h3 className="mt-4 font-display text-lg text-text-high">
                Prophet + LSTM + Ensemble
              </h3>
              <p className="mt-2 text-sm text-text-medium">
                Tres modelos combinados, con degradación en cascada — si uno
                no está disponible para una serie, cae al siguiente. Nunca se
                deja caer una predicción.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <TrendingUp size={22} className="text-teal" />
              <h3 className="mt-4 font-display text-lg text-text-high">
                Contexto real, no solo historial
              </h3>
              <p className="mt-2 text-sm text-text-medium">
                Ajuste de demanda por feriados chilenos y clima, y alertas de
                variación de precio de insumos según tu rubro.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Planes */}
      <section className="flex min-h-screen snap-start flex-col justify-center px-6 py-16 md:px-16">
        <div className="mx-auto w-full max-w-5xl">
          <p className="font-mono text-sm uppercase tracking-widest text-teal">
            Planes
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-text-high md:text-4xl">
            Un plan para cada etapa
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {Object.values(PLANS).map((plan) => {
              const highlighted = plan.id === "growth";
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-lg border p-6 ${
                    highlighted
                      ? "border-teal bg-panel-raised"
                      : "border-border bg-panel"
                  }`}
                >
                  <h3 className="font-display text-lg text-text-high">
                    {plan.name}
                  </h3>
                  <p className="mt-3 font-mono text-2xl text-text-high">
                    ${getPriceMercadoPago(plan).toLocaleString("es-CL")}
                    <span className="text-sm text-text-medium"> CLP/mes</span>
                  </p>
                  <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm">
                    {PLAN_FEATURES[plan.id].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-text-medium"
                      >
                        <Check size={16} className="mt-0.5 shrink-0 text-teal" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-sm text-text-medium">
            Precios en CLP/mes, IVA y comisión de Mercado Pago incluidos. ¿Un
            catálogo más grande o necesidades a medida? Pregunta por el plan
            Corporate.
          </p>
        </div>
      </section>

      {/* 7. CTA final */}
      <section className="flex min-h-screen snap-start flex-col items-center justify-center bg-panel px-6 py-16 text-center md:px-16">
        <Logo className="h-9 w-auto" />
        <h2 className="mt-8 max-w-xl font-display text-3xl font-semibold text-text-high md:text-4xl">
          Deja de adivinar cuánto stock necesitas
        </h2>
        <p className="mt-4 max-w-md text-text-medium">
          Prueba RadarStock con tus propios datos en minutos.
        </p>
        <Link
          href="/signup"
          className="mt-8 inline-block rounded-md bg-teal px-8 py-3 font-medium text-navy transition hover:opacity-90"
        >
          Crear cuenta gratis
        </Link>
        <p className="mt-10 font-mono text-xs text-text-medium">
          radarstock.cl
        </p>
      </section>
    </main>
  );
}
