import { ArtistCard } from "@/components/artists/artist-card";
import { TattooFeedCard } from "@/components/feed/tattoo-feed-card";
import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getFilteredArtists } from "@/lib/artist-queries";
import { getFavoritedTattooIds, getPublicTattoos } from "@/lib/tattoo-queries";
import { headers } from "next/headers";
import Link from "next/link";

export const revalidate = 3600;

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = (session?.user as { role?: string } | undefined)?.role;

  const [{ tattoos }, artists] = await Promise.all([
    getPublicTattoos({ page: 1 }),
    getFilteredArtists({}),
  ]);

  const previewTattoos = tattoos.slice(0, 8);

  const favoritedTattooIds = session
    ? await getFavoritedTattooIds(session.user.id, previewTattoos.map((t) => t.id))
    : new Set<string>();
  const previewArtists = artists.slice(0, 6);

  return (
    <main className="space-y-20 px-4 py-16">
      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <Typography tag="h1" align="center" size="4xl">
          Où l&apos;art rencontre la peau
        </Typography>
        <Typography tag="p" color="muted" align="center" size="lg" className="max-w-xl">
          Découvrez des artistes tatoueurs d&apos;exception, explorez leurs œuvres et trouvez
          l&apos;inspiration pour votre prochain tatouage.
        </Typography>
        <div className="flex gap-3">
          {!session && (
            <>
              <Button asChild size="lg">
                <Link href="/register">Rejoindre la plateforme</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/feed">Explorer</Link>
              </Button>
            </>
          )}
          {role === "client" && (
            <>
              <Button asChild size="lg">
                <Link href="/feed">Explorer le feed</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/artists">Trouver un artiste</Link>
              </Button>
            </>
          )}
          {role === "artist" && (
            <>
              <Button asChild size="lg">
                <Link href="/dashboard">Mon dashboard</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/feed">Voir le feed</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Dernières œuvres */}
      {previewTattoos.length > 0 && (
        <section className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center justify-between">
            <Typography tag="h2">Dernières œuvres</Typography>
            <Link href="/feed">
              <Typography tag="span" color="primary" underline>
                Voir tout →
              </Typography>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {previewTattoos.map((tattoo, index) => (
              <TattooFeedCard
                key={tattoo.id}
                id={tattoo.id}
                imageUrl={tattoo.imageUrl}
                title={tattoo.title}
                style={tattoo.style}
                artist={tattoo.artist}
                isFavorited={favoritedTattooIds.has(tattoo.id)}
                priority={index < 4}
              />
            ))}
          </div>
        </section>
      )}

      {/* Artistes récents */}
      {previewArtists.length > 0 && (
        <section className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <Typography tag="h2">Artistes à découvrir</Typography>
            <Link href="/artists">
              <Typography tag="span" color="primary" underline>
                Voir tous →
              </Typography>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewArtists.map((artist) => (
              <ArtistCard
                key={artist.id}
                id={artist.id}
                artistName={artist.artistName}
                bio={artist.bio}
                city={artist.city}
                priceMin={artist.priceMin}
                priceMax={artist.priceMax}
                verified={artist.verified}
                styles={artist.artistStyles.map((as) => as.style)}
                tattooCount={artist._count.tattoos}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
