import * as Sentry from "@sentry/nextjs";

// TEMPORAL: diagnóstico para confirmar si NEXT_PUBLIC_SENTRY_DSN llega
// a esta función en runtime — borrar junto con debug/este log una vez
// confirmado que Sentry recibe eventos.
console.log(
  "[sentry-debug] DSN presente:",
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  "longitud:",
  process.env.NEXT_PUBLIC_SENTRY_DSN?.length ?? 0
);

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
