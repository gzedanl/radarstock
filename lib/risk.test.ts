import { describe, expect, it } from "vitest";
import { calcRiesgo, diasHastaQuiebreAjustado } from "./risk";

describe("calcRiesgo", () => {
  it("es bajo si no hay días hasta el quiebre (sin ventas históricas)", () => {
    expect(calcRiesgo(null, 5, 15)).toBe("bajo");
  });

  it("es alto si los días son menores o iguales al umbral de alerta alta", () => {
    expect(calcRiesgo(5, 5, 15)).toBe("alto");
    expect(calcRiesgo(3, 5, 15)).toBe("alto");
  });

  it("es medio si los días superan el umbral alto pero no el medio", () => {
    expect(calcRiesgo(10, 5, 15)).toBe("medio");
    expect(calcRiesgo(15, 5, 15)).toBe("medio");
  });

  it("es bajo si los días superan ambos umbrales", () => {
    expect(calcRiesgo(20, 5, 15)).toBe("bajo");
  });
});

describe("diasHastaQuiebreAjustado", () => {
  it("es null si no hay días hasta el quiebre", () => {
    expect(diasHastaQuiebreAjustado(null, 10)).toBeNull();
  });

  it("resta el lead time a los días hasta el quiebre", () => {
    expect(diasHastaQuiebreAjustado(20, 5)).toBe(15);
  });

  it("no baja de 0 aunque el lead time sea mayor a los días hasta el quiebre", () => {
    expect(diasHastaQuiebreAjustado(3, 10)).toBe(0);
  });

  it("funciona con lead time 0 (SKU sin ese dato cargado)", () => {
    expect(diasHastaQuiebreAjustado(20, 0)).toBe(20);
  });
});
