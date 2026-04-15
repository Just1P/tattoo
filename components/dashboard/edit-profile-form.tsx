"use client";

import { FormField } from "@/components/form/form-field";
import { StyleSelector } from "@/components/form/style-selector";
import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { validateArtistForm } from "@/lib/validation/artist-validation";
import { useState } from "react";

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

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationErrors = validateArtistForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    await apiFetch("/api/artist/profile", {
      method: "PATCH",
      body: {
        ...formData,
        priceMin: formData.priceMin ? parseInt(formData.priceMin) : null,
        priceMax: formData.priceMax ? parseInt(formData.priceMax) : null,
        instagramUrl: formData.instagramUrl || null,
      },
      successMessage: "Profil mis à jour avec succès !",
      errorMessage: "Une erreur est survenue. Veuillez réessayer.",
    });
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <Typography tag="h3">Identité artistique</Typography>
        <FormField id="artistName" label="Nom / pseudo artistique *" error={errors.artistName}>
          <Input
            id="artistName"
            placeholder="ex: Dark Ink Studio"
            value={formData.artistName}
            onChange={(e) => update("artistName", e.target.value)}
            aria-invalid={!!errors.artistName}
          />
        </FormField>
        <FormField id="bio" label="Bio / présentation">
          <Textarea
            id="bio"
            placeholder="Décrivez votre parcours, votre philosophie artistique..."
            rows={4}
            value={formData.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </FormField>
        <FormField id="instagramUrl" label="Instagram" error={errors.instagramUrl}>
          <Input
            id="instagramUrl"
            placeholder="https://instagram.com/votre_compte"
            value={formData.instagramUrl}
            onChange={(e) => update("instagramUrl", e.target.value)}
            aria-invalid={!!errors.instagramUrl}
          />
        </FormField>
      </section>

      <section className="space-y-4">
        <Typography tag="h3">Localisation</Typography>
        <FormField id="city" label="Ville *" error={errors.city}>
          <Input
            id="city"
            placeholder="ex: Paris"
            value={formData.city}
            onChange={(e) => update("city", e.target.value)}
            aria-invalid={!!errors.city}
          />
        </FormField>
        <FormField id="location" label="Adresse du salon">
          <Input
            id="location"
            placeholder="ex: 12 rue de Rivoli, 75001 Paris"
            value={formData.location}
            onChange={(e) => update("location", e.target.value)}
          />
        </FormField>
      </section>

      <section className="space-y-4">
        <Typography tag="h3">Informations légales</Typography>
        <FormField id="siret" label="Numéro SIRET *" error={errors.siret}>
          <Input
            id="siret"
            placeholder="14 chiffres"
            maxLength={14}
            value={formData.siret}
            onChange={(e) => update("siret", e.target.value.replace(/\D/g, ""))}
            aria-invalid={!!errors.siret}
          />
        </FormField>
        <Typography tag="p" color="muted">
          Votre numéro SIRET permet de vérifier votre statut professionnel.
        </Typography>
      </section>

      <section className="space-y-4">
        <Typography tag="h3">Tarifs</Typography>
        <div className="flex gap-4">
          <FormField id="priceMin" label="Tarif min (€/h)" className="flex-1">
            <Input
              id="priceMin"
              type="number"
              min={0}
              placeholder="ex: 80"
              value={formData.priceMin}
              onChange={(e) => update("priceMin", e.target.value)}
            />
          </FormField>
          <FormField id="priceMax" label="Tarif max (€/h)" className="flex-1">
            <Input
              id="priceMax"
              type="number"
              min={0}
              placeholder="ex: 150"
              value={formData.priceMax}
              onChange={(e) => update("priceMax", e.target.value)}
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <Typography tag="h3">Styles pratiqués</Typography>
        <Typography tag="p" color="muted">
          Sélectionnez vos styles de prédilection *
        </Typography>
        <StyleSelector
          multi
          styles={styles}
          selected={formData.styleIds}
          onToggle={toggleStyle}
          error={errors.styleIds}
        />
      </section>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
      </Button>
    </form>
  );
}
