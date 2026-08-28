"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminEmail } from "@/lib/isAdmin";
import { applyCreditToInvoice, type CreditoDisponible } from "@/lib/referralCredit";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    redirect("/dashboard");
  }
}

// Aplica el crédito pendiente de un referente contra el monto de su
// factura de un mes dado — cap al 100% de la factura, el excedente
// queda pendiente para el próximo mes (ver lib/referralCredit.ts).
export async function aplicarCreditoReferido(formData: FormData) {
  await requireAdmin();

  const referrerCompanyId = String(formData.get("referrerCompanyId") ?? "");
  const montoFactura = Number(formData.get("montoFactura") ?? 0);
  const mes = String(formData.get("mes") ?? "");

  if (!referrerCompanyId || !mes || !Number.isFinite(montoFactura) || montoFactura <= 0) {
    redirect(
      `/admin?error=${encodeURIComponent("Datos incompletos para aplicar el crédito.")}`
    );
  }

  const supabaseAdmin = createAdminClient();

  const { data: creditos } = await supabaseAdmin
    .from("referral_rewards")
    .select("id, amount_clp, monto_aplicado")
    .eq("referrer_company_id", referrerCompanyId)
    .eq("status", "pendiente")
    .order("created_at", { ascending: true });

  const creditosDisponibles: CreditoDisponible[] = (creditos ?? []).map((c) => ({
    id: c.id,
    amountClp: c.amount_clp,
    montoAplicado: Number(c.monto_aplicado),
  }));

  const aplicaciones = applyCreditToInvoice(creditosDisponibles, montoFactura);

  for (const a of aplicaciones) {
    const { error } = await supabaseAdmin
      .from("referral_rewards")
      .update({
        monto_aplicado: a.nuevoMontoAplicado,
        mes_aplicacion: mes,
        status: a.nuevoEstado,
        ...(a.nuevoEstado === "aplicado" ? { applied_at: new Date().toISOString() } : {}),
      })
      .eq("id", a.id);

    if (error) {
      console.error("Error aplicando crédito de referido:", error.message);
    }
  }

  const totalAplicado = aplicaciones.reduce((sum, a) => sum + a.montoAAplicar, 0);

  revalidatePath("/admin");
  redirect(
    `/admin?mensaje=${encodeURIComponent(
      `Se aplicaron $${totalAplicado.toLocaleString("es-CL")} CLP de crédito.`
    )}`
  );
}

// El control de fraude (0013) deja los premios de referentes con 3+
// convertidos en 30 días en revision_pendiente en vez de bloquearlos —
// esto es lo que el equipo comercial usa tras validar que la empresa
// referida es real, para que el premio vuelva a quedar aplicable.
export async function aprobarPremioReferido(formData: FormData) {
  await requireAdmin();

  const rewardId = String(formData.get("rewardId") ?? "");
  if (!rewardId) {
    redirect(`/admin?error=${encodeURIComponent("Falta el id del premio a aprobar.")}`);
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("referral_rewards")
    .update({ status: "pendiente" })
    .eq("id", rewardId)
    .eq("status", "revision_pendiente");

  if (error) {
    console.error("Error aprobando premio de referido:", error.message);
    redirect(`/admin?error=${encodeURIComponent("No se pudo aprobar el premio.")}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?mensaje=${encodeURIComponent("Premio aprobado, ya puede aplicarse.")}`);
}

// Registra addons vendidos fuera del flujo automático de Mercado Pago
// (ej. un cliente que pagó por transferencia) — no otorga acceso real
// a usuarios adicionales ni al agente de WhatsApp, ambos pendientes de
// construir; es solo el registro para control comercial.
export async function actualizarAddonsCompania(formData: FormData) {
  await requireAdmin();

  const companyId = String(formData.get("companyId") ?? "");
  const usuariosExtra = Number(formData.get("usuariosExtra") ?? 0);
  const agenteWhatsapp = formData.get("agenteWhatsapp") === "on";

  if (!companyId || !Number.isFinite(usuariosExtra) || usuariosExtra < 0) {
    redirect(`/admin?error=${encodeURIComponent("Datos inválidos para actualizar addons.")}`);
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("companies")
    .update({ usuarios_extra: usuariosExtra, agente_whatsapp: agenteWhatsapp })
    .eq("id", companyId);

  if (error) {
    console.error("Error actualizando addons de la empresa:", error.message);
    redirect(`/admin?error=${encodeURIComponent("No se pudo actualizar los addons.")}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?mensaje=${encodeURIComponent("Addons actualizados.")}`);
}
