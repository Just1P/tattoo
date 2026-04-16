"use client";

import { BookingCard } from "./booking-card";
import { useState } from "react";

type BookingStatus = "pending" | "confirmed" | "cancelled";

type Booking = {
  id: string;
  status: BookingStatus;
  tattooType: string | null;
  bodyPart: string | null;
  size: string | null;
  description: string | null;
  referenceUrls: string[];
  artistNote: string | null;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

type Filter = "all" | BookingStatus;

const FILTER_LABELS: Record<Filter, string> = {
  all: "Toutes",
  pending: "En attente",
  confirmed: "Confirmées",
  cancelled: "Annulées",
};

type Props = {
  initialBookings: Booking[];
};

export function BookingList({ initialBookings }: Props) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [filter, setFilter] = useState<Filter>("pending");

  function handleStatusChange(id: string, newStatus: BookingStatus) {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  }

  const filtered =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const counts: Record<Filter, number> = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {(["pending", "confirmed", "all", "cancelled"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              filter === f
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {FILTER_LABELS[f]}
            {counts[f] > 0 && (
              <span className="ml-1.5 text-xs opacity-70">{counts[f]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          Aucune demande{filter !== "all" ? ` ${FILTER_LABELS[filter].toLowerCase()}` : ""}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
