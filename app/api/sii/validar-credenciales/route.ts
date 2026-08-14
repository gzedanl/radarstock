import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  validarCredencialesSii,
  SiiCredencialesInvalidasError,
} from "@/lib/sii";
import { isTrialExpired } from "@/lib/trialStatus";
import { siiRateLimitExceeded } from "@/lib/siiRateLimit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const rut = typeof body?.rut === "string" ? body.rut.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!rut || !password) {
    return NextResponse.json(
      { error: "Falta RUT o clave SII." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: company } = await supabase
    .from("companies")
    .select("id, plan, trial_ends_at")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  if (isTrialExpired(company.plan, company.trial_ends_at)) {
    return NextResponse.json(
      { error: "Tu período de prueba terminó. Suscríbete a un plan para seguir usando RadarStock." },
      { status: 402 }
    );
  }

  if (await siiRateLimitExceeded(supabase, company.id)) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos y vuelve a intentar." },
      { status: 429 }
    );
  }

  try {
    await validarCredencialesSii({ rut, password });
    // Se registra igual que una sincronización (0 documentos) para que
    // cuente en la misma ventana de rate-limit — si no, alguien podría
    // usar este endpoint sin límite para probar credenciales SII ajenas.
    await supabase.from("sii_sincronizaciones").insert({
      company_id: company.id,
      periodo: new Date().toISOString().slice(0, 7),
      estado: "ok",
      compras_sincronizadas: 0,
      ventas_sincronizadas: 0,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    await supabase.from("sii_sincronizaciones").insert({
      company_id: company.id,
      periodo: new Date().toISOString().slice(0, 7),
      estado: "error",
      compras_sincronizadas: 0,
      ventas_sincronizadas: 0,
      mensaje_error:
        err instanceof SiiCredencialesInvalidasError
          ? err.message
          : "Error validando con el SII.",
    });

    if (err instanceof SiiCredencialesInvalidasError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("Error validando credenciales SII:", err);
    return NextResponse.json(
      { error: "No se pudo validar con el SII. Intenta de nuevo." },
      { status: 502 }
    );
  }
}
