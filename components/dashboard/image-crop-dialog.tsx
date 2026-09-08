"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCroppedImageFile, type PixelCrop } from "@/lib/image-crop";
import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

type Props = {
  open: boolean;
  imageSrc: string | null;
  fileName: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

export function ImageCropDialog({ open, imageSrc, fileName, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleConfirm() {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels as PixelCrop, fileName);
      onConfirm(file);
    } finally {
      setIsProcessing(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Recadrer l&apos;image</DialogTitle>
          <DialogDescription>
            Ajustez le zoom et la position, puis validez pour appliquer le cadrage carré.
          </DialogDescription>
        </DialogHeader>

        {imageSrc && (
          <div className="relative h-80 w-full overflow-hidden rounded-lg bg-muted">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing}>
            Annuler
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isProcessing || !croppedAreaPixels}>
            {isProcessing ? "Traitement..." : "Valider le cadrage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
