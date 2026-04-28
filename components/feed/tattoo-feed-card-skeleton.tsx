import { Skeleton } from "@/components/ui/skeleton";

export function TattooFeedCardSkeleton() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg">
      <Skeleton className="h-full w-full" />
    </div>
  );
}
