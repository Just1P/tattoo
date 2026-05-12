import { ArtistFilters } from "@/components/artists/artist-filters";
import { ArtistsInfiniteGrid } from "@/components/artists/artists-infinite-grid";
import Typography from "@/components/custom/Typography";
import { auth } from "@/lib/auth";
import { getFilteredArtists, getAllStyles } from "@/lib/artist-queries";
import { headers } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Artistes tatoueurs · Tattoo Pro",
  description:
    "Trouvez votre prochain tatoueur parmi notre sélection d'artistes vérifiés. Filtrez par style, ville et budget.",
  openGraph: {
    title: "Artistes tatoueurs · Tattoo Pro",
    description:
      "Trouvez votre prochain tatoueur parmi notre sélection d'artistes vérifiés. Filtrez par style, ville et budget.",
  },
};

type SearchParams = Promise<{
  search?: string;
  city?: string;
  styleSlug?: string;
  minPrice?: string;
  maxPrice?: string;
}>;

export default async function ArtistsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  const filters = {
    search: params.search,
    city: params.city,
    styleSlug: params.styleSlug,
    minPrice: params.minPrice ? parseInt(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseInt(params.maxPrice) : undefined,
    excludeUserId: session?.user.id,
    page: 1,
  };

  const hasFilters = !!(params.search || params.city || params.styleSlug || params.minPrice || params.maxPrice);

  const [{ artists, hasNextPage, totalCount }, styles] = await Promise.all([
    getFilteredArtists(filters),
    getAllStyles(),
  ]);

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-1">
        <Typography tag="h1">Nos tatoueurs</Typography>
        <Typography tag="p" color="muted">
          {totalCount} artiste{totalCount !== 1 ? "s" : ""} trouvé{totalCount !== 1 ? "s" : ""}
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
        <ArtistsInfiniteGrid
          initialArtists={artists}
          initialHasNextPage={hasNextPage}
        />
      )}
    </main>
  );
}
