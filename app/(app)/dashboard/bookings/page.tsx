import { BookingList } from "@/components/dashboard/bookings/booking-list";
import Typography from "@/components/custom/Typography";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardBookingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if (session.user.role !== "artist") redirect("/");

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: session.user.id },
  });

  if (!artist) redirect("/onboarding");

  const [bookings, weeklySlots, blockedPeriods] = await Promise.all([
    prisma.booking.findMany({
      where: { artistId: artist.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.weeklySlot.findMany({ where: { artistId: artist.id } }),
    prisma.blockedPeriod.findMany({ where: { artistId: artist.id } }),
  ]);

  const serialized = bookings.map((b) => ({
    ...b,
    startAt: b.startAt?.toISOString() ?? null,
    endAt: b.endAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
  }));

  const serializedWeeklySlots = weeklySlots.map((s) => ({
    day: s.day,
    startTime: s.startTime,
    endTime: s.endTime,
  }));
  const serializedBlockedPeriods = blockedPeriods.map((p) => ({
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
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

      <BookingList
        initialBookings={serialized}
        weeklySlots={serializedWeeklySlots}
        blockedPeriods={serializedBlockedPeriods}
      />
    </div>
  );
}
