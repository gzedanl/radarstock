import { describe, expect, it } from "vitest";
import { applyCreditToInvoice, decideEstadoNuevoPremio } from "./referralCredit";

describe("decideEstadoNuevoPremio", () => {
  it("es pendiente si el referente tiene menos de 2 convertidos previos", () => {
    expect(decideEstadoNuevoPremio(0)).toBe("pendiente");
    expect(decideEstadoNuevoPremio(1)).toBe("pendiente");
  });

  it("es revision_pendiente al llegar al 3er convertido en 30 días", () => {
    // 2 previos + este nuevo = 3.
    expect(decideEstadoNuevoPremio(2)).toBe("revision_pendiente");
  });

  it("sigue en revision_pendiente para el 4to, 5to, etc.", () => {
    expect(decideEstadoNuevoPremio(3)).toBe("revision_pendiente");
    expect(decideEstadoNuevoPremio(10)).toBe("revision_pendiente");
  });
});

describe("applyCreditToInvoice", () => {
  it("aplica todo el crédito si alcanza para la factura completa", () => {
    const resultado = applyCreditToInvoice(
      [{ id: "a", amountClp: 30000, montoAplicado: 0 }],
      50000
    );
    expect(resultado).toEqual([
      { id: "a", montoAAplicar: 30000, nuevoMontoAplicado: 30000, nuevoEstado: "aplicado" },
    ]);
  });

  it("cap: si el crédito disponible supera la factura, solo aplica hasta el monto de la factura", () => {
    const resultado = applyCreditToInvoice(
      [{ id: "a", amountClp: 30000, montoAplicado: 0 }],
      20000
    );
    expect(resultado).toEqual([
      { id: "a", montoAAplicar: 20000, nuevoMontoAplicado: 20000, nuevoEstado: "pendiente" },
    ]);
  });

  it("rollover: un crédito parcialmente aplicado en un mes se completa en el siguiente", () => {
    // Mes 1: factura de $20.000, crédito de $30.000 -> aplica $20.000, quedan $10.000.
    const mes1 = applyCreditToInvoice(
      [{ id: "a", amountClp: 30000, montoAplicado: 0 }],
      20000
    );
    expect(mes1[0].nuevoEstado).toBe("pendiente");
    expect(mes1[0].nuevoMontoAplicado).toBe(20000);

    // Mes 2: parte del estado que dejó el mes 1 (monto_aplicado = 20000).
    const mes2 = applyCreditToInvoice(
      [{ id: "a", amountClp: 30000, montoAplicado: mes1[0].nuevoMontoAplicado }],
      50000
    );
    expect(mes2).toEqual([
      { id: "a", montoAAplicar: 10000, nuevoMontoAplicado: 30000, nuevoEstado: "aplicado" },
    ]);
  });

  it("consume los créditos en el orden recibido (FIFO) hasta cubrir la factura", () => {
    const resultado = applyCreditToInvoice(
      [
        { id: "viejo", amountClp: 30000, montoAplicado: 0 },
        { id: "nuevo", amountClp: 30000, montoAplicado: 0 },
      ],
      40000
    );
    expect(resultado).toEqual([
      { id: "viejo", montoAAplicar: 30000, nuevoMontoAplicado: 30000, nuevoEstado: "aplicado" },
      { id: "nuevo", montoAAplicar: 10000, nuevoMontoAplicado: 10000, nuevoEstado: "pendiente" },
    ]);
  });

  it("no toca créditos que ya estaban completamente aplicados", () => {
    const resultado = applyCreditToInvoice(
      [{ id: "a", amountClp: 30000, montoAplicado: 30000 }],
      50000
    );
    expect(resultado).toEqual([]);
  });

  it("devuelve un arreglo vacío si no hay créditos pendientes", () => {
    expect(applyCreditToInvoice([], 50000)).toEqual([]);
  });

  it("devuelve un arreglo vacío si la factura es 0", () => {
    const resultado = applyCreditToInvoice(
      [{ id: "a", amountClp: 30000, montoAplicado: 0 }],
      0
    );
    expect(resultado).toEqual([]);
  });
});
