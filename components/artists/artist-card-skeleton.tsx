import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ArtistCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-14" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
