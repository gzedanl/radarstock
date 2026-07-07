import Link from "next/link";
import { signup } from "../actions";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-panel-raised p-8">
        <h1 className="font-display text-2xl font-semibold text-text-high">
          Crea tu cuenta
        </h1>
        <p className="mt-1 text-sm text-text-medium">
          Empieza a predecir tu inventario en minutos.
        </p>

        <form action={signup} className="mt-6 flex flex-col gap-4">
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
              minLength={6}
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
            Crear cuenta
          </button>
        </form>

        <p className="mt-6 text-sm text-text-medium">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-teal hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
