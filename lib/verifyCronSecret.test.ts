import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyCronSecret } from "./verifyCronSecret";

describe("verifyCronSecret", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "el-secreto-correcto";
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("es true si el header coincide con el secreto configurado", () => {
    expect(verifyCronSecret("Bearer el-secreto-correcto")).toBe(true);
  });

  it("es false si el header no coincide", () => {
    expect(verifyCronSecret("Bearer un-secreto-incorrecto")).toBe(false);
  });

  it("es false si el header es null", () => {
    expect(verifyCronSecret(null)).toBe(false);
  });

  it("es false si no hay CRON_SECRET configurado en el entorno", () => {
    delete process.env.CRON_SECRET;
    expect(verifyCronSecret("Bearer cualquier-cosa")).toBe(false);
  });

  it("es false si falta el prefijo 'Bearer '", () => {
    expect(verifyCronSecret("el-secreto-correcto")).toBe(false);
  });

  it("es false si el header tiene distinto largo (no compara byte a byte)", () => {
    expect(verifyCronSecret("Bearer x")).toBe(false);
  });
});
