"use client";

import Typography from "@/components/custom/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Style = { id: string; name: string };

type Props = {
  initialUser: {
    firstName: string;
    lastName: string;
    description: string;
  };
  initialArtist?: {
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
  styles?: Style[];
};

export function EditProfileForm({ initialUser, initialArtist, styles = [] }: Props) {
  const router = useRouter();
  const isArtist = !!initialArtist;

  const [userData, setUserData] = useState(initialUser);
  const [artistData, setArtistData] = useState(initialArtist ?? {
    artistName: "",
    bio: "",
    city: "",
    location: "",
    siret: "",
    priceMin: "",
    priceMax: "",
    instagramUrl: "",
    styleIds: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateUser(field: keyof typeof userData, value: string) {
    setUserData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function updateArtist(field: keyof typeof artistData, value: string) {
    setArtistData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function toggleStyle(id: string) {
    setArtistData((prev) => ({
      ...prev,
      styleIds: prev.styleIds.includes(id)
        ? prev.styleIds.filter((s) => s !== id)
        : [...prev.styleIds, id],
    }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!userData.firstName.trim()) newErrors.firstName = "Le prénom est requis.";
    if (!userData.lastName.trim()) newErrors.lastName = "Le nom est requis.";
    if (isArtist) {
      if (!artistData.artistName.trim()) newErrors.artistName = "Le nom artistique est requis.";
      if (!artistData.city.trim()) newErrors.city = "La ville est requise.";
      if (!/^\d{14}$/.test(artistData.siret)) newErrors.siret = "Le SIRET doit contenir exactement 14 chiffres.";
      if (artistData.styleIds.length === 0) newErrors.styleIds = "Sélectionnez au moins un style.";
      if (artistData.instagramUrl && !/^https?:\/\/.+/.test(artistData.instagramUrl))
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
      const userRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      if (!userRes.ok) throw new Error();

      if (isArtist) {
        const artistRes = await fetch("/api/artist/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...artistData,
            priceMin: artistData.priceMin ? parseInt(artistData.priceMin) : null,
            priceMax: artistData.priceMax ? parseInt(artistData.priceMax) : null,
            instagramUrl: artistData.instagramUrl || null,
          }),
        });
        if (!artistRes.ok) throw new Error();
      }

      toast.success("Profil mis à jour !");
      router.push("/profile");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Infos communes */}
      <section className="space-y-4">
        <Typography tag="h3">Informations personnelles</Typography>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="firstName">Prénom *</Label>
            <Input
              id="firstName"
              value={userData.firstName}
              onChange={(e) => updateUser("firstName", e.target.value)}
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName && <Typography tag="p" color="destructive">{errors.firstName}</Typography>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Nom *</Label>
            <Input
              id="lastName"
              value={userData.lastName}
              onChange={(e) => updateUser("lastName", e.target.value)}
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName && <Typography tag="p" color="destructive">{errors.lastName}</Typography>}
          </div>
        </div>
        {!isArtist && (
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Parlez de vous..."
              value={userData.description}
              onChange={(e) => updateUser("description", e.target.value)}
            />
          </div>
        )}
      </section>

      {/* Infos artiste */}
      {isArtist && (
        <>
          <section className="space-y-4">
            <Typography tag="h3">Identité artistique</Typography>
            <div className="space-y-1">
              <Label htmlFor="artistName">Nom / pseudo artistique *</Label>
              <Input
                id="artistName"
                placeholder="ex: Dark Ink Studio"
                value={artistData.artistName}
                onChange={(e) => updateArtist("artistName", e.target.value)}
                aria-invalid={!!errors.artistName}
              />
              {errors.artistName && <Typography tag="p" color="destructive">{errors.artistName}</Typography>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                rows={4}
                placeholder="Décrivez votre parcours, votre philosophie artistique..."
                value={artistData.bio}
                onChange={(e) => updateArtist("bio", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="instagramUrl">Instagram</Label>
              <Input
                id="instagramUrl"
                placeholder="https://instagram.com/votre_compte"
                value={artistData.instagramUrl}
                onChange={(e) => updateArtist("instagramUrl", e.target.value)}
                aria-invalid={!!errors.instagramUrl}
              />
              {errors.instagramUrl && <Typography tag="p" color="destructive">{errors.instagramUrl}</Typography>}
            </div>
          </section>

          <section className="space-y-4">
            <Typography tag="h3">Localisation</Typography>
            <div className="space-y-1">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                placeholder="ex: Paris"
                value={artistData.city}
                onChange={(e) => updateArtist("city", e.target.value)}
                aria-invalid={!!errors.city}
              />
              {errors.city && <Typography tag="p" color="destructive">{errors.city}</Typography>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="location">Adresse du salon</Label>
              <Input
                id="location"
                placeholder="ex: 12 rue de Rivoli, 75001 Paris"
                value={artistData.location}
                onChange={(e) => updateArtist("location", e.target.value)}
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
                value={artistData.siret}
                onChange={(e) => updateArtist("siret", e.target.value.replace(/\D/g, ""))}
                aria-invalid={!!errors.siret}
              />
              {errors.siret && <Typography tag="p" color="destructive">{errors.siret}</Typography>}
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
                  value={artistData.priceMin}
                  onChange={(e) => updateArtist("priceMin", e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label htmlFor="priceMax">Tarif max (€/h)</Label>
                <Input
                  id="priceMax"
                  type="number"
                  min={0}
                  placeholder="ex: 150"
                  value={artistData.priceMax}
                  onChange={(e) => updateArtist("priceMax", e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <Typography tag="h3">Styles pratiqués</Typography>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {styles.map((style) => {
                  const selected = artistData.styleIds.includes(style.id);
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => toggleStyle(style.id)}
                      aria-pressed={selected}
                      className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Badge
                        variant="outline"
                        className={`h-auto px-4 py-2 text-sm transition-smooth ${selected ? "bg-primary text-primary-foreground border-primary" : ""}`}
                      >
                        {style.name}
                      </Badge>
                    </button>
                  );
                })}
              </div>
              {errors.styleIds && <Typography tag="p" color="destructive">{errors.styleIds}</Typography>}
            </div>
          </section>
        </>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
