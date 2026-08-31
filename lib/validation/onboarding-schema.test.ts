import { describe, expect, it } from "vitest";
import { onboardingSchema } from "@/lib/validation/onboarding-schema";

const validPayload = {
  artistName: "Dark Ink Studio",
  city: "Paris",
  siret: "12345678901234",
  styleIds: ["style-1"],
};

describe("onboardingSchema — SIRET", () => {
  it("accepts a 14-digit SIRET", () => {
    const result = onboardingSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejects a SIRET with fewer than 14 digits", () => {
    const result = onboardingSchema.safeParse({ ...validPayload, siret: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects a SIRET containing non-numeric characters", () => {
    const result = onboardingSchema.safeParse({
      ...validPayload,
      siret: "1234567890123A",
    });
    expect(result.success).toBe(false);
  });
});

describe("onboardingSchema — champs requis", () => {
  it("rejects un nom artistique vide", () => {
    const result = onboardingSchema.safeParse({ ...validPayload, artistName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects une liste de styles vide", () => {
    const result = onboardingSchema.safeParse({ ...validPayload, styleIds: [] });
    expect(result.success).toBe(false);
  });

  it("accepte les champs optionnels absents (bio, location, prix)", () => {
    const result = onboardingSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });
});
