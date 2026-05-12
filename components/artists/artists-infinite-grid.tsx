"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArtistCard } from "@/components/artists/artist-card";

type Artist = {
  id: string;
  artistName: string | null;
  bio: string | null;
  city: string | null;
  priceMin: number | null;
  priceMax: number | null;
  verified: "pending" | "approved" | "rejected";
  artistStyles: { style: { id: string; name: string } }[];
  _count: { tattoos: number };
};

type Props = {
  initialArtists: Artist[];
  initialHasMore: boolean;
};

export function ArtistsInfiniteGrid({ initialArtists, initialHasMore }: Props) {
  const searchParams = useSearchParams();
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when filters change
  useEffect(() => {
    setArtists(initialArtists);
    setPage(2);
    setHasMore(initialHasMore);
  }, [initialArtists, initialHasMore]);

  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, page, searchParams]);

  async function loadMore() {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      const res = await fetch(`/api/artists?${params.toString()}`);
      const data = await res.json();
      setArtists((prev) => [...prev, ...data.artists]);
      setHasMore(data.currentPage < data.totalPages);
      setPage((p) => p + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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

      <div ref={sentinelRef} className="flex justify-center py-8">
        {loading && (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50" />
        )}
      </div>
    </>
  );
}
