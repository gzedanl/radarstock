"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div style={{ padding: "4rem", textAlign: "center" }}>
          <h1>Ocurrió un error inesperado</h1>
          <p>Ya nos enteramos y lo estamos revisando. Intenta recargar la página.</p>
        </div>
      </body>
    </html>
  );
}
