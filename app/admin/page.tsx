import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminEmail } from "@/lib/isAdmin";
import { PLANS } from "@/lib/plans";
import AppHeader from "@/components/AppHeader";

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

async function getAdminData() {
  const supabaseAdmin = createAdminClient();

  const [{ data: companies }, { data: usersList }] = await Promise.all([
    supabaseAdmin
      .from("companies")
      .select(
        "id, name, user_id, plan, plan_status, trial_ends_at, referred_by_company_id, created_at"
      )
      .order("created_at", { ascending: false })
      .returns<CompanyRow[]>(),
    supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailByUserId = new Map(
    (usersList?.users ?? []).map((u) => [u.id, u.email ?? "—"])
  );
  const nameByCompanyId = new Map(
    (companies ?? []).map((c) => [c.id, c.name])
  );

  return (companies ?? []).map((c) => ({
    ...c,
    email: emailByUserId.get(c.user_id) ?? "—",
    referidoPor: c.referred_by_company_id
      ? (nameByCompanyId.get(c.referred_by_company_id) ?? "—")
      : null,
  }));
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    redirect("/dashboard");
  }

  const rows = await getAdminData();
  const referidos = rows.filter((r) => r.referidoPor).length;

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

        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-panel-raised">
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
