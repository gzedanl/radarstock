import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "./mapWithConcurrency";

describe("mapWithConcurrency", () => {
  it("devuelve los resultados en el mismo orden que los items de entrada", async () => {
    const items = [5, 1, 3, 2, 4];
    const results = await mapWithConcurrency(items, 2, async (n) => {
      // delay inverso: los números más chicos "terminan" antes, para
      // forzar que sin el orden por índice el resultado saliera mezclado.
      await new Promise((r) => setTimeout(r, n));
      return n * 10;
    });
    expect(results).toEqual([50, 10, 30, 20, 40]);
  });

  it("nunca corre más de `limit` llamadas en simultáneo", async () => {
    let enVuelo = 0;
    let maxEnVuelo = 0;
    const items = Array.from({ length: 10 }, (_, i) => i);

    await mapWithConcurrency(items, 3, async (n) => {
      enVuelo++;
      maxEnVuelo = Math.max(maxEnVuelo, enVuelo);
      await new Promise((r) => setTimeout(r, 5));
      enVuelo--;
      return n;
    });

    expect(maxEnVuelo).toBeLessThanOrEqual(3);
  });

  it("llama fn exactamente una vez por item", async () => {
    let llamadas = 0;
    await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => {
      llamadas++;
      return n;
    });
    expect(llamadas).toBe(4);
  });

  it("funciona con una lista vacía", async () => {
    const results = await mapWithConcurrency([], 3, async (n) => n);
    expect(results).toEqual([]);
  });

  it("funciona si el límite es mayor que la cantidad de items", async () => {
    const results = await mapWithConcurrency([1, 2], 10, async (n) => n * 2);
    expect(results).toEqual([2, 4]);
  });
});
