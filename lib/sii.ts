import "server-only";

// Integración SII, Fase 1 — adaptado del patrón ya probado en
// producción en otro proyecto (PayOrbit) contra el mismo proveedor
// (API Gateway, apigateway.cl). Las credenciales del contribuyente
// (RUT + clave del portal SII) se reciben en cada request y se pasan
// tal cual a API Gateway — nunca se guardan, ni siquiera en logs.
//
// Los endpoints de RCV ventas y compras están confirmados contra la
// documentación real de API Gateway. A diferencia de ventas, el RCV de
// compras exige un {estado} en la URL (REGISTRO, PENDIENTE, NO_INCLUIR,
// RECLAMADO) — por ahora solo sincronizamos REGISTRO (documentos
// confirmados, con acuse de recibo o pagados al contado); los otros 3
// estados quedan fuera de esta fase.
//
// Límite conocido: si el contribuyente tiene más de 1000 documentos en
// el mes, API Gateway exige usar su API asíncrona (solicitar → estado
// → detalle) en vez de este endpoint síncrono — no implementada en
// esta fase, poco probable que aplique al volumen típico de una PyME.
const APIGATEWAY_URL = "https://app.apigateway.cl/api/v2";
const CALL_TIMEOUT_MS = 30_000;

export type SiiDocTipo = "compra" | "venta";

export interface SiiCredenciales {
  rut: string;
  password: string;
}

export class SiiCredencialesInvalidasError extends Error {
  constructor() {
    super("Credenciales SII incorrectas.");
    this.name = "SiiCredencialesInvalidasError";
  }
}

