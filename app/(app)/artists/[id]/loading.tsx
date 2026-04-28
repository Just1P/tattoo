import { TattooFeedCardSkeleton } from "@/components/feed/tattoo-feed-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ArtistLoading() {
  return (
    <main>
      {/* Hero */}
      <section className="flex min-h-[40vh] flex-col md:flex-row">
        <div className="flex flex-col justify-center gap-6 px-8 py-10 md:w-[75%]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-52" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-3/4 max-w-sm" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-36 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-75 w-125 shrink-0 rounded-4xl" />
      </section>

      {/* Portfolio */}
      <section className="space-y-6 px-8 py-12">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <TattooFeedCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
