import type { Metadata } from "next";
import Logo from "@/components/Logo";
import DashboardProof from "@/components/DashboardProof";
import SlideCounter from "@/components/SlideCounter";
import CorporatePlanCard from "@/components/CorporatePlanCard";

export const metadata: Metadata = {
  title: "Propuesta Corporate — RadarStock",
  description: "Predicción de inventario para operaciones grandes.",
  robots: { index: false, follow: false },
};

const SLIDES = [
  "Portada",
  "El problema",
  "El producto",
  "Cómo funciona",
  "Plan Corporate",
  "Conversemos",
];

export default function PropuestaCorporatePage() {
  return (
    <main className="h-screen snap-y snap-proximity overflow-y-scroll scroll-smooth">
      <SlideCounter labels={SLIDES} />

      {/* 1. Portada */}
      <section className="flex min-h-screen snap-start flex-col justify-between px-6 py-10 md:px-16">
        <div className="flex items-center justify-between">
          <Logo className="h-8 w-auto" />
          <p className="font-mono text-xs uppercase tracking-widest text-text-medium">
            Propuesta Corporate
          </p>
        </div>
        <div className="mx-auto w-full max-w-3xl">
          <p className="font-mono text-sm uppercase tracking-widest text-teal">
            Predicción de inventario para operaciones grandes
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-tight text-text-high md:text-5xl">
            Tu catálogo creció más rápido que tu capacidad de anticiparlo
          </h1>
          <p className="mt-6 max-w-xl text-lg text-text-medium">
            RadarStock predice demanda y detecta riesgo de quiebre o
            sobre-stock SKU por SKU, ajustado a tu operación real — sin
            depender de un ERP ni de una hoja de cálculo que ya no da abasto.
          </p>
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
            Cuando el catálogo crece, las hojas de cálculo dejan de alcanzar
          </h2>
          <p className="mt-4 max-w-2xl text-text-medium">
            Con cientos o miles de SKUs, de múltiples proveedores y orígenes,
            el criterio manual no escala — y los errores salen caros de las
            dos formas.
          </p>
          <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
            <div className="bg-panel-raised p-6">
              <span className="font-mono text-xs uppercase tracking-wide text-amber">
                Quiebre de stock
              </span>
              <p className="mt-2 text-sm text-text-medium">
                Cada SKU sin inventario es una venta que ya estaba lista para
                cerrarse y se pierde.
              </p>
            </div>
            <div className="bg-panel-raised p-6">
              <span className="font-mono text-xs uppercase tracking-wide text-amber">
                Sobre-stock
              </span>
              <p className="mt-2 text-sm text-text-medium">
                Capital de trabajo inmovilizado en productos que no rotan al
                ritmo que se compró.
              </p>
            </div>
            <div className="bg-panel-raised p-6">
              <span className="font-mono text-xs uppercase tracking-wide text-amber">
                Visibilidad fragmentada
              </span>
              <p className="mt-2 text-sm text-text-medium">
                Distintas planillas por bodega o categoría, sin una vista
                única de riesgo real.
              </p>
            </div>
            <div className="bg-panel-raised p-6">
              <span className="font-mono text-xs uppercase tracking-wide text-amber">
                Decisiones reactivas
              </span>
              <p className="mt-2 text-sm text-text-medium">
                Reponer después del quiebre, en vez de anticiparlo con
                semanas de margen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. El producto */}
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
            y la tabla de productos priorizada por nivel de riesgo — el mismo
            dashboard que usan hoy las empresas en RadarStock.
          </p>
          <div className="mt-6">
            <DashboardProof />
          </div>
        </div>
      </section>

      {/* 4. Cómo funciona */}
      <section className="flex min-h-screen snap-start flex-col justify-center px-6 py-16 md:px-16">
        <div className="mx-auto w-full max-w-4xl">
          <p className="font-mono text-sm uppercase tracking-widest text-teal">
            Cómo funciona
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-text-high md:text-4xl">
            Del historial de ventas a la alerta accionable
          </h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <div>
              <span className="font-mono text-xs text-teal">01</span>
              <h3 className="mt-2 font-display text-lg text-text-high">
                Conecta tus datos
              </h3>
              <p className="mt-2 text-sm text-text-medium">
                Historial de ventas e inventario por SKU — vía CSV o una
                integración a medida con tu ERP/WMS para catálogos grandes.
              </p>
            </div>
            <div>
              <span className="font-mono text-xs text-teal">02</span>
              <h3 className="mt-2 font-display text-lg text-text-high">
                El motor predice
              </h3>
              <p className="mt-2 text-sm text-text-medium">
                Prophet, LSTM y Ensemble generan la demanda proyectada,
                ajustada por feriados chilenos, clima y precio de insumos
                según tu rubro.
              </p>
            </div>
            <div>
              <span className="font-mono text-xs text-teal">03</span>
              <h3 className="mt-2 font-display text-lg text-text-high">
                Actúas antes del quiebre
              </h3>
              <p className="mt-2 text-sm text-text-medium">
                Alertas automáticas y cantidad sugerida de reposición,
                priorizadas por nivel de riesgo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Qué incluye Corporate */}
      <section className="flex min-h-screen snap-start flex-col justify-center px-6 py-16 md:px-16">
        <div className="mx-auto w-full max-w-4xl">
          <p className="font-mono text-sm uppercase tracking-widest text-amber">
            Plan Corporate
          </p>
          <h2 className="mt-4 font-display text-3xl font-semibold text-text-high md:text-4xl">
            Pensado para operaciones que ya superaron el autoservicio
          </h2>
          <div className="mt-10 flex flex-col">
            <div className="grid grid-cols-1 gap-2 border-t border-border py-5 md:grid-cols-[220px_1fr] md:gap-6">
              <div className="font-display font-semibold text-text-high">
                Catálogo sin límite
              </div>
              <p className="text-sm text-text-medium">
                SKUs y usuarios ilimitados — sin el tope de 1.000 SKUs de
                nuestros planes de autoservicio.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 border-t border-border py-5 md:grid-cols-[220px_1fr] md:gap-6">
              <div className="font-display font-semibold text-text-high">
                Predicción a tu medida
              </div>
              <p className="text-sm text-text-medium">
                Ajustes de demanda por clima, feriados y precio de insumos ya
                integrados. Para operaciones de importación, incorporamos
                variables por país de origen (commodities, estacionalidad,
                tipo de cambio) — se desarrolla junto a los primeros
                clientes Corporate.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 border-t border-border py-5 md:grid-cols-[220px_1fr] md:gap-6">
              <div className="font-display font-semibold text-text-high">
                Onboarding dedicado
              </div>
              <p className="text-sm text-text-medium">
                Tu equipo no sube un CSV y espera — te acompañamos en la
                carga inicial de datos y la puesta en marcha.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 border-y border-border py-5 md:grid-cols-[220px_1fr] md:gap-6">
              <div className="font-display font-semibold text-text-high">
                Facturación directa
              </div>
              <p className="text-sm text-text-medium">
                Sin checkout de suscripción por tarjeta — facturación y
                condiciones acordadas directamente con tu empresa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Conversemos */}
      <section className="flex min-h-screen snap-start flex-col items-center justify-center bg-panel px-6 py-16 text-center md:px-16">
        <p className="font-mono text-sm uppercase tracking-widest text-teal">
          Siguiente paso
        </p>
        <h2 className="mt-4 max-w-lg font-display text-3xl font-semibold text-text-high md:text-4xl">
          Conversemos sobre tu operación
        </h2>
        <p className="mt-4 max-w-md text-text-medium">
          Cuéntanos cuántos SKUs manejas, de cuántos orígenes, y qué decisión
          quieres poder anticipar — armamos la propuesta a partir de ahí.
        </p>
        <div className="mt-10 w-full max-w-sm text-left">
          <CorporatePlanCard />
        </div>
        <p className="mt-10 font-mono text-xs text-text-medium">
          radarstock.cl
        </p>
      </section>
    </main>
  );
}
