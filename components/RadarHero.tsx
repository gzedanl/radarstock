"use client";

import { useState } from "react";

type RiskLevel = "alto" | "medio";

interface Blip {
  nombre: string;
  risk: RiskLevel;
  top: string;
  left: string;
}

// Mismos productos que components/ProductTable.tsx (DEMO_PRODUCTS), para
// que la landing y el dashboard demo cuenten la misma historia — un
// nombre de producto es más reconocible para una PYME que un SKU.
const BLIPS: Blip[] = [
  { nombre: "Jamón Serrano 100g", risk: "alto", top: "28%", left: "62%" },
  { nombre: "Aceite de Oliva 500ml", risk: "medio", top: "68%", left: "40%" },
  { nombre: "Queso Gouda 200g", risk: "alto", top: "45%", left: "22%" },
  { nombre: "Membrillo 300g", risk: "medio", top: "20%", left: "35%" },
  { nombre: "Aceitunas Negras 250g", risk: "alto", top: "72%", left: "68%" },
];

const RING_COUNT = 4;

export default function RadarHero() {
  const [activeBlip, setActiveBlip] = useState<string | null>(null);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div className="relative h-full w-full overflow-hidden rounded-full border border-border bg-panel">
        {Array.from({ length: RING_COUNT }).map((_, i) => {
          const size = ((i + 1) / RING_COUNT) * 100;
          return (
            <div
              key={i}
              className="absolute rounded-full border border-border/70"
              style={{
                width: `${size}%`,
                height: `${size}%`,
                top: `${(100 - size) / 2}%`,
                left: `${(100 - size) / 2}%`,
              }}
            />
          );
        })}

        <div
          className="absolute inset-0 origin-center animate-radar-sweep motion-reduce:animate-none"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(0,217,163,0.45), rgba(0,217,163,0) 30%)",
          }}
        />

        {BLIPS.map((blip) => (
          <div
            key={blip.nombre}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: blip.top, left: blip.left }}
            onMouseEnter={() => setActiveBlip(blip.nombre)}
            onMouseLeave={() => setActiveBlip(null)}
          >
            <span
              className={`block h-3 w-3 animate-blip-pulse rounded-full motion-reduce:animate-none ${
                blip.risk === "alto" ? "bg-amber" : "bg-teal"
              }`}
            />
            {activeBlip === blip.nombre && (
              <div className="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-panel-raised px-2 py-1 text-xs text-text-high shadow-lg">
                {blip.nombre} · riesgo {blip.risk}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
