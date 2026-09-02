-- Empêche en base qu'un même client ait deux réservations "pending"
-- simultanées auprès du même artiste. Le contrôle applicatif
-- (app/api/bookings/route.ts) fait un findFirst avant d'écrire, mais deux
-- requêtes strictement simultanées peuvent toutes les deux passer ce
-- contrôle avant qu'aucune n'ait committé (TOCTOU) : cet index unique
-- partiel est la garantie réelle, imposée par Postgres, pas par
-- l'application.
CREATE UNIQUE INDEX "Booking_artistId_userId_pending_key"
  ON "Booking" ("artistId", "userId")
  WHERE "status" = 'pending';
