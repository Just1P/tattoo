import { UploadTattooForm } from "@/components/dashboard/upload-tattoo-form";
import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewTattooPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "artist") redirect("/");

  const [artist, styles] = await Promise.all([
    prisma.tattooArtist.findUnique({ where: { userId: session.user.id } }),
    prisma.style.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!artist) redirect("/onboarding");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Typography tag="h1">Ajouter une œuvre</Typography>
          <Typography tag="p" color="muted">
            Ajoutez une nouvelle réalisation à votre portfolio.
          </Typography>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/portfolio">Annuler</Link>
        </Button>
      </div>
      <UploadTattooForm styles={styles} />
    </div>
  );
}
