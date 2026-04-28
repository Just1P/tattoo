import { ArtistCard } from "@/components/artists/artist-card";
import Typography from "@/components/custom/Typography";
import { auth } from "@/lib/auth";
import { getFollowedArtists } from "@/lib/artist-queries";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function FollowingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const artists = await getFollowedArtists(session.user.id);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <Typography tag="h1">Artistes suivis</Typography>

      {artists.length === 0 ? (
        <Typography tag="p" color="muted">
          Vous ne suivez aucun artiste pour le moment.
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
