import { NextRequest, NextResponse } from "next/server";

// Render duerme el servicio free/starter tras ~15 min sin tráfico, y
// despertarlo tarda 50+ segundos — más que el timeout de 8s que usa
// lib/mlService.ts al llamar /predict. Este cron pinguea /health cada
// 10 min para evitarlo.
//
// Reemplaza al workflow de GitHub Actions en radarstock-ml
// (.github/workflows/keep-alive.yml): el trigger `schedule` de GitHub
// Actions resultó no disparar de forma confiable en un repo de poco
// tráfico (el dispatch manual sí funciona, pero el cron programado
// nunca corrió solo). Vercel Cron es más confiable para esto y ya lo
// usamos para los otros crons de la app.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const mlServiceUrl = process.env.ML_SERVICE_URL;
  if (!mlServiceUrl) {
    return NextResponse.json(
      { error: "ML_SERVICE_URL no configurada" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(`${mlServiceUrl}/health`, {
      cache: "no-store",
    });
    return NextResponse.json({
      status: "ok",
      ml_service_status: res.status,
    });
  } catch (err) {
    console.error(
      "Error pingueando el servicio ML:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json({ status: "ok", ml_service_status: null });
  }
}
