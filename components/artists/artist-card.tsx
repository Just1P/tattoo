import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Typography from "@/components/custom/Typography";
import { formatHourlyRateRange } from "@/lib/format-price";

type ArtistCardProps = {
  id: string;
  artistName: string | null;
  bio: string | null;
  city: string | null;
  priceMin: number | null;
  priceMax: number | null;
  verified: "pending" | "approved" | "rejected";
  styles: { id: string; name: string }[];
  tattooCount: number;
};

export function ArtistCard({
  id,
  artistName,
  bio,
  city,
  priceMin,
  priceMax,
  verified,
  styles,
  tattooCount,
}: ArtistCardProps) {
  const priceLabel = formatHourlyRateRange(priceMin, priceMax);

  return (
    <Link href={`/artists/${id}`} className="group block">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-center gap-2">
            <Typography tag="h4">{artistName ?? "Artiste"}</Typography>
            {verified === "approved" && (
              <Badge variant="default" className="shrink-0 gap-1">
                Vérifié
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {city && (
              <Typography tag="span" color="muted">
                {city}
              </Typography>
            )}
            {priceLabel && (
              <Typography tag="span" color="muted">
                {priceLabel}
              </Typography>
            )}
            <Typography tag="span" color="muted">
              {tattooCount} œuvre{tattooCount !== 1 ? "s" : ""}
            </Typography>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {bio && (
            <Typography tag="p" color="muted" className="line-clamp-2">
              {bio}
            </Typography>
          )}
          {styles.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {styles.map((style) => (
                <Badge key={style.id} variant="outline">
                  {style.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
