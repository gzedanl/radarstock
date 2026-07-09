import { getCompanyPlan } from "@/lib/getCompanyPlan";
import BillingPlans from "@/components/BillingPlans";

export default async function BillingPage() {
  const companyPlan = await getCompanyPlan();

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-3xl font-semibold text-text-high">
          Planes
        </h1>
        <p className="mt-1 text-text-medium">
          Elige el plan que mejor se ajuste a tu empresa.
        </p>

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
