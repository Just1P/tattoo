"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Artist = {
  id: string;
  artistName: string | null;
  city: string | null;
  siret: string | null;
  verified: "pending" | "approved" | "rejected";
  verificationNote: string | null;
  createdAt: string;
  user: { email: string; name: string | null };
};

const STATUS_LABELS: Record<Artist["verified"], string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
};

const STATUS_VARIANTS: Record<
  Artist["verified"],
  "default" | "secondary" | "destructive"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export function ArtistVerificationTable({ artists }: { artists: Artist[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Artist | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleVerify(status: "approved" | "rejected") {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/artists/${selected.id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: status, verificationNote: note }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        status === "approved" ? "Artiste approuvé" : "Artiste refusé",
      );
      setSelected(null);
      setNote("");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (artists.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aucun artiste dans cette catégorie.</p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Artiste</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Ville</th>
              <th className="px-4 py-3 text-left font-medium">SIRET</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
              <th className="px-4 py-3 text-left font-medium">Inscription</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {artists.map((artist) => (
              <tr key={artist.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  {artist.artistName ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {artist.user.email}
                </td>
                <td className="px-4 py-3">{artist.city ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {artist.siret ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANTS[artist.verified]}>
                    {STATUS_LABELS[artist.verified]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(artist.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelected(artist);
                      setNote(artist.verificationNote ?? "");
                    }}
                  >
                    Réviser
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Vérification — {selected?.artistName ?? selected?.user.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Email :</span>{" "}
              {selected?.user.email}
            </p>
            <p>
              <span className="font-medium">Ville :</span>{" "}
              {selected?.city ?? "—"}
            </p>
            <p>
              <span className="font-medium">SIRET :</span>{" "}
              {selected?.siret ?? "—"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Note interne (visible par l&apos;artiste)
            </label>
            <Textarea
              placeholder="Motif de refus, demande de documents manquants…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="destructive"
              disabled={loading}
              onClick={() => handleVerify("rejected")}
            >
              Refuser
            </Button>
            <Button
              disabled={loading}
              onClick={() => handleVerify("approved")}
            >
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
