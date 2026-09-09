export type BookingStatus = "pending" | "confirmed" | "cancelled";

/**
 * Un booking "confirmed" sans clientConfirmedAt attend encore la réponse du
 * client (voir app/api/bookings/[id]/client-response/route.ts) — c'est un
 * état d'affichage à part entière, pas juste "confirmed".
 */
export type BookingDisplayStatus = BookingStatus | "awaiting_client";

export function getBookingDisplayStatus(
  status: BookingStatus,
  clientConfirmedAt: string | Date | null,
): BookingDisplayStatus {
  return status === "confirmed" && !clientConfirmedAt ? "awaiting_client" : status;
}

export const BOOKING_STATUS_LABELS: Record<BookingDisplayStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  awaiting_client: "Créneau proposé — à confirmer",
};

export const BOOKING_STATUS_STYLES: Record<BookingDisplayStatus, string> = {
  pending: "bg-warning/10 text-warning dark:bg-warning/20",
  confirmed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-destructive/10 text-destructive dark:bg-destructive/20",
  awaiting_client:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};
