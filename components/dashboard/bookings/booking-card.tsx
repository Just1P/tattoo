"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type BookingStatus = "pending" | "confirmed" | "cancelled";

type Booking = {
  id: string;
  status: BookingStatus;
  tattooType: string | null;
  bodyPart: string | null;
  size: string | null;
  description: string | null;
  referenceUrls: string[];
  artistNote: string | null;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

const TATTOO_TYPE_LABELS: Record<string, string> = {
  premier_rdv: "Premier rendez-vous",
  remplissage: "Remplissage",
  retouche: "Retouche",
};

const SIZE_LABELS: Record<string, string> = {
  petit: "Petit (< 5 cm)",
  moyen: "Moyen (5–15 cm)",
  grand: "Grand (15–30 cm)",
  tres_grand: "Très grand (> 30 cm)",
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  confirmed:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
};

function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 7; h <= 22; h++) {
    options.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 22) options.push(`${String(h).padStart(2, "0")}:30`);
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

type Props = {
  booking: Booking;
  onStatusChange: (id: string, newStatus: BookingStatus) => void;
};

export function BookingCard({ booking, onStatusChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [action, setAction] = useState<"confirm" | "cancel" | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDate(undefined);
    setStartTime("09:00");
    setEndTime("12:00");
    setNote("");
  }, [action]);

  async function handleConfirm() {
    if (!date) {
      toast.error("Choisissez une date");
      return;
    }
    if (startTime >= endTime) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "confirmed",
          startAt: combineDateAndTime(date, startTime).toISOString(),
          endAt: combineDateAndTime(date, endTime).toISOString(),
          artistNote: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erreur lors de la confirmation");
        return;
      }
      const updated = await res.json();
      onStatusChange(booking.id, "confirmed");
      Object.assign(booking, updated);
      toast.success("Réservation confirmée");
      setAction(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          artistNote: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erreur lors du refus");
        return;
      }
      onStatusChange(booking.id, "cancelled");
      toast.success("Demande refusée");
      setAction(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* En-tête — bouton accessible au clavier */}
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium text-sm">
              {booking.user.name ?? booking.user.email}
            </p>
            <p className="text-xs text-muted-foreground">
              {booking.tattooType
                ? (TATTOO_TYPE_LABELS[booking.tattooType] ?? booking.tattooType)
                : "Type non précisé"}
              {booking.size
                ? ` · ${SIZE_LABELS[booking.size] ?? booking.size}`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              STATUS_STYLES[booking.status],
            )}
          >
            {STATUS_LABELS[booking.status]}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(booking.createdAt), "d MMM yyyy", { locale: fr })}
          </span>
        </div>
      </button>

      {/* Détail dépliable */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            {booking.bodyPart && (
              <div>
                <span className="text-muted-foreground">Zone : </span>
                {booking.bodyPart}
              </div>
            )}
            {booking.size && (
              <div>
                <span className="text-muted-foreground">Taille : </span>
                {SIZE_LABELS[booking.size] ?? booking.size}
              </div>
            )}
            {booking.startAt && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Créneau : </span>
                {format(
                  new Date(booking.startAt),
                  "EEEE d MMMM yyyy 'de' HH:mm",
                  { locale: fr },
                )}
                {" → "}
                {booking.endAt
                  ? format(new Date(booking.endAt), "HH:mm", { locale: fr })
                  : ""}
              </div>
            )}
          </div>

          {booking.description && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-1">Description</p>
              <p className="whitespace-pre-wrap">{booking.description}</p>
            </div>
          )}

          {booking.referenceUrls.length > 0 && (
            <div className="text-sm">
              <p className="text-muted-foreground mb-2">Références</p>
              <div className="flex flex-wrap gap-2">
                {booking.referenceUrls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    Référence {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {booking.artistNote && (
            <div className="text-sm rounded-md bg-muted px-3 py-2">
              <span className="text-muted-foreground">Note : </span>
              {booking.artistNote}
            </div>
          )}

          {/* Actions pour les demandes en attente */}
          {booking.status === "pending" && action === null && (
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={() => setAction("confirm")}>
                Confirmer un créneau
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setAction("cancel")}
              >
                Refuser
              </Button>
            </div>
          )}

          {/* Formulaire de confirmation */}
          {action === "confirm" && (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="font-medium text-sm">Proposer un créneau</p>

              <div className="space-y-1.5">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-48 justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {date
                        ? format(date, "d MMM yyyy", { locale: fr })
                        : "Choisir une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      locale={fr}
                      disabled={{ before: new Date() }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="space-y-1.5">
                  <Label>Début</Label>
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
                <div className="space-y-1.5">
                  <Label>Fin</Label>
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
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`note-confirm-${booking.id}`}>
                  Message au client (optionnel)
                </Label>
                <Textarea
                  id={`note-confirm-${booking.id}`}
                  placeholder="Informations pratiques, adresse exacte…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={handleConfirm} disabled={loading}>
                  Envoyer la confirmation
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAction(null)}
                  disabled={loading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}

          {/* Formulaire de refus */}
          {action === "cancel" && (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="font-medium text-sm">Refuser la demande</p>

              <div className="space-y-1.5">
                <Label htmlFor={`note-cancel-${booking.id}`}>
                  Motif (optionnel)
                </Label>
                <Textarea
                  id={`note-cancel-${booking.id}`}
                  placeholder="Expliquez pourquoi vous refusez cette demande…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Confirmer le refus
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setAction(null)}
                  disabled={loading}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
