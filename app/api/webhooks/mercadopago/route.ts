import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PLANS, getPlan } from "@/lib/plans";
import {
  sendPlanActivatedEmail,
  sendReferralRewardEmail,
  sendReferralReviewEmail,
} from "@/lib/email";
import { decideEstadoNuevoPremio } from "@/lib/referralCredit";

const REFERRAL_REWARD_CLP = 30000;
const VENTANA_REVISION_DIAS = 30;

// El SDK de crypto de Node requiere runtime nodejs (no edge).
export const runtime = "nodejs";

function verifySignature(params: {
  xSignature: string;
  xRequestId: string;
  dataId: string;
  secret: string;
}): boolean {
  const parsed = params.xSignature.split(",").reduce<Record<string, string>>(
    (acc, part) => {
      const [key, value] = part.split("=");
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    },
    {}
  );

  const { ts, v1 } = parsed;
  if (!ts || !v1) return false;

  // Manifest oficial de Mercado Pago: no firma el body crudo, sino esta
  // combinación específica de campos. Igual leemos el body como texto
  // antes de parsearlo, para no depender del resultado del parseo en
  // la verificación.
  const manifest = `id:${params.dataId.toLowerCase()};request-id:${params.xRequestId};ts:${ts};`;
  const expected = crypto
    .createHmac("sha256", params.secret)
    .update(manifest)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(v1);

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function mapPreapprovalStatus(status?: string): string {
  switch (status) {
    case "authorized":
      return "active";
    case "paused":
      return "paused";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

function matchPlanFromReason(reason?: string): string | null {
  if (!reason) return null;
  const found = Object.values(PLANS).find((plan) =>
    reason.toLowerCase().includes(plan.name.toLowerCase())
  );
  return found?.id ?? null;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const dataId = request.nextUrl.searchParams.get("data.id");

  if (!xSignature || !xRequestId || !dataId) {
    return NextResponse.json(
      { error: "Faltan headers de firma" },
      { status: 401 }
    );
  }

  const isValid = verifySignature({
    xSignature,
    xRequestId,
    dataId,
    secret: process.env.MP_WEBHOOK_SECRET!,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  // Recién ahora, con la firma ya verificada, parseamos el JSON.
  const event = JSON.parse(rawBody);

  if (event.type !== "subscription_preapproval") {
    // Evento de un tipo que no nos interesa (ej. payment). Igual
    // respondemos 200 rápido para que Mercado Pago no reintente.
    return NextResponse.json({ received: true });
  }

  const preapprovalId = event.data?.id ?? dataId;

  const detailRes = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
  );

  if (!detailRes.ok) {
    console.error(
      "No se pudo obtener el detalle de la preapproval:",
      await detailRes.text()
    );
    return NextResponse.json({ received: true });
  }

  const preapproval = await detailRes.json();
  const companyId = preapproval.external_reference;

  if (!companyId) {
    return NextResponse.json({ received: true });
  }

  const planId = matchPlanFromReason(preapproval.reason);
  const newPlanStatus = mapPreapprovalStatus(preapproval.status);
  const supabaseAdmin = createAdminClient();

  const { data: previousCompany } = await supabaseAdmin
    .from("companies")
    .select("plan_status, name, referred_by_company_id")
    .eq("id", companyId)
    .single();

  const { error } = await supabaseAdmin
    .from("companies")
    .update({
      plan_status: newPlanStatus,
      mp_preapproval_id: preapproval.id,
      ...(planId ? { plan: planId } : {}),
    })
    .eq("id", companyId);

  if (error) {
    console.error("Error actualizando company desde webhook MP:", error.message);
  }

  const justActivated =
    newPlanStatus === "active" && previousCompany?.plan_status !== "active";

  if (!error && justActivated && preapproval.payer_email && planId) {
    // No debe romper el webhook si el email falla.
    await sendPlanActivatedEmail(
      preapproval.payer_email,
      getPlan(planId)?.name ?? planId
    );
  }

  // Programa de referidos: si esta empresa fue referida y esta es la
  // primera vez que activa un plan pago, se genera el premio. El
  // unique en referred_company_id (0011) garantiza que reactivaciones
  // posteriores (pausó y volvió a activar, etc.) no generen otro premio.
  if (!error && justActivated && previousCompany?.referred_by_company_id) {
    const referrerCompanyId = previousCompany.referred_by_company_id;
    const desdeVentanaRevision = new Date(
      Date.now() - VENTANA_REVISION_DIAS * 24 * 60 * 60 * 1000
    ).toISOString();

    // Control de fraude: si el referente acumula 3+ convertidos en 30
    // días, el premio nuevo queda en revisión manual en vez de
    // aplicarse directo (no bloquea el premio, solo pausa su aplicación
    // hasta que el equipo comercial confirme que son negocios reales).
    const { data: recientesRewards } = await supabaseAdmin
      .from("referral_rewards")
      .select("referred_company_id")
      .eq("referrer_company_id", referrerCompanyId)
      .in("status", ["pendiente", "aplicado"])
      .gte("created_at", desdeVentanaRevision);

    const countRecientes = recientesRewards?.length ?? 0;
    const estadoNuevoPremio = decideEstadoNuevoPremio(countRecientes);

    const { data: reward, error: rewardError } = await supabaseAdmin
      .from("referral_rewards")
      .insert({
        referrer_company_id: referrerCompanyId,
        referred_company_id: companyId,
        amount_clp: REFERRAL_REWARD_CLP,
        status: estadoNuevoPremio,
      })
      .select("id")
      .maybeSingle();

    if (rewardError && rewardError.code !== "23505") {
      // 23505 = violación de unique (referred_company_id ya tenía
      // premio) — esperable en una reactivación, no es un error real.
      console.error("Error creando premio de referido:", rewardError.message);
    }

    if (reward) {
      const { data: referrerCompany } = await supabaseAdmin
        .from("companies")
        .select("name, user_id")
        .eq("id", referrerCompanyId)
        .single();

      if (referrerCompany) {
        const { data: referrerUser } =
          await supabaseAdmin.auth.admin.getUserById(referrerCompany.user_id);
        const referrerEmail = referrerUser?.user?.email;

        if (referrerEmail && estadoNuevoPremio === "revision_pendiente") {
          const idsRecientes = [
            ...(recientesRewards ?? []).map((r) => r.referred_company_id),
            companyId,
          ];
          const { data: companiasRecientes } = await supabaseAdmin
            .from("companies")
            .select("name, user_id")
            .in("id", idsRecientes);

          const referidosRecientes = await Promise.all(
            (companiasRecientes ?? []).map(async (c) => {
              const { data: u } = await supabaseAdmin.auth.admin.getUserById(
                c.user_id
              );
              return { name: c.name, email: u?.user?.email ?? "—" };
            })
          );

          await sendReferralReviewEmail({
            referrerCompanyName: referrerCompany.name,
            referrerEmail,
            convertidosUltimos30Dias: countRecientes + 1,
            referidosRecientes,
          });
        } else if (referrerEmail) {
          await sendReferralRewardEmail({
            referrerEmail,
            referrerCompanyName: referrerCompany.name,
            referredCompanyName: previousCompany.name,
            amountClp: REFERRAL_REWARD_CLP,
          });
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
