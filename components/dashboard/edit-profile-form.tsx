"use client";

import Typography from "@/components/custom/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

type Style = { id: string; name: string };

type ProfileData = {
  artistName: string;
  bio: string;
  city: string;
  location: string;
  siret: string;
  priceMin: string;
  priceMax: string;
  instagramUrl: string;
  styleIds: string[];
};

type Props = {
  initialData: ProfileData;
  styles: Style[];
};

export function EditProfileForm({ initialData, styles }: Props) {
  const [formData, setFormData] = useState<ProfileData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update(field: keyof ProfileData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function toggleStyle(id: string) {
    setFormData((prev) => ({
      ...prev,
      styleIds: prev.styleIds.includes(id)
        ? prev.styleIds.filter((s) => s !== id)
        : [...prev.styleIds, id],
    }));
    setErrors((prev) => ({ ...prev, styleIds: "" }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.artistName.trim()) {
      newErrors.artistName = "Le nom artistique est requis.";
    }
    if (!formData.city.trim()) {
      newErrors.city = "La ville est requise.";
    }
    if (!/^\d{14}$/.test(formData.siret)) {
      newErrors.siret = "Le SIRET doit contenir exactement 14 chiffres.";
    }
    if (formData.styleIds.length === 0) {
      newErrors.styleIds = "Sélectionnez au moins un style.";
    }
    if (
      formData.instagramUrl &&
      !/^https?:\/\/.+/.test(formData.instagramUrl)
    ) {
      newErrors.instagramUrl = "L'URL Instagram doit commencer par http(s)://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/artist/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          priceMin: formData.priceMin ? parseInt(formData.priceMin) : null,
          priceMax: formData.priceMax ? parseInt(formData.priceMax) : null,
          instagramUrl: formData.instagramUrl || null,
        }),
      });

      if (!res.ok) {
        toast.error("Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      toast.success("Profil mis à jour avec succès !");
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <Typography tag="h3">Identité artistique</Typography>
        <div className="space-y-1">
          <Label htmlFor="artistName">Nom / pseudo artistique *</Label>
          <Input
            id="artistName"
            placeholder="ex: Dark Ink Studio"
            value={formData.artistName}
            onChange={(e) => update("artistName", e.target.value)}
            aria-invalid={!!errors.artistName}
          />
          {errors.artistName && (
            <Typography tag="p" color="destructive">
              {errors.artistName}
            </Typography>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="bio">Bio / présentation</Label>
          <Textarea
            id="bio"
            placeholder="Décrivez votre parcours, votre philosophie artistique..."
            rows={4}
            value={formData.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="instagramUrl">Instagram</Label>
          <Input
            id="instagramUrl"
            placeholder="https://instagram.com/votre_compte"
            value={formData.instagramUrl}
            onChange={(e) => update("instagramUrl", e.target.value)}
            aria-invalid={!!errors.instagramUrl}
          />
          {errors.instagramUrl && (
            <Typography tag="p" color="destructive">
              {errors.instagramUrl}
            </Typography>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <Typography tag="h3">Localisation</Typography>
        <div className="space-y-1">
          <Label htmlFor="city">Ville *</Label>
          <Input
            id="city"
            placeholder="ex: Paris"
            value={formData.city}
            onChange={(e) => update("city", e.target.value)}
            aria-invalid={!!errors.city}
          />
          {errors.city && (
            <Typography tag="p" color="destructive">
              {errors.city}
            </Typography>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="location">Adresse du salon</Label>
          <Input
            id="location"
            placeholder="ex: 12 rue de Rivoli, 75001 Paris"
            value={formData.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <Typography tag="h3">Informations légales</Typography>
        <div className="space-y-1">
          <Label htmlFor="siret">Numéro SIRET *</Label>
          <Input
            id="siret"
            placeholder="14 chiffres"
            maxLength={14}
            value={formData.siret}
            onChange={(e) => update("siret", e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!errors.siret}
          />
          {errors.siret && (
            <Typography tag="p" color="destructive">
              {errors.siret}
            </Typography>
          )}
          <Typography tag="p" color="muted">
            Votre numéro SIRET permet de vérifier votre statut professionnel.
          </Typography>
        </div>
      </section>

      <section className="space-y-4">
        <Typography tag="h3">Tarifs</Typography>
        <div className="flex gap-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="priceMin">Tarif min (€/h)</Label>
            <Input
              id="priceMin"
              type="number"
              min={0}
              placeholder="ex: 80"
              value={formData.priceMin}
              onChange={(e) => update("priceMin", e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="priceMax">Tarif max (€/h)</Label>
            <Input
              id="priceMax"
              type="number"
              min={0}
              placeholder="ex: 150"
              value={formData.priceMax}
              onChange={(e) => update("priceMax", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <Typography tag="h3">Styles pratiqués</Typography>
        <div className="space-y-2">
          <Typography tag="p" color="muted">
            Sélectionnez vos styles de prédilection *
          </Typography>
          <div className="flex flex-wrap gap-2">
            {styles.map((style) => {
              const selected = formData.styleIds.includes(style.id);
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => toggleStyle(style.id)}
                  aria-pressed={selected}
                  className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Badge
                    variant={selected ? "default" : "outline"}
                    className="h-auto px-4 py-2 text-sm"
                  >
                    {style.name}
                  </Badge>
                </button>
              );
            })}
          </div>
          {errors.styleIds && (
            <Typography tag="p" color="destructive">
              {errors.styleIds}
            </Typography>
          )}
        </div>
      </section>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
      </Button>
    </form>
  );
}
