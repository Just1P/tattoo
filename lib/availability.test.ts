import { describe, expect, it } from "vitest";
import {
  doDateRangesOverlap,
  doTimeRangesOverlap,
  getDayOfWeek,
  getFreeTimeRangesForDate,
  isDateBlocked,
  isSlotAvailable,
  isTimeRangeWithinAny,
  subtractTimeRanges,
} from "@/lib/availability";

// 2026-07-06 est un lundi, 2026-07-07 un mardi.
const MONDAY = new Date("2026-07-06T00:00:00");
const TUESDAY = new Date("2026-07-07T00:00:00");

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

describe("getDayOfWeek", () => {
  it("identifie correctement un lundi", () => {
    expect(getDayOfWeek(MONDAY)).toBe("MONDAY");
  });

  it("identifie correctement un mardi", () => {
    expect(getDayOfWeek(TUESDAY)).toBe("TUESDAY");
  });
});

describe("isDateBlocked", () => {
  it("détecte une date à l'intérieur d'une période bloquée", () => {
    const blocked = [{ startDate: new Date("2026-07-05"), endDate: new Date("2026-07-10") }];
    expect(isDateBlocked(MONDAY, blocked)).toBe(true);
  });

  it("ne bloque pas une date hors période", () => {
    const blocked = [{ startDate: new Date("2026-07-10"), endDate: new Date("2026-07-15") }];
    expect(isDateBlocked(MONDAY, blocked)).toBe(false);
  });
});

describe("subtractTimeRanges", () => {
  it("retire une plage réservée au milieu d'un créneau, en laissant deux trous libres", () => {
    const result = subtractTimeRanges(
      [{ startTime: "09:00", endTime: "18:00" }],
      [{ startTime: "12:00", endTime: "13:00" }],
    );
    expect(result).toEqual([
      { startTime: "09:00", endTime: "12:00" },
      { startTime: "13:00", endTime: "18:00" },
    ]);
  });

  it("ne crée pas de faux trou quand la réservation est adjacente à la limite du créneau", () => {
    const result = subtractTimeRanges(
      [{ startTime: "09:00", endTime: "18:00" }],
      [{ startTime: "09:00", endTime: "10:00" }],
    );
    expect(result).toEqual([{ startTime: "10:00", endTime: "18:00" }]);
  });

  it("retourne le créneau vide si entièrement recouvert", () => {
    const result = subtractTimeRanges(
      [{ startTime: "09:00", endTime: "18:00" }],
      [{ startTime: "08:00", endTime: "19:00" }],
    );
    expect(result).toEqual([]);
  });
});

describe("isTimeRangeWithinAny", () => {
  it("détecte qu'une plage est contenue dans un créneau", () => {
    expect(isTimeRangeWithinAny("10:00", "11:00", [{ startTime: "09:00", endTime: "18:00" }])).toBe(true);
  });

  it("rejette une plage qui dépasse le créneau", () => {
    expect(isTimeRangeWithinAny("17:00", "19:00", [{ startTime: "09:00", endTime: "18:00" }])).toBe(false);
  });

  it("fonctionne même avec des créneaux hebdo qui se chevauchent entre eux", () => {
    const ranges = [
      { startTime: "09:00", endTime: "12:00" },
      { startTime: "11:00", endTime: "18:00" },
    ];
    expect(isTimeRangeWithinAny("13:00", "15:00", ranges)).toBe(true);
  });
});

