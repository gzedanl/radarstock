import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { resumenDiscrepancias } from "@/lib/audit";

// POST: cierra una auditoría en curso, vuelca el conteo a
// products.stock_actual_real y devuelve el resumen de discrepancias
// (merma) para mostrarlo en pantalla.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auditoriaId } = await params;
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

  const { data: auditoria } = await supabase
    .from("physical_audits")
    .select("id, estado")
    .eq("id", auditoriaId)
    .eq("company_id", company.id)
    .single();

  if (!auditoria) {
    return NextResponse.json({ error: "Auditoría no encontrada" }, { status: 404 });
  }

  if (auditoria.estado !== "en_progreso") {
    return NextResponse.json(
      { error: "La auditoría ya no está en curso." },
      { status: 409 }
    );
  }

  const { data: items } = await supabase
    .from("audit_items")
    .select("product_id, stock_teorico, stock_contado")
    .eq("audit_id", auditoriaId);

  const ahora = new Date().toISOString();

  await Promise.all(
    (items ?? []).map((item) =>
      supabase
        .from("products")
        .update({
          stock_actual_real: item.stock_contado,
          stock_actual_real_actualizado_en: ahora,
        })
        .eq("id", item.product_id)
    )
  );

  const { error: cierreError } = await supabase
    .from("physical_audits")
    .update({ estado: "finalizada", finalizado_en: ahora })
    .eq("id", auditoriaId);

  if (cierreError) {
    console.error("Error cerrando auditoría:", cierreError.message);
    return NextResponse.json(
      { error: "No se pudo cerrar la auditoría." },
      { status: 500 }
    );
  }

  const discrepancias = resumenDiscrepancias(
    (items ?? []).map((item) => ({
      productId: item.product_id,
      stockTeorico: item.stock_teorico,
      stockContado: item.stock_contado,
    }))
  );

  return NextResponse.json({ discrepancias });
}
