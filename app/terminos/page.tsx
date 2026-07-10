import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description:
    "Condiciones de uso del Servicio RadarStock: cuentas, suscripciones, pagos y responsabilidades.",
};

const LAST_UPDATED = "10 de julio de 2026";

export default function TerminosPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-block">
          <Logo className="h-8 w-auto" />
        </Link>

        <h1 className="mt-8 font-display text-3xl font-semibold text-text-high">
          Términos de Servicio
        </h1>
        <p className="mt-1 text-sm text-text-medium">
          Última actualización: {LAST_UPDATED}
        </p>

        <div className="mt-8 flex flex-col gap-6 text-text-medium">
          <p>
            Al crear una cuenta o usar RadarStock (el &ldquo;Servicio&rdquo;)
            aceptas estos Términos de Servicio. Si no estás de acuerdo, no
            uses el Servicio.
          </p>

          <section>
            <h2 className="font-display text-xl text-text-high">
              1. El Servicio
            </h2>
            <p className="mt-3">
              RadarStock es una herramienta de predicción de demanda y
              detección de riesgo de quiebre de stock para empresas. Subes
              datos de ventas e inventario y el Servicio genera predicciones
              y alertas. Las predicciones son una estimación basada en datos
              históricos y no garantizan resultados exactos — las decisiones
              de compra, reposición o inventario siguen siendo
              responsabilidad tuya.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              2. Cuentas
            </h2>
            <p className="mt-3">
              Eres responsable de mantener la confidencialidad de tu
              contraseña y de toda actividad que ocurra en tu cuenta. Debes
              tener autorización para representar a tu empresa al crear una
              cuenta.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              3. Planes y pagos
            </h2>
            <p className="mt-3">
              Los planes pagados (Starter, Growth, Enterprise) se cobran
              mensualmente vía Mercado Pago, con los valores publicados en{" "}
              <Link href="/#pricing" className="text-teal hover:underline">
                nuestra página de precios
              </Link>{" "}
              (que incluyen IVA y la comisión de Mercado Pago). Puedes
              cancelar tu suscripción en cualquier momento desde tu panel de
              facturación — la cancelación aplica hacia adelante, sin
              reembolso del período ya pagado. El plan Corporate se rige por
              las condiciones acordadas directamente con nuestro equipo
              comercial.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              4. Tus datos
            </h2>
            <p className="mt-3">
              Los datos de ventas e inventario que subes son tuyos. Los
              usamos únicamente para generar tus predicciones y no los
              compartimos con otras empresas. Ver nuestra{" "}
              <Link href="/privacidad" className="text-teal hover:underline">
                Política de Privacidad
              </Link>{" "}
              para el detalle de qué datos personales recolectamos y cómo los
              tratamos.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              5. Disponibilidad del Servicio
            </h2>
            <p className="mt-3">
              Hacemos esfuerzos razonables para mantener el Servicio
              disponible, pero no garantizamos disponibilidad continua o sin
              errores. Podemos suspender o modificar funciones del Servicio
              con aviso razonable cuando sea posible.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              6. Limitación de responsabilidad
            </h2>
            <p className="mt-3">
              El Servicio se entrega &ldquo;tal cual&rdquo;. En la máxima
              medida
              permitida por la ley, RadarStock no será responsable por
              pérdidas de ventas, quiebres de stock, sobre-stock u otras
              decisiones de negocio tomadas en base a las predicciones del
              Servicio.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              7. Cambios a estos términos
            </h2>
            <p className="mt-3">
              Podemos actualizar estos términos ocasionalmente. Si hacemos
              cambios significativos, te lo notificaremos por email o
              mediante un aviso en el Servicio.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              8. Contacto
            </h2>
            <p className="mt-3">
              Si tienes preguntas sobre estos Términos, escríbenos a{" "}
              <a
                href="mailto:comercial@radarstock.cl"
                className="text-teal hover:underline"
              >
                comercial@radarstock.cl
              </a>
              .
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm text-text-medium">
          <Link href="/" className="text-teal hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
