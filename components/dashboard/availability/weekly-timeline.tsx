"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doTimeRangesOverlap } from "@/lib/availability";
import { type DayOfWeek, DAY_LABELS, DAYS, TIME_OPTIONS } from "@/lib/time-utils";
import { useRef, useState } from "react";
import { toast } from "sonner";

type WeeklySlot = {
  id: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
};

const DEFAULT_START = "09:00";
const DEFAULT_END = "18:00";
const MIN_SLOT_MINUTES = 30;

const DAY_START_MIN = 7 * 60;
const DAY_END_MIN = 22 * 60;
const DAY_SPAN_MIN = DAY_END_MIN - DAY_START_MIN;
const HOUR_TICKS = Array.from({ length: 16 }, (_, i) => 7 + i);

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Position (0-100%) le long de la frise 07:00-22:00 pour un temps "HH:MM". */
function percentForTime(time: string): number {
  return ((toMinutes(time) - DAY_START_MIN) / DAY_SPAN_MIN) * 100;
}

/** Convertit une position en pixels sur la frise en temps "HH:MM", arrondi au quart d'heure le plus proche puis snappé aux 30 min (granularité de TIME_OPTIONS). */
function timeFromPointerX(clientX: number, rect: DOMRect): string {
  const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const rawMinutes = DAY_START_MIN + fraction * DAY_SPAN_MIN;
  const snapped = Math.round(rawMinutes / 30) * 30;
  const clamped = Math.min(DAY_END_MIN, Math.max(DAY_START_MIN, snapped));
  return toTimeString(clamped);
}

type EditMode = "move" | "resize-start" | "resize-end";

type EditState = {
  id: string;
  day: DayOfWeek;
  mode: EditMode;
  anchorMinutes: number;
  originalStart: string;
  originalEnd: string;
  liveStart: string;
  liveEnd: string;
};

type Props = {
  initialSlots: WeeklySlot[];
};

