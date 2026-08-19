import { describe, expect, it } from "vitest";
import { isTrialExpired, isTrialPlan } from "./trialStatus";

describe("isTrialExpired", () => {
  it("es false si el plan no es trial, sin importar la fecha", () => {
    expect(isTrialExpired("starter", "2000-01-01")).toBe(false);
  });

  it("es false si es trial pero no tiene trial_ends_at", () => {
    expect(isTrialExpired("trial", null)).toBe(false);
  });

  it("es true si es trial y trial_ends_at ya pasó", () => {
    expect(isTrialExpired("trial", "2000-01-01")).toBe(true);
  });

  it("es false si es trial y trial_ends_at todavía no llega", () => {
    const enElFuturo = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(isTrialExpired("trial", enElFuturo)).toBe(false);
  });
});

describe("isTrialPlan", () => {
  it("es true para plan trial, sin importar si venció o no", () => {
    expect(isTrialPlan("trial")).toBe(true);
  });

  it("es false para cualquier plan pago", () => {
    expect(isTrialPlan("starter")).toBe(false);
    expect(isTrialPlan("growth")).toBe(false);
    expect(isTrialPlan("enterprise")).toBe(false);
  });
});
