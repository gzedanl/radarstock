import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchRcvDocumentos,
  SiiCredencialesInvalidasError,
  validarCredencialesSii,
} from "./sii";

function mockResponse(status: number, body: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

describe("sii", () => {
  const credenciales = { rut: "12.345.678-9", password: "clave-secreta" };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.APIGATEWAY_API_TOKEN = "token-de-prueba";
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchRcvDocumentos", () => {
    it("ventas: arma la URL sin {estado} y normaliza el detalle", async () => {
      fetchMock
        .mockResolvedValueOnce(mockResponse(200, [{ tipoDte: 33 }]))
        .mockResolvedValueOnce(
          mockResponse(200, [
            {
              folio: "100",
              rutReceptor: "1-9",
              razonSocialReceptor: "Cliente Test",
              fechaEmision: "2026-08-05",
              montoTotal: 50000,
              estado: "ACEPTADO",
            },
          ])
        );

      const documentos = await fetchRcvDocumentos(credenciales, "venta", "2026-08");

      // El RUT va sin puntos y en mayúsculas; el período, sin guion.
      const resumenUrl = fetchMock.mock.calls[0][0] as string;
      const detalleUrl = fetchMock.mock.calls[1][0] as string;
      expect(resumenUrl).toBe(
        "https://app.apigateway.cl/api/v2/sii/rcv/ventas/resumen/12345678-9/202608"
      );
      expect(detalleUrl).toBe(
        "https://app.apigateway.cl/api/v2/sii/rcv/ventas/detalle/12345678-9/202608/33"
      );

      expect(documentos).toEqual([
        {
          folio: "100",
          rutContraparte: "1-9",
          razonSocialContraparte: "Cliente Test",
          fechaEmision: "2026-08-05",
          monto: 50000,
          estadoSii: "ACEPTADO",
          raw: expect.objectContaining({ folio: "100" }),
        },
      ]);
    });

    it("compras: arma la URL con /REGISTRO y usa el emisor como contraparte", async () => {
      fetchMock
        .mockResolvedValueOnce(mockResponse(200, [{ tipoDte: 33 }]))
        .mockResolvedValueOnce(
          mockResponse(200, [
            {
              Folio: "200",
              RutEmisor: "5-6",
              razonSocialEmisor: "Proveedor Test",
              FechaEmision: "2026-08-10",
              MontoTotal: 12000,
              Estado: "REGISTRO",
            },
          ])
        );

      const documentos = await fetchRcvDocumentos(credenciales, "compra", "2026-08");

      const resumenUrl = fetchMock.mock.calls[0][0] as string;
      const detalleUrl = fetchMock.mock.calls[1][0] as string;
      expect(resumenUrl).toBe(
        "https://app.apigateway.cl/api/v2/sii/rcv/compras/resumen/12345678-9/202608/REGISTRO"
      );
      expect(detalleUrl).toBe(
        "https://app.apigateway.cl/api/v2/sii/rcv/compras/detalle/12345678-9/202608/33/REGISTRO"
      );

      expect(documentos).toEqual([
        {
          folio: "200",
          rutContraparte: "5-6",
          razonSocialContraparte: "Proveedor Test",
          fechaEmision: "2026-08-10",
          monto: 12000,
          estadoSii: "REGISTRO",
          raw: expect.objectContaining({ Folio: "200" }),
        },
      ]);
    });

    it("devuelve [] sin llamar al detalle si el resumen viene vacío", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(200, []));

      const documentos = await fetchRcvDocumentos(credenciales, "venta", "2026-08");

      expect(documentos).toEqual([]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("devuelve [] si el resumen responde 404 (sin documentos ese período)", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(404, null));

      const documentos = await fetchRcvDocumentos(credenciales, "venta", "2026-08");

      expect(documentos).toEqual([]);
    });

    it("propaga SiiCredencialesInvalidasError si el resumen responde 401", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(401, null));

      await expect(
        fetchRcvDocumentos(credenciales, "venta", "2026-08")
      ).rejects.toThrow(SiiCredencialesInvalidasError);
    });
  });

  describe("validarCredencialesSii", () => {
    it("no lanza error si las credenciales son válidas (200 o 404)", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(200, []));
      await expect(validarCredencialesSii(credenciales)).resolves.toBeUndefined();
    });

    it("no lanza error si el período no tiene ventas (404)", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(404, null));
      await expect(validarCredencialesSii(credenciales)).resolves.toBeUndefined();
    });

    it("lanza SiiCredencialesInvalidasError si la API responde 401", async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(401, null));
      await expect(validarCredencialesSii(credenciales)).rejects.toThrow(
        SiiCredencialesInvalidasError
      );
    });
  });
});
