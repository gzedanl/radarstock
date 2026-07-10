import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description:
    "Cómo RadarStock recolecta, usa y protege los datos personales de sus usuarios, conforme a la Ley 21.719 sobre Protección de Datos Personales.",
};

const LAST_UPDATED = "10 de julio de 2026";

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-block">
          <Logo className="h-8 w-auto" />
        </Link>

        <h1 className="mt-8 font-display text-3xl font-semibold text-text-high">
          Política de Privacidad
        </h1>
        <p className="mt-1 text-sm text-text-medium">
          Última actualización: {LAST_UPDATED}
        </p>

        <div className="mt-8 flex flex-col gap-6 text-text-medium">
          <p>
            Esta Política de Privacidad describe cómo RadarStock
            (&ldquo;nosotros&rdquo;) recolecta, usa, almacena y protege los
            datos personales de quienes usan nuestro sitio y nuestra
            aplicación (en conjunto, el &ldquo;Servicio&rdquo;), en
            cumplimiento de la Ley N° 21.719 sobre Protección de Datos
            Personales.
          </p>

          <section>
            <h2 className="font-display text-xl text-text-high">
              1. Datos que recolectamos
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <strong className="text-text-high">Cuenta:</strong> al crear
                una cuenta solo pedimos tu email y contraseña.
              </li>
              <li>
                <strong className="text-text-high">Pago:</strong> si
                contratas un plan vía Mercado Pago, compartimos tu email con
                Mercado Pago para procesar la suscripción. No almacenamos
                datos de tarjetas — eso lo procesa directamente Mercado Pago.
              </li>
              <li>
                <strong className="text-text-high">
                  Formulario de contacto (plan Corporate):
                </strong>{" "}
                si nos escribes a través del formulario
                &ldquo;Conversemos&rdquo;,
                recolectamos el nombre de tu empresa, tu email, y si los
                incluyes, tu teléfono y mensaje. Estos datos se envían por
                email a nuestro equipo comercial y no se almacenan en una
                base de datos.
              </li>
              <li>
                <strong className="text-text-high">
                  Datos de inventario y ventas:
                </strong>{" "}
                los archivos CSV que subes (SKU, stock, historial de ventas)
                son datos de tu negocio, no datos personales de individuos, y
                se usan exclusivamente para generar tus predicciones.
              </li>
            </ul>
            <p className="mt-3">
              No usamos cookies de analítica ni de publicidad. La única
              cookie que usamos es la de sesión, necesaria para mantenerte
              autenticado.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              2. Para qué usamos tus datos
            </h2>
            <p className="mt-3">
              Usamos tus datos para: proveerte el Servicio (autenticación,
              predicciones, alertas), procesar el pago de tu suscripción,
              enviarte comunicaciones transaccionales (bienvenida, alertas de
              stock, activación de plan), y responder a tus consultas
              comerciales. No vendemos ni compartimos tus datos con terceros
              para fines de marketing.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              3. Con quién compartimos datos
            </h2>
            <p className="mt-3">
              Usamos proveedores externos para operar el Servicio, que
              procesan datos en nuestro nombre bajo sus propios estándares de
              seguridad:
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <strong className="text-text-high">Supabase</strong> —
                autenticación y base de datos.
              </li>
              <li>
                <strong className="text-text-high">SendGrid (Twilio)</strong>{" "}
                — envío de emails transaccionales.
              </li>
              <li>
                <strong className="text-text-high">Mercado Pago</strong> —
                procesamiento de pagos y suscripciones.
              </li>
              <li>
                <strong className="text-text-high">Vercel</strong> — hosting
                de la aplicación.
              </li>
            </ul>
            <p className="mt-3">
              Estos proveedores procesan datos en servidores fuera de Chile
              (Estados Unidos y otras jurisdicciones). Al usar el Servicio,
              aceptas esta transferencia internacional, que se realiza bajo
              los estándares de seguridad y protección de datos de cada
              proveedor.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              4. Cuánto tiempo conservamos tus datos
            </h2>
            <p className="mt-3">
              Conservamos los datos de tu cuenta mientras mantengas tu
              suscripción o cuenta activa. Si cancelas o eliminas tu cuenta,
              eliminamos tus datos en un plazo razonable, salvo que debamos
              conservar cierta información por obligaciones legales o
              tributarias.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              5. Tus derechos (ARCO+)
            </h2>
            <p className="mt-3">
              Puedes ejercer en cualquier momento tus derechos de acceso,
              rectificación, cancelación y oposición sobre tus datos
              personales, así como solicitar la portabilidad de tus datos.
              Para ejercerlos, escríbenos a{" "}
              <a
                href="mailto:privacidad@radarstock.cl"
                className="text-teal hover:underline"
              >
                privacidad@radarstock.cl
              </a>{" "}
              indicando tu solicitud — te responderemos dentro de los plazos
              que establece la ley.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              6. Seguridad
            </h2>
            <p className="mt-3">
              Protegemos tus datos con controles de acceso a nivel de fila en
              nuestra base de datos (cada empresa solo puede ver sus propios
              datos), conexiones cifradas (HTTPS) y comparaciones
              criptográficas de tiempo constante para credenciales
              sensibles. Si detectamos una brecha de seguridad que afecte
              tus datos personales, te notificaremos junto con la Agencia de
              Protección de Datos Personales conforme a los plazos legales.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              7. Cambios a esta política
            </h2>
            <p className="mt-3">
              Podemos actualizar esta política ocasionalmente. Si hacemos
              cambios significativos, te lo notificaremos por email o
              mediante un aviso en el Servicio.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl text-text-high">
              8. Contacto
            </h2>
            <p className="mt-3">
              Si tienes preguntas sobre esta Política de Privacidad, escríbenos
              a{" "}
              <a
                href="mailto:privacidad@radarstock.cl"
                className="text-teal hover:underline"
              >
                privacidad@radarstock.cl
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
