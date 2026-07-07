export type PlanId = "starter" | "growth" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  // Precio final en CLP/mes, IVA incluido — es el monto que se le
  // muestra al cliente y el que se cobra vía Mercado Pago. La comisión
  // de Mercado Pago es un costo operativo interno, no se traspasa al
  // cliente como un cargo aparte.
  priceClp: number;
  maxSkus: number;
  maxUsers: number;
  whatsappAlerts: boolean;
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    priceClp: 427000,
    maxSkus: 200,
    maxUsers: 1,
    whatsappAlerts: false,
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceClp: 970000,
    maxSkus: 1000,
    maxUsers: 5,
    whatsappAlerts: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceClp: 1830000,
    maxSkus: Infinity,
    maxUsers: Infinity,
    whatsappAlerts: true,
  },
};

export function getPlan(planId: string): Plan | undefined {
  return PLANS[planId as PlanId];
}
