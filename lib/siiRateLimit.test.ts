import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { siiRateLimitExceeded } from "./siiRateLimit";

function buildSupabaseMock(result: { count: number | null; error: { message: string } | null }) {
  const gte = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ gte });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { from, __eq: eq, __select: select } as unknown as SupabaseClient & {
    __eq: typeof eq;
    __select: typeof select;
  };
}

describe("siiRateLimitExceeded", () => {
  it("es false si el conteo está bajo el límite (5 intentos en 15 min)", async () => {
    const supabase = buildSupabaseMock({ count: 3, error: null });
    expect(await siiRateLimitExceeded(supabase, "company-1")).toBe(false);
  });

  it("es true si el conteo alcanza el límite", async () => {
    const supabase = buildSupabaseMock({ count: 5, error: null });
    expect(await siiRateLimitExceeded(supabase, "company-1")).toBe(true);
  });

  it("es true si el conteo supera el límite", async () => {
    const supabase = buildSupabaseMock({ count: 8, error: null });
    expect(await siiRateLimitExceeded(supabase, "company-1")).toBe(true);
  });

  it("trata count null como 0 (sin intentos todavía)", async () => {
    const supabase = buildSupabaseMock({ count: null, error: null });
    expect(await siiRateLimitExceeded(supabase, "company-1")).toBe(false);
  });

  it("falla abierto (false) si Supabase devuelve un error, sin bloquear al usuario", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const supabase = buildSupabaseMock({
      count: null,
      error: { message: "relation does not exist" },
    });
    expect(await siiRateLimitExceeded(supabase, "company-1")).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("filtra por el company_id recibido", async () => {
    const supabase = buildSupabaseMock({ count: 0, error: null });
    await siiRateLimitExceeded(supabase, "company-especifica");
    expect(supabase.__eq).toHaveBeenCalledWith("company_id", "company-especifica");
  });
});
