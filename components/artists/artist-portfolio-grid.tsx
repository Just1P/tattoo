import Typography from "@/components/custom/Typography";
import Image from "next/image";

type Tattoo = {
  id: string;
  imageUrl: string;
  title: string | null;
  description: string | null;
  style: { name: string };
};

export function ArtistPortfolioGrid({ tattoos }: { tattoos: Tattoo[] }) {
  if (tattoos.length === 0) {
    return (
      <Typography tag="p" color="muted">
        Aucune œuvre dans le portfolio pour le moment.
      </Typography>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {tattoos.map((tattoo) => (
        <div
          key={tattoo.id}
          className="group relative aspect-square overflow-hidden rounded-md bg-muted"
        >
          <Image
            src={tattoo.imageUrl}
            alt={tattoo.title ?? "Tatouage"}
            fill
            className="object-cover transition-smooth group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/60 to-transparent p-2 opacity-0 transition-smooth transition-opacity group-hover:opacity-100">
            {tattoo.title && (
              <Typography tag="span" color="white" weight="semi-bold">
                {tattoo.title}
              </Typography>
            )}
            <Typography tag="span" color="white" size="xs">
              {tattoo.style.name}
            </Typography>
          </div>
        </div>
      ))}
    </div>
  );
}
