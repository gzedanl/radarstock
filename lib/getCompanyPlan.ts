import { createClient } from "@/utils/supabase/server";
import { PLANS, type Plan } from "@/lib/plans";

export interface CompanyPlanInfo {
  companyId: string;
  plan: string;
  planStatus: string;
  trialEndsAt: string | null;
  isTrialExpired: boolean;
  limits: Plan;
  diasAlertaAlto: number;
  diasAlertaMedio: number;
}

// Mientras la empresa está en trial (o tiene un plan no reconocido),
// se gatean features con los límites de Starter.
const FALLBACK_LIMITS = PLANS.starter;

export async function getCompanyPlan(): Promise<CompanyPlanInfo | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: company } = await supabase
    .from("companies")
    .select(
      "id, plan, plan_status, trial_ends_at, dias_alerta_alto, dias_alerta_medio"
    )
    .eq("user_id", user.id)
    .single();

  if (!company) return null;

  const isTrialExpired =
    company.plan === "trial" &&
    !!company.trial_ends_at &&
    new Date(company.trial_ends_at) < new Date();

  return {
    companyId: company.id,
    plan: company.plan,
    planStatus: company.plan_status,
    trialEndsAt: company.trial_ends_at,
    isTrialExpired,
    limits: PLANS[company.plan as keyof typeof PLANS] ?? FALLBACK_LIMITS,
    diasAlertaAlto: company.dias_alerta_alto,
    diasAlertaMedio: company.dias_alerta_medio,
  };
}
