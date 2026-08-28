import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface EscanearBody {
  codigoBarras: string;
  productId?: string;
}

// POST: registra un escaneo dentro de una auditoría en curso.
// - Si el código de barras ya está mapeado a un producto, suma
//   unidades_por_escaneo al conteo de ese producto.
// - Si el código es desconocido y no viene productId, devuelve
//   requiereMapeo=true para que el frontend pida a qué producto
//   corresponde.
// - Si el código es desconocido y viene productId, crea el mapeo y
//   registra el escaneo en la misma llamada.
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

  const body = (await request.json().catch(() => null)) as EscanearBody | null;
  const codigoBarras = body?.codigoBarras?.trim();

  if (!codigoBarras) {
    return NextResponse.json({ error: "Falta codigoBarras" }, { status: 400 });
  }

  const { data: mapeoExistente } = await supabase
    .from("barcodes_map")
    .select("product_id, unidades_por_escaneo")
    .eq("company_id", company.id)
    .eq("codigo_barras", codigoBarras)
    .maybeSingle();

  let mapeo = mapeoExistente;

  if (!mapeo) {
    if (!body?.productId) {
      return NextResponse.json({ requiereMapeo: true, codigoBarras });
    }

    const { data: producto } = await supabase
      .from("products")
      .select("id")
      .eq("id", body.productId)
      .eq("company_id", company.id)
      .single();

    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const { data: nuevoMapeo, error: mapeoError } = await supabase
      .from("barcodes_map")
      .insert({
        company_id: company.id,
        product_id: producto.id,
        codigo_barras: codigoBarras,
      })
      .select("product_id, unidades_por_escaneo")
      .single();

    if (mapeoError || !nuevoMapeo) {
      console.error("Error creando mapeo de código de barras:", mapeoError?.message);
      return NextResponse.json(
        { error: "No se pudo asociar el código de barras." },
        { status: 500 }
      );
    }

    mapeo = nuevoMapeo;
  }

  const productId = mapeo.product_id;
  const unidades = mapeo.unidades_por_escaneo;

  const { data: itemExistente } = await supabase
    .from("audit_items")
    .select("id, stock_contado")
    .eq("audit_id", auditoriaId)
    .eq("product_id", productId)
    .maybeSingle();

  if (itemExistente) {
    const { data: actualizado, error: updateError } = await supabase
      .from("audit_items")
      .update({ stock_contado: itemExistente.stock_contado + unidades })
      .eq("id", itemExistente.id)
      .select("product_id, stock_teorico, stock_contado")
      .single();

    if (updateError || !actualizado) {
      console.error("Error actualizando conteo:", updateError?.message);
      return NextResponse.json(
        { error: "No se pudo registrar el escaneo." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      productId: actualizado.product_id,
      stockTeorico: actualizado.stock_teorico,
      stockContado: actualizado.stock_contado,
    });
  }

  const { data: producto } = await supabase
    .from("products")
    .select("stock_actual")
    .eq("id", productId)
    .single();

  const { data: nuevoItem, error: insertError } = await supabase
    .from("audit_items")
    .insert({
      audit_id: auditoriaId,
      product_id: productId,
      stock_teorico: producto?.stock_actual ?? 0,
      stock_contado: unidades,
    })
    .select("product_id, stock_teorico, stock_contado")
    .single();

  if (insertError || !nuevoItem) {
    console.error("Error creando ítem de auditoría:", insertError?.message);
    return NextResponse.json(
      { error: "No se pudo registrar el escaneo." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    productId: nuevoItem.product_id,
    stockTeorico: nuevoItem.stock_teorico,
    stockContado: nuevoItem.stock_contado,
  });
}
