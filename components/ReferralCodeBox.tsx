"use client";

import { useState } from "react";

export default function ReferralCodeBox({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard puede fallar por permisos del navegador — el link
      // sigue visible y seleccionable a mano, no es un error fatal.
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <code className="rounded-md border border-border bg-panel px-3 py-2 text-sm text-text-high">
        {link}
      </code>
      <button
        type="button"
        onClick={copiar}
        className="rounded-md border border-teal/40 px-3 py-2 text-sm font-medium text-teal transition hover:bg-teal/10"
      >
        {copiado ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
