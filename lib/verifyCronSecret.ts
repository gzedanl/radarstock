import "server-only";
import crypto from "crypto";

// Comparación en tiempo constante para el header Authorization de los
// crons, igual que ya hace el webhook de Mercado Pago con su firma —
// evita filtrar el secreto byte a byte por diferencias de tiempo en un
// `!==` normal.
export function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authHeader);

  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}
