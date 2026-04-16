"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  artistId: string;
  artistName: string | null;
};

const TATTOO_TYPES = [
  { value: "premier_rdv", label: "Premier rendez-vous" },
  { value: "remplissage", label: "Remplissage" },
  { value: "retouche", label: "Retouche" },
];

const SIZES = [
  { value: "petit", label: "Petit (moins de 5 cm)" },
  { value: "moyen", label: "Moyen (5 à 15 cm)" },
  { value: "grand", label: "Grand (15 à 30 cm)" },
  { value: "tres_grand", label: "Très grand (plus de 30 cm)" },
];

export function BookingRequestSheet({ artistId, artistName }: Props) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [tattooType, setTattooType] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [size, setSize] = useState("");
  const [description, setDescription] = useState("");

  function handleOpenChange(value: boolean) {
    if (value && !session?.user) {
      router.push("/login");
      return;
    }
    setOpen(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!tattooType || !bodyPart || !size || !description) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId,
          tattooType,
          bodyPart,
          size,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Erreur lors de l'envoi");
        return;
      }

      toast.success("Demande envoyée ! L'artiste vous contactera bientôt.");
      setOpen(false);
      setTattooType("");
      setBodyPart("");
      setSize("");
      setDescription("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button disabled={isPending}>Demander un RDV</Button>
      </SheetTrigger>

      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Demande de rendez-vous</SheetTitle>
          <SheetDescription>
            Décrivez votre projet à{" "}
            {artistName ?? "l'artiste"}. Il vous proposera un créneau adapté.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="tattoo-type">Type de rendez-vous *</Label>
            <Select value={tattooType} onValueChange={setTattooType}>
              <SelectTrigger id="tattoo-type">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                {TATTOO_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body-part">Zone du corps *</Label>
            <Input
              id="body-part"
              placeholder="ex : avant-bras, épaule, mollet…"
              value={bodyPart}
              onChange={(e) => setBodyPart(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="size">Taille approximative *</Label>
            <Select value={size} onValueChange={setSize}>
              <SelectTrigger id="size">
                <SelectValue placeholder="Choisir une taille" />
              </SelectTrigger>
              <SelectContent>
                {SIZES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description du projet *</Label>
            <Textarea
              id="description"
              placeholder="Décrivez votre idée : motif, style, couleurs, ambiance recherchée…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Plus votre description est précise, mieux l'artiste pourra estimer
              le temps nécessaire.
            </p>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={loading} className="w-full">
              Envoyer la demande
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