describe("getFreeTimeRangesForDate", () => {
  it("renvoie les créneaux vides si la date est bloquée", () => {
    const result = getFreeTimeRangesForDate(
      MONDAY,
      [{ day: "MONDAY", startTime: "09:00", endTime: "18:00" }],
      [{ startDate: new Date("2026-07-06T00:00:00"), endDate: new Date("2026-07-06T23:59:59") }],
      [],
    );
    expect(result).toEqual([]);
  });

  it("renvoie vide si l'artiste ne travaille pas ce jour-là", () => {
    const result = getFreeTimeRangesForDate(
      MONDAY,
      [{ day: "TUESDAY", startTime: "09:00", endTime: "18:00" }],
      [],
      [],
    );
    expect(result).toEqual([]);
  });

  it("soustrait une réservation confirmée du même jour", () => {
    const startAt = new Date("2026-07-06T14:00:00");
    const endAt = new Date("2026-07-06T15:00:00");
    const result = getFreeTimeRangesForDate(
      MONDAY,
      [{ day: "MONDAY", startTime: "09:00", endTime: "18:00" }],
      [],
      [{ id: "b1", startAt, endAt }],
    );
    expect(result).toEqual([
      { startTime: "09:00", endTime: "14:00" },
      { startTime: "15:00", endTime: "18:00" },
    ]);
  });

  it("exclut la réservation passée en excludeBookingId", () => {
    const startAt = new Date("2026-07-06T14:00:00");
    const endAt = new Date("2026-07-06T15:00:00");
    const result = getFreeTimeRangesForDate(
      MONDAY,
      [{ day: "MONDAY", startTime: "09:00", endTime: "18:00" }],
      [],
      [{ id: "b1", startAt, endAt }],
      { excludeBookingId: "b1" },
    );
    expect(result).toEqual([{ startTime: "09:00", endTime: "18:00" }]);
  });
});

describe("isSlotAvailable", () => {
  const weeklySlots = [{ day: "MONDAY" as const, startTime: "09:00", endTime: "18:00" }];

  it("accepte un créneau valide dans les horaires déclarés", () => {
    const result = isSlotAvailable(
      new Date("2026-07-06T10:00:00"),
      new Date("2026-07-06T11:00:00"),
      weeklySlots,
      [],
      [],
    );
    expect(result).toEqual({ ok: true });
  });

  it("rejette si l'heure de fin précède l'heure de début", () => {
    const result = isSlotAvailable(
      new Date("2026-07-06T11:00:00"),
      new Date("2026-07-06T10:00:00"),
      weeklySlots,
      [],
      [],
    );
    expect(result.ok).toBe(false);
  });

  it("rejette un créneau à cheval sur deux jours", () => {
    const result = isSlotAvailable(
      new Date("2026-07-06T23:00:00"),
      new Date("2026-07-07T01:00:00"),
      weeklySlots,
      [],
      [],
    );
    expect(result.ok).toBe(false);
  });

  it("rejette une date dans une période bloquée", () => {
    const result = isSlotAvailable(
      new Date("2026-07-06T10:00:00"),
      new Date("2026-07-06T11:00:00"),
      weeklySlots,
      [{ startDate: new Date("2026-07-06T00:00:00"), endDate: new Date("2026-07-06T23:59:59") }],
      [],
    );
    expect(result.ok).toBe(false);
  });

  it("rejette un jour sans créneau hebdo déclaré", () => {
    const result = isSlotAvailable(
      new Date("2026-07-07T10:00:00"),
      new Date("2026-07-07T11:00:00"),
      weeklySlots,
      [],
      [],
    );
    expect(result.ok).toBe(false);
  });

  it("rejette un créneau en dehors des horaires déclarés", () => {
    const result = isSlotAvailable(
      new Date("2026-07-06T19:00:00"),
      new Date("2026-07-06T20:00:00"),
      weeklySlots,
      [],
      [],
    );
    expect(result.ok).toBe(false);
  });

  it("rejette un créneau qui chevauche une réservation confirmée existante", () => {
    const existing = [
      {
        id: "b1",
        startAt: new Date("2026-07-06T10:00:00"),
        endAt: new Date("2026-07-06T12:00:00"),
      },
    ];
    const result = isSlotAvailable(
      new Date("2026-07-06T11:00:00"),
      new Date("2026-07-06T13:00:00"),
      weeklySlots,
      [],
      existing,
    );
    expect(result.ok).toBe(false);
  });

  it("accepte en ignorant la réservation elle-même via excludeBookingId", () => {
    const existing = [
      {
        id: "b1",
        startAt: new Date("2026-07-06T10:00:00"),
        endAt: new Date("2026-07-06T12:00:00"),
      },
    ];
    const result = isSlotAvailable(
      new Date("2026-07-06T10:00:00"),
      new Date("2026-07-06T12:00:00"),
      weeklySlots,
      [],
      existing,
      { excludeBookingId: "b1" },
    );
    expect(result).toEqual({ ok: true });
  });
});
