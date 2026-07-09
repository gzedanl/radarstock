import "server-only";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? "");

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? "no-reply@radarstock.cl";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://radarstock.vercel.app";

function emailShell(title: string, bodyHtml: string): string {
  return `
    <div style="font-family: Arial, sans-serif; background: #0B1220; padding: 32px; color: #E5E7EB;">
      <div style="max-width: 480px; margin: 0 auto; background: #111827; border-radius: 12px; padding: 32px;">
        <img src="${APP_URL}/logo.svg" alt="RadarStock" width="180" style="display: block; margin: 0 0 24px; height: auto; max-width: 180px;" />
        <h1 style="font-size: 20px; margin: 0 0 16px; color: #E5E7EB;">${title}</h1>
        ${bodyHtml}
      </div>
    </div>
  `;
}

// Nunca debe interrumpir el flujo que la llama (signup, webhook de pago,
// etc.): siempre atrapa sus propios errores y solo loguea.
async function sendEmailSafe(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error("SENDGRID_API_KEY no configurada, se omite envío de email.");
    return;
  }

  try {
    await sgMail.send({
      to: params.to,
      from: FROM_EMAIL,
      subject: params.subject,
      html: params.html,
    });
  } catch (err) {
    console.error(
      "Error enviando email vía SendGrid:",
      err instanceof Error ? err.message : err
    );
  }
}

export async function sendWelcomeEmail(to: string): Promise<void> {
  const html = emailShell(
    "¡Bienvenido a RadarStock!",
    `
      <p style="color: #E5E7EB; line-height: 1.6;">
        Tu cuenta ya está lista. Sube tu primer CSV de ventas y en minutos
        vas a tener tu radar de inventario funcionando.
      </p>
      <a href="${APP_URL}/dashboard"
         style="display: inline-block; margin-top: 16px; background: #00D9A3; color: #0B1220; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Ir al dashboard
      </a>
    `
  );

  await sendEmailSafe({
    to,
    subject: "Bienvenido a RadarStock",
    html,
  });
}

export async function sendPlanActivatedEmail(
  to: string,
  planName: string
): Promise<void> {
  const html = emailShell(
    `¡Tu plan ${planName} está activo!`,
    `
      <p style="color: #E5E7EB; line-height: 1.6;">
        Confirmamos tu suscripción al plan <strong>${planName}</strong>.
        Ya puedes aprovechar todos sus límites y funciones desde tu dashboard.
      </p>
      <a href="${APP_URL}/dashboard"
         style="display: inline-block; margin-top: 16px; background: #00D9A3; color: #0B1220; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Ir al dashboard
      </a>
    `
  );

  await sendEmailSafe({
    to,
    subject: `Tu plan ${planName} está activo`,
    html,
  });
}

export interface StockAlertItem {
  sku: string;
  diasHastaQuiebre: number | null;
  cantidadSugerida: number;
}

// Llamado desde app/api/cron/check-alerts (Fase 4). `alertas` ya viene
// filtrada solo con los SKUs en riesgo alto de esta empresa.
export async function sendStockAlertEmail(
  to: string,
  alertas: StockAlertItem[]
): Promise<void> {
  const filas = alertas
    .map(
      (a) => `
        <tr>
          <td style="padding: 6px 12px; color: #E5E7EB; font-family: monospace;">${a.sku}</td>
          <td style="padding: 6px 12px; color: #F5A623;">${a.diasHastaQuiebre ?? "—"} días</td>
          <td style="padding: 6px 12px; color: #E5E7EB;">${a.cantidadSugerida} unidades</td>
        </tr>
      `
    )
    .join("");

  const html = emailShell(
    `${alertas.length} SKU${alertas.length === 1 ? "" : "s"} en riesgo de quiebre`,
    `
      <p style="color: #E5E7EB; line-height: 1.6;">
        Estos productos están en riesgo alto según el umbral que configuraste
        en tu dashboard:
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 6px 12px; color: #94A3B8; font-size: 12px;">SKU</th>
            <th style="text-align: left; padding: 6px 12px; color: #94A3B8; font-size: 12px;">Días hasta quiebre</th>
            <th style="text-align: left; padding: 6px 12px; color: #94A3B8; font-size: 12px;">Cantidad sugerida</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
      <a href="${APP_URL}/dashboard"
         style="display: inline-block; margin-top: 20px; background: #00D9A3; color: #0B1220; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Ver dashboard
      </a>
    `
  );

  await sendEmailSafe({
    to,
    subject: `RadarStock: ${alertas.length} SKU${alertas.length === 1 ? "" : "s"} en riesgo de quiebre`,
    html,
  });
}

// Lista para llamarse desde un cron (Fase 3+). No hay cron todavía.
export async function sendTrialEndingEmail(
  to: string,
  daysLeft: number
): Promise<void> {
  const html = emailShell(
    `Tu prueba gratuita termina en ${daysLeft} día(s)`,
    `
      <p style="color: #E5E7EB; line-height: 1.6;">
        Para seguir recibiendo predicciones y alertas sin interrupciones,
        suscríbete a un plan antes de que termine tu período de prueba.
      </p>
      <a href="${APP_URL}/billing"
         style="display: inline-block; margin-top: 16px; background: #00D9A3; color: #0B1220; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
        Ver planes
      </a>
    `
  );

  await sendEmailSafe({
    to,
    subject: `Tu prueba gratuita de RadarStock termina en ${daysLeft} día(s)`,
    html,
  });
}
