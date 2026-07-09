export type PlanId = "starter" | "growth" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  // Precio neto en CLP/mes (antes de IVA) — es el ingreso real que le
  // queda a RadarStock por este plan. El precio con IVA y el precio
  // final vía Mercado Pago (que además incluye la comisión) se derivan
  // de este con getPriceConIva() / getPriceMercadoPago(), para no tener
  // que actualizar tres números cada vez que cambia uno.
  priceNetoClp: number;
  maxSkus: number;
  maxUsers: number;
  whatsappAlerts: boolean;
}

const IVA_RATE = 0.19;

// Comisión de Mercado Pago sobre pagos con tarjeta (suscripción
// automática): 2,5% + IVA sobre esa comisión. Se traspasa al cliente
// solo cuando paga vía Mercado Pago — si paga por transferencia
// directa (ver copy en /billing y la landing), no aplica.
const MP_FEE_RATE = 0.025;

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceNetoClp: 99990,
    maxSkus: 200,
    maxUsers: 1,
    whatsappAlerts: false,
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceNetoClp: 249990,
    maxSkus: 1000,
    maxUsers: 5,
    whatsappAlerts: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceNetoClp: 549990,
    maxSkus: Infinity,
    maxUsers: Infinity,
    whatsappAlerts: true,
  },
};

export function getPlan(planId: string): Plan | undefined {
  return PLANS[planId as PlanId];
}

// Precio con IVA, sin comisión de Mercado Pago — es lo que se cobra si
// el cliente paga por transferencia directa en vez de suscripción
// automática.
export function getPriceConIva(plan: Plan): number {
  return Math.round(plan.priceNetoClp * (1 + IVA_RATE));
}

// Precio final cobrado vía Mercado Pago: precio con IVA + comisión de
// Mercado Pago (2,5% + IVA sobre la comisión), calculada sobre el
// monto de la transacción.
export function getPriceMercadoPago(plan: Plan): number {
  const precioConIva = getPriceConIva(plan);
  const comision = precioConIva * MP_FEE_RATE * (1 + IVA_RATE);
  return Math.round(precioConIva + comision);
}
