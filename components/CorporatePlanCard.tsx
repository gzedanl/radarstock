"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export default function CorporatePlanCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Honeypot: campo oculto vía CSS, invisible para personas.
    if ((formData.get("website") as string)?.trim()) {
      setIsSent(true);
      return;
    }

    if (formData.get("aceptaPrivacidad") !== "on") {
      setError("Debes aceptar la Política de Privacidad para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa: formData.get("empresa"),
          email: formData.get("email"),
          telefono: formData.get("telefono"),
          mensaje: formData.get("mensaje"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "No se pudo enviar el mensaje.");
      }

      setIsSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col rounded-lg border border-border bg-panel-raised p-8">
      <h3 className="font-display text-xl text-text-high">Corporate</h3>
      <p className="mt-4 font-mono text-3xl text-text-high">A medida</p>
      <p className="mt-1 text-xs text-text-medium">
        Precio según volumen y alcance
      </p>
      <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm text-text-medium">
        <li>SKUs y usuarios ilimitados</li>
        <li>Predicción por país de origen para importadores</li>
        <li>Onboarding y soporte dedicado</li>
        <li>SLA a medida</li>
      </ul>

      {isSent ? (
        <p className="mt-8 rounded-md border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal">
          ¡Gracias! Te vamos a contactar a la brevedad.
        </p>
      ) : isOpen ? (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          {error && (
            <p className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-xs text-amber">
              {error}
            </p>
          )}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          <input
            type="text"
            name="empresa"
            required
            placeholder="Nombre de la empresa"
            className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-text-high placeholder:text-text-medium focus:border-teal focus:outline-none"
          />
          <input
            type="email"
            name="email"
            required
            placeholder="Email de contacto"
            className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-text-high placeholder:text-text-medium focus:border-teal focus:outline-none"
          />
          <input
            type="tel"
            name="telefono"
            placeholder="Teléfono (opcional)"
            className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-text-high placeholder:text-text-medium focus:border-teal focus:outline-none"
          />
          <textarea
            name="mensaje"
            rows={3}
            placeholder="Cuéntanos qué necesitas (opcional)"
            className="rounded-md border border-border bg-navy px-3 py-2 text-sm text-text-high placeholder:text-text-medium focus:border-teal focus:outline-none"
          />
          <label className="flex items-start gap-2 text-xs text-text-medium">
            <input
              type="checkbox"
              name="aceptaPrivacidad"
              required
              className="mt-0.5 accent-teal"
            />
            <span>
              Acepto la{" "}
              <Link href="/privacidad" className="text-teal hover:underline">
                Política de Privacidad
              </Link>
            </span>
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-md bg-teal px-6 py-3 font-medium text-navy transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="mt-8 rounded-md border border-teal px-6 py-3 font-medium text-teal transition hover:bg-teal/10"
        >
          Conversemos
        </button>
      )}
    </div>
  );
}
