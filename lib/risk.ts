import type { RiskLevel } from "@/components/ProductTable";

// Compartido entre app/dashboard/page.tsx y app/api/cron/check-alerts,
// para que la tabla del dashboard y las alertas por email clasifiquen
// el riesgo exactamente igual — una sola fuente de verdad.
export function calcRiesgo(
  diasHastaQuiebreAjustado: number | null,
  diasAlertaAlto: number,
  diasAlertaMedio: number
): RiskLevel {
  if (diasHastaQuiebreAjustado === null) return "bajo";
  if (diasHastaQuiebreAjustado <= diasAlertaAlto) return "alto";
  if (diasHastaQuiebreAjustado <= diasAlertaMedio) return "medio";
  return "bajo";
}

// El riesgo se calcula sobre los días hasta el quiebre YA descontado el
// lead time de reposición, no sobre el día de quiebre físico — ver
// docs/ROADMAP_PRE_FASE_4.md (P2.2).
export function diasHastaQuiebreAjustado(
  diasHastaQuiebre: number | null,
  leadTimeDias: number
): number | null {
  return diasHastaQuiebre !== null
    ? Math.max(0, diasHastaQuiebre - leadTimeDias)
    : null;
}
