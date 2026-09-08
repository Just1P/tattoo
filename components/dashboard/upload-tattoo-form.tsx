"use client";

import { FormField } from "@/components/form/form-field";
import { StyleSelector } from "@/components/form/style-selector";
import { ImageCropDialog } from "@/components/dashboard/image-crop-dialog";
import Typography from "@/components/custom/Typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api-client";
import type { OurFileRouter } from "@/lib/uploadthing";
import { generateReactHelpers } from "@uploadthing/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

type Style = { id: string; name: string };

type Props = {
  styles: Style[];
};

export function UploadTattooForm({ styles }: Props) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState("image.webp");
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
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
      if (res[0]) {
        setImageUrl(res[0].ufsUrl);
        setErrors((prev) => ({ ...prev, imageUrl: "" }));
        toast.success("Image uploadée !");
      }
    },
    onUploadError: (error) => {
      setIsUploading(false);
      if (localPreview) URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
      toast.error(error.message || "Erreur lors de l'upload. Veuillez réessayer.");
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    setPendingFileName(file.name);
    setCropSrc(URL.createObjectURL(file));
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function handleCropConfirm(file: File) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setLocalPreview(URL.createObjectURL(file));
    await startUpload([file]);
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
              <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-lg">
                <Image
                  src={imageUrl}
                  alt="Aperçu de l'œuvre"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 384px"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImageUrl(null)}
              >
                Changer l&apos;image
              </Button>
            </div>
          ) : localPreview ? (
            <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={localPreview}
                alt="Aperçu de l'œuvre recadrée"
                className="size-full object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Typography tag="p" className="text-white">
                    Envoi en cours...
                  </Typography>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 px-6 py-10 text-muted-foreground transition-smooth transition-colors hover:border-primary hover:bg-muted"
              >
                <Typography tag="p" weight="medium">
                  Cliquez pour choisir une image
                </Typography>
                <Typography tag="p" color="muted">
                  JPG, PNG, WEBP — max 8 Mo
                </Typography>
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
          <ImageCropDialog
            open={!!cropSrc}
            imageSrc={cropSrc}
            fileName={pendingFileName}
            onCancel={handleCropCancel}
            onConfirm={handleCropConfirm}
          />
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
