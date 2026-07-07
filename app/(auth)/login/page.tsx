import Link from "next/link";
import { login } from "../actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-panel-raised p-8">
        <h1 className="font-display text-2xl font-semibold text-text-high">
          Inicia sesión
        </h1>
        <p className="mt-1 text-sm text-text-medium">
          Vuelve a tu radar de inventario.
        </p>

        {searchParams.message && (
          <p className="mt-4 rounded-md border border-teal/40 bg-teal/10 px-3 py-2 text-sm text-teal">
            {searchParams.message}
          </p>
        )}

        <form action={login} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-sm text-text-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2 text-text-high outline-none focus:border-teal"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm text-text-medium">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-md border border-border bg-panel px-3 py-2 text-text-high outline-none focus:border-teal"
            />
          </div>

          {searchParams.error && (
            <p className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-sm text-amber">
              {searchParams.error}
            </p>
          )}

          <button
            type="submit"
            className="mt-2 rounded-md bg-teal px-4 py-2 font-medium text-navy transition hover:opacity-90"
          >
            Iniciar sesión
          </button>
        </form>

        <p className="mt-6 text-sm text-text-medium">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="text-teal hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
