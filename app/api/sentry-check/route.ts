// Ruta temporal para verificar manualmente que Sentry está capturando
// errores una vez configurado NEXT_PUBLIC_SENTRY_DSN — visitar
// /api/sentry-check debería generar un evento en el proyecto de Sentry.
// Se puede borrar una vez confirmado.
export async function GET() {
  throw new Error("Sentry check: error de prueba generado a propósito.");
}
