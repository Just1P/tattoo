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

        {(session.user as { lastLoginMethod?: string }).lastLoginMethod && (
          <div className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm text-muted-foreground">
            {(session.user as { lastLoginMethod?: string }).lastLoginMethod === "google" ? (
              <>
                <svg className="size-3.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Connecté via Google
              </>
            ) : (
              <>
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Connecté via Email
              </>
            )}
          </div>
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
