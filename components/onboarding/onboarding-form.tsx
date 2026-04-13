"use client";

import Typography from "@/components/custom/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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

    if (step === 1 && !formData.artistName.trim()) {
      newErrors.artistName = "Le nom artistique est requis.";
    }
    if (step === 2 && !formData.city.trim()) {
      newErrors.city = "La ville est requise.";
    }
    if (step === 3) {
      if (!/^\d{14}$/.test(formData.siret)) {
        newErrors.siret = "Le SIRET doit contenir exactement 14 chiffres.";
      }
    }
    if (step === 5 && formData.styleIds.length === 0) {
      newErrors.styleIds = "Sélectionnez au moins un style.";
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

    try {
      const res = await fetch("/api/artist/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          priceMin: formData.priceMin ? parseInt(formData.priceMin) : undefined,
          priceMax: formData.priceMax ? parseInt(formData.priceMax) : undefined,
        }),
      });

      if (!res.ok) {
        toast.error("Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      toast.success("Profil créé avec succès !");
      router.push("/dashboard");
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
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
              className="h-full bg-primary transition-smooth transition-all"
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
            </>
          )}

          {step === 2 && (
            <>
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
            </>
          )}

          {step === 3 && (
            <div className="space-y-1">
              <Label htmlFor="siret">Numéro SIRET *</Label>
              <Input
                id="siret"
                placeholder="14 chiffres"
                maxLength={14}
                value={formData.siret}
                onChange={(e) =>
                  update("siret", e.target.value.replace(/\D/g, ""))
                }
                aria-invalid={!!errors.siret}
              />
              {errors.siret && (
                <Typography tag="p" color="destructive">
                  {errors.siret}
                </Typography>
              )}
              <Typography tag="p" color="muted">
                Votre numéro SIRET permet de vérifier votre statut
                professionnel.
              </Typography>
            </div>
          )}

          {step === 4 && (
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
          )}

          {step === 5 && (
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
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={prev}
              disabled={step === 1}
            >
              Précédent
            </Button>
            {step < TOTAL_STEPS ? (
              <Button type="button" onClick={next}>
                Suivant
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enregistrement..." : "Terminer"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
