// Stub de "server-only" para tests con Vitest: el paquete real revienta
// si se importa fuera de un build de Next.js con soporte a Server
// Components, que Vitest no tiene. Los módulos que lo usan (lib/sii.ts,
// lib/siiRateLimit.ts, etc.) son código de servidor de todas formas —
// el paquete solo protege contra un import accidental desde el cliente
// en el build de Next.js, no aporta nada dentro de los tests.
export {};
