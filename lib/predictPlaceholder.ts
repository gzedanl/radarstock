import type { ParsedProductRow } from "@/lib/csvProducts";

export interface PlaceholderPrediction {
  dias_hasta_quiebre: number | null;
  cantidad_sugerida: number;
}

// Cálculo simple/placeholder: promedio de ventas diarias históricas
// proyectado hacia adelante. La Fase 3 lo reemplaza por Prophet/LSTM/Ensemble.
export function computePlaceholderPrediction(
  product: Pick<ParsedProductRow, "stock_actual" | "ventas_historicas">
): PlaceholderPrediction {
  const { stock_actual, ventas_historicas } = product;

  if (ventas_historicas.length === 0) {
    return { dias_hasta_quiebre: null, cantidad_sugerida: 0 };
  }

  const avgDaily =
    ventas_historicas.reduce((sum, v) => sum + v.ventas, 0) /
    ventas_historicas.length;

  if (avgDaily <= 0) {
    return { dias_hasta_quiebre: null, cantidad_sugerida: 0 };
  }

  return {
    dias_hasta_quiebre: Math.max(0, Math.round(stock_actual / avgDaily)),
    cantidad_sugerida: Math.round(avgDaily * 30),
  };
}
