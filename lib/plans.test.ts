import { describe, expect, it } from "vitest";
import { ADDONS, getPlan, getPriceConIva, getPriceMercadoPago, PLANS } from "./plans";

describe("getPriceConIva", () => {
  it("agrega 19% de IVA y redondea al entero más cercano", () => {
    expect(getPriceConIva({ priceNetoClp: 99990 })).toBe(118988);
  });
});

describe("getPriceMercadoPago", () => {
  // Valores confirmados contra el precio real mostrado en /billing
  // (con IVA + comisión de Mercado Pago incluidos).
  it("calcula el precio final del plan Starter", () => {
    expect(getPriceMercadoPago(PLANS.starter)).toBe(122528);
  });

  it("calcula el precio final del plan Growth", () => {
    expect(getPriceMercadoPago(PLANS.growth)).toBe(306338);
  });

  it("calcula el precio final del plan Enterprise", () => {
    expect(getPriceMercadoPago(PLANS.enterprise)).toBe(673959);
  });

  it("calcula el precio final del add-on Agente IA por WhatsApp", () => {
    expect(getPriceMercadoPago(ADDONS.whatsappAgent)).toBe(24496);
  });

  it("calcula el precio final del add-on Usuario extra", () => {
    expect(getPriceMercadoPago(ADDONS.extraUser)).toBe(12242);
  });
});

describe("getPlan", () => {
  it("devuelve el plan si el id es válido", () => {
    expect(getPlan("growth")).toEqual(PLANS.growth);
  });

  it("devuelve undefined si el id no existe", () => {
    expect(getPlan("plan-inexistente")).toBeUndefined();
  });
});
