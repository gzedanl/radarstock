"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS, getPriceMercadoPago, type PlanId } from "@/lib/plans";
import CorporatePlanCard from "@/components/CorporatePlanCard";

interface BillingPlansProps {
  currentPlan: string | null;
  planStatus: string | null;
  hasPreapproval: boolean;
}

export default function BillingPlans({
  currentPlan,
  planStatus,
  hasPreapproval,
}: BillingPlansProps) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasActiveSubscription =
    hasPreapproval && !!planStatus && planStatus !== "cancelled";

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

  async function handleCancel() {
    if (
      !window.confirm(
        "¿Seguro que quieres cancelar tu suscripción? Vas a perder acceso a las funciones de tu plan."
      )
    ) {
      return;
    }

    setError(null);
    setIsCancelling(true);

    try {
      const res = await fetch("/api/mercadopago/cancel-preapproval", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo cancelar la suscripción.");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <>
      {error && (
        <p className="mt-6 rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
          {error}
        </p>
      )}

      {hasActiveSubscription && currentPlan && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-teal/40 bg-teal/10 px-6 py-4">
          <p className="text-sm text-text-high">
            Tu plan actual es{" "}
            <strong>
              {PLANS[currentPlan as PlanId]?.name ?? currentPlan}
            </strong>
            {planStatus === "paused" ? " (pausado)" : ""}.
          </p>
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="rounded-md border border-amber/40 px-4 py-2 text-sm font-medium text-amber transition hover:bg-amber/10 disabled:opacity-50"
          >
            {isCancelling ? "Cancelando..." : "Cancelar suscripción"}
          </button>
        </div>
      )}

      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {Object.values(PLANS).map((plan) => {
          const isCurrentPlan = hasActiveSubscription && currentPlan === plan.id;

          return (
            <div
              key={plan.id}
              className="flex flex-col rounded-lg border border-border bg-panel-raised p-8"
            >
              <h3 className="font-display text-xl text-text-high">
                {plan.name}
              </h3>
              <p className="mt-4 font-mono text-3xl text-text-high">
                ${getPriceMercadoPago(plan).toLocaleString("es-CL")}
                <span className="text-base text-text-medium"> CLP/mes</span>
              </p>
              <p className="mt-1 text-xs text-text-medium">
                IVA y comisión de Mercado Pago incluidos
              </p>
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
                disabled={loadingPlan !== null || isCancelling || isCurrentPlan}
                className="mt-8 rounded-md bg-teal px-6 py-3 font-medium text-navy transition hover:opacity-90 disabled:opacity-50"
              >
                {loadingPlan === plan.id
                  ? "Redirigiendo..."
                  : isCurrentPlan
                    ? "Tu plan actual"
                    : "Suscribirme"}
              </button>
            </div>
          );
        })}
        <CorporatePlanCard />
      </div>

      {hasActiveSubscription && (
        <p className="mt-4 text-sm text-text-medium">
          Si cambias a otro plan sin cancelar el actual, vas a quedar con dos
          suscripciones activas y cobros duplicados — cancela primero tu plan
          actual si quieres cambiarte a otro.
        </p>
      )}
    </>
  );
}
