import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminEmail } from "@/lib/isAdmin";
import { PLANS } from "@/lib/plans";
import AppHeader from "@/components/AppHeader";
import { aplicarCreditoReferido, aprobarPremioReferido } from "./actions";

interface CompanyRow {
  id: string;
  name: string;
  user_id: string;
  plan: string;
  plan_status: string | null;
  trial_ends_at: string | null;
  referred_by_company_id: string | null;
  created_at: string;
}

interface RewardRow {
  id: string;
  referrer_company_id: string;
  referred_company_id: string;
  amount_clp: number;
  monto_aplicado: number;
  status: "pendiente" | "revision_pendiente" | "aplicado";
  created_at: string;
}

async function getAdminData() {
  const supabaseAdmin = createAdminClient();

  const [{ data: companies }, { data: usersList }, { data: rewards }] =
    await Promise.all([
      supabaseAdmin
        .from("companies")
        .select(
          "id, name, user_id, plan, plan_status, trial_ends_at, referred_by_company_id, created_at"
        )
        .order("created_at", { ascending: false })
        .returns<CompanyRow[]>(),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      supabaseAdmin
        .from("referral_rewards")
        .select(
          "id, referrer_company_id, referred_company_id, amount_clp, monto_aplicado, status, created_at"
        )
        .returns<RewardRow[]>(),
    ]);

  const emailByUserId = new Map(
    (usersList?.users ?? []).map((u) => [u.id, u.email ?? "—"])
  );
  const nameByCompanyId = new Map(
    (companies ?? []).map((c) => [c.id, c.name])
  );

  const rows = (companies ?? []).map((c) => ({
    ...c,
    email: emailByUserId.get(c.user_id) ?? "—",
    referidoPor: c.referred_by_company_id
      ? (nameByCompanyId.get(c.referred_by_company_id) ?? "—")
      : null,
  }));

  // Crédito disponible por referente — solo premios en estado
  // "pendiente" (los en revisión no se pueden aplicar todavía).
  const disponiblePorReferente = new Map<string, number>();
  for (const r of rewards ?? []) {
    if (r.status !== "pendiente") continue;
    const disponible = r.amount_clp - Number(r.monto_aplicado);
    if (disponible <= 0) continue;
    disponiblePorReferente.set(
      r.referrer_company_id,
      (disponiblePorReferente.get(r.referrer_company_id) ?? 0) + disponible
    );
  }
  const creditosPorReferente = Array.from(disponiblePorReferente.entries())
    .map(([referrerCompanyId, disponible]) => ({
      referrerCompanyId,
      referrerName: nameByCompanyId.get(referrerCompanyId) ?? "—",
      disponible,
    }))
    .sort((a, b) => b.disponible - a.disponible);

  const premiosEnRevision = (rewards ?? [])
    .filter((r) => r.status === "revision_pendiente")
    .map((r) => ({
      id: r.id,
      referrerName: nameByCompanyId.get(r.referrer_company_id) ?? "—",
      referredName: nameByCompanyId.get(r.referred_company_id) ?? "—",
      createdAt: r.created_at,
    }));

  return { rows, creditosPorReferente, premiosEnRevision };
}

