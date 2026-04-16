import { ArtistPortfolioGrid } from "@/components/artists/artist-portfolio-grid";
import { ArtistProfileHeader } from "@/components/artists/artist-profile-header";
import { BookingRequestSheet } from "@/components/artists/booking-request-sheet";
import { ContactButton } from "@/components/artists/contact-button";
import Typography from "@/components/custom/Typography";
import { getAllPublicArtistIds, getPublicArtist } from "@/lib/artist-queries";
import Image from "next/image";
import { notFound } from "next/navigation";

export const revalidate = 3600;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getAllPublicArtistIds();
}

export default async function ArtistPublicPage({ params }: Props) {
  const { id } = await params;
  const artist = await getPublicArtist(id);

  if (!artist) notFound();

  const styles = artist.artistStyles.map((as) => as.style);
  const heroTattoo = artist.tattoos[0] ?? null;

  return (
    <main>
      <section className="flex min-h-[40vh] flex-col md:flex-row">
        <div className="flex flex-col justify-center gap-6 px-8 py-10 md:w-[75%]">
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
          <div className="flex gap-3">
            <BookingRequestSheet
              artistId={artist.id}
              artistName={artist.artistName}
            />
            <ContactButton artistId={artist.id} />
          </div>
        </div>

        {heroTattoo && (
          <div className="relative h-75 w-125 shrink-0 overflow-hidden rounded-4xl">
            <Image
              src={heroTattoo.imageUrl}
              alt={heroTattoo.title ?? artist.artistName ?? "Portfolio"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
              quality={90}
              priority
            />
          </div>
        )}
      </section>

      <section className="space-y-6 px-8 py-12">
        <Typography tag="h2">Portfolio</Typography>
        <ArtistPortfolioGrid tattoos={artist.tattoos} />
      </section>
    </main>
  );
}
