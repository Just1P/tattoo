import { TattooFeedCard } from "@/components/feed/tattoo-feed-card";
import { StyleFilterPills } from "@/components/feed/style-filter-pills";
import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getAllStyles } from "@/lib/artist-queries";
import { getPublicTattoos } from "@/lib/tattoo-queries";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Link from "next/link";

type SearchParams = Promise<{ styleSlug?: string; page?: string }>;

export default async function FeedPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const styleSlug = params.styleSlug ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1") || 1);

  const session = await auth.api.getSession({ headers: await headers() });

  const [{ tattoos, totalPages, currentPage }, styles] = await Promise.all([
    getPublicTattoos({ styleSlug: styleSlug || undefined, page }),
    getAllStyles(),
  ]);

  const favoritedTattooIds =
    session && tattoos.length > 0
      ? await prisma.favoriteTattoo
          .findMany({
            where: { userId: session.user.id, tattooId: { in: tattoos.map((t) => t.id) } },
            select: { tattooId: true },
          })
          .then((rows) => new Set(rows.map((r) => r.tattooId)))
      : new Set<string>();

  function buildPageUrl(p: number) {
    const ps = new URLSearchParams();
    if (styleSlug) ps.set("styleSlug", styleSlug);
    if (p > 1) ps.set("page", String(p));
    const qs = ps.toString();
    return `/feed${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-1">
        <Typography tag="h1">Feed</Typography>
        <Typography tag="p" color="muted">
          Découvrez les œuvres de nos artistes
        </Typography>
      </div>

      <StyleFilterPills styles={styles} activeSlug={styleSlug} />

      {tattoos.length === 0 ? (
        <Typography tag="p" color="muted">
          Aucun tatouage pour ce style pour le moment.
        </Typography>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tattoos.map((tattoo, index) => (
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
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {currentPage > 1 && (
            <Button variant="outline" asChild>
              <Link href={buildPageUrl(currentPage - 1)}>← Précédent</Link>
            </Button>
          )}
          <Typography tag="span" color="muted">
            Page {currentPage} / {totalPages}
          </Typography>
          {currentPage < totalPages && (
            <Button variant="outline" asChild>
              <Link href={buildPageUrl(currentPage + 1)}>Suivant →</Link>
            </Button>
          )}
        </div>
      )}
    </main>
  );
}
