import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { calcRiesgo, diasHastaQuiebreAjustado } from "@/lib/risk";
import { sendStockAlertEmail, type StockAlertItem } from "@/lib/email";

interface CompanyRow {
  id: string;
  user_id: string;
  dias_alerta_alto: number;
  dias_alerta_medio: number;
  products: {
    sku: string;
    lead_time_dias: number;
    predictions: {
      dias_hasta_quiebre: number | null;
      cantidad_sugerida: number;
    } | null;
  }[];
}

// Disparado por el cron de Vercel (ver vercel.json), una vez al día.
// Usa la misma lógica de riesgo que el dashboard (lib/risk.ts) para que
// las alertas por email nunca contradigan lo que se ve en pantalla.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  const { data: companies, error } = await supabaseAdmin
    .from("companies")
    .select(
      "id, user_id, dias_alerta_alto, dias_alerta_medio, products(sku, lead_time_dias, predictions(dias_hasta_quiebre, cantidad_sugerida))"
    )
    .returns<CompanyRow[]>();

  if (error) {
    console.error("Error leyendo companies para check-alerts:", error.message);
    return NextResponse.json({ error: "Error leyendo empresas" }, { status: 500 });
  }

  let empresasNotificadas = 0;
  let alertasTotales = 0;

  for (const company of companies ?? []) {
    const alertas: StockAlertItem[] = [];

    for (const product of company.products) {
      const diasHastaQuiebre = product.predictions?.dias_hasta_quiebre ?? null;
      const diasAjustado = diasHastaQuiebreAjustado(
        diasHastaQuiebre,
        product.lead_time_dias
      );
      const riesgo = calcRiesgo(
        diasAjustado,
        company.dias_alerta_alto,
        company.dias_alerta_medio
      );

      if (riesgo === "alto") {
        alertas.push({
          sku: product.sku,
          diasHastaQuiebre,
          cantidadSugerida: product.predictions?.cantidad_sugerida ?? 0,
        });
      }
    }

    if (alertas.length === 0) continue;

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(company.user_id);

    if (userError || !userData?.user?.email) {
      console.error(
        "No se pudo obtener el email para company",
        company.id,
        userError?.message
      );
      continue;
    }

    await sendStockAlertEmail(userData.user.email, alertas);
    empresasNotificadas += 1;
    alertasTotales += alertas.length;
  }

  return NextResponse.json({
    status: "ok",
    empresas_revisadas: companies?.length ?? 0,
    empresas_notificadas: empresasNotificadas,
    alertas_totales: alertasTotales,
  });
}