function agHeaders(): HeadersInit {
  const token = process.env.APIGATEWAY_API_TOKEN;
  if (!token) {
    throw new Error("Falta configurar APIGATEWAY_API_TOKEN.");
  }
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Token ${token}`,
  };
}

function authBody(rut: string, password: string) {
  return { auth: { pass: { rut, clave: password } } };
}

// API Gateway espera el RUT sin puntos, con guion, en mayúsculas.
function rutForUrl(rut: string): string {
  return rut.replace(/\./g, "").toUpperCase();
}

// Convierte "2026-08" (formato que usamos internamente) a "202608"
// (formato que exige API Gateway en las URLs).
function periodoForUrl(periodo: string): string {
  return periodo.replace("-", "");
}

async function callApiGateway<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

  try {
    const res = await fetch(`${APIGATEWAY_URL}${path}`, {
      method: "POST",
      headers: agHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (res.status === 401) {
      throw new SiiCredencialesInvalidasError();
    }
    if (res.status === 404) {
      // Sin documentos para ese período — no es un error, la cuenta
      // consultada simplemente no tiene datos ahí.
      return null as T;
    }
    if (!res.ok) {
      throw new Error(`API Gateway respondió ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// Valida que las credenciales sean correctas antes de sincronizar,
// pidiendo el resumen de ventas del período actual. Un 404 (sin ventas
// ese mes) igual cuenta como credenciales válidas.
export async function validarCredencialesSii(
  credenciales: SiiCredenciales
): Promise<void> {
  const periodoActual = periodoForUrl(
    new Date().toISOString().slice(0, 7)
  );
  await callApiGateway(
    `/sii/rcv/ventas/resumen/${rutForUrl(credenciales.rut)}/${periodoActual}`,
    authBody(credenciales.rut, credenciales.password)
  );
}

export interface SiiDocumentoRaw {
  folio?: string;
  nroDoc?: string;
  NroDoc?: string;
  FOLIO?: string;
  Folio?: string;
  rutReceptor?: string;
  RutReceptor?: string;
  rut_receptor?: string;
  rutEmisor?: string;
  RutEmisor?: string;
  rut_emisor?: string;
  razonSocialReceptor?: string;
  razonSocial?: string;
  razon_social?: string;
  RazonSocial?: string;
  razonSocialEmisor?: string;
  fechaDocto?: string;
  fechaEmision?: string;
  FechaEmision?: string;
  mntTotal?: number | string;
  montoTotal?: number | string;
  MontoTotal?: number | string;
  monto?: number | string;
  estadoAcuse?: string;
  estado?: string;
  Estado?: string;
  [key: string]: unknown;
}

export interface SiiDocumentoNormalizado {
  folio: string;
  rutContraparte: string | null;
  razonSocialContraparte: string | null;
  fechaEmision: string | null;
  monto: number | null;
  estadoSii: string | null;
  raw: SiiDocumentoRaw;
}

// API Gateway devuelve los mismos datos con distintos nombres de campo
// según el tipo de documento — se prueban las variantes en orden de
// prioridad, igual que en la integración de referencia.
function normalizarDocumento(
  d: SiiDocumentoRaw,
  tipo: SiiDocTipo
): SiiDocumentoNormalizado {
  const montoRaw = d.mntTotal ?? d.montoTotal ?? d.MontoTotal ?? d.monto;
  const contraparteRut =
    tipo === "compra"
      ? d.rutEmisor ?? d.RutEmisor ?? d.rut_emisor
      : d.rutReceptor ?? d.RutReceptor ?? d.rut_receptor;
  const contraparteNombre =
    d.razonSocialReceptor ??
    d.razonSocialEmisor ??
    d.razonSocial ??
    d.razon_social ??
    d.RazonSocial;

  return {
    folio: String(d.folio ?? d.nroDoc ?? d.NroDoc ?? d.FOLIO ?? d.Folio ?? ""),
    rutContraparte: contraparteRut ? String(contraparteRut) : null,
    razonSocialContraparte: contraparteNombre ? String(contraparteNombre) : null,
    fechaEmision: d.fechaDocto ?? d.fechaEmision ?? d.FechaEmision ?? null,
    monto: montoRaw != null ? Number(montoRaw) : null,
    estadoSii: d.estadoAcuse ?? d.estado ?? d.Estado ?? null,
    raw: d,
  };
}

// Estado de RCV compras que sincronizamos — ver nota al inicio del
// archivo sobre por qué solo REGISTRO por ahora.
const ESTADO_COMPRAS = "REGISTRO";

// Trae el listado de documentos (a nivel de documento, sin detalle de
// líneas) de un tipo y período. Compras y ventas tienen distinta forma
// de URL (compras exige {estado}, ventas no) — ver nota al inicio del
// archivo.
export async function fetchRcvDocumentos(
  credenciales: SiiCredenciales,
  tipo: SiiDocTipo,
  periodo: string
): Promise<SiiDocumentoNormalizado[]> {
  const rut = rutForUrl(credenciales.rut);
  const periodoUrl = periodoForUrl(periodo);
  const body = authBody(credenciales.rut, credenciales.password);

  const resumenPath =
    tipo === "compra"
      ? `/sii/rcv/compras/resumen/${rut}/${periodoUrl}/${ESTADO_COMPRAS}`
      : `/sii/rcv/ventas/resumen/${rut}/${periodoUrl}`;

  const resumen = await callApiGateway<
    { tipoDte: string | number }[] | null
  >(resumenPath, body);

  if (!resumen || resumen.length === 0) return [];

  const documentos: SiiDocumentoNormalizado[] = [];
  for (const item of resumen) {
    const detallePath =
      tipo === "compra"
        ? `/sii/rcv/compras/detalle/${rut}/${periodoUrl}/${item.tipoDte}/${ESTADO_COMPRAS}`
        : `/sii/rcv/ventas/detalle/${rut}/${periodoUrl}/${item.tipoDte}`;

    const detalle = await callApiGateway<SiiDocumentoRaw[] | null>(
      detallePath,
      body
    );
    if (!detalle) continue;
    documentos.push(...detalle.map((d) => normalizarDocumento(d, tipo)));
  }

  return documentos;
}
