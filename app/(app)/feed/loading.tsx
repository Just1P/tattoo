import { TattooFeedCardSkeleton } from "@/components/feed/tattoo-feed-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-1">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-5 w-56" />
      </div>

      {/* Style filter pills skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <TattooFeedCardSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
