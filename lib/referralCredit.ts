// Sin conexión a DB — toda la matemática de cap/rollover vive acá para
// poder testearla con Vitest. Quien llama (webhook / acción de admin)
// se encarga de leer y escribir en Supabase.

// A partir de 3 referidos convertidos (incluyendo el nuevo) en una
// ventana de 30 días, el premio queda en revisión manual en vez de
// aplicarse directo — control mínimo contra empresas fantasma.
const UMBRAL_REVISION = 3;

export function decideEstadoNuevoPremio(
  convertidosUltimos30Dias: number
): "pendiente" | "revision_pendiente" {
  // +1 porque convertidosUltimos30Dias no incluye el que se está por
  // crear — el llamador pasa el conteo de premios ya existentes.
  return convertidosUltimos30Dias + 1 >= UMBRAL_REVISION
    ? "revision_pendiente"
    : "pendiente";
}

export interface CreditoDisponible {
  id: string;
  amountClp: number;
  montoAplicado: number;
}

export interface AplicacionCredito {
  id: string;
  montoAAplicar: number;
  nuevoMontoAplicado: number;
  nuevoEstado: "pendiente" | "aplicado";
}

// Aplica crédito contra la factura de un mes, respetando dos reglas:
//   1. Nunca se aplica más del 100% del monto de la factura ese mes.
//   2. Los créditos se consumen en el orden recibido (FIFO — el
//      llamador debe pasarlos ordenados por antigüedad, más viejo
//      primero) y el excedente de un crédito parcialmente usado queda
//      disponible para el próximo llamado (rollover), sin marcarlo
//      "aplicado" hasta consumirlo por completo.
// Devuelve solo los créditos que efectivamente cambiaron (monto > 0),
// para que el llamador sepa qué filas actualizar en la base.
export function applyCreditToInvoice(
  creditosPendientes: CreditoDisponible[],
  montoFactura: number
): AplicacionCredito[] {
  const aplicaciones: AplicacionCredito[] = [];
  let restante = montoFactura;

  for (const credito of creditosPendientes) {
    if (restante <= 0) break;

    const disponible = credito.amountClp - credito.montoAplicado;
    if (disponible <= 0) continue;

    const aAplicar = Math.min(disponible, restante);
    const nuevoMontoAplicado = credito.montoAplicado + aAplicar;

    aplicaciones.push({
      id: credito.id,
      montoAAplicar: aAplicar,
      nuevoMontoAplicado,
      nuevoEstado: nuevoMontoAplicado >= credito.amountClp ? "aplicado" : "pendiente",
    });

    restante -= aAplicar;
  }

  return aplicaciones;
}
