"use client";

import { FavoriteTattooButton } from "@/components/artists/favorite-tattoo-button";
import Typography from "@/components/custom/Typography";
import Image from "next/image";
import Link from "next/link";

type Props = {
  id: string;
  imageUrl: string;
  title: string | null;
  style: { name: string };
  artist: { id: string; artistName: string | null; city: string | null };
  isFavorited: boolean;
};

export function TattooFeedCard({ id, imageUrl, title, style, artist, isFavorited }: Props) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-md bg-muted">
      <Image
        src={imageUrl}
        alt={title ?? "Tatouage"}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        quality={85}
      />

      <div className="absolute right-2 top-2 z-10">
        <FavoriteTattooButton tattooId={id} initialIsFavorited={isFavorited} />
      </div>

      <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        {title && (
          <Typography tag="span" color="white" weight="semi-bold" className="line-clamp-1">
            {title}
          </Typography>
        )}
        <Typography tag="span" color="white" size="xs">
          {style.name}
        </Typography>
        <Link
          href={`/artists/${artist.id}`}
          className="mt-1 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <Typography tag="span" color="white" size="xs" weight="medium">
            {artist.artistName ?? "Artiste"}
            {artist.city ? ` · ${artist.city}` : ""}
          </Typography>
        </Link>
      </div>
    </div>
  );
}
