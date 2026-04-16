"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

type BlockedPeriod = {
  id: string;
  label: string | null;
  startDate: string;
  endDate: string;
};

function formatDate(iso: string) {
  return format(new Date(iso), "d MMM yyyy", { locale: fr });
}

type Props = {
  initialPeriods: BlockedPeriod[];
};

export function BlockedPeriods({ initialPeriods }: Props) {
  const [periods, setPeriods] = useState<BlockedPeriod[]>(initialPeriods);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!range?.from) {
      toast.error("Sélectionnez une période");
      return;
    }
    const endDate = range.to ?? range.from;

    setLoading(true);
    try {
      const res = await fetch("/api/artist/availability/blocked-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim() || undefined,
          startDate: range.from.toISOString(),
          endDate: new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate(),
            23,
            59,
            59
          ).toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erreur lors de l'ajout");
        return;
      }
      const period: BlockedPeriod = await res.json();
      setPeriods((prev) =>
        [...prev, period].sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )
      );
      setShowForm(false);
      setLabel("");
      setRange(undefined);
      toast.success("Période bloquée ajoutée");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/artist/availability/blocked-periods/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        toast.error("Erreur lors de la suppression");
        return;
      }
      setPeriods((prev) => prev.filter((p) => p.id !== id));
      toast.success("Période supprimée");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {periods.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground">Aucune période bloquée</p>
      )}

      {periods.map((period) => (
        <div
          key={period.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div>
            {period.label && (
              <p className="text-sm font-medium">{period.label}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {formatDate(period.startDate)} → {formatDate(period.endDate)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(period.id)}
            disabled={loading}
            className="text-destructive hover:text-destructive"
          >
            Supprimer
          </Button>
        </div>
      ))}

      {showForm ? (
        <div className="rounded-lg border p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="blocked-label">Libellé (optionnel)</Label>
            <Input
              id="blocked-label"
              placeholder="ex : Vacances, Convention Paris…"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Période</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-72 justify-start text-left font-normal",
                    !range?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {range?.from ? (
                    range.to ? (
                      <>
                        {format(range.from, "d MMM yyyy", { locale: fr })} →{" "}
                        {format(range.to, "d MMM yyyy", { locale: fr })}
                      </>
                    ) : (
                      format(range.from, "d MMM yyyy", { locale: fr })
                    )
                  ) : (
                    "Sélectionner une période"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  locale={fr}
                  disabled={{ before: new Date() }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={loading}>
              Confirmer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setLabel("");
                setRange(undefined);
              }}
              disabled={loading}
            >
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          + Bloquer une période
        </Button>
      )}
    </div>
  );
}
