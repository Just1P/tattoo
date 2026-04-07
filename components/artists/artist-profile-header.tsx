import { Badge } from "@/components/ui/badge";
import Typography from "@/components/custom/Typography";

type ArtistProfileHeaderProps = {
  artistName: string | null;
  bio: string | null;
  city: string | null;
  location: string | null;
  priceMin: number | null;
  priceMax: number | null;
  instagramUrl: string | null;
  verified: "pending" | "approved" | "rejected";
  styles: { id: string; name: string }[];
};

export function ArtistProfileHeader({
  artistName,
  bio,
  city,
  location,
  priceMin,
  priceMax,
  instagramUrl,
  verified,
  styles,
}: ArtistProfileHeaderProps) {
  const priceLabel =
    priceMin !== null && priceMax !== null
      ? `${priceMin} – ${priceMax} €/h`
      : priceMin !== null
        ? `À partir de ${priceMin} €/h`
        : priceMax !== null
          ? `Jusqu'à ${priceMax} €/h`
          : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Typography tag="h1">{artistName ?? "Artiste"}</Typography>
        {verified === "approved" && (
          <Badge variant="default" className="gap-1">
            Vérifié
          </Badge>
        )}
      </div>

      {bio && (
        <Typography tag="p" color="muted">
          {bio}
        </Typography>
      )}

      <div className="flex flex-wrap gap-4">
        {city && (
          <Typography tag="span" color="muted">
            {city}
            {location ? ` — ${location}` : ""}
          </Typography>
        )}
        {priceLabel && (
          <Typography tag="span" color="muted">
            {priceLabel}
          </Typography>
        )}
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Typography tag="span" color="primary" underline>
              Instagram
            </Typography>
          </a>
        )}
      </div>

      {styles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {styles.map((style) => (
            <Badge key={style.id} variant="outline">
              {style.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
