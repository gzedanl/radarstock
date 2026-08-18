import { describe, expect, it } from "vitest";
import { buildChartData } from "./buildChartData";

describe("buildChartData", () => {
  it("devuelve un arreglo vacío si no hay ventas históricas", () => {
    expect(buildChartData([])).toEqual([]);
    expect(buildChartData([[]])).toEqual([]);
  });

  it("suma las ventas de todos los productos por fecha", () => {
    const data = buildChartData([
      [{ fecha: "2026-01-01", ventas: 5 }],
      [{ fecha: "2026-01-01", ventas: 3 }],
    ]);
    const puntoReal = data.find((p) => p.real !== null);
    expect(puntoReal?.real).toBe(8);
    expect(puntoReal?.base).toBe(8);
  });

  it("ordena los puntos reales cronológicamente sin importar el orden de entrada", () => {
    const data = buildChartData([
      [
        { fecha: "2026-01-03", ventas: 3 },
        { fecha: "2026-01-01", ventas: 1 },
        { fecha: "2026-01-02", ventas: 2 },
      ],
    ]);
    const reales = data.filter((p) => p.real !== null);
    expect(reales.map((p) => p.real)).toEqual([1, 2, 3]);
    // Formato día/mes (locale es-CL) — no se valida el padding ni el
    // separador exacto porque dependen del ICU disponible en el entorno
    // que corre el test, no de nuestra lógica.
    for (const p of reales) {
      expect(p.date).toMatch(/^\d{1,2}\D+\d{1,2}$/);
    }
  });

  it("proyecta 15 días futuros basados en el promedio de los últimos 7 días reales", () => {
    const ventas = Array.from({ length: 8 }, (_, i) => ({
      fecha: `2026-01-${String(i + 1).padStart(2, "0")}`,
      ventas: 100,
    }));
    const data = buildChartData([ventas]);

    const futuros = data.filter((p) => p.real === null);
    expect(futuros).toHaveLength(15);
    for (const p of futuros) {
      expect(p.base).toBe(100);
      expect(p.optimista).toBe(115);
      expect(p.pesimista).toBe(85);
    }
  });
});
