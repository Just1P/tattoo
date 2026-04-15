"use client";

import { FormField } from "@/components/form/form-field";
import { StyleSelector } from "@/components/form/style-selector";
import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import type { OurFileRouter } from "@/lib/uploadthing";
import { generateReactHelpers } from "@uploadthing/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type Style = { id: string; name: string };

type Props = {
  styles: Style[];
};

const MAX_DIMENSION = 2400;
const WEBP_QUALITY = 0.92;

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, ".webp"),
            { type: "image/webp" },
          );
          resolve(compressed);
        },
        "image/webp",
        WEBP_QUALITY,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };

    img.src = objectUrl;
  });
}

export function UploadTattooForm({ styles }: Props) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [styleId, setStyleId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { startUpload } = useUploadThing("tattooImage", {
    onUploadBegin: () => setIsUploading(true),
    onClientUploadComplete: (res) => {
      setIsUploading(false);
      if (res[0]) {
        setImageUrl(res[0].ufsUrl);
        setErrors((prev) => ({ ...prev, imageUrl: "" }));
        toast.success("Image uploadée !");
      }
    },
    onUploadError: () => {
      setIsUploading(false);
      toast.error("Erreur lors de l'upload. Veuillez réessayer.");
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      await startUpload([compressed]);
    } finally {
      input.value = "";
    }
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!imageUrl) newErrors.imageUrl = "Veuillez uploader une image.";
    if (!styleId) newErrors.styleId = "Veuillez sélectionner un style.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    await apiFetch("/api/tattoos", {
      method: "POST",
      body: {
        imageUrl,
        styleId,
        title: title.trim() || undefined,
        description: description.trim() || undefined,
      },
      successMessage: "Œuvre ajoutée au portfolio !",
      errorMessage: "Une erreur est survenue. Veuillez réessayer.",
      onSuccess: () => router.push("/dashboard/portfolio"),
    });

    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-3">
        <Typography tag="h3">Image *</Typography>
        <div className="space-y-2">
          {imageUrl ? (
            <div className="space-y-3">
              <img
                src={imageUrl}
                alt="Aperçu de l'œuvre"
                className="h-64 w-full rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImageUrl(null)}
              >
                Changer l&apos;image
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-muted-foreground transition-smooth transition-colors hover:border-primary hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? (
                  <Typography tag="p">Envoi en cours...</Typography>
                ) : (
                  <>
                    <Typography tag="p" weight="medium">
                      Cliquez pour choisir une image
                    </Typography>
                    <Typography tag="p" color="muted">
                      JPG, PNG, WEBP — max 8 Mo
                    </Typography>
                  </>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}
          {errors.imageUrl && (
            <Typography tag="p" color="destructive">
              {errors.imageUrl}
            </Typography>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <Typography tag="h3">Style *</Typography>
        <StyleSelector
          styles={styles}
          selected={styleId}
          onToggle={(id) => {
            setStyleId(id);
            setErrors((prev) => ({ ...prev, styleId: "" }));
          }}
          error={errors.styleId}
        />
      </section>

      <section className="space-y-3">
        <Typography tag="h3">Détails</Typography>
        <FormField id="title" label="Titre">
          <Input
            id="title"
            placeholder="ex: Serpent japonais"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>
        <FormField id="description" label="Description">
          <Textarea
            id="description"
            placeholder="Décrivez cette œuvre, le contexte, les techniques utilisées..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>
      </section>

      <Button type="submit" disabled={isSubmitting || !imageUrl}>
        {isSubmitting ? "Enregistrement..." : "Ajouter au portfolio"}
      </Button>
    </form>
  );
}
