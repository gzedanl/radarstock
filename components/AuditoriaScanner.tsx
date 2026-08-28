"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Producto {
  id: string;
  sku: string;
  nombre: string | null;
  stockActual: number;
}

interface ItemConteo {
  productId: string;
  stockTeorico: number;
  stockContado: number;
}

interface Discrepancia extends ItemConteo {
  merma: number;
}

// Duplicados: la cámara sigue leyendo el mismo código mientras el
// producto está frente al lente, así que se ignoran re-lecturas del
// mismo código dentro de esta ventana de tiempo.
const IGNORAR_DUPLICADO_MS = 2000;

// BarcodeDetector no está en los tipos de TS todavía (API experimental).
interface BarcodeDetectorResult {
  rawValue: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<BarcodeDetectorResult[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): BarcodeDetectorLike;
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

export default function AuditoriaScanner() {
  const [cargando, setCargando] = useState(true);
  const [auditoriaId, setAuditoriaId] = useState<string | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [items, setItems] = useState<Record<string, ItemConteo>>({});
  const [escaneando, setEscaneando] = useState(false);
  const [codigoPendiente, setCodigoPendiente] = useState<string | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [discrepancias, setDiscrepancias] = useState<Discrepancia[] | null>(
    null
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const ultimoEscaneoRef = useRef<Map<string, number>>(new Map());
  const procesandoRef = useRef(false);

  const cargarEstado = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/auditorias");
      if (!res.ok) throw new Error("No se pudo cargar la auditoría.");
      const data = await res.json();
      setProductos(data.productos ?? []);
      if (data.auditoria) {
        setAuditoriaId(data.auditoria.id);
        const mapa: Record<string, ItemConteo> = {};
        for (const item of data.items ?? []) {
          const producto = (data.productos ?? []).find(
            (p: Producto) => p.id === item.productId
          );
          mapa[item.productId] = {
            productId: item.productId,
            stockTeorico: producto?.stockActual ?? 0,
            stockContado: item.stockContado,
          };
        }
        setItems(mapa);
      } else {
        setAuditoriaId(null);
        setItems({});
      }
    } catch {
      setError("No se pudo cargar el estado de la auditoría.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarEstado();
  }, [cargarEstado]);

  const iniciarAuditoria = async () => {
    setError(null);
    try {
      const res = await fetch("/api/auditorias", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAuditoriaId(data.id);
      setItems({});
      setDiscrepancias(null);
    } catch {
      setError("No se pudo iniciar la auditoría.");
    }
  };

  const registrarEscaneo = useCallback(
    async (codigoBarras: string, productId?: string) => {
      if (!auditoriaId) return;
      try {
        const res = await fetch(`/api/auditorias/${auditoriaId}/escanear`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigoBarras, productId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "No se pudo registrar el escaneo.");
          return;
        }
        if (data.requiereMapeo) {
          setCodigoPendiente(codigoBarras);
          return;
        }
        setItems((prev) => ({
          ...prev,
          [data.productId]: {
            productId: data.productId,
            stockTeorico: data.stockTeorico,
            stockContado: data.stockContado,
          },
        }));
      } catch {
        setError("No se pudo registrar el escaneo.");
      }
    },
    [auditoriaId]
  );

  const onCodigoDetectado = useCallback(
    (codigo: string) => {
      const ahora = Date.now();
      const ultima = ultimoEscaneoRef.current.get(codigo) ?? 0;
      if (ahora - ultima < IGNORAR_DUPLICADO_MS) return;
      ultimoEscaneoRef.current.set(codigo, ahora);
      registrarEscaneo(codigo);
    },
    [registrarEscaneo]
  );

  const detenerCamara = useCallback(() => {
    zxingControlsRef.current?.stop();
    zxingControlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    detectorRef.current = null;
    setEscaneando(false);
  }, []);

  const activarCamara = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setEscaneando(true);

      if (window.BarcodeDetector) {
        detectorRef.current = new window.BarcodeDetector({
          formats: [
            "ean_13",
            "ean_8",
            "upc_a",
            "upc_e",
            "code_128",
            "code_39",
            "qr_code",
          ],
        });
        const loop = async () => {
          if (!videoRef.current || !detectorRef.current || !streamRef.current)
            return;
          if (!procesandoRef.current) {
            procesandoRef.current = true;
            try {
              const resultados = await detectorRef.current.detect(
                videoRef.current
              );
              for (const r of resultados) {
                if (r.rawValue) onCodigoDetectado(r.rawValue);
              }
            } catch {
              // Frame no decodificable — se reintenta en el próximo tick.
            }
            procesandoRef.current = false;
          }
          if (streamRef.current) requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      } else {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoElement(
          videoRef.current!,
          (result) => {
            if (result) onCodigoDetectado(result.getText());
          }
        );
        zxingControlsRef.current = controls;
      }
    } catch {
      setError(
        "No se pudo acceder a la cámara. Revisa los permisos del navegador."
      );
      setEscaneando(false);
    }
  };

  useEffect(() => () => detenerCamara(), [detenerCamara]);

  const confirmarMapeo = async () => {
    if (!codigoPendiente || !productoSeleccionado) return;
    await registrarEscaneo(codigoPendiente, productoSeleccionado);
    setCodigoPendiente(null);
    setProductoSeleccionado("");
  };

