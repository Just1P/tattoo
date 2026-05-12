"use client";

import { FormField } from "@/components/form/form-field";
import { StyleSelector } from "@/components/form/style-selector";
import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import { validateArtistForm } from "@/lib/validation/artist-validation";
import type { OurFileRouter } from "@/lib/uploadthing";
import { generateReactHelpers } from "@uploadthing/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type Style = { id: string; name: string };

type Props = {
  initialUser: {
    firstName: string;
    lastName: string;
    description: string;
    avatarUrl: string | null;
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialUser.avatarUrl);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  const { startUpload, isUploading } = useUploadThing("avatarImage");

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
    setErrors((prev) => ({ ...prev, styleIds: "" }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!userData.firstName.trim()) newErrors.firstName = "Le prénom est requis.";
    if (!userData.lastName.trim()) newErrors.lastName = "Le nom est requis.";
    if (isArtist) {
      Object.assign(newErrors, validateArtistForm(artistData));
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    let avatarUrl: string | undefined;
    if (pendingAvatarFile) {
      const uploaded = await startUpload([pendingAvatarFile]);
      if (!uploaded?.[0]) {
        toast.error("Erreur lors de l'upload de l'avatar.");
        setIsSubmitting(false);
        return;
      }
      avatarUrl = uploaded[0].url;
    }

    const userOk = await apiFetch("/api/user/profile", {
      method: "PATCH",
      body: { ...userData, ...(avatarUrl ? { avatarUrl } : {}) },
      errorMessage: "Une erreur est survenue.",
    });

    if (userOk === null) {
      setIsSubmitting(false);
      return;
    }

    if (isArtist) {
      const artistOk = await apiFetch("/api/artist/profile", {
        method: "PATCH",
        body: {
          ...artistData,
          priceMin: artistData.priceMin ? parseInt(artistData.priceMin) : null,
          priceMax: artistData.priceMax ? parseInt(artistData.priceMax) : null,
          instagramUrl: artistData.instagramUrl || null,
        },
        errorMessage: "Une erreur est survenue.",
      });
      if (artistOk === null) {
        setIsSubmitting(false);
        return;
      }
    }

    router.push("/profile");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <Typography tag="h3">Photo de profil</Typography>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative size-20 overflow-hidden rounded-full bg-muted ring-2 ring-border hover:opacity-80 transition-opacity"
          >
            {avatarPreview ? (
              <Image src={avatarPreview} alt="Avatar" fill className="object-cover" sizes="80px" />
            ) : (
              <span className="flex size-full items-center justify-center text-2xl font-bold text-muted-foreground">
                {(userData.firstName?.[0] ?? "?").toUpperCase()}
              </span>
            )}
          </button>
          <div className="space-y-1">
            <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={isUploading}>
              {isUploading ? "Upload en cours..." : "Changer la photo"}
            </Button>
            <p className="text-xs text-muted-foreground">JPG, PNG ou WebP · max 4 Mo</p>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </section>

      <section className="space-y-4">
        <Typography tag="h3">Informations personnelles</Typography>
        <div className="grid grid-cols-2 gap-4">
          <FormField id="firstName" label="Prénom *" error={errors.firstName}>
            <Input
              id="firstName"
              value={userData.firstName}
              onChange={(e) => updateUser("firstName", e.target.value)}
              aria-invalid={!!errors.firstName}
            />
          </FormField>
          <FormField id="lastName" label="Nom *" error={errors.lastName}>
            <Input
              id="lastName"
              value={userData.lastName}
              onChange={(e) => updateUser("lastName", e.target.value)}
              aria-invalid={!!errors.lastName}
            />
          </FormField>
        </div>
        {!isArtist && (
          <FormField id="description" label="Description">
            <Textarea
              id="description"
              rows={3}
              placeholder="Parlez de vous..."
              value={userData.description}
              onChange={(e) => updateUser("description", e.target.value)}
            />
          </FormField>
        )}
      </section>

      {isArtist && (
        <>
          <section className="space-y-4">
            <Typography tag="h3">Identité artistique</Typography>
            <FormField id="artistName" label="Nom / pseudo artistique *" error={errors.artistName}>
              <Input
                id="artistName"
                placeholder="ex: Dark Ink Studio"
                value={artistData.artistName}
                onChange={(e) => updateArtist("artistName", e.target.value)}
                aria-invalid={!!errors.artistName}
              />
            </FormField>
            <FormField id="bio" label="Bio">
              <Textarea
                id="bio"
                rows={4}
                placeholder="Décrivez votre parcours, votre philosophie artistique..."
                value={artistData.bio}
                onChange={(e) => updateArtist("bio", e.target.value)}
              />
            </FormField>
            <FormField id="instagramUrl" label="Instagram" error={errors.instagramUrl}>
              <Input
                id="instagramUrl"
                placeholder="https://instagram.com/votre_compte"
                value={artistData.instagramUrl}
                onChange={(e) => updateArtist("instagramUrl", e.target.value)}
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
                value={artistData.city}
                onChange={(e) => updateArtist("city", e.target.value)}
                aria-invalid={!!errors.city}
              />
            </FormField>
            <FormField id="location" label="Adresse du salon">
              <Input
                id="location"
                placeholder="ex: 12 rue de Rivoli, 75001 Paris"
                value={artistData.location}
                onChange={(e) => updateArtist("location", e.target.value)}
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
                value={artistData.siret}
                onChange={(e) => updateArtist("siret", e.target.value.replace(/\D/g, ""))}
                aria-invalid={!!errors.siret}
              />
            </FormField>
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
                  value={artistData.priceMin}
                  onChange={(e) => updateArtist("priceMin", e.target.value)}
                />
              </FormField>
              <FormField id="priceMax" label="Tarif max (€/h)" className="flex-1">
                <Input
                  id="priceMax"
                  type="number"
                  min={0}
                  placeholder="ex: 150"
                  value={artistData.priceMax}
                  onChange={(e) => updateArtist("priceMax", e.target.value)}
                />
              </FormField>
            </div>
          </section>

          <section className="space-y-4">
            <Typography tag="h3">Styles pratiqués</Typography>
            <StyleSelector
              multi
              styles={styles}
              selected={artistData.styleIds}
              onToggle={toggleStyle}
              error={errors.styleIds}
            />
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
