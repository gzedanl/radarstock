import { describe, expect, it } from "vitest";
import { calcularMerma, resumenDiscrepancias } from "./audit";

describe("calcularMerma", () => {
  it("es positiva cuando el stock contado es menor al teórico (falta stock)", () => {
    expect(calcularMerma(10, 6)).toBe(4);
  });

  it("es negativa cuando el stock contado es mayor al teórico (sobra stock)", () => {
    expect(calcularMerma(10, 15)).toBe(-5);
  });

  it("es cero cuando coinciden", () => {
    expect(calcularMerma(10, 10)).toBe(0);
  });
});

describe("resumenDiscrepancias", () => {
  it("calcula la merma de cada ítem", () => {
    const resultado = resumenDiscrepancias([
      { productId: "a", stockTeorico: 10, stockContado: 8 },
    ]);
    expect(resultado[0].merma).toBe(2);
  });

  it("ordena por merma absoluta descendente", () => {
    const resultado = resumenDiscrepancias([
      { productId: "chico", stockTeorico: 10, stockContado: 9 },
      { productId: "grande-negativo", stockTeorico: 5, stockContado: 20 },
      { productId: "grande-positivo", stockTeorico: 30, stockContado: 5 },
    ]);
    expect(resultado.map((r) => r.productId)).toEqual([
      "grande-positivo",
      "grande-negativo",
      "chico",
    ]);
  });

  it("devuelve arreglo vacío si no hay ítems", () => {
    expect(resumenDiscrepancias([])).toEqual([]);
  });
});
