import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Typography from "@/components/custom/Typography";
import { formatHourlyRateRange } from "@/lib/format-price";
import {
  IconConfetti,
  IconFlame,
  IconPlant2,
  IconSeedling,
  IconTree,
} from "@tabler/icons-react";

type Style = { id: string; name: string };

type OnboardingPreviewProps = {
  artistName: string;
  bio: string;
  city: string;
  priceMin: string;
  priceMax: string;
  styleIds: string[];
  styles: Style[];
  progressPercent: number;
};

const GROWTH_STAGES = [
  { min: 0, icon: IconSeedling, label: "On démarre" },
  { min: 21, icon: IconPlant2, label: "Ça pousse" },
  { min: 51, icon: IconTree, label: "Ça prend forme" },
  { min: 81, icon: IconFlame, label: "Presque prêt" },
  { min: 100, icon: IconConfetti, label: "Profil complet" },
];

function getGrowthStage(percent: number) {
  return [...GROWTH_STAGES].reverse().find((stage) => percent >= stage.min)!;
}

export function OnboardingPreview({
  artistName,
  bio,
  city,
  priceMin,
  priceMax,
  styleIds,
  styles,
  progressPercent,
}: OnboardingPreviewProps) {
  const priceLabel = formatHourlyRateRange(
    priceMin ? parseInt(priceMin) : null,
    priceMax ? parseInt(priceMax) : null,
  );
  const selectedStyles = styles.filter((s) => styleIds.includes(s.id));
  const growth = getGrowthStage(progressPercent);

  return (
    <div className="space-y-3">
      <Typography tag="p" color="muted" className="text-center lg:text-left">
        Aperçu de ta fiche artiste
      </Typography>

      <Card className="transition-smooth">
        <CardHeader className="space-y-2 pb-2">
          <div className="flex items-center gap-2">
            <Typography tag="h4">
              {artistName || (
                <span className="text-muted-foreground italic">Ton nom d&apos;artiste</span>
              )}
            </Typography>
            <Badge variant="outline" className="shrink-0 gap-1">
              <growth.icon className="size-3.5" />
              {growth.label}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-3">
            <Typography tag="span" color="muted">
              {city || "Ta ville"}
            </Typography>
            {priceLabel && (
              <Typography tag="span" color="muted">
                {priceLabel}
              </Typography>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Typography
            tag="p"
            color="muted"
            className={`line-clamp-3 ${!bio ? "italic" : ""}`}
          >
            {bio || "Ta bio apparaîtra ici — donne envie à tes futurs clients !"}
          </Typography>

          <div className="flex flex-wrap gap-1">
            {selectedStyles.length > 0 ? (
              selectedStyles.map((style) => (
                <Badge key={style.id} variant="outline" className="border-primary">
                  {style.name}
                </Badge>
              ))
            ) : (
              <Typography tag="span" color="muted" className="italic">
                Tes styles s&apos;afficheront ici
              </Typography>
            )}
          </div>
        </CardContent>
      </Card>

      <Typography
        tag="p"
        color="muted"
        className="flex items-center justify-center gap-1.5 lg:justify-start"
      >
        <growth.icon className="size-4" />
        {progressPercent}% complété — continue, ton profil prend forme
      </Typography>
    </div>
  );
}
