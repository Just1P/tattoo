import { EditProfileForm } from "@/components/profile/edit-profile-form";
import Typography from "@/components/custom/Typography";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProfileEditPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const isArtist = session.user.role === "artist";

  const [user, artistData, styles] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    isArtist
      ? prisma.tattooArtist.findUnique({
          where: { userId: session.user.id },
          include: { artistStyles: { select: { styleId: true } } },
        })
      : null,
    isArtist ? prisma.style.findMany({ orderBy: { name: "asc" } }) : [],
  ]);

  if (!user) redirect("/login");

  const initialUser = {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    description: user.description ?? "",
  };

  const initialArtist = artistData
    ? {
        artistName: artistData.artistName ?? "",
        bio: artistData.bio ?? "",
        city: artistData.city ?? "",
        location: artistData.location ?? "",
        siret: artistData.siret ?? "",
        priceMin: artistData.priceMin?.toString() ?? "",
        priceMax: artistData.priceMax?.toString() ?? "",
        instagramUrl: artistData.instagramUrl ?? "",
        styleIds: artistData.artistStyles.map((as) => as.styleId),
      }
    : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <Typography tag="h1">Modifier le profil</Typography>
      </div>
      <EditProfileForm
        initialUser={initialUser}
        initialArtist={initialArtist}
        styles={styles}
      />
    </div>
  );
}
