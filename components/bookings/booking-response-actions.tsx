"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  bookingId: string;
};

export function BookingResponseActions({ bookingId }: Props) {
  const router = useRouter();
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function respond(response: "accept" | "decline") {
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/client-response`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          response === "accept"
            ? { response: "accept" }
            : { response: "decline", clientNote: note.trim() || undefined },
        ),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Une erreur est survenue");
        return;
      }
      toast.success(
        response === "accept" ? "Créneau confirmé !" : "Créneau refusé, l'artiste en sera informé",
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (declining) {
    return (
      <div className="space-y-2 rounded-md border p-3">
        <Textarea
          placeholder="Raison du refus (optionnel)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => respond("decline")}
            disabled={loading}
          >
            Confirmer le refus
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeclining(false)}
            disabled={loading}
          >
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => respond("accept")} disabled={loading}>
        Accepter le créneau
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        onClick={() => setDeclining(true)}
        disabled={loading}
      >
        Refuser
      </Button>
    </div>
  );
}
