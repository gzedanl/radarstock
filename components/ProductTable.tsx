import { Clock } from "lucide-react";

export type RiskLevel = "alto" | "medio" | "bajo";

export interface Product {
  sku: string;
  stockActual: number;
  diasHastaQuiebre: number | null;
  cantidadSugerida: number;
  riesgo: RiskLevel;
  // true si el servicio ML no respondió hoy y se está mostrando la
  // última predicción guardada en vez de una fresca.
  desactualizado?: boolean;
}

const DEMO_PRODUCTS: Product[] = [
  {
    sku: "SKU-2091",
    stockActual: 34,
    diasHastaQuiebre: 3,
    cantidadSugerida: 120,
    riesgo: "alto",
  },
  {
    sku: "SKU-1187",
    stockActual: 210,
    diasHastaQuiebre: 12,
    cantidadSugerida: 60,
    riesgo: "medio",
  },
  {
    sku: "SKU-3320",
    stockActual: 15,
    diasHastaQuiebre: 2,
    cantidadSugerida: 200,
    riesgo: "alto",
  },
  {
    sku: "SKU-0456",
    stockActual: 340,
    diasHastaQuiebre: 28,
    cantidadSugerida: 0,
    riesgo: "bajo",
  },
  {
    sku: "SKU-7742",
    stockActual: 48,
    diasHastaQuiebre: 5,
    cantidadSugerida: 150,
    riesgo: "alto",
  },
];

const RISK_STYLES: Record<RiskLevel, string> = {
  alto: "bg-amber/15 text-amber border border-amber/40",
  medio: "bg-teal/15 text-teal border border-teal/40",
  bajo: "bg-text-medium/10 text-text-medium border border-text-medium/30",
};

interface ProductTableProps {
  products?: Product[];
}

export default function ProductTable({
  products = DEMO_PRODUCTS,
}: ProductTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-panel-raised">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-medium">
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 font-medium">Stock actual</th>
            <th className="px-4 py-3 font-medium">Días hasta quiebre</th>
            <th className="px-4 py-3 font-medium">Cantidad sugerida</th>
            <th className="px-4 py-3 font-medium">Riesgo</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.sku} className="border-b border-border last:border-0">
              <td className="px-4 py-3 font-mono text-text-high">
                {product.sku}
              </td>
              <td className="px-4 py-3 font-mono text-text-high">
                {product.stockActual}
              </td>
              <td className="px-4 py-3 font-mono text-text-high">
                <span className="inline-flex items-center gap-1.5">
                  {product.diasHastaQuiebre ?? "—"}
                  {product.desactualizado && (
                    <span
                      title="Predicción no actualizada hoy — mostrando el último dato guardado"
                      className="inline-flex items-center gap-1 rounded-full bg-amber/10 px-1.5 py-0.5 font-body text-[10px] text-amber"
                    >
                      <Clock size={10} />
                      no actualizada hoy
                    </span>
                  )}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-text-high">
                {product.cantidadSugerida}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${RISK_STYLES[product.riesgo]}`}
                >
                  {product.riesgo}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
