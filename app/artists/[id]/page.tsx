import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArtistProfileHeader } from "@/components/artists/artist-profile-header";
import { ArtistPortfolioGrid } from "@/components/artists/artist-portfolio-grid";
import { ContactButton } from "@/components/artists/contact-button";
import Typography from "@/components/custom/Typography";

export const revalidate = 3600;

type Props = {
  params: { id: string };
};

const publicWhere = { verified: "approved" as const };

export async function generateStaticParams() {
  const artists = await prisma.tattooArtist.findMany({
    where: publicWhere,
    select: { id: true },
  });
  return artists.map((a) => ({ id: a.id }));
}

async function getArtist(id: string) {
  return prisma.tattooArtist.findFirst({
    where: { id, ...publicWhere },
    include: {
      tattoos: {
        orderBy: [{ pinned: "desc" }, { position: "asc" }],
        include: { style: { select: { name: true } } },
      },
      artistStyles: {
        include: { style: { select: { id: true, name: true } } },
      },
    },
  });
}

export default async function ArtistPublicPage({ params }: Props) {
  const { id } = params;
  const artist = await getArtist(id);

  if (!artist) notFound();

  const styles = artist.artistStyles.map((as) => as.style);

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-10">
      <ArtistProfileHeader
        artistName={artist.artistName}
        bio={artist.bio}
        city={artist.city}
        location={artist.location}
        priceMin={artist.priceMin}
        priceMax={artist.priceMax}
        instagramUrl={artist.instagramUrl}
        verified={artist.verified}
        styles={styles}
      />

      <div className="flex">
        <ContactButton artistId={artist.id} />
      </div>

      <section className="space-y-4">
        <Typography tag="h2">Portfolio</Typography>
        <ArtistPortfolioGrid tattoos={artist.tattoos} />
      </section>
    </main>
  );
}
