"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type WeeklySlot = {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Lundi",
  TUESDAY: "Mardi",
  WEDNESDAY: "Mercredi",
  THURSDAY: "Jeudi",
  FRIDAY: "Vendredi",
  SATURDAY: "Samedi",
  SUNDAY: "Dimanche",
};

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 7; h <= 22; h++) {
    options.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 22) options.push(`${String(h).padStart(2, "0")}:30`);
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();
const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";

type Props = {
  initialSlots: WeeklySlot[];
};

export function WeeklySchedule({ initialSlots }: Props) {
  const [slots, setSlots] = useState<WeeklySlot[]>(initialSlots);
  const [adding, setAdding] = useState<DayOfWeek | null>(null);
  const [startTime, setStartTime] = useState(DEFAULT_START);
  const [endTime, setEndTime] = useState(DEFAULT_END);
  const [loading, setLoading] = useState(false);

  async function handleAdd(day: DayOfWeek) {
    if (startTime >= endTime) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/artist/availability/weekly-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, startTime, endTime }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erreur lors de l'ajout");
        return;
      }
      const slot: WeeklySlot = await res.json();
      setSlots((prev) =>
        [...prev, slot].sort((a, b) => {
          const di = DAYS.indexOf(a.day) - DAYS.indexOf(b.day);
          return di !== 0 ? di : a.startTime.localeCompare(b.startTime);
        }),
      );
      setAdding(null);
      setStartTime(DEFAULT_START);
      setEndTime(DEFAULT_END);
      toast.success("Créneau ajouté");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/artist/availability/weekly-slots/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Erreur lors de la suppression");
        return;
      }
      setSlots((prev) => prev.filter((s) => s.id !== id));
      toast.success("Créneau supprimé");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const daySlots = slots.filter((s) => s.day === day);
        const isAdding = adding === day;

        return (
          <div key={day} className="rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{DAY_LABELS[day]}</span>
              {!isAdding && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdding(day)}
                  disabled={loading}
                >
                  + Ajouter
                </Button>
              )}
            </div>

            {daySlots.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-2 rounded-md bg-muted px-2 py-1 text-sm"
                  >
                    <span>
                      {slot.startTime} – {slot.endTime}
                    </span>
                    <button
                      onClick={() => handleDelete(slot.id)}
                      disabled={loading}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Supprimer ce créneau"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isAdding && (
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Début</span>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Fin</span>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_OPTIONS.filter((t) => t > startTime).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAdd(day)}
                    disabled={loading}
                  >
                    Confirmer
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAdding(null);
                      setStartTime(DEFAULT_START);
                      setEndTime(DEFAULT_END);
                    }}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
