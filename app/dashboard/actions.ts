"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

// Pre-Fase 4 (P1.1): permite que cada empresa ajuste sus propios
// umbrales de riesgo en vez de los 5/14 días fijos que tenía el
// dashboard. RLS (companies_update_own) ya impide que una empresa
// edite los umbrales de otra.
export async function updateRiskThresholds(formData: FormData) {
  const diasAlertaAlto = Number(formData.get("dias_alerta_alto"));
  const diasAlertaMedio = Number(formData.get("dias_alerta_medio"));

  if (
    !Number.isFinite(diasAlertaAlto) ||
    !Number.isFinite(diasAlertaMedio) ||
    diasAlertaAlto < 1 ||
    diasAlertaMedio <= diasAlertaAlto
  ) {
    return;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("companies")
    .update({
      dias_alerta_alto: diasAlertaAlto,
      dias_alerta_medio: diasAlertaMedio,
    })
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}
