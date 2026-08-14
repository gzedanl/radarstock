// Un solo lugar para calcular si el trial venció, reutilizado por
// getCompanyPlan() (para el banner) y por las rutas que ahora bloquean
// funcionalidad cuando el trial expiró sin que la empresa haya pagado.
export function isTrialExpired(
  plan: string,
  trialEndsAt: string | null
): boolean {
  return plan === "trial" && !!trialEndsAt && new Date(trialEndsAt) < new Date();
}
