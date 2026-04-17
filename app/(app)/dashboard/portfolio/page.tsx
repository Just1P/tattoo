import { PortfolioGrid } from "@/components/dashboard/portfolio-grid";
import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPortfolioPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if (session.user.role !== "artist") redirect("/");

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: session.user.id },
  });

  if (!artist) redirect("/onboarding");

  const [tattoos, styles] = await Promise.all([
    prisma.tattoo.findMany({
      where: { artistId: artist.id },
      orderBy: [{ pinned: "desc" }, { position: "asc" }],
      include: { style: { select: { id: true, name: true } } },
    }),
    prisma.style.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography tag="h1">Mon portfolio</Typography>
          <Typography tag="p" color="muted">
            {tattoos.length} œuvre{tattoos.length !== 1 ? "s" : ""}
          </Typography>
        </div>
        <Button asChild>
          <Link href="/dashboard/portfolio/new">Ajouter une œuvre</Link>
        </Button>
      </div>

      <PortfolioGrid initialTattoos={tattoos} styles={styles} />
    </div>
  );
}
