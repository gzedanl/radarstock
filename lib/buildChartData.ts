import type { PredictionPoint } from "@/components/PredictionChart";

interface VentaHistorica {
  fecha: string;
  ventas: number;
}

function formatLabel(fecha: string): string {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return fecha;
  // timeZone: "UTC" evita que fechas sin hora (ej. "2026-06-20", que
  // parsea como medianoche UTC) se corran un día al formatear en la
  // zona horaria local del servidor.
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

// Agrega ventas_historicas de todos los productos por fecha y proyecta
// una predicción simple (promedio ± 15%) para los próximos 15 días.
// Placeholder — la Fase 3 lo reemplaza por Prophet/LSTM/Ensemble reales.
export function buildChartData(
  productsVentas: VentaHistorica[][]
): PredictionPoint[] {
  const totalsByDate = new Map<string, number>();

  for (const ventas of productsVentas) {
    for (const { fecha, ventas: cantidad } of ventas) {
      totalsByDate.set(fecha, (totalsByDate.get(fecha) ?? 0) + cantidad);
    }
  }

  const sortedDates = Array.from(totalsByDate.keys()).sort((a, b) => {
    const da = new Date(a).getTime();
    const db = new Date(b).getTime();
    if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db;
    return a.localeCompare(b);
  });

  if (sortedDates.length === 0) return [];

  const realPoints: PredictionPoint[] = sortedDates.map((fecha) => ({
    date: formatLabel(fecha),
    real: totalsByDate.get(fecha) ?? 0,
    base: totalsByDate.get(fecha) ?? 0,
    optimista: totalsByDate.get(fecha) ?? 0,
    pesimista: totalsByDate.get(fecha) ?? 0,
  }));

  const recentWindow = sortedDates.slice(-7);
  const avgDaily =
    recentWindow.reduce((sum, fecha) => sum + (totalsByDate.get(fecha) ?? 0), 0) /
    recentWindow.length;

  const lastDate = new Date(sortedDates[sortedDates.length - 1]);
  const canProjectDates = !Number.isNaN(lastDate.getTime());

  const futurePoints: PredictionPoint[] = Array.from({ length: 15 }).map(
    (_, i) => {
      const dayOffset = i + 1;
      const label = canProjectDates
        ? (() => {
            const d = new Date(lastDate);
            d.setUTCDate(d.getUTCDate() + dayOffset);
            return formatLabel(d.toISOString());
          })()
        : `Día +${dayOffset}`;

      return {
        date: label,
        real: null,
        base: Math.round(avgDaily),
        optimista: Math.round(avgDaily * 1.15),
        pesimista: Math.round(avgDaily * 0.85),
      };
    }
  );

  return [...realPoints, ...futurePoints];
}
