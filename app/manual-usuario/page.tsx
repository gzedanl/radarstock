import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "Manual de usuario",
  description:
    "Guía completa de RadarStock: cómo crear tu cuenta, subir tu CSV de ventas, leer tu dashboard, sincronizar con el SII, planes y el programa de referidos.",
};

const LAST_UPDATED = "19 de agosto de 2026";

const SECCIONES = [
  { id: "primeros-pasos", label: "1. Primeros pasos" },
  { id: "csv", label: "2. Sube tu CSV de ventas" },
  { id: "dashboard", label: "3. Tu dashboard" },
  { id: "configuracion", label: "4. Umbrales de riesgo y perfil" },
  { id: "sii", label: "5. Sincronizar con el SII" },
  { id: "planes", label: "6. Planes y facturación" },
  { id: "referidos", label: "7. Programa de referidos" },
  { id: "soporte", label: "8. Soporte" },
];

export default function ManualUsuarioPage() {
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-block">
          <Logo className="h-8 w-auto" />
        </Link>

        <h1 className="mt-8 font-display text-3xl font-semibold text-text-high">
          Manual de usuario
        </h1>
        <p className="mt-1 text-sm text-text-medium">
          Última actualización: {LAST_UPDATED}
        </p>
        <p className="mt-4 text-text-medium">
          Esta guía cubre todo lo que necesitas para usar RadarStock, desde
          crear tu cuenta hasta interpretar tus predicciones y administrar tu
          plan.
        </p>

        <nav className="mt-8 rounded-lg border border-border bg-panel-raised p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-medium">
            Contenido
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {SECCIONES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-sm text-teal hover:underline">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-10 flex flex-col gap-12 text-text-medium">
          <section id="primeros-pasos">
            <h2 className="font-display text-2xl text-text-high">
              1. Primeros pasos
            </h2>
            <p className="mt-3">
              Crea tu cuenta en{" "}
              <Link href="/signup" className="text-teal hover:underline">
                radarstock.cl/signup
              </Link>{" "}
              con tu email y una contraseña. Al registrarte partes
              automáticamente con <strong className="text-text-high">14 días de prueba gratis</strong>,
              sin necesidad de tarjeta de crédito, con acceso completo a la
              carga de CSV, el dashboard y las predicciones.
            </p>
            <p className="mt-3">
              Si alguien te compartió un link de referido (con{" "}
              <code className="rounded bg-panel px-1.5 py-0.5 text-xs">
                ?ref=
              </code>{" "}
              en la URL), el código queda prellenado automáticamente en el
              formulario de registro — no tienes que hacer nada extra.
            </p>
            <p className="mt-3">
              Cuando termine tu período de prueba, vas a necesitar suscribirte
              a un plan pago para seguir accediendo a tu dashboard (ver{" "}
              <a href="#planes" className="text-teal hover:underline">
                sección 6
              </a>
              ). Tus datos no se pierden — apenas te suscribes, recuperas el
              acceso con toda tu información intacta.
            </p>
          </section>

          <section id="csv">
            <h2 className="font-display text-2xl text-text-high">
              2. Sube tu CSV de ventas
            </h2>
            <p className="mt-3">
              Desde tu dashboard, arrastra o selecciona un archivo{" "}
              <code className="rounded bg-panel px-1.5 py-0.5 text-xs">
                .csv
              </code>{" "}
              en la sección &ldquo;Sube tu CSV de ventas&rdquo;. El formato
              esperado es una fila por producto, con estas columnas:
            </p>
            <div className="mt-4 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-panel text-xs uppercase text-text-medium">
                    <th className="px-4 py-2 font-medium">Columna</th>
                    <th className="px-4 py-2 font-medium">Obligatoria</th>
                    <th className="px-4 py-2 font-medium">Descripción</th>
                  </tr>
                </thead>
                <tbody className="text-text-medium">
                  <tr className="border-b border-border">
                    <td className="px-4 py-2 font-mono text-text-high">sku</td>
                    <td className="px-4 py-2">Sí</td>
                    <td className="px-4 py-2">
                      Código único de tu producto. Filas sin SKU se ignoran.
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-2 font-mono text-text-high">
                      nombre
                    </td>
                    <td className="px-4 py-2">No</td>
                    <td className="px-4 py-2">
                      Nombre del producto (ej. &ldquo;Jamón Serrano
                      100g&rdquo;). Si lo agregas, tu dashboard lo muestra en
                      vez del SKU — más fácil de reconocer de un vistazo.
                      También aceptamos{" "}
                      <code className="rounded bg-panel px-1 py-0.5 text-xs">
                        producto
                      </code>{" "}
                      o{" "}
                      <code className="rounded bg-panel px-1 py-0.5 text-xs">
                        nombre_producto
                      </code>{" "}
                      como nombre de columna.
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-2 font-mono text-text-high">
                      stock
                    </td>
                    <td className="px-4 py-2">No</td>
                    <td className="px-4 py-2">
                      Stock actual disponible. Si falta, se asume 0. También
                      aceptamos{" "}
                      <code className="rounded bg-panel px-1 py-0.5 text-xs">
                        stock_actual
                      </code>
                      .
                    </td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="px-4 py-2 font-mono text-text-high">
                      lead_time
                    </td>
                    <td className="px-4 py-2">No</td>
                    <td className="px-4 py-2">
                      Días que demora la reposición de ese producto (proveedor
                      + logística). El cálculo de riesgo descuenta este valor
                      de los días hasta el quiebre — sin él, se asume 0.
                      También aceptamos{" "}
                      <code className="rounded bg-panel px-1 py-0.5 text-xs">
                        lead_time_dias
                      </code>{" "}
                      o{" "}
                      <code className="rounded bg-panel px-1 py-0.5 text-xs">
                        tiempo_entrega
                      </code>
                      .
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-mono text-text-high">
                      (fechas)
                    </td>
                    <td className="px-4 py-2">No</td>
                    <td className="px-4 py-2">
                      Una columna por cada día con ventas de ese producto (ej.{" "}
                      <code className="rounded bg-panel px-1 py-0.5 text-xs">
                        2026-07-01
                      </code>
                      ,{" "}
                      <code className="rounded bg-panel px-1 py-0.5 text-xs">
                        2026-07-02
                      </code>
                      , etc.), con la cantidad vendida ese día como valor.
                      Cualquier columna que no sea sku/nombre/stock/lead_time
                      y tenga un valor numérico se interpreta como una fecha
                      de venta.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              Puedes volver a subir el mismo archivo (o uno actualizado) las
              veces que quieras — cada carga reemplaza los datos de los SKUs
              que coincidan por código, y agrega los que sean nuevos. Tu plan
              define cuántos SKUs distintos puedes monitorear a la vez; si tu
              CSV trae más, se guardan los primeros hasta el límite y te
              avisamos cuántos quedaron afuera.
            </p>
          </section>

          <section id="dashboard">
            <h2 className="font-display text-2xl text-text-high">
              3. Tu dashboard
            </h2>
            <p className="mt-3">
              Una vez que subiste tu primer CSV, tu dashboard muestra:
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              <li>
                <strong className="text-text-high">
                  SKUs en riesgo, unidades en inventario y SKUs monitoreados
                </strong>{" "}
                — un resumen rápido del estado general de tu inventario.
              </li>
              <li>
                <strong className="text-text-high">
                  Ventas reales vs. predicción
                </strong>{" "}
                — un gráfico con tus ventas históricas y una proyección a 15
                días, con un escenario base y dos bandas (optimista y
                pesimista).
              </li>
              <li>
                <strong className="text-text-high">
                  Productos monitoreados
                </strong>{" "}
                — la tabla principal, ordenada por urgencia (los productos en
                riesgo alto aparecen primero). Cada fila muestra el stock
                actual, los días estimados hasta el quiebre, la cantidad
                sugerida a reponer, y un nivel de riesgo:
                <ul className="mt-2 flex flex-col gap-1 pl-4">
                  <li>
                    <span className="rounded-full bg-amber/15 px-2 py-0.5 text-xs font-medium text-amber">
                      Alto
                    </span>{" "}
                    — se quiebra pronto, revísalo primero.
                  </li>
                  <li>
                    <span className="rounded-full bg-teal/15 px-2 py-0.5 text-xs font-medium text-teal">
                      Medio
                    </span>{" "}
                    — vale la pena vigilarlo.
                  </li>
                  <li>
                    <span className="rounded-full bg-text-medium/10 px-2 py-0.5 text-xs font-medium text-text-medium">
                      Bajo
                    </span>{" "}
                    — sin urgencia por ahora.
                  </li>
                </ul>
              </li>
            </ul>
            <p className="mt-3">
              El botón <strong className="text-text-high">&ldquo;Exportar reposición&rdquo;</strong>{" "}
              descarga un CSV con los productos en riesgo alto o medio (SKU,
              nombre, stock, cantidad sugerida y días hasta el quiebre) —
              listo para mandarle a tu proveedor sin copiar filas a mano.
            </p>
            <p className="mt-3">
              Mientras no hayas subido datos propios, el dashboard muestra
              información de ejemplo marcada con la etiqueta{" "}
              <span className="rounded-full border border-text-medium/30 bg-text-medium/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-medium">
                Demo
              </span>{" "}
              — así puedes explorar cómo se ve la herramienta antes de cargar
              tu propio inventario.
            </p>
          </section>

          <section id="configuracion">
            <h2 className="font-display text-2xl text-text-high">
              4. Umbrales de riesgo y perfil de tu negocio
            </h2>
            <p className="mt-3">
              En &ldquo;Umbral de riesgo&rdquo; defines a cuántos días de
              quiebre un producto pasa a riesgo alto o medio — ajústalo según
              cuánto te demora reponer en general. Un negocio con proveedores
              rápidos puede usar umbrales más ajustados; uno con logística
              lenta necesita más margen de aviso.
            </p>
            <p className="mt-3">
              En &ldquo;Perfil de tu negocio&rdquo; puedes indicar tu rubro y
              comuna (ambos opcionales) — los usamos para ajustar la
              predicción por clima y feriados, y para avisarte si sube el
              precio de insumos clave de tu rubro.
            </p>
          </section>

          <section id="sii">
            <h2 className="font-display text-2xl text-text-high">
              5. Sincronizar con el SII
            </h2>
            <p className="mt-3">
              Disponible desde el plan Starter en adelante. Con tu RUT y la
              misma clave con la que entras al portal del SII, RadarStock trae
              tus compras y ventas del Registro de Compras y Ventas (RCV) para
              el período que elijas, sin que tengas que copiarlas a mano.
            </p>
            <p className="mt-3">
              <strong className="text-text-high">Importante:</strong> esta
              sincronización trae los documentos a nivel de folio, contraparte
              (RUT y razón social), monto y fecha — no el detalle de qué
              productos contiene cada factura. Es un complemento útil como
              registro auditable de tus compras y ventas, pero{" "}
              <strong className="text-text-high">no reemplaza</strong> la
              carga de tu CSV de ventas históricas, que es lo que alimenta las
              predicciones de demanda.
            </p>
            <p className="mt-3">
              Tu clave del SII viaja únicamente durante la consulta — nunca
              queda guardada, ni en nuestra base de datos ni en ningún
              registro.
            </p>
          </section>

          <section id="planes">
            <h2 className="font-display text-2xl text-text-high">
              6. Planes y facturación
            </h2>
            <p className="mt-3">
              Desde{" "}
              <Link href="/billing" className="text-teal hover:underline">
                radarstock.cl/billing
              </Link>{" "}
              puedes suscribirte a un plan (Starter, Growth o Enterprise),
              pagando con tarjeta vía Mercado Pago con cobro automático
              mensual. Los precios mostrados ya incluyen IVA y la comisión de
              Mercado Pago.
            </p>
            <p className="mt-3">
              <strong className="text-text-high">Cambiar de plan:</strong> si
              ya tienes un plan activo y eliges otro, te pedimos confirmación
              y luego cancelamos automáticamente tu suscripción anterior antes
              de crear la nueva — nunca quedas pagando dos planes al mismo
              tiempo.
            </p>
            <p className="mt-3">
              <strong className="text-text-high">Cancelar:</strong> puedes
              cancelar tu suscripción en cualquier momento desde la misma
              página. La cancelación aplica hacia adelante, sin reembolso del
              período ya pagado.
            </p>
            <p className="mt-3">
              ¿Prefieres pagar por transferencia en vez de tarjeta? Escríbenos
              a{" "}
              <a
                href="mailto:comercial@radarstock.cl"
                className="text-teal hover:underline"
              >
                comercial@radarstock.cl
              </a>{" "}
              — en ese caso solo se cobra la membresía más IVA, sin la
              comisión de Mercado Pago.
            </p>
          </section>

          <section id="referidos">
            <h2 className="font-display text-2xl text-text-high">
              7. Programa de referidos
            </h2>
            <p className="mt-3">
              Desde{" "}
              <Link href="/referidos" className="text-teal hover:underline">
                radarstock.cl/referidos
              </Link>{" "}
              (una vez logueado) encuentras tu código y link únicos para
              compartir con otros negocios. Cuando alguien se registra con tu
              código y{" "}
              <strong className="text-text-high">
                paga su primer plan
              </strong>
              , te abonamos <strong className="text-text-high">$30.000 CLP</strong>{" "}
              de crédito.
            </p>
            <p className="mt-3">
              El crédito se acumula y se aplica hasta el 100% del monto de tu
              factura mensual — si tienes más crédito del que cubre un mes, el
              excedente queda guardado automáticamente para el siguiente, sin
              vencer. Como Mercado Pago no permite aplicar descuentos
              puntuales sobre una suscripción recurrente, nuestro equipo
              comercial lo aplica a mano contra tu factura — escríbenos a{" "}
              <a
                href="mailto:comercial@radarstock.cl"
                className="text-teal hover:underline"
              >
                comercial@radarstock.cl
              </a>{" "}
              si quieres coordinarlo.
            </p>
          </section>

          <section id="soporte">
            <h2 className="font-display text-2xl text-text-high">
              8. Soporte
            </h2>
            <p className="mt-3">
              ¿Tienes dudas, encontraste un problema, o quieres pedir una
              función nueva? Escríbenos a{" "}
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