export default async function AdminPage(props: {
  searchParams: Promise<{ mensaje?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    redirect("/dashboard");
  }

  const { rows, creditosPorReferente, premiosEnRevision } = await getAdminData();
  const referidos = rows.filter((r) => r.referidoPor).length;
  const hoyISO = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <AppHeader />

        <h1 className="mt-8 font-display text-3xl font-semibold text-text-high">
          Admin — Clientes
        </h1>
        <p className="mt-1 text-text-medium">
          {rows.length} empresas registradas · {referidos} llegaron por
          referido.
        </p>

        {searchParams.mensaje && (
          <p className="mt-4 rounded-md border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-text-high">
            {searchParams.mensaje}
          </p>
        )}
        {searchParams.error && (
          <p className="mt-4 rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
            {searchParams.error}
          </p>
        )}

        {premiosEnRevision.length > 0 && (
          <div className="mt-8 rounded-lg border border-amber/40 bg-amber/10 p-6">
            <h2 className="font-display text-lg text-text-high">
              Premios en revisión ({premiosEnRevision.length})
            </h2>
            <p className="mt-1 text-sm text-text-medium">
              El referente acumuló 3+ convertidos en 30 días. Valida que sean
              negocios reales antes de aprobar.
            </p>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase text-text-medium">
                  <th className="pb-2 font-medium">Referente</th>
                  <th className="pb-2 font-medium">Referido</th>
                  <th className="pb-2 font-medium">Fecha</th>
                  <th className="pb-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {premiosEnRevision.map((p) => (
                  <tr key={p.id} className="border-t border-amber/20">
                    <td className="py-2 text-text-high">{p.referrerName}</td>
                    <td className="py-2 text-text-medium">{p.referredName}</td>
                    <td className="py-2 text-text-medium">
                      {new Date(p.createdAt).toLocaleDateString("es-CL")}
                    </td>
                    <td className="py-2 text-right">
                      <form action={aprobarPremioReferido}>
                        <input type="hidden" name="rewardId" value={p.id} />
                        <button
                          type="submit"
                          className="rounded-md border border-teal/40 px-3 py-1 text-xs font-medium text-teal transition hover:bg-teal/10"
                        >
                          Aprobar
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {creditosPorReferente.length > 0 && (
          <div className="mt-8 rounded-lg border border-border bg-panel-raised p-6">
            <h2 className="font-display text-lg text-text-high">
              Aplicar crédito de referido
            </h2>
            <p className="mt-1 text-sm text-text-medium">
              Se aplica hasta el 100% del monto de la factura ingresada; el
              excedente queda pendiente para el próximo mes.
            </p>

            <ul className="mt-3 text-sm text-text-medium">
              {creditosPorReferente.map((c) => (
                <li key={c.referrerCompanyId}>
                  {c.referrerName}: ${c.disponible.toLocaleString("es-CL")} CLP
                  disponibles
                </li>
              ))}
            </ul>

            <form
              action={aplicarCreditoReferido}
              className="mt-4 flex flex-wrap items-end gap-3"
            >
              <div>
                <label className="text-xs text-text-medium">Referente</label>
                <select
                  name="referrerCompanyId"
                  required
                  className="mt-1 block rounded-md border border-border bg-panel px-3 py-2 text-sm text-text-high outline-none focus:border-teal"
                >
                  {creditosPorReferente.map((c) => (
                    <option key={c.referrerCompanyId} value={c.referrerCompanyId}>
                      {c.referrerName} (${c.disponible.toLocaleString("es-CL")})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-medium">
                  Monto de la factura (CLP)
                </label>
                <input
                  type="number"
                  name="montoFactura"
                  required
                  min={1}
                  className="mt-1 block w-40 rounded-md border border-border bg-panel px-3 py-2 text-sm text-text-high outline-none focus:border-teal"
                />
              </div>
              <div>
                <label className="text-xs text-text-medium">Mes</label>
                <input
                  type="date"
                  name="mes"
                  required
                  defaultValue={hoyISO}
                  className="mt-1 block rounded-md border border-border bg-panel px-3 py-2 text-sm text-text-high outline-none focus:border-teal"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-navy transition hover:opacity-90"
              >
                Aplicar
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-panel-raised">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-text-medium">
                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  Empresa
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  Email
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  Plan
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  Estado
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  Registrado el
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  Vence trial
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  Referido por
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-text-high">
                    {r.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-medium">
                    {r.email}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-medium">
                    {PLANS[r.plan as keyof typeof PLANS]?.name ?? r.plan}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-medium">
                    {r.plan_status ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-medium">
                    {new Date(r.created_at).toLocaleDateString("es-CL")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-medium">
                    {r.plan === "trial" && r.trial_ends_at
                      ? new Date(r.trial_ends_at).toLocaleDateString("es-CL")
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {r.referidoPor ? (
                      <span className="rounded-full bg-teal/10 px-2 py-1 text-xs text-teal">
                        {r.referidoPor}
                      </span>
                    ) : (
                      <span className="text-text-medium">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
