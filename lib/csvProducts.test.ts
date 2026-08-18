import { describe, expect, it } from "vitest";
import { parseProductRows } from "./csvProducts";

describe("parseProductRows", () => {
  it("parsea sku, stock, lead time y ventas por fecha", () => {
    const rows = [
      {
        sku: "ACEITE-OLIVA-500ML",
        stock: "10",
        lead_time: "5",
        "2026-01-01": "3",
        "2026-01-02": "7",
      },
    ];
    const result = parseProductRows(rows);
    expect(result).toEqual([
      {
        sku: "ACEITE-OLIVA-500ML",
        stock_actual: 10,
        lead_time_dias: 5,
        ventas_historicas: [
          { fecha: "2026-01-01", ventas: 3 },
          { fecha: "2026-01-02", ventas: 7 },
        ],
      },
    ]);
  });

  it("descarta filas sin sku", () => {
    const rows = [{ sku: "", stock: "10", "2026-01-01": "3" }];
    expect(parseProductRows(rows)).toEqual([]);
  });

  it("reconoce nombres de columna alternativos (stock_actual, tiempo_entrega)", () => {
    const rows = [
      {
        SKU: "QUESO-GOUDA-200G",
        stock_actual: "20",
        tiempo_entrega: "3",
      },
    ];
    const [row] = parseProductRows(rows);
    expect(row.stock_actual).toBe(20);
    expect(row.lead_time_dias).toBe(3);
  });

  it("usa 0 como default para stock y lead time si faltan o no son numéricos", () => {
    const rows = [{ sku: "JAMON-SERRANO", stock: "no-es-numero" }];
    const [row] = parseProductRows(rows);
    expect(row.stock_actual).toBe(0);
    expect(row.lead_time_dias).toBe(0);
  });

  it("nunca deja lead_time_dias negativo", () => {
    const rows = [{ sku: "NUEZ-500G", lead_time: "-5" }];
    const [row] = parseProductRows(rows);
    expect(row.lead_time_dias).toBe(0);
  });

  it("ignora columnas de fecha con valores vacíos o no numéricos", () => {
    const rows = [
      {
        sku: "PAN-CAMPESINO",
        "2026-01-01": "",
        "2026-01-02": "no-es-numero",
        "2026-01-03": "5",
      },
    ];
    const [row] = parseProductRows(rows);
    expect(row.ventas_historicas).toEqual([{ fecha: "2026-01-03", ventas: 5 }]);
  });
});
