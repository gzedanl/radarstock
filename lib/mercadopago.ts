import "server-only";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

const config = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export const preApprovalClient = new PreApproval(config);
