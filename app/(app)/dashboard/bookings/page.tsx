import { BookingList } from "@/components/dashboard/bookings/booking-list";
import Typography from "@/components/custom/Typography";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardBookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "artist") redirect("/");

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: session.user.id },
  });

  if (!artist) redirect("/onboarding");

  const bookings = await prisma.booking.findMany({
    where: { artistId: artist.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const serialized = bookings.map((b) => ({
    ...b,
    startAt: b.startAt?.toISOString() ?? null,
    endAt: b.endAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
  }));

  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <Typography tag="h1">Demandes de réservation</Typography>
        <Typography tag="p" color="muted">
          {pendingCount > 0
            ? `${pendingCount} demande${pendingCount > 1 ? "s" : ""} en attente`
            : "Aucune demande en attente"}
        </Typography>
      </div>

      <BookingList initialBookings={serialized} />
    </div>
  );
}
