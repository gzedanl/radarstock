// Merma/descuadre: positivo significa que falta stock físico respecto
// a lo que el sistema creía tener; negativo, que hay más del esperado
// (ej. un ingreso no registrado).
export function calcularMerma(stockTeorico: number, stockContado: number): number {
  return stockTeorico - stockContado;
}

export interface AuditItemResumen {
  productId: string;
  stockTeorico: number;
  stockContado: number;
}

export interface DiscrepanciaResumen extends AuditItemResumen {
  merma: number;
}

// Ordena por merma absoluta descendente — los descuadres más grandes
// (en cualquier dirección) primero, para revisarlos antes que el resto.
export function resumenDiscrepancias(
  items: AuditItemResumen[]
): DiscrepanciaResumen[] {
  return items
    .map((item) => ({
      ...item,
      merma: calcularMerma(item.stockTeorico, item.stockContado),
    }))
    .sort((a, b) => Math.abs(b.merma) - Math.abs(a.merma));
}