export function WeeklyTimeline({ initialSlots }: Props) {
  const [slots, setSlots] = useState<WeeklySlot[]>(initialSlots);
  const [loading, setLoading] = useState(false);
  const [drag, setDrag] = useState<{ day: DayOfWeek; anchor: string; current: string } | null>(
    null,
  );
  const [edit, setEdit] = useState<EditState | null>(null);
  const [manualDay, setManualDay] = useState<DayOfWeek | null>(null);
  const [manualStart, setManualStart] = useState(DEFAULT_START);
  const [manualEnd, setManualEnd] = useState(DEFAULT_END);
  const stripRefs = useRef<Partial<Record<DayOfWeek, HTMLDivElement>>>({});

  async function createSlot(day: DayOfWeek, startTime: string, endTime: string) {
    if (startTime >= endTime) return;

    const daySlots = slots.filter((s) => s.day === day);
    const overlaps = daySlots.some((s) =>
      doTimeRangesOverlap(startTime, endTime, s.startTime, s.endTime),
    );
    if (overlaps) {
      toast.error("Ce créneau chevauche un créneau déjà défini");
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
      setSlots((prev) => [...prev, slot]);
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

  async function commitEdit(state: EditState) {
    const { id, day, liveStart: startTime, liveEnd: endTime, originalStart, originalEnd } = state;
    if (startTime === originalStart && endTime === originalEnd) return; // rien n'a changé

    const overlaps = slots
      .filter((s) => s.day === day && s.id !== id)
      .some((s) => doTimeRangesOverlap(startTime, endTime, s.startTime, s.endTime));
    if (overlaps) {
      toast.error("Ce créneau chevaucherait un créneau déjà défini");
      return; // le rendu retombe sur les valeurs stockées, rien à défaire
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/artist/availability/weekly-slots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime, endTime }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erreur lors de la modification");
        return;
      }
      const updated: WeeklySlot = await res.json();
      setSlots((prev) => prev.map((s) => (s.id === id ? updated : s)));
      toast.success("Créneau modifié");
    } finally {
      setLoading(false);
    }
  }

  function handlePointerDown(day: DayOfWeek, e: React.PointerEvent<HTMLDivElement>) {
    if (loading || edit) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const time = timeFromPointerX(e.clientX, rect);
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ day, anchor: time, current: time });
  }

  function handlePointerMove(day: DayOfWeek, e: React.PointerEvent<HTMLDivElement>) {
    if (!drag || drag.day !== day) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const time = timeFromPointerX(e.clientX, rect);
    setDrag((prev) => (prev ? { ...prev, current: time } : prev));
  }

  function handlePointerUp() {
    if (!drag) return;
    const start = drag.anchor < drag.current ? drag.anchor : drag.current;
    const end = drag.anchor < drag.current ? drag.current : drag.anchor;
    setDrag(null);
    if (start === end) return; // simple clic sans glisser : ignoré
    void createSlot(drag.day, start, end);
  }

  function startEdit(slot: WeeklySlot, mode: EditMode, e: React.PointerEvent<HTMLDivElement>) {
    if (loading) return;
    e.stopPropagation();
    const strip = stripRefs.current[slot.day];
    if (!strip) return;
    const rect = strip.getBoundingClientRect();
    const anchorMinutes = toMinutes(timeFromPointerX(e.clientX, rect));
    e.currentTarget.setPointerCapture(e.pointerId);
    setEdit({
      id: slot.id,
      day: slot.day,
      mode,
      anchorMinutes,
      originalStart: slot.startTime,
      originalEnd: slot.endTime,
      liveStart: slot.startTime,
      liveEnd: slot.endTime,
    });
  }

  function handleEditPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!edit) return;
    // Le pointer capturé sur la poignée (élément enfant) continue de bubbler
    // vers le bloc parent, qui a le même handler : sans ça, chaque
    // mouvement/relâchement serait traité deux fois.
    e.stopPropagation();
    const strip = stripRefs.current[edit.day];
    if (!strip) return;
    const rect = strip.getBoundingClientRect();
    const pointerTime = toMinutes(timeFromPointerX(e.clientX, rect));

    setEdit((prev) => {
      if (!prev) return prev;
      const origStart = toMinutes(prev.originalStart);
      const origEnd = toMinutes(prev.originalEnd);

      if (prev.mode === "resize-start") {
        const maxStart = origEnd - MIN_SLOT_MINUTES;
        const newStart = Math.min(maxStart, Math.max(DAY_START_MIN, pointerTime));
        return { ...prev, liveStart: toTimeString(newStart) };
      }
      if (prev.mode === "resize-end") {
        const minEnd = origStart + MIN_SLOT_MINUTES;
        const newEnd = Math.max(minEnd, Math.min(DAY_END_MIN, pointerTime));
        return { ...prev, liveEnd: toTimeString(newEnd) };
      }
      // move
      const duration = origEnd - origStart;
      const delta = pointerTime - prev.anchorMinutes;
      let newStart = origStart + delta;
      newStart = Math.max(DAY_START_MIN, Math.min(DAY_END_MIN - duration, newStart));
      return { ...prev, liveStart: toTimeString(newStart), liveEnd: toTimeString(newStart + duration) };
    });
  }

  function handleEditPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!edit) return;
    e.stopPropagation();
    setEdit(null);
    void commitEdit(edit);
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-160 space-y-1">
          {/* Règle graduée */}
          <div className="relative ml-24 h-5 text-xs text-muted-foreground">
            {HOUR_TICKS.map((h) => (
              <span
                key={h}
                className="absolute -translate-x-1/2"
                style={{ left: `${percentForTime(`${String(h).padStart(2, "0")}:00`)}%` }}
              >
                {h}h
              </span>
            ))}
          </div>

          {DAYS.map((day) => {
            const daySlots = slots.filter((s) => s.day === day);
            const previewRange =
              drag && drag.day === day
                ? {
                    start: drag.anchor < drag.current ? drag.anchor : drag.current,
                    end: drag.anchor < drag.current ? drag.current : drag.anchor,
                  }
                : null;

            return (
              <div key={day} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-sm font-medium">{DAY_LABELS[day]}</span>
                <div
                  ref={(el) => {
                    stripRefs.current[day] = el ?? undefined;
                  }}
                  className="relative h-10 flex-1 cursor-crosshair touch-none rounded-md bg-muted select-none"
                  onPointerDown={(e) => handlePointerDown(day, e)}
                  onPointerMove={(e) => handlePointerMove(day, e)}
                  onPointerUp={handlePointerUp}
                >
                  {HOUR_TICKS.map((h) => (
                    <div
                      key={h}
                      className="absolute inset-y-0 w-px bg-border"
                      style={{ left: `${percentForTime(`${String(h).padStart(2, "0")}:00`)}%` }}
                    />
                  ))}

                  {daySlots.map((slot) => {
                    const isEditing = edit?.id === slot.id;
                    const displayStart = isEditing ? edit.liveStart : slot.startTime;
                    const displayEnd = isEditing ? edit.liveEnd : slot.endTime;

                    return (
                      <div
                        key={slot.id}
                        className="group/slot absolute inset-y-0.5 flex items-center justify-center rounded border border-primary bg-primary/20 text-xs font-medium"
                        style={{
                          left: `${percentForTime(displayStart)}%`,
                          width: `${percentForTime(displayEnd) - percentForTime(displayStart)}%`,
                        }}
                        onPointerDown={(e) => startEdit(slot, "move", e)}
                        onPointerMove={handleEditPointerMove}
                        onPointerUp={handleEditPointerUp}
                      >
                        <div
                          onPointerDown={(e) => startEdit(slot, "resize-start", e)}
                          onPointerMove={handleEditPointerMove}
                          onPointerUp={handleEditPointerUp}
                          className="absolute inset-y-0 left-0 w-3 cursor-ew-resize"
                        />
                        <span className="pointer-events-none truncate px-1">
                          {displayStart}–{displayEnd}
                        </span>
                        <div
                          onPointerDown={(e) => startEdit(slot, "resize-end", e)}
                          onPointerMove={handleEditPointerMove}
                          onPointerUp={handleEditPointerUp}
                          className="absolute inset-y-0 right-0 w-3 cursor-ew-resize"
                        />
                        <button
                          type="button"
                          onClick={() => handleDelete(slot.id)}
                          onPointerDown={(e) => e.stopPropagation()}
                          disabled={loading}
                          aria-label="Supprimer ce créneau"
                          className="absolute -right-2 -top-2 hidden size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover/slot:flex"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                  {previewRange && (
                    <div
                      className="pointer-events-none absolute inset-y-0.5 rounded border border-primary bg-primary/40"
                      style={{
                        left: `${percentForTime(previewRange.start)}%`,
                        width: `${Math.max(
                          0.5,
                          percentForTime(previewRange.end) - percentForTime(previewRange.start),
                        )}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Cliquez-glissez sur une ligne vide pour ajouter un créneau. Sur un créneau existant :
        glissez le centre pour le déplacer, les bords pour l&apos;étirer, ou survolez-le pour le
        supprimer.
      </p>

      {/* Solution de repli au clavier / tactile fin, par jour */}
      <div className="space-y-2">
        {manualDay === null ? (
          <Button variant="ghost" size="sm" onClick={() => setManualDay(DAYS[0])}>
            + Ajouter manuellement
          </Button>
        ) : (
          <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Jour</span>
              <Select value={manualDay} onValueChange={(v) => setManualDay(v as DayOfWeek)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DAY_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Début</span>
              <Select value={manualStart} onValueChange={setManualStart}>
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
              <Select value={manualEnd} onValueChange={setManualEnd}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.filter((t) => t > manualStart).map((t) => (
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
                disabled={loading}
                onClick={async () => {
                  await createSlot(manualDay, manualStart, manualEnd);
                  setManualDay(null);
                  setManualStart(DEFAULT_START);
                  setManualEnd(DEFAULT_END);
                }}
              >
                Confirmer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setManualDay(null)} disabled={loading}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
