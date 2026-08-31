import { describe, expect, it } from "vitest";
import { formatHourlyRateRange } from "@/lib/format-price";

describe("formatHourlyRateRange", () => {
  it("formats a min/max range", () => {
    expect(formatHourlyRateRange(80, 150)).toBe("80 – 150 €/h");
  });

  it("formats a min-only rate", () => {
    expect(formatHourlyRateRange(80, null)).toBe("À partir de 80 €/h");
  });

  it("formats a max-only rate", () => {
    expect(formatHourlyRateRange(null, 150)).toBe("Jusqu'à 150 €/h");
  });

  it("returns null when neither rate is set", () => {
    expect(formatHourlyRateRange(null, null)).toBeNull();
  });
});
