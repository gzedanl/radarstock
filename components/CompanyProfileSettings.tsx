"use client";

import { useState, useTransition } from "react";
import { updateCompanyProfile } from "@/app/dashboard/actions";

interface CompanyProfileSettingsProps {
  rubro: string | null;
  comuna: string | null;
}

// Los value de estas opciones tienen que calzar exacto (sin tildes, en
// minúscula) con las claves que reconoce radarstock-ml — ver
// RUBRO_COMMODITIES en services/market_signals.py y
// RUBROS_SENSIBLES_CLIMA en services/demand_adjustments.py. Un rubro
// que no calce no rompe nada, pero tampoco activa ningún ajuste.
const RUBRO_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Prefiero no decir" },
  { value: "bebidas", label: "Bebidas" },
  { value: "ropa", label: "Ropa" },
  { value: "ferreteria", label: "Ferretería" },
  { value: "textil", label: "Textil" },
  { value: "alimentos", label: "Alimentos" },
  { value: "plasticos", label: "Plásticos" },
  { value: "transporte", label: "Transporte" },
];

export default function CompanyProfileSettings({
  rubro,
  comuna,
}: CompanyProfileSettingsProps) {
  const [rubroValue, setRubroValue] = useState(rubro ?? "");
  const [comunaValue, setComunaValue] = useState(comuna ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.set("rubro", rubroValue);
    formData.set("comuna", comunaValue);

    setSaved(false);
    startTransition(async () => {
      await updateCompanyProfile(formData);
      setSaved(true);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-panel-raised p-6">
      <h3 className="font-display text-lg text-text-high">
        Perfil de tu negocio
      </h3>
      <p className="mt-1 text-sm text-text-medium">
        Con tu rubro y comuna ajustamos la predicción por clima y
        feriados, y te avisamos si sube el precio de insumos clave de tu
        rubro. Es opcional.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-wrap items-end gap-4"
      >
        <label className="flex flex-col gap-1 text-sm text-text-medium">
          Rubro
          <select
            value={rubroValue}
            onChange={(e) => setRubroValue(e.target.value)}
            className="w-48 rounded-md border border-border bg-panel px-3 py-2 text-text-high"
          >
            {RUBRO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-text-medium">
          Comuna
          <input
            type="text"
            value={comunaValue}
            onChange={(e) => setComunaValue(e.target.value)}
            placeholder="Ej: Providencia"
            className="w-48 rounded-md border border-border bg-panel px-3 py-2 text-text-high"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-teal px-5 py-2 font-medium text-navy transition hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Guardando..." : "Guardar"}
        </button>
        {saved && !isPending && (
          <span className="text-sm text-teal">Guardado.</span>
        )}
      </form>
    </div>
  );
}
