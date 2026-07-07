import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { preApprovalClient } from "@/lib/mercadopago";
import { getPlan } from "@/lib/plans";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const plan = body ? getPlan(body.plan) : undefined;

  if (!plan) {
    return NextResponse.json(
      { error: "Plan inválido. Usa 'starter', 'growth' o 'enterprise'." },
      { status: 400 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  // Mercado Pago exige que back_url sea una URL pública HTTPS: no
  // acepta http://localhost. En dev usamos NEXT_PUBLIC_APP_URL (o el
  // placeholder de producción) en vez de request.url.
  const backUrl = new URL(
    "/dashboard",
    process.env.NEXT_PUBLIC_APP_URL ?? "https://radarstock.vercel.app"
  ).toString();

  try {
    const preapproval = await preApprovalClient.create({
      body: {
        reason: `RadarStock - Plan ${plan.name}`,
        external_reference: company.id,
        payer_email: user.email!,
        back_url: backUrl,
        status: "pending",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          // La cuenta collector opera en CLP; Mercado Pago rechaza
          // cobros recurrentes en USD para cuentas chilenas.
          // plan.priceClp ya incluye IVA — es el precio final mostrado
          // al cliente. La comisión de Mercado Pago es un costo interno.
          transaction_amount: plan.priceClp,
          currency_id: "CLP",
        },
      },
    });

    return NextResponse.json({ init_point: preapproval.init_point });
  } catch (err) {
    // El SDK de Mercado Pago lanza el body de error de la API (no un
    // Error de JS), así que lo logueamos completo para depurar (ej.
    // límites de monto en cuentas de prueba) y devolvemos un mensaje
    // legible en vez de un 500 sin cuerpo.
    console.error("Error creando preapproval en Mercado Pago:", err);
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "No se pudo iniciar la suscripción con Mercado Pago.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
