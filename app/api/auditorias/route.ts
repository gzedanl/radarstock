import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET: trae la auditoría en curso (si hay una) más el catálogo de
// productos de la empresa, para que la pantalla de escaneo arranque
// con todo lo que necesita en una sola llamada.
export async function GET() {
  const supabase = await createClient();
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

  const [{ data: productos }, { data: auditoriaActiva }, { data: codigos }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, sku, nombre, stock_actual")
        .eq("company_id", company.id)
        .order("sku"),
      supabase
        .from("physical_audits")
        .select("id, iniciado_en")
        .eq("company_id", company.id)
        .eq("estado", "en_progreso")
        .order("iniciado_en", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("barcodes_map")
        .select("codigo_barras, product_id, unidades_por_escaneo")
        .eq("company_id", company.id),
    ]);

  let items: { product_id: string; stock_contado: number }[] = [];
  if (auditoriaActiva) {
    const { data } = await supabase
      .from("audit_items")
      .select("product_id, stock_contado")
      .eq("audit_id", auditoriaActiva.id);
    items = data ?? [];
  }

  return NextResponse.json({
    auditoria: auditoriaActiva
      ? { id: auditoriaActiva.id, iniciadoEn: auditoriaActiva.iniciado_en }
      : null,
    productos: (productos ?? []).map((p) => ({
      id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      stockActual: p.stock_actual,
    })),
    codigosBarras: (codigos ?? []).map((c) => ({
      codigoBarras: c.codigo_barras,
      productId: c.product_id,
      unidadesPorEscaneo: c.unidades_por_escaneo,
    })),
    items: items.map((i) => ({
      productId: i.product_id,
      stockContado: i.stock_contado,
    })),
  });
}

// POST: arranca una auditoría nueva, o devuelve la que ya está en
// curso — evita duplicados si el usuario recarga la página a mitad de
// un conteo.
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
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!company) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  const { data: existente } = await supabase
    .from("physical_audits")
    .select("id, iniciado_en")
    .eq("company_id", company.id)
    .eq("estado", "en_progreso")
    .order("iniciado_en", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existente) {
    return NextResponse.json({ id: existente.id, iniciadoEn: existente.iniciado_en });
  }

  const { data: nueva, error } = await supabase
    .from("physical_audits")
    .insert({ company_id: company.id, user_id: user.id })
    .select("id, iniciado_en")
    .single();

  if (error || !nueva) {
    console.error("Error creando auditoría:", error?.message);
    return NextResponse.json(
      { error: "No se pudo iniciar la auditoría." },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: nueva.id, iniciadoEn: nueva.iniciado_en });
}
