import { getCompanyPlan } from "@/lib/getCompanyPlan";
import BillingPlans from "@/components/BillingPlans";
import ReferralCodeBox from "@/components/ReferralCodeBox";
import { createClient } from "@/utils/supabase/server";

async function getReferralCreditPendiente(companyId: string): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("referral_rewards")
    .select("amount_clp")
    .eq("referrer_company_id", companyId)
    .eq("status", "pendiente");

  return (data ?? []).reduce((sum, r) => sum + r.amount_clp, 0);
}

export default async function BillingPage(
  props: {
    searchParams: Promise<{ message?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const companyPlan = await getCompanyPlan();
  const creditoPendiente = companyPlan
    ? await getReferralCreditPendiente(companyPlan.companyId)
    : 0;

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-3xl font-semibold text-text-high">
          Planes
        </h1>
        <p className="mt-1 text-text-medium">
          Elige el plan que mejor se ajuste a tu empresa.
        </p>

        {searchParams.message && (
          <p className="mt-6 rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
            {searchParams.message}
          </p>
        )}

        <BillingPlans
          currentPlan={companyPlan?.plan ?? null}
          planStatus={companyPlan?.planStatus ?? null}
          hasPreapproval={!!companyPlan?.mpPreapprovalId}
        />

        <p className="mt-8 text-sm text-text-medium">
          ¿Prefieres que te facturemos directo (transferencia), sin
          suscripción automática? Escríbenos — en ese caso solo se cobra la
          membresía + IVA, sin la comisión de tarjeta bancaria.
        </p>

        {companyPlan && (
          <div className="mt-10 rounded-lg border border-border bg-panel-raised p-6">
            <h2 className="font-display text-xl text-text-high">
              Programa de referidos
            </h2>
            <p className="mt-1 text-sm text-text-medium">
              Comparte tu link con otros negocios. Cuando alguien se registre
              con tu código y pague su primer plan, te abonamos{" "}
              <strong>$30.000 CLP</strong> de crédito.
            </p>

            <ReferralCodeBox
              link={`${process.env.NEXT_PUBLIC_APP_URL ?? "https://radarstock.vercel.app"}/signup?ref=${companyPlan.referralCode}`}
            />

            {creditoPendiente > 0 && (
              <p className="mt-4 rounded-md border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-text-high">
                Tienes{" "}
                <strong>${creditoPendiente.toLocaleString("es-CL")} CLP</strong>{" "}
                en crédito por referidos pendiente de aplicar. Escríbenos a{" "}
                <a
                  href={`mailto:${process.env.SALES_EMAIL ?? "comercial@radarstock.cl"}`}
                  className="text-teal hover:underline"
                >
                  {process.env.SALES_EMAIL ?? "comercial@radarstock.cl"}
                </a>{" "}
                para coordinarlo.
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
