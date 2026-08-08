import { ADDONS, getPriceMercadoPago } from "@/lib/plans";

// Los add-ons todavía no tienen checkout self-service (el agente de
// WhatsApp no está construido, y el usuario extra requiere ajustar la
// suscripción manualmente) — por eso el CTA es "escríbenos" y no un
// botón de pago directo, para no prometer algo que no se activa solo.
export default function AddonsSection() {
  return (
    <div className="mt-10">
      <h3 className="font-display text-xl text-text-high">Add-ons</h3>
      <p className="mt-2 text-sm text-text-medium">
        Disponibles sobre cualquier plan (Starter, Growth o Enterprise).
      </p>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {Object.values(ADDONS).map((addon) => (
          <div
            key={addon.id}
            className="flex flex-col rounded-lg border border-border bg-panel-raised p-6"
          >
            <h4 className="font-display text-lg text-text-high">
              {addon.name}
            </h4>
            <p className="mt-2 font-mono text-2xl text-text-high">
              ${getPriceMercadoPago(addon).toLocaleString("es-CL")}
              <span className="text-sm text-text-medium">
                {addon.perUnit ? " CLP/usuario/mes" : " CLP/mes"}
              </span>
            </p>
            <p className="mt-1 text-xs text-text-medium">
              IVA y comisión de Mercado Pago incluidos
            </p>
            <p className="mt-3 flex-1 text-sm text-text-medium">
              {addon.description}
            </p>
            {addon.overagePack && (
              <p className="mt-2 text-xs text-text-medium">
                ¿Superas la cuota? Paquete de {addon.overagePack.units}{" "}
                mensajes extra por $
                {getPriceMercadoPago(addon.overagePack).toLocaleString(
                  "es-CL"
                )}{" "}
                CLP.
              </p>
            )}
            <a
              href={`mailto:comercial@radarstock.cl?subject=${encodeURIComponent(
                `Quiero agregar "${addon.name}" a mi plan`
              )}`}
              className="mt-4 self-start rounded-md border border-teal px-4 py-2 text-sm font-medium text-teal transition hover:bg-teal/10"
            >
              Escríbenos para agregarlo
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
