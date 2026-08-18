import { redirect } from "next/navigation";
import { getCompanyPlan } from "@/lib/getCompanyPlan";
import { createClient } from "@/utils/supabase/server";
import AppHeader from "@/components/AppHeader";
import ReferralCodeBox from "@/components/ReferralCodeBox";

interface Referido {
  id: string;
  name: string;
  created_at: string;
  convertido: boolean;
  recompensa_status: "pendiente" | "revision_pendiente" | "aplicado" | null;
  recompensa_monto: number | null;
  recompensa_monto_aplicado: number | null;
}

async function getMisReferidos(): Promise<Referido[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_mis_referidos");

  if (error) {
    console.error("Error obteniendo referidos:", error.message);
    return [];
  }

  return data ?? [];
}

const REFERRAL_REWARD_CLP = 30000;

export default async function ReferidosPage() {
  const companyPlan = await getCompanyPlan();

  if (!companyPlan) {
    redirect("/login");
  }

  const referidos = await getMisReferidos();

  const convertidos = referidos.filter((r) => r.convertido);
  const creditoTotal = convertidos.reduce(
    (sum, r) => sum + (r.recompensa_monto ?? REFERRAL_REWARD_CLP),
    0
  );
  // Disponible para la próxima factura — solo premios ya confirmados
  // (pendiente) y no consumidos todavía; el excedente de un mes anterior
  // hace rollover automático acá porque se resta lo ya aplicado.
  const creditoDisponible = referidos
    .filter((r) => r.recompensa_status === "pendiente")
    .reduce(
      (sum, r) =>
        sum + (r.recompensa_monto ?? 0) - (r.recompensa_monto_aplicado ?? 0),
      0
    );
  const enValidacion = referidos.filter(
    (r) => r.recompensa_status === "revision_pendiente"
  ).length;

  const link = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://radarstock.vercel.app"}/signup?ref=${companyPlan.referralCode}`;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <AppHeader />

        <h1 className="mt-8 font-display text-3xl font-semibold text-text-high">
          Programa de referidos
        </h1>
        <p className="mt-1 text-text-medium">
          Comparte tu link con otros negocios. Cuando el negocio que refieras
          pague su primer plan, te abonamos{" "}
          <strong className="text-text-high">
            ${REFERRAL_REWARD_CLP.toLocaleString("es-CL")} CLP
          </strong>{" "}
          de crédito.
        </p>

        <div className="mt-6 rounded-lg border border-border bg-panel-raised p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-text-medium">
            Tu código único
          </p>
          <p className="mt-1 font-display text-2xl text-text-high">
            {companyPlan.referralCode}
          </p>
          <ReferralCodeBox link={link} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-panel-raised p-5">
            <p className="text-3xl font-semibold text-text-high">
              {referidos.length}
            </p>
            <p className="mt-1 text-sm text-text-medium">Referidos registrados</p>
          </div>
          <div className="rounded-lg border border-border bg-panel-raised p-5">
            <p className="text-3xl font-semibold text-text-high">
              {convertidos.length}
            </p>
            <p className="mt-1 text-sm text-text-medium">Convertidos (pagaron)</p>
          </div>
          <div className="rounded-lg border border-teal/40 bg-teal/10 p-5">
            <p className="text-3xl font-semibold text-teal">
              ${creditoTotal.toLocaleString("es-CL")}
            </p>
            <p className="mt-1 text-sm text-text-medium">
              Crédito acumulado
              {creditoDisponible > 0 && (
                <>
                  {" "}
                  · ${creditoDisponible.toLocaleString("es-CL")} disponibles
                  para tu próxima factura
                </>
              )}
            </p>
          </div>
        </div>

        {creditoDisponible > 0 && (
          <p className="mt-4 rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-text-high">
            Tienes ${creditoDisponible.toLocaleString("es-CL")} CLP en
            crédito disponible. Se aplica hasta el 100% del monto de tu
            próxima factura — si sobra, queda guardado para la siguiente.
            Escríbenos a{" "}
            <a
              href={`mailto:${process.env.SALES_EMAIL ?? "comercial@radarstock.cl"}`}
              className="text-teal hover:underline"
            >
              {process.env.SALES_EMAIL ?? "comercial@radarstock.cl"}
            </a>{" "}
            si tienes dudas.
          </p>
        )}

        {enValidacion > 0 && (
          <p className="mt-4 rounded-md border border-border bg-panel px-4 py-3 text-sm text-text-medium">
            Tienes {enValidacion} premio{enValidacion === 1 ? "" : "s"} en
            validación — nuestro equipo lo confirma en breve.
          </p>
        )}

        <div className="mt-8 rounded-lg border border-border bg-panel-raised p-6">
          <h2 className="font-display text-lg text-text-high">Tus referidos</h2>

          {referidos.length === 0 ? (
            <p className="mt-3 text-sm text-text-medium">
              Todavía no tienes referidos. Comparte tu link para empezar a
              sumar crédito.
            </p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-text-medium">
                  <th className="pb-2 font-medium">Negocio</th>
                  <th className="pb-2 font-medium">Registrado el</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Recompensa</th>
                </tr>
              </thead>
              <tbody>
                {referidos.map((r) => {
                  const disponible =
                    (r.recompensa_monto ?? 0) - (r.recompensa_monto_aplicado ?? 0);
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-3 text-text-high">{r.name}</td>
                      <td className="py-3 text-text-medium">
                        {new Date(r.created_at).toLocaleDateString("es-CL")}
                      </td>
                      <td className="py-3">
                        {r.convertido ? (
                          <span className="rounded-full bg-teal/10 px-2 py-1 text-xs text-teal">
                            Convertido
                          </span>
                        ) : (
                          <span className="rounded-full bg-panel px-2 py-1 text-xs text-text-medium">
                            Registrado
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-text-medium">
                        {r.recompensa_status === "aplicado"
                          ? "Aplicado"
                          : r.recompensa_status === "revision_pendiente"
                            ? "En validación"
                            : r.recompensa_status === "pendiente"
                              ? `Pendiente ($${disponible.toLocaleString("es-CL")})`
                              : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
