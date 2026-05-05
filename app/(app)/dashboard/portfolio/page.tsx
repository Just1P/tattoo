import { PortfolioGrid } from "@/components/dashboard/portfolio-grid";
import Typography from "@/components/custom/Typography";
import { Badge } from "@/components/ui/badge";
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

  const verificationBanner = {
    pending: {
      label: "En attente de vérification",
      variant: "secondary" as const,
      message:
        "Votre profil est en cours d'examen par notre équipe. Vous serez notifié une fois la vérification effectuée.",
    },
    approved: null,
    rejected: {
      label: "Profil refusé",
      variant: "destructive" as const,
      message: artist.verificationNote
        ? `Motif : ${artist.verificationNote}`
        : "Votre profil n'a pas été approuvé. Contactez le support pour plus d'informations.",
    },
  }[artist.verified];

  return (
    <div className="space-y-6">
      {verificationBanner && (
        <div className="rounded-md border bg-muted/40 p-4">
          <div className="flex items-center gap-2">
            <Badge variant={verificationBanner.variant}>
              {verificationBanner.label}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {verificationBanner.message}
          </p>
        </div>
      )}

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
