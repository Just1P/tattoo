import type { DayOfWeek } from "@/lib/time-utils";
import { DAYS } from "@/lib/time-utils";

/** Compare two "HH:MM" time strings; works because the format is fixed-width and zero-padded. */
export function doTimeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function doDateRangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

export type TimeRange = { startTime: string; endTime: string };
export type WeeklySlotLike = { day: DayOfWeek; startTime: string; endTime: string };
export type BlockedPeriodLike = { startDate: Date; endDate: Date };
export type BookingRangeLike = { id: string; startAt: Date; endAt: Date };

/** JS's `getDay()` is 0=Sunday..6=Saturday; DAYS is Monday-first. */
export function getDayOfWeek(date: Date): DayOfWeek {
  const jsDay = date.getDay();
  return DAYS[(jsDay + 6) % 7];
}

export function isDateBlocked(date: Date, blockedPeriods: BlockedPeriodLike[]): boolean {
  return blockedPeriods.some(
    (period) => date >= period.startDate && date <= period.endDate,
  );
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Subtracts `subtract` ranges from `base` ranges, returning the remaining free sub-ranges. */
export function subtractTimeRanges(base: TimeRange[], subtract: TimeRange[]): TimeRange[] {
  let free = base.map((r) => ({ start: toMinutes(r.startTime), end: toMinutes(r.endTime) }));

  for (const sub of subtract) {
    const subStart = toMinutes(sub.startTime);
    const subEnd = toMinutes(sub.endTime);
    const next: { start: number; end: number }[] = [];

    for (const range of free) {
      if (subEnd <= range.start || subStart >= range.end) {
        // No overlap with this range.
        next.push(range);
        continue;
      }
      if (subStart > range.start) {
        next.push({ start: range.start, end: subStart });
      }
      if (subEnd < range.end) {
        next.push({ start: subEnd, end: range.end });
      }
    }
    free = next;
  }

  return free
    .filter((r) => r.end > r.start)
    .map((r) => ({ startTime: toTimeString(r.start), endTime: toTimeString(r.end) }));
}

/** True if [start,end) is fully contained within at least one of `ranges` (does not merge overlapping ranges). */
export function isTimeRangeWithinAny(start: string, end: string, ranges: TimeRange[]): boolean {
  return ranges.some((r) => start >= r.startTime && end <= r.endTime);
}

/** Free "HH:MM" ranges for a specific calendar date, after subtracting that day's confirmed bookings. */
export function getFreeTimeRangesForDate(
  date: Date,
  weeklySlots: WeeklySlotLike[],
  blockedPeriods: BlockedPeriodLike[],
  confirmedBookings: BookingRangeLike[],
  opts?: { excludeBookingId?: string },
): TimeRange[] {
  if (isDateBlocked(date, blockedPeriods)) return [];

  const day = getDayOfWeek(date);
  const daySlots = weeklySlots.filter((s) => s.day === day);
  if (daySlots.length === 0) return [];

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const sameDayBookingRanges: TimeRange[] = confirmedBookings
    .filter((b) => b.id !== opts?.excludeBookingId)
    .filter((b) => b.startAt <= dayEnd && b.endAt >= dayStart)
    .map((b) => ({
      startTime: toTimeString(Math.max(0, (b.startAt.getTime() - dayStart.getTime()) / 60000)),
      endTime: toTimeString(
        Math.min(24 * 60, (b.endAt.getTime() - dayStart.getTime()) / 60000),
      ),
    }));

  return subtractTimeRanges(
    daySlots.map((s) => ({ startTime: s.startTime, endTime: s.endTime })),
    sameDayBookingRanges,
  );
}

/**
 * Vérifie qu'un créneau proposé (startAt/endAt) est réellement disponible :
 * même jour, dans les horaires déclarés, hors période bloquée, sans
 * chevauchement avec une autre réservation confirmée de l'artiste.
 */
export function isSlotAvailable(
  startAt: Date,
  endAt: Date,
  weeklySlots: WeeklySlotLike[],
  blockedPeriods: BlockedPeriodLike[],
  confirmedBookings: BookingRangeLike[],
  opts?: { excludeBookingId?: string },
): { ok: true } | { ok: false; reason: string } {
  if (startAt >= endAt) {
    return { ok: false, reason: "L'heure de début doit précéder l'heure de fin" };
  }

  const startDay = getDayOfWeek(startAt);
  const sameCalendarDay =
    startAt.getFullYear() === endAt.getFullYear() &&
    startAt.getMonth() === endAt.getMonth() &&
    startAt.getDate() === endAt.getDate();
  if (!sameCalendarDay) {
    return { ok: false, reason: "Le créneau ne peut pas s'étendre sur plusieurs jours" };
  }

  if (isDateBlocked(startAt, blockedPeriods)) {
    return { ok: false, reason: "Cette date est marquée comme indisponible par l'artiste" };
  }

  const daySlots = weeklySlots.filter((s) => s.day === startDay);
  if (daySlots.length === 0) {
    return { ok: false, reason: "L'artiste ne travaille pas ce jour-là" };
  }

  const startTime = `${String(startAt.getHours()).padStart(2, "0")}:${String(startAt.getMinutes()).padStart(2, "0")}`;
  const endTime = `${String(endAt.getHours()).padStart(2, "0")}:${String(endAt.getMinutes()).padStart(2, "0")}`;
  if (!isTimeRangeWithinAny(startTime, endTime, daySlots)) {
    return { ok: false, reason: "Ce créneau est en dehors des horaires déclarés par l'artiste" };
  }

  const overlapsAnotherBooking = confirmedBookings
    .filter((b) => b.id !== opts?.excludeBookingId)
    .some((b) => doDateRangesOverlap(startAt, endAt, b.startAt, b.endAt));
  if (overlapsAnotherBooking) {
    return { ok: false, reason: "Ce créneau chevauche une autre réservation confirmée" };
  }

  return { ok: true };
}
