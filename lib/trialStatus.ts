// Un solo lugar para calcular si el trial venció, reutilizado por
// getCompanyPlan() (para el banner) y por las rutas que ahora bloquean
// funcionalidad cuando el trial expiró sin que la empresa haya pagado.
export function isTrialExpired(
  plan: string,
  trialEndsAt: string | null
): boolean {
  return plan === "trial" && !!trialEndsAt && new Date(trialEndsAt) < new Date();
}

// El SII cuesta créditos reales de API Gateway por consulta (a
// diferencia de la carga de CSV, que no tiene costo marginal) — se
// restringe a planes pagos desde el primer día, no solo cuando el
// trial vence, para no exponerlo a que alguien abra una cuenta gratis
// solo para consumir créditos sin pagar nunca.
export function isTrialPlan(plan: string): boolean {
  return plan === "trial";
}
