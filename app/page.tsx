import Link from "next/link";
import {
  Upload,
  Radar,
  BellRing,
  Check,
  CloudSun,
  CalendarDays,
  TrendingUp,
  SlidersHorizontal,
  Download,
  Clock,
  FlaskConical,
} from "lucide-react";
import Image from "next/image";
import RadarHero from "@/components/RadarHero";
import Logo from "@/components/Logo";
import CorporatePlanCard from "@/components/CorporatePlanCard";
import { PLANS, getPriceMercadoPago, type PlanId } from "@/lib/plans";

const PLAN_COPY: Record<PlanId, { features: string[]; highlighted?: boolean }> = {
  starter: {
    features: [
      "Hasta 200 SKUs monitoreados",
      "1 usuario",
      "Predicción base (Prophet)",
      "Alertas por email",
    ],
  },
  growth: {
    features: [
      "Hasta 1.000 SKUs monitoreados",
      "5 usuarios",
      "Predicción Ensemble (Prophet + LSTM)",
      "Alertas por email y WhatsApp",
    ],
    highlighted: true,
  },
  enterprise: {
    features: [
      "SKUs ilimitados",
      "Usuarios ilimitados",
      "Predicción Ensemble + contexto macroeconómico",
      "Soporte prioritario",
    ],
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RadarStock",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "RadarStock predice quiebres de stock y sobre-stock para PYMEs chilenas. Sube un CSV de ventas y en minutos tienes tu radar de inventario funcionando, sin necesidad de un ERP.",
  url: "https://www.radarstock.cl",
  image: "https://www.radarstock.cl/og-image.png",
  provider: {
    "@type": "Organization",
    name: "RadarStock",
    url: "https://www.radarstock.cl",
  },
  areaServed: {
    "@type": "Country",
    name: "Chile",
  },
  offers: Object.values(PLANS).map((plan) => ({
    "@type": "Offer",
    name: `Plan ${plan.name}`,
    price: getPriceMercadoPago(plan),
    priceCurrency: "CLP",
    url: "https://www.radarstock.cl/#pricing",
  })),
};

export default function Home() {
  return (
    <>
      {/* Datos estructurados para buscadores y motores de IA — no
          contiene ningún dato de usuario, solo el catálogo de planes
          propio (PLANS), seguro de serializar tal cual. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-6 sm:px-6 sm:pt-8">
        <Logo className="h-7 w-auto sm:h-9" />
        <nav className="flex items-center gap-2 sm:gap-6">
          <Link
            href="/login"
            className="text-xs font-medium text-text-medium transition hover:text-text-high sm:text-sm"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-teal px-3 py-1.5 text-xs font-medium text-navy transition hover:opacity-90 sm:px-4 sm:py-2 sm:text-sm"
          >
            Crear cuenta
          </Link>
        </nav>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 pb-24 pt-12 md:flex-row">
        <div className="flex-1">
          <p className="font-mono text-sm uppercase tracking-widest text-teal">
            Predicción de inventario
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-text-high md:text-5xl">
            Anticipa los quiebres de stock antes de que te cuesten ventas
          </h1>
          <p className="mt-6 max-w-xl text-lg text-text-medium">
            RadarStock predice tu demanda y detecta riesgo de quiebre o
            sobre-stock, sin necesidad de un ERP. Sube tu Excel o CSV de
            ventas y en minutos tienes tu radar de inventario funcionando.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-teal px-6 py-3 font-medium text-navy transition hover:opacity-90"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="#pricing"
              className="rounded-md border border-border px-6 py-3 font-medium text-text-high transition hover:border-teal"
            >
              Ver planes
            </Link>
          </div>
        </div>
        <div className="flex-1">
          <RadarHero />
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-border bg-panel-raised px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-teal/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-text-medium/40" />
              <span className="ml-3 font-mono text-xs text-text-medium">
                radarstock.cl/dashboard
              </span>
            </div>
            <Image
              src="/dashboard-preview.png"
              alt="Dashboard de RadarStock con KPIs de inventario, predicción de ventas vs. demanda y tabla de productos por nivel de riesgo"
              width={1440}
              height={920}
              className="w-full"
              priority
            />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-panel py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl font-semibold text-text-high">
            El inventario mal calculado le cuesta caro a las PYMEs
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
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

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl font-semibold text-text-high">
            Cómo funciona
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-panel-raised text-teal">
                <Upload size={22} />
              </div>
              <h3 className="font-display text-xl text-text-high">
                1. Sube tu CSV
              </h3>
              <p className="text-text-medium">
                Exporta tus ventas históricas desde tu punto de venta o Excel
                y súbelas directamente, sin integraciones complejas.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-panel-raised text-teal">
                <Radar size={22} />
              </div>
              <h3 className="font-display text-xl text-text-high">
                2. Detecta riesgo
              </h3>
              <p className="text-text-medium">
                Nuestros modelos predicen demanda futura y calculan días
                hasta el quiebre para cada SKU.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-panel-raised text-teal">
                <BellRing size={22} />
              </div>
              <h3 className="font-display text-xl text-text-high">
                3. Recibe alertas
              </h3>
              <p className="text-text-medium">
                Te avisamos con anticipación qué reponer y cuánto, antes de
                que sea demasiado tarde.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl font-semibold text-text-high">
            Cada alerta, ajustada a tu forma de reponer
          </h2>
          <p className="mt-4 max-w-2xl text-text-medium">
            Los umbrales de riesgo, la reposición sugerida y las proyecciones
            se ajustan a tu operación real, no a un promedio genérico igual
            para todos.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-teal">
                <SlidersHorizontal size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg text-text-high">
                Umbral de riesgo a tu medida
              </h3>
              <p className="mt-2 text-text-medium">
                Define tú cuándo un SKU pasa a riesgo alto o medio, según
                cuánto te demora reponer. No todos los negocios compran al
                mismo ritmo.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-teal">
                <Download size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg text-text-high">
                Reposición lista para tu proveedor
              </h3>
              <p className="mt-2 text-text-medium">
                Exporta un CSV con los SKUs que necesitan pedido, cuánto
                pedir y en cuántos días se quiebran — listo para enviar, sin
                copiar filas a mano.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-teal">
                <Clock size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg text-text-high">
                Tu tiempo de entrega, incluido
              </h3>
              <p className="mt-2 text-text-medium">
                El cálculo de riesgo descuenta el lead time real de cada
                proveedor, para que un SKU con envío lento no te tome por
                sorpresa.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-teal">
                <FlaskConical size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg text-text-high">
                Simula antes de decidir
              </h3>
              <p className="mt-2 text-text-medium">
                Ajusta el slider del gráfico y prueba cómo cambia tu
                proyección antes de una promoción o un peak de demanda.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-panel py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl font-semibold text-text-high">
            Predicción con contexto real, no solo tu historial de ventas
          </h2>
          <p className="mt-4 max-w-2xl text-text-medium">
            RadarStock cruza tu historial con señales externas que mueven tu
            demanda y tus costos: clima, feriados chilenos e indicadores
            económicos (UF, dólar, IPC).
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-teal">
                <CloudSun size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg text-text-high">
                Clima
              </h3>
              <p className="mt-2 text-text-medium">
                Ajustamos la demanda proyectada según el pronóstico del tiempo
                en tu comuna, para rubros donde el clima mueve las ventas
                (bebidas, ropa, ferretería).
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-teal">
                <CalendarDays size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg text-text-high">
                Feriados y estacionalidad
              </h3>
              <p className="mt-2 text-text-medium">
                Detectamos fiestas patrias, navidad y otras fechas clave para
                anticipar los peaks de demanda antes de que ocurran.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-teal">
                <TrendingUp size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg text-text-high">
                Alerta de insumos
              </h3>
              <p className="mt-2 text-text-medium">
                Monitoreamos precios de materias primas relevantes a tu rubro
                (algodón, trigo, cobre, petróleo) y te avisamos si suben
                fuerte esta semana, para que decidas si conviene adelantar tu
                próxima compra. No predecimos la causa — solo reportamos el
                movimiento del precio.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl font-semibold text-text-high">
            Pensado para PYMEs, no para corporaciones
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <h3 className="font-display text-lg text-text-high">
                Sin ERP requerido
              </h3>
              <p className="mt-2 text-text-medium">
                Empieza con un archivo CSV o Excel, sin integraciones de
                semanas ni consultores.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <h3 className="font-display text-lg text-text-high">
                Sin mínimos de historial
              </h3>
              <p className="mt-2 text-text-medium">
                Nuestros modelos se adaptan incluso con pocos meses de datos
                de ventas.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel-raised p-6">
              <h3 className="font-display text-lg text-text-high">
                100% self-service
              </h3>
              <p className="mt-2 text-text-medium">
                Configura tu cuenta y empieza a ver predicciones el mismo
                día, sin depender de un equipo de implementación.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl font-semibold text-text-high">
            Planes
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {Object.values(PLANS).map((plan) => {
              const copy = PLAN_COPY[plan.id];
              return (
                <div
                  key={plan.name}
                  className={`flex flex-col rounded-lg border p-8 ${
                    copy.highlighted
                      ? "border-teal bg-panel-raised"
                      : "border-border bg-panel"
                  }`}
                >
                  <h3 className="font-display text-xl text-text-high">
                    {plan.name}
                  </h3>
                  <p className="mt-4 font-mono text-3xl text-text-high">
                    ${getPriceMercadoPago(plan).toLocaleString("es-CL")}
                    <span className="text-base text-text-medium"> CLP/mes</span>
                  </p>
                  <p className="mt-1 text-xs text-text-medium">
                    IVA y comisión de Mercado Pago incluidos
                  </p>
                  <ul className="mt-6 flex flex-1 flex-col gap-3">
                    {copy.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-text-medium"
                      >
                        <Check size={18} className="mt-0.5 shrink-0 text-teal" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-8 rounded-md px-6 py-3 text-center font-medium transition ${
                      copy.highlighted
                        ? "bg-teal text-navy hover:opacity-90"
                        : "border border-border text-text-high hover:border-teal"
                    }`}
                  >
                    Empezar
                  </Link>
                </div>
              );
            })}
            <CorporatePlanCard />
          </div>
          <p className="mt-8 text-sm text-text-medium">
            ¿Prefieres que te facturemos directo (transferencia), sin
            suscripción automática? Escríbenos — en ese caso solo se cobra la
            membresía + IVA, sin la comisión de tarjeta bancaria.
          </p>
        </div>
      </section>

      <section className="border-t border-border bg-panel py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-display text-3xl font-semibold text-text-high">
            Deja de adivinar cuánto stock necesitas
          </h2>
          <p className="mt-4 text-text-medium">
            Prueba RadarStock con tus propios datos en minutos.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-md bg-teal px-8 py-3 font-medium text-navy transition hover:opacity-90"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-6xl px-6 text-sm text-text-medium">
          © {new Date().getFullYear()} RadarStock. Predicción de inventario
          para PYMEs chilenas.
        </div>
      </footer>
      </main>
    </>
  );
}