  const finalizarAuditoria = async () => {
    if (!auditoriaId) return;
    setError(null);
    try {
      const res = await fetch(`/api/auditorias/${auditoriaId}/finalizar`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      detenerCamara();
      setDiscrepancias(data.discrepancias ?? []);
      setAuditoriaId(null);
    } catch {
      setError("No se pudo finalizar la auditoría.");
    }
  };

  const nombreProducto = (productId: string) =>
    productos.find((p) => p.id === productId)?.nombre ??
    productos.find((p) => p.id === productId)?.sku ??
    productId;

  if (cargando) {
    return (
      <p className="text-sm text-text-medium">Cargando estado de auditoría…</p>
    );
  }

  if (discrepancias) {
    return (
      <div className="rounded-lg border border-border bg-panel-raised p-6">
        <h2 className="font-display text-lg text-text-high">
          Auditoría finalizada
        </h2>
        <p className="mt-1 text-sm text-text-medium">
          Stock real actualizado para {discrepancias.length} producto
          {discrepancias.length === 1 ? "" : "s"} contado
          {discrepancias.length === 1 ? "" : "s"}.
        </p>
        {discrepancias.length > 0 && (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-text-medium">
                <th className="pb-2 font-medium">Producto</th>
                <th className="pb-2 font-medium">Teórico</th>
                <th className="pb-2 font-medium">Contado</th>
                <th className="pb-2 font-medium">Merma</th>
              </tr>
            </thead>
            <tbody>
              {discrepancias.map((d) => (
                <tr key={d.productId} className="border-t border-border">
                  <td className="py-2 text-text-high">
                    {nombreProducto(d.productId)}
                  </td>
                  <td className="py-2 text-text-medium">{d.stockTeorico}</td>
                  <td className="py-2 text-text-medium">{d.stockContado}</td>
                  <td
                    className={`py-2 font-medium ${
                      d.merma > 0
                        ? "text-amber"
                        : d.merma < 0
                          ? "text-teal"
                          : "text-text-medium"
                    }`}
                  >
                    {d.merma > 0 ? `-${d.merma}` : d.merma < 0 ? `+${-d.merma}` : 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button
          onClick={iniciarAuditoria}
          className="mt-6 rounded-md bg-teal px-4 py-2 text-sm font-medium text-panel transition hover:bg-teal/90"
        >
          Iniciar nueva auditoría
        </button>
      </div>
    );
  }

  if (!auditoriaId) {
    return (
      <div className="rounded-lg border border-border bg-panel-raised p-6">
        <h2 className="font-display text-lg text-text-high">
          Conteo físico de inventario
        </h2>
        <p className="mt-1 text-sm text-text-medium">
          Escanea los códigos de barra de tus productos con la cámara del
          celular o notebook para comparar el stock real contra el stock que
          RadarStock cree que tienes.
        </p>
        {error && <p className="mt-3 text-sm text-amber">{error}</p>}
        <button
          onClick={iniciarAuditoria}
          className="mt-4 rounded-md bg-teal px-4 py-2 text-sm font-medium text-panel transition hover:bg-teal/90"
        >
          Iniciar auditoría
        </button>
      </div>
    );
  }

  const itemsList = Object.values(items);

  return (
    <div className="rounded-lg border border-border bg-panel-raised p-6">
      <h2 className="font-display text-lg text-text-high">
        Auditoría en curso
      </h2>
      {error && <p className="mt-2 text-sm text-amber">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-md border border-border bg-panel">
        <video
          ref={videoRef}
          className="aspect-video w-full object-cover"
          muted
          playsInline
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {!escaneando ? (
          <button
            onClick={activarCamara}
            className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-panel transition hover:bg-teal/90"
          >
            Activar cámara
          </button>
        ) : (
          <button
            onClick={detenerCamara}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-text-high transition hover:bg-panel"
          >
            Detener cámara
          </button>
        )}
        <button
          onClick={finalizarAuditoria}
          className="rounded-md border border-teal/40 px-4 py-2 text-sm font-medium text-teal transition hover:bg-teal/10"
        >
          Finalizar auditoría
        </button>
      </div>

      {codigoPendiente && (
        <div className="mt-4 rounded-md border border-amber/40 bg-amber/10 p-4">
          <p className="text-sm text-text-high">
            Código{" "}
            <span className="font-mono">{codigoPendiente}</span> no está
            asociado a ningún producto. ¿A cuál corresponde?
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              className="rounded-md border border-border bg-panel px-3 py-2 text-sm text-text-high"
            >
              <option value="">Selecciona un producto…</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre ?? p.sku}
                </option>
              ))}
            </select>
            <button
              onClick={confirmarMapeo}
              disabled={!productoSeleccionado}
              className="rounded-md bg-teal px-3 py-2 text-sm font-medium text-panel transition hover:bg-teal/90 disabled:opacity-50"
            >
              Asociar
            </button>
            <button
              onClick={() => {
                setCodigoPendiente(null);
                setProductoSeleccionado("");
              }}
              className="text-sm text-text-medium hover:text-text-high"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-text-medium">
          Productos contados ({itemsList.length})
        </p>
        {itemsList.length === 0 ? (
          <p className="mt-2 text-sm text-text-medium">
            Todavía no has escaneado ningún producto.
          </p>
        ) : (
          <table className="mt-2 w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-text-medium">
                <th className="pb-2 font-medium">Producto</th>
                <th className="pb-2 font-medium">Teórico</th>
                <th className="pb-2 font-medium">Contado</th>
              </tr>
            </thead>
            <tbody>
              {itemsList.map((item) => (
                <tr key={item.productId} className="border-t border-border">
                  <td className="py-2 text-text-high">
                    {nombreProducto(item.productId)}
                  </td>
                  <td className="py-2 text-text-medium">
                    {item.stockTeorico}
                  </td>
                  <td className="py-2 text-text-medium">
                    {item.stockContado}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
