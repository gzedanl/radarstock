import { NextRequest, NextResponse } from "next/server";
import { sendCorporateLeadEmail } from "@/lib/email";

const MAX_FIELD_LENGTH = 2000;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  // Honeypot: campo oculto que solo un bot rellenaría.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const empresa = typeof body.empresa === "string" ? body.empresa.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const telefono = typeof body.telefono === "string" ? body.telefono.trim() : "";
  const mensaje = typeof body.mensaje === "string" ? body.mensaje.trim() : "";

  if (!empresa || !email) {
    return NextResponse.json(
      { error: "Empresa y email son obligatorios." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  if (
    empresa.length > MAX_FIELD_LENGTH ||
    email.length > MAX_FIELD_LENGTH ||
    telefono.length > MAX_FIELD_LENGTH ||
    mensaje.length > MAX_FIELD_LENGTH
  ) {
    return NextResponse.json({ error: "Uno de los campos es demasiado largo." }, { status: 400 });
  }

  await sendCorporateLeadEmail({
    empresa,
    email,
    telefono: telefono || undefined,
    mensaje: mensaje || undefined,
  });

  return NextResponse.json({ ok: true });
}
