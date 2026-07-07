"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { UploadCloud, FileWarning, CheckCircle2 } from "lucide-react";

type CSVRow = Record<string, string>;

export default function CSVUploader() {
  const router = useRouter();
  const [allRows, setAllRows] = useState<CSVRow[]>([]);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parseFile = useCallback((file: File) => {
    setError(null);
    setSuccessMessage(null);
    setFileName(file.name);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(
            `No se pudo leer el archivo: ${results.errors[0].message}`
          );
          setAllRows([]);
          setPreview([]);
          setColumns([]);
          return;
        }
        const rows = results.data;
        if (!rows.length) {
          setError("El archivo no contiene filas de datos.");
          setAllRows([]);
          setPreview([]);
          setColumns([]);
          return;
        }
        setColumns(Object.keys(rows[0]));
        setPreview(rows.slice(0, 5));
        setAllRows(rows);
      },
      error: (err) => {
        setError(`Error al procesar el archivo: ${err.message}`);
        setAllRows([]);
        setPreview([]);
        setColumns([]);
      },
    });
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/products/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: allRows }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo guardar el CSV.");
      }

      if (data.truncated) {
        setSuccessMessage(
          `Se guardaron ${data.saved} de ${data.received} productos. Tu plan permite monitorear hasta ${data.limit} SKUs — el resto no se guardó.`
        );
      } else {
        setSuccessMessage(`Se guardaron ${data.saved} productos correctamente.`);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-panel-raised p-6">
      <h3 className="font-display text-lg text-text-high">
        Sube tu CSV de ventas
      </h3>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition ${
          isDragging ? "border-teal bg-teal/5" : "border-border"
        }`}
      >
        <UploadCloud size={28} className="text-teal" />
        <span className="text-text-medium">
          Arrastra tu archivo aquí o haz clic para seleccionarlo
        </span>
        <span className="text-xs text-text-medium">
          Formatos aceptados: .csv (columnas: sku, stock, y una columna por
          fecha con las ventas de ese día)
        </span>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileInput}
        />
      </label>

      {fileName && !error && (
        <p className="mt-4 font-mono text-xs text-text-medium">{fileName}</p>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
          <FileWarning size={18} />
          {error}
        </div>
      )}

      {successMessage && !error && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      )}

      {preview.length > 0 && !error && (
        <div className="mt-4 overflow-x-auto">
          <p className="mb-2 text-xs text-text-medium">
            Vista previa (primeras {preview.length} de {allRows.length} filas)
          </p>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-medium">
                {columns.map((col) => (
                  <th key={col} className="px-3 py-2 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-3 py-2 font-mono text-text-high"
                    >
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-4 rounded-md bg-teal px-6 py-2 font-medium text-navy transition hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar en mi dashboard"}
          </button>
        </div>
      )}
    </div>
  );
}
