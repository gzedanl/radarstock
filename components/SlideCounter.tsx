"use client";

import { useEffect, useRef, useState } from "react";

interface SlideCounterProps {
  labels: string[];
}

// Indicador de progreso para las presentaciones comerciales
// (/propuesta, /propuesta-corporate): observa qué <section> ocupa más
// pantalla y marca ese número — el lector siempre sabe cuánto le queda.
export default function SlideCounter({ labels }: SlideCounterProps) {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollRoot = document.querySelector("main");
    if (!scrollRoot) return;
    const sections = scrollRoot.querySelectorAll(":scope > section");
    if (sections.length === 0) return;

    // root: scrollRoot — main es su propio contenedor de scroll
    // (h-screen overflow-y-scroll), no el viewport del documento.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const index = Array.from(sections).indexOf(visible.target);
          if (index !== -1) setActive(index);
        }
      },
      { root: scrollRoot, threshold: [0.5] }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-border bg-panel/90 px-4 py-2 font-mono text-xs text-text-medium backdrop-blur"
    >
      <span className="text-text-high">
        {String(active + 1).padStart(2, "0")}
      </span>
      <span>/ {String(labels.length).padStart(2, "0")}</span>
      <span className="hidden text-text-medium sm:inline">
        — {labels[active]}
      </span>
    </div>
  );
}
