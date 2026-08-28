import { redirect } from "next/navigation";
import { getCompanyPlan } from "@/lib/getCompanyPlan";
import AppHeader from "@/components/AppHeader";
import AuditoriaScanner from "@/components/AuditoriaScanner";

export default async function AuditoriaPage() {
  const companyPlan = await getCompanyPlan();

  if (!companyPlan) {
    redirect("/login");
  }

  if (companyPlan.isTrialExpired) {
    redirect(
      `/billing?message=${encodeURIComponent(
        "Tu período de prueba terminó. Suscríbete a un plan para volver a acceder a RadarStock Cam."
      )}`
    );
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <AppHeader />

        <h1 className="mt-8 font-display text-3xl font-semibold text-text-high">
          RadarStock Cam
        </h1>
        <p className="mt-1 text-text-medium">
          Cuenta tu inventario con la cámara y compáralo contra el stock que
          RadarStock cree que tienes.
        </p>

        <div className="mt-8">
          <AuditoriaScanner />
        </div>
      </div>
    </main>
  );
}
