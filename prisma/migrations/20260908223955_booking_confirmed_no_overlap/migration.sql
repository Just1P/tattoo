-- Empêche en base que deux réservations "confirmed" du même artiste se
-- chevauchent dans le temps. Le contrôle applicatif (isSlotAvailable, dans
-- lib/availability.ts, appelé depuis app/api/bookings/[id]/status/route.ts)
-- refait ce calcul avant d'écrire, mais deux confirmations strictement
-- simultanées (double-clic, deux onglets) peuvent toutes les deux passer ce
-- contrôle avant qu'aucune n'ait committé (même TOCTOU que pour l'index
-- partiel des réservations "pending", voir
-- prisma/migrations/20260902084328_booking_pending_unique_index/) : cette
-- contrainte d'exclusion est la garantie réelle, imposée par Postgres.
--
-- Nécessite l'extension btree_gist pour combiner une égalité (artistId) et
-- un chevauchement de plage (tsrange) dans une même contrainte EXCLUDE.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_no_overlap_confirmed"
  EXCLUDE USING gist (
    "artistId" WITH =,
    tsrange("startAt", "endAt", '[)') WITH &&
  )
  WHERE ("status" = 'confirmed');
