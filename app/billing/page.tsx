import { getCompanyPlan } from "@/lib/getCompanyPlan";
import BillingPlans from "@/components/BillingPlans";
import AppHeader from "@/components/AppHeader";

export default async function BillingPage(
  props: {
    searchParams: Promise<{ message?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const companyPlan = await getCompanyPlan();

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <AppHeader />

        <h1 className="mt-8 font-display text-3xl font-semibold text-text-high">
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
      </div>
    </main>
  );
}
