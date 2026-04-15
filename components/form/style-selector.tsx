"use client";

import { Badge } from "@/components/ui/badge";
import Typography from "@/components/custom/Typography";

type Style = { id: string; name: string };

type StyleSelectorProps =
  | {
      multi: true;
      styles: Style[];
      selected: string[];
      onToggle: (id: string) => void;
      error?: string;
    }
  | {
      multi?: false;
      styles: Style[];
      selected: string;
      onToggle: (id: string) => void;
      error?: string;
    };

export function StyleSelector({ styles, selected, onToggle, error, multi = false }: StyleSelectorProps) {
  function isSelected(id: string) {
    return multi ? (selected as string[]).includes(id) : selected === id;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {styles.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onToggle(style.id)}
            aria-pressed={isSelected(style.id)}
            className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Badge
              variant="outline"
              className={`h-auto px-4 py-2 text-sm transition-smooth ${isSelected(style.id) ? "border-primary bg-primary text-primary-foreground" : ""}`}
            >
              {style.name}
            </Badge>
          </button>
        ))}
      </div>
      {error && (
        <Typography tag="p" color="destructive">
          {error}
        </Typography>
      )}
    </div>
  );
}
