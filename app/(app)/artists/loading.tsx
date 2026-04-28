import { ArtistCardSkeleton } from "@/components/artists/artist-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ArtistsLoading() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ArtistCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
