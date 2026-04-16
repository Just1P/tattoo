import Typography from "@/components/custom/Typography";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const STATUS_LABELS = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
};

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const TATTOO_TYPE_LABELS: Record<string, string> = {
  premier_rdv: "Premier rendez-vous",
  remplissage: "Remplissage",
  retouche: "Retouche",
};

const SIZE_LABELS: Record<string, string> = {
  petit: "Petit (< 5 cm)",
  moyen: "Moyen (5–15 cm)",
  grand: "Grand (15–30 cm)",
  tres_grand: "Très grand (> 30 cm)",
};

export default async function ClientBookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      artist: {
        select: {
          id: true,
          artistName: true,
          city: true,
          user: { select: { image: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Typography tag="h1">Mes demandes de rendez-vous</Typography>
        <Typography tag="p" color="muted">
          {bookings.length === 0
            ? "Aucune demande pour le moment"
            : `${bookings.length} demande${bookings.length > 1 ? "s" : ""}`}
        </Typography>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas encore fait de demande de rendez-vous.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-lg border bg-card p-4 space-y-3">
              {/* En-tête */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">
                    {booking.artist.artistName ?? "Artiste"}
                  </p>
                  {booking.artist.city && (
                    <p className="text-xs text-muted-foreground">
                      {booking.artist.city}
                    </p>
                  )}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0 ${STATUS_STYLES[booking.status]}`}
                >
                  {STATUS_LABELS[booking.status]}
                </span>
              </div>

              {/* Détails */}
              <div className="grid gap-1.5 text-sm sm:grid-cols-2">
                {booking.tattooType && (
                  <div>
                    <span className="text-muted-foreground">Type : </span>
                    {TATTOO_TYPE_LABELS[booking.tattooType] ?? booking.tattooType}
                  </div>
                )}
                {booking.bodyPart && (
                  <div>
                    <span className="text-muted-foreground">Zone : </span>
                    {booking.bodyPart}
                  </div>
                )}
                {booking.size && (
                  <div>
                    <span className="text-muted-foreground">Taille : </span>
                    {SIZE_LABELS[booking.size] ?? booking.size}
                  </div>
                )}
                {booking.startAt && (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Créneau proposé : </span>
                    {format(booking.startAt, "EEEE d MMMM yyyy 'de' HH:mm", { locale: fr })}
                    {booking.endAt &&
                      ` à ${format(booking.endAt, "HH:mm", { locale: fr })}`}
                  </div>
                )}
              </div>

              {booking.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {booking.description}
                </p>
              )}

              {booking.artistNote && (
                <div className="rounded-md bg-muted px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Message de l'artiste : </span>
                  {booking.artistNote}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Envoyée le{" "}
                {format(booking.createdAt, "d MMMM yyyy", { locale: fr })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
