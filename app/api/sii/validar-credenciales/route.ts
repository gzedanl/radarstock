import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  validarCredencialesSii,
  SiiCredencialesInvalidasError,
} from "@/lib/sii";

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

  try {
    await validarCredencialesSii({ rut, password });
    return NextResponse.json({ ok: true });
  } catch (err) {
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
