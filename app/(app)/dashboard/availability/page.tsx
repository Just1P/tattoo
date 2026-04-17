import { BlockedPeriods } from "@/components/dashboard/availability/blocked-periods";
import { WeeklySchedule } from "@/components/dashboard/availability/weekly-schedule";
import Typography from "@/components/custom/Typography";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardAvailabilityPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if (session.user.role !== "artist") redirect("/");

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: session.user.id },
  });

  if (!artist) redirect("/onboarding");

  const [weeklySlots, blockedPeriods] = await Promise.all([
    prisma.weeklySlot.findMany({
      where: { artistId: artist.id },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    }),
    prisma.blockedPeriod.findMany({
      where: { artistId: artist.id },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <Typography tag="h1">Disponibilités</Typography>
        <Typography tag="p" color="muted">
          Définissez vos horaires habituels et bloquez les périodes indisponibles
        </Typography>
      </div>

      <section className="space-y-4">
        <div>
          <Typography tag="h2">Horaires récurrents</Typography>
          <Typography tag="p" color="muted">
            Les créneaux durant lesquels vous êtes disponible chaque semaine
          </Typography>
        </div>
        <WeeklySchedule initialSlots={weeklySlots} />
      </section>

      <section className="space-y-4">
        <div>
          <Typography tag="h2">Périodes bloquées</Typography>
          <Typography tag="p" color="muted">
            Congés, conventions, fermetures exceptionnelles…
          </Typography>
        </div>
        <BlockedPeriods
          initialPeriods={blockedPeriods.map((p) => ({
            ...p,
            startDate: p.startDate.toISOString(),
            endDate: p.endDate.toISOString(),
          }))}
        />
      </section>
    </div>
  );
}
