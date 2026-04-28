import { ArtistCard } from "@/components/artists/artist-card";
import { ArtistFilters } from "@/components/artists/artist-filters";
import Typography from "@/components/custom/Typography";
import { getFilteredArtists, getAllStyles } from "@/lib/artist-queries";
import Link from "next/link";

type SearchParams = Promise<{
  search?: string;
  city?: string;
  styleSlug?: string;
  minPrice?: string;
  maxPrice?: string;
}>;

export default async function ArtistsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const filters = {
    search: params.search,
    city: params.city,
    styleSlug: params.styleSlug,
    minPrice: params.minPrice ? parseInt(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseInt(params.maxPrice) : undefined,
  };

  const hasFilters = !!(params.search || params.city || params.styleSlug || params.minPrice || params.maxPrice);

  const [artists, styles] = await Promise.all([
    getFilteredArtists(filters),
    getAllStyles(),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-1">
        <Typography tag="h1">Nos tatoueurs</Typography>
        <Typography tag="p" color="muted">
          {artists.length} artiste{artists.length !== 1 ? "s" : ""} trouvé{artists.length !== 1 ? "s" : ""}
        </Typography>
      </div>

      <ArtistFilters
        styles={styles}
        defaultValues={{
          search: params.search ?? "",
          city: params.city ?? "",
          styleSlug: params.styleSlug ?? "",
          minPrice: params.minPrice ?? "",
          maxPrice: params.maxPrice ?? "",
        }}
      />

      {artists.length === 0 ? (
        <div className="space-y-2">
          <Typography tag="p" color="muted">
            Aucun artiste trouvé pour ces critères.
          </Typography>
          {hasFilters && (
            <Link href="/artists">
              <Typography tag="span" color="primary" underline>
                Réinitialiser les filtres
              </Typography>
            </Link>
          )}
        </div>
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
