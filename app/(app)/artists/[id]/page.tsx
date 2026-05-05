import { ArtistPortfolioGrid } from "@/components/artists/artist-portfolio-grid";
import { ArtistProfileHeader } from "@/components/artists/artist-profile-header";
import { BookingRequestSheet } from "@/components/artists/booking-request-sheet";
import { ContactButton } from "@/components/artists/contact-button";
import { FollowButton } from "@/components/artists/follow-button";
import Typography from "@/components/custom/Typography";
import { auth } from "@/lib/auth";
import { getAllPublicArtistIds, getArtistPageData, getPublicArtist } from "@/lib/artist-queries";
import { headers } from "next/headers";
import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return getAllPublicArtistIds();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const artist = await getPublicArtist(id);
  if (!artist) return {};

  const name = artist.artistName ?? "Artiste";
  const description = artist.bio
    ? artist.bio.slice(0, 160)
    : `Découvrez le portfolio de ${name} sur Tattoo Pro.`;
  const firstImage = artist.tattoos[0]?.imageUrl ?? null;

  return {
    title: `${name} — Tattoo Pro`,
    description,
    openGraph: {
      title: `${name} — Tattoo Pro`,
      description,
      ...(firstImage ? { images: [{ url: firstImage, width: 1200, height: 630 }] } : {}),
    },
  };
}

export default async function ArtistPublicPage({ params }: Props) {
  const { id } = await params;

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  const { artist, isFollowed, favoritedTattooIds } = await getArtistPageData(id, session?.user.id);

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
            followersCount={artist.followersCount}
          />
          <div className="flex gap-3">
            <BookingRequestSheet
              artistId={artist.id}
              artistName={artist.artistName}
            />
            <ContactButton artistUserId={artist.userId} />
            {session?.user.id !== artist.userId && (
              <FollowButton artistId={artist.id} initialIsFollowed={isFollowed} />
            )}
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
        <ArtistPortfolioGrid tattoos={artist.tattoos} favoritedTattooIds={favoritedTattooIds} />
      </section>
    </main>
  );
}
