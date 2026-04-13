"use client";

import Typography from "@/components/custom/Typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      await startUpload([file]);
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
    try {
      const res = await fetch("/api/tattoos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          styleId,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        toast.error("Une erreur est survenue. Veuillez réessayer.");
        return;
      }

      toast.success("Œuvre ajoutée au portfolio !");
      router.push("/dashboard/portfolio");
    } catch {
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {styles.map((style) => {
              const selected = styleId === style.id;
              return (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    setStyleId(style.id);
                    setErrors((prev) => ({ ...prev, styleId: "" }));
                  }}
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
          {errors.styleId && (
            <Typography tag="p" color="destructive">
              {errors.styleId}
            </Typography>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <Typography tag="h3">Détails</Typography>
        <div className="space-y-1">
          <Label htmlFor="title">Titre</Label>
          <Input
            id="title"
            placeholder="ex: Serpent japonais"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Décrivez cette œuvre, le contexte, les techniques utilisées..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </section>

      <Button type="submit" disabled={isSubmitting || !imageUrl}>
        {isSubmitting ? "Enregistrement..." : "Ajouter au portfolio"}
      </Button>
    </form>
  );
}
