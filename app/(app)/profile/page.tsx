import { ArtistPortfolioGrid } from "@/components/artists/artist-portfolio-grid";
import Typography from "@/components/custom/Typography";
import { ShareButton } from "@/components/profile/share-button";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      artistProfile: {
        include: {
          tattoos: {
            orderBy: [{ pinned: "desc" }, { position: "asc" }],
            include: { style: { select: { name: true } } },
          },
        },
      },
      favoriteTattoos: {
        include: {
          tattoo: {
            include: { style: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!user) redirect("/login");

  const isArtist = !!user.artistProfile;

  return (
    <main className="px-4 py-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
        <div className="relative size-24 overflow-hidden rounded-full bg-muted">
          {user.image || user.avatarUrl ? (
            <Image
              src={(user.image ?? user.avatarUrl)!}
              alt={user.name ?? "Photo de profil"}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-primary">
              <Typography
                tag="span"
                color="primary-foreground"
                size="lg"
                weight="bold"
              >
                {(user.firstName?.[0] ?? user.name?.[0] ?? "?").toUpperCase()}
              </Typography>
            </div>
          )}
        </div>

        {isArtist && user.artistProfile?.artistName && (
          <Typography tag="h2" align="center">
            {user.artistProfile.artistName}
          </Typography>
        )}

        {(user.firstName || user.lastName || user.name) && (
          <Typography tag="p" color="muted" align="center">
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.name}
          </Typography>
        )}

        {(isArtist ? user.artistProfile?.bio : user.description) && (
          <Typography tag="p" align="center" className="max-w-md">
            {isArtist ? user.artistProfile?.bio : user.description}
          </Typography>
        )}

        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/profile/edit">Modifier</Link>
          </Button>
          <ShareButton
            size="lg"
            url={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${isArtist && user.artistProfile?.id ? `/artists/${user.artistProfile.id}` : "/profile"}`}
            title={user.artistProfile?.artistName ?? user.name ?? "Mon profil"}
          />
        </div>
      </div>

      <section className="mx-auto mt-12 max-w-6xl space-y-6">
        {isArtist ? (
          <>
            <Typography tag="h3" style="h1" align="center">
              Portfolio
            </Typography>
            <ArtistPortfolioGrid tattoos={user.artistProfile!.tattoos} />
          </>
        ) : (
          <>
            <Typography tag="h3" style="h1" align="center">
              Favoris
            </Typography>
            {user.favoriteTattoos.length === 0 ? (
              <Typography tag="p" color="muted">
                Aucun tatouage en favoris pour le moment.
              </Typography>
            ) : (
              <ArtistPortfolioGrid
                tattoos={user.favoriteTattoos.map((f) => f.tattoo)}
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}
