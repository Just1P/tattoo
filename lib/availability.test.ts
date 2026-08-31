import { describe, expect, it } from "vitest";
import { doDateRangesOverlap, doTimeRangesOverlap } from "@/lib/availability";

describe("doTimeRangesOverlap", () => {
  it("détecte deux créneaux qui se chevauchent", () => {
    expect(doTimeRangesOverlap("09:00", "11:00", "10:00", "12:00")).toBe(true);
  });

  it("ne détecte pas de chevauchement quand un créneau se termine juste au début de l'autre", () => {
    expect(doTimeRangesOverlap("09:00", "10:00", "10:00", "11:00")).toBe(false);
  });

  it("ne détecte pas de chevauchement pour des créneaux disjoints", () => {
    expect(doTimeRangesOverlap("09:00", "10:00", "11:00", "12:00")).toBe(false);
  });

  it("détecte un chevauchement pour deux créneaux identiques", () => {
    expect(doTimeRangesOverlap("09:00", "11:00", "09:00", "11:00")).toBe(true);
  });

  it("détecte un chevauchement quand un créneau est inclus dans l'autre", () => {
    expect(doTimeRangesOverlap("09:00", "12:00", "10:00", "11:00")).toBe(true);
  });
});

describe("doDateRangesOverlap", () => {
  it("détecte deux périodes qui se chevauchent", () => {
    expect(
      doDateRangesOverlap(
        new Date("2026-07-01"),
        new Date("2026-07-10"),
        new Date("2026-07-05"),
        new Date("2026-07-15"),
      ),
    ).toBe(true);
  });

  it("détecte un chevauchement quand les périodes se touchent sur un jour commun", () => {
    expect(
      doDateRangesOverlap(
        new Date("2026-07-01"),
        new Date("2026-07-10"),
        new Date("2026-07-10"),
        new Date("2026-07-15"),
      ),
    ).toBe(true);
  });

  it("ne détecte pas de chevauchement pour des périodes disjointes", () => {
    expect(
      doDateRangesOverlap(
        new Date("2026-07-01"),
        new Date("2026-07-10"),
        new Date("2026-07-11"),
        new Date("2026-07-15"),
      ),
    ).toBe(false);
  });
});
