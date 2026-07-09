import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { preApprovalClient } from "@/lib/mercadopago";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id, mp_preapproval_id, plan_status")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  if (!company.mp_preapproval_id) {
    return NextResponse.json(
      { error: "No tienes una suscripción activa para cancelar." },
      { status: 400 }
    );
  }

  if (company.plan_status === "cancelled") {
    return NextResponse.json(
      { error: "Tu suscripción ya está cancelada." },
      { status: 400 }
    );
  }

  try {
    await preApprovalClient.update({
      id: company.mp_preapproval_id,
      body: { status: "cancelled" },
    });
  } catch (err) {
    // El SDK de Mercado Pago lanza el body de error de la API (no un
    // Error de JS), así que lo logueamos completo para depurar.
    console.error("Error cancelando preapproval en Mercado Pago:", err);
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "No se pudo cancelar la suscripción con Mercado Pago.";

    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Actualiza de inmediato para que la UI refleje el cambio sin esperar
  // el webhook — cuando llegue, va a confirmar el mismo estado.
  const { error: updateError } = await supabase
    .from("companies")
    .update({ plan_status: "cancelled" })
    .eq("id", company.id);

  if (updateError) {
    console.error(
      "Error actualizando plan_status tras cancelar:",
      updateError.message
    );
  }

  return NextResponse.json({ status: "ok" });
}
