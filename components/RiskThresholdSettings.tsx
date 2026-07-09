"use client";

import { useState, useTransition } from "react";
import { updateRiskThresholds } from "@/app/dashboard/actions";

interface RiskThresholdSettingsProps {
  diasAlertaAlto: number;
  diasAlertaMedio: number;
}

export default function RiskThresholdSettings({
  diasAlertaAlto,
  diasAlertaMedio,
}: RiskThresholdSettingsProps) {
  const [alto, setAlto] = useState(diasAlertaAlto);
  const [medio, setMedio] = useState(diasAlertaMedio);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const isValid = alto >= 1 && medio > alto;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    const formData = new FormData();
    formData.set("dias_alerta_alto", String(alto));
    formData.set("dias_alerta_medio", String(medio));

    setSaved(false);
    startTransition(async () => {
      await updateRiskThresholds(formData);
      setSaved(true);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-panel-raised p-6">
      <h3 className="font-display text-lg text-text-high">Umbral de riesgo</h3>
      <p className="mt-1 text-sm text-text-medium">
        Define cuándo un SKU pasa a riesgo alto o medio, según cuánto demora
        tu reposición.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-wrap items-end gap-4"
      >
        <label className="flex flex-col gap-1 text-sm text-text-medium">
          Riesgo alto (días o menos)
          <input
            type="number"
            min={1}
            value={alto}
            onChange={(e) => setAlto(Number(e.target.value))}
            className="w-28 rounded-md border border-border bg-panel px-3 py-2 font-mono text-text-high"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-medium">
          Riesgo medio (días o menos)
          <input
            type="number"
            min={alto + 1}
            value={medio}
            onChange={(e) => setMedio(Number(e.target.value))}
            className="w-28 rounded-md border border-border bg-panel px-3 py-2 font-mono text-text-high"
          />
        </label>
        <button
          type="submit"
          disabled={!isValid || isPending}
          className="rounded-md bg-teal px-5 py-2 font-medium text-navy transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
        {saved && !isPending && (
          <span className="text-sm text-teal">Guardado.</span>
        )}
        {!isValid && (
          <span className="text-sm text-amber">
            El riesgo medio debe ser mayor que el riesgo alto.
          </span>
        )}
      </form>
    </div>
  );
}
