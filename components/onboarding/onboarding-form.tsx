"use client";

import { FormField } from "@/components/form/form-field";
import { StyleSelector } from "@/components/form/style-selector";
import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { artistValidation } from "@/lib/validation/artist-validation";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Style = { id: string; name: string };

const STEPS = [
  "Identité artistique",
  "Localisation",
  "Informations légales",
  "Tarifs",
  "Styles pratiqués",
];

const TOTAL_STEPS = STEPS.length;

export function OnboardingForm({ styles }: { styles: Style[] }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    artistName: "",
    bio: "",
    city: "",
    location: "",
    siret: "",
    priceMin: "",
    priceMax: "",
    styleIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: string, value: string) {
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

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      const err = artistValidation.artistName(formData.artistName);
      if (err) newErrors.artistName = err;
    }
    if (step === 2) {
      const err = artistValidation.city(formData.city);
      if (err) newErrors.city = err;
    }
    if (step === 3) {
      const err = artistValidation.siret(formData.siret);
      if (err) newErrors.siret = err;
    }
    if (step === 5) {
      const err = artistValidation.styleIds(formData.styleIds);
      if (err) newErrors.styleIds = err;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function next() {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function prev() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setIsSubmitting(true);

    await apiFetch("/api/artist/onboarding", {
      method: "POST",
      body: {
        ...formData,
        priceMin: formData.priceMin ? parseInt(formData.priceMin) : undefined,
        priceMax: formData.priceMax ? parseInt(formData.priceMax) : undefined,
      },
      successMessage: "Profil créé avec succès !",
      errorMessage: "Une erreur est survenue. Veuillez réessayer.",
      onSuccess: () => router.push("/dashboard"),
    });

    setIsSubmitting(false);
  }

  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex items-center justify-between">
            <Typography tag="p" color="muted">
              Étape {step} sur {TOTAL_STEPS}
            </Typography>
            <Typography tag="p" color="muted">
              {progressPercent}%
            </Typography>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-smooth"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <CardTitle className="mt-4">
            <Typography tag="h3">{STEPS[step - 1]}</Typography>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 1 && (
            <>
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
            </>
          )}

          {step === 2 && (
            <>
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
            </>
          )}

          {step === 3 && (
            <>
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
            </>
          )}

          {step === 4 && (
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
          )}

          {step === 5 && (
            <>
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
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="ghost" onClick={prev} disabled={step === 1}>
              Précédent
            </Button>
            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={next}>
                Suivant
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Terminer"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
