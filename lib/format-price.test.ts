import { describe, expect, it } from "vitest";
import { formatHourlyRateRange } from "@/lib/format-price";

describe("formatHourlyRateRange", () => {
  it("formats a min/max range", () => {
    expect(formatHourlyRateRange(80, 150)).toBe("80 – 150 €/h");
  });
});
