import { EditProfileForm } from "@/components/dashboard/edit-profile-form";
import Typography from "@/components/custom/Typography";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if ((session.user as { role?: string }).role !== "artist") redirect("/");

  const [artist, styles] = await Promise.all([
    prisma.tattooArtist.findUnique({
      where: { userId: session.user.id },
      include: { artistStyles: { select: { styleId: true } } },
    }),
    prisma.style.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!artist) redirect("/onboarding");

  const initialData = {
    artistName: artist.artistName ?? "",
    bio: artist.bio ?? "",
    city: artist.city ?? "",
    location: artist.location ?? "",
    siret: artist.siret ?? "",
    priceMin: artist.priceMin?.toString() ?? "",
    priceMax: artist.priceMax?.toString() ?? "",
    instagramUrl: artist.instagramUrl ?? "",
    styleIds: artist.artistStyles.map((as) => as.styleId),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Typography tag="h1">Mon profil</Typography>
        <Typography tag="p" color="muted">
          Mettez à jour vos informations professionnelles.
        </Typography>
      </div>
      <EditProfileForm initialData={initialData} styles={styles} />
    </div>
  );
}
