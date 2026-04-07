import { prisma } from "@/lib/prisma";
import { ArtistCard } from "@/components/artists/artist-card";
import Typography from "@/components/custom/Typography";

export const revalidate = 3600;

async function getArtists() {
  return prisma.tattooArtist.findMany({
    where: {
      artistName: { not: null },
    },
    include: {
      artistStyles: {
        include: { style: { select: { id: true, name: true } } },
      },
      _count: { select: { tattoos: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-1">
        <Typography tag="h1">Nos tatoueurs</Typography>
        <Typography tag="p" color="muted">
          {artists.length} artiste{artists.length !== 1 ? "s" : ""} sur la plateforme
        </Typography>
      </div>

      {artists.length === 0 ? (
        <Typography tag="p" color="muted">
          Aucun artiste disponible pour le moment.
        </Typography>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
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
      )}
    </main>
  );
}
