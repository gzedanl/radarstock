import { describe, expect, it } from "vitest";
import {
  ADDONS,
  getMonthlyChargeClp,
  getPlan,
  getPriceConIva,
  getPriceMercadoPago,
  getPriceMercadoPagoTotal,
  PLANS,
} from "./plans";

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

describe("getPriceMercadoPagoTotal", () => {
  it("suma los netos y aplica IVA + comisión una sola vez sobre el total", () => {
    // Plan Starter (99990) + 1 usuario extra (9990) = 109980 neto.
    expect(
      getPriceMercadoPagoTotal([
        { priceNetoClp: PLANS.starter.priceNetoClp },
        { priceNetoClp: ADDONS.extraUser.priceNetoClp },
      ])
    ).toBe(getPriceMercadoPago({ priceNetoClp: 109980 }));
  });

  it("con un solo ítem da lo mismo que getPriceMercadoPago", () => {
    expect(getPriceMercadoPagoTotal([PLANS.growth])).toBe(
      getPriceMercadoPago(PLANS.growth)
    );
  });

  it("con arreglo vacío da 0", () => {
    expect(getPriceMercadoPagoTotal([])).toBe(0);
  });
});

describe("getMonthlyChargeClp", () => {
  it("es null si el plan no existe", () => {
    expect(getMonthlyChargeClp("plan-inexistente", 0, false)).toBeNull();
  });

  it("sin addons, es igual al precio normal del plan", () => {
    expect(getMonthlyChargeClp("starter", 0, false)).toBe(
      getPriceMercadoPago(PLANS.starter)
    );
  });

  it("suma usuarios extra al monto del plan", () => {
    const esperado = getPriceMercadoPagoTotal([
      { priceNetoClp: PLANS.starter.priceNetoClp },
      { priceNetoClp: ADDONS.extraUser.priceNetoClp * 3 },
    ]);
    expect(getMonthlyChargeClp("starter", 3, false)).toBe(esperado);
  });

  it("suma el agente de WhatsApp al monto del plan", () => {
    const esperado = getPriceMercadoPagoTotal([
      { priceNetoClp: PLANS.growth.priceNetoClp },
      { priceNetoClp: ADDONS.whatsappAgent.priceNetoClp },
    ]);
    expect(getMonthlyChargeClp("growth", 0, true)).toBe(esperado);
  });

  it("suma usuarios extra y agente de WhatsApp juntos", () => {
    const esperado = getPriceMercadoPagoTotal([
      { priceNetoClp: PLANS.enterprise.priceNetoClp },
      { priceNetoClp: ADDONS.extraUser.priceNetoClp * 2 },
      { priceNetoClp: ADDONS.whatsappAgent.priceNetoClp },
    ]);
    expect(getMonthlyChargeClp("enterprise", 2, true)).toBe(esperado);
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
