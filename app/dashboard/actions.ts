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

  const supabase = await createClient();
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

// Pre-Fase 4 / Fase 4 (paso 3): rubro y comuna alimentan los ajustes de
// demanda por clima/feriados y las alertas de insumos que ya existen en
// el servicio ML (radarstock-ml/services/demand_adjustments.py y
// market_signals.py) pero que hasta ahora nunca recibían estos datos.
export async function updateCompanyProfile(formData: FormData) {
  const rubroRaw = String(formData.get("rubro") ?? "").trim();
  const comunaRaw = String(formData.get("comuna") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("companies")
    .update({
      rubro: rubroRaw || null,
      comuna: comunaRaw || null,
    })
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
}
