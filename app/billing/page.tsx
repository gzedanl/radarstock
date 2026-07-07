"use client";

import { useState } from "react";
import { PLANS, type PlanId } from "@/lib/plans";

export default function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe(planId: PlanId) {
    setError(null);
    setLoadingPlan(planId);

    try {
      const res = await fetch("/api/mercadopago/create-preapproval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await res.json();

      if (!res.ok || !data.init_point) {
        throw new Error(data.error ?? "No se pudo iniciar la suscripción.");
      }

      window.location.href = data.init_point;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-3xl font-semibold text-text-high">
          Planes
        </h1>
        <p className="mt-1 text-text-medium">
          Elige el plan que mejor se ajuste a tu empresa.
        </p>

        {error && (
          <p className="mt-6 rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
            {error}
          </p>
        )}

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {Object.values(PLANS).map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col rounded-lg border border-border bg-panel-raised p-8"
            >
              <h3 className="font-display text-xl text-text-high">
                {plan.name}
              </h3>
              <p className="mt-4 font-mono text-3xl text-text-high">
                ${plan.priceClp.toLocaleString("es-CL")}
                <span className="text-base text-text-medium"> CLP/mes</span>
              </p>
              <p className="mt-1 text-xs text-text-medium">IVA incluido</p>
              <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-text-medium">
                <li>
                  {plan.maxSkus === Infinity
                    ? "SKUs ilimitados"
                    : `Hasta ${plan.maxSkus} SKUs monitoreados`}
                </li>
                <li>
                  {plan.maxUsers === Infinity
                    ? "Usuarios ilimitados"
                    : `${plan.maxUsers} usuario(s)`}
                </li>
                <li>
                  {plan.whatsappAlerts
                    ? "Alertas por email y WhatsApp"
                    : "Alertas por email"}
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loadingPlan !== null}
                className="mt-8 rounded-md bg-teal px-6 py-3 font-medium text-navy transition hover:opacity-90 disabled:opacity-50"
              >
                {loadingPlan === plan.id ? "Redirigiendo..." : "Suscribirme"}
              </button>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-text-medium">
          ¿Prefieres que te facturemos directo (transferencia), sin
          suscripción automática? Escríbenos — en ese caso solo se cobra la
          membresía + IVA, sin la comisión de tarjeta bancaria.
        </p>
      </div>
    </main>
  );
}
