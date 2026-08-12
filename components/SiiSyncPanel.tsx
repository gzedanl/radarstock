"use client";

import { useState } from "react";

interface UltimaSincronizacion {
  periodo: string;
  estado: string;
  comprasSincronizadas: number;
  ventasSincronizadas: number;
  creadoEn: string;
}

interface SiiSyncPanelProps {
  ultimaSincronizacion: UltimaSincronizacion | null;
  totalDocumentos: number;
}

function periodoActual(): string {
  return new Date().toISOString().slice(0, 7);
}

// Fase 1: solo sincroniza compras y ventas a nivel de documento (folio,
// proveedor/cliente, monto, fecha) — no detalle de productos/cantidad
// por línea, así que todavía no reemplaza la carga de CSV de ventas
// históricas. Sirve para tener un registro auditable de compras y
// ventas sin digitarlo a mano.
export default function SiiSyncPanel({
  ultimaSincronizacion,
  totalDocumentos,
}: SiiSyncPanelProps) {
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [periodo, setPeriodo] = useState(periodoActual());
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    compras: number;
    ventas: number;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setIsSyncing(true);

    try {
      const res = await fetch("/api/sii/sincronizar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut, password, periodo }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo sincronizar con el SII.");
      }

      setResult({ compras: data.compras, ventas: data.ventas });
      if (data.errores?.length > 0) {
        setError(data.errores.join(" "));
      }
      // La clave nunca se guarda — se limpia del formulario apenas se usa.
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-panel-raised p-6">
      <h3 className="font-display text-lg text-text-high">
        Sincronizar con el SII
      </h3>
      <p className="mt-1 text-sm text-text-medium">
        Trae tus compras y ventas del Registro de Compras y Ventas del SII
        para un período. Tu RUT y clave se usan solo para esta consulta y
        nunca se guardan.
      </p>

      {ultimaSincronizacion && (
        <p className="mt-3 text-xs text-text-medium">
          Última sincronización: {ultimaSincronizacion.periodo} —{" "}
          {ultimaSincronizacion.comprasSincronizadas} compras,{" "}
          {ultimaSincronizacion.ventasSincronizadas} ventas
          {ultimaSincronizacion.estado === "error" ? " (con errores)" : ""}.{" "}
          {totalDocumentos} documentos guardados en total.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
        {error && (
          <p className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-amber">
            {error}
          </p>
        )}
        {result && (
          <p className="rounded-md border border-teal/40 bg-teal/10 px-3 py-2 text-sm text-teal">
            Listo: {result.compras} compras y {result.ventas} ventas
            sincronizadas para {periodo}.
          </p>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-text-medium">
            RUT
            <input
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="76.123.456-7"
              required
              className="w-40 rounded-md border border-border bg-panel px-3 py-2 text-text-high placeholder:text-text-medium/60 focus:border-teal focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-medium">
            Clave SII
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="off"
              className="w-40 rounded-md border border-border bg-panel px-3 py-2 text-text-high focus:border-teal focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-text-medium">
            Período
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              required
              className="w-40 rounded-md border border-border bg-panel px-3 py-2 text-text-high focus:border-teal focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={isSyncing}
            className="rounded-md bg-teal px-5 py-2 font-medium text-navy transition hover:opacity-90 disabled:opacity-50"
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </button>
        </div>
      </form>
    </div>
  );
}
