export type PixelCrop = { x: number; y: number; width: number; height: number };

const MAX_DIMENSION = 2400;
const WEBP_QUALITY = 0.92;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = src;
  });
}

/**
 * Découpe `imageSrc` selon `pixelCrop` (coordonnées de react-easy-crop, en
 * pixels de l'image source), puis redimensionne si le résultat dépasse
 * MAX_DIMENSION et réencode en WebP — même logique que l'ancienne
 * compression appliquée à la zone recadrée plutôt qu'à l'image entière.
 */
export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: PixelCrop,
  fileName: string,
): Promise<File> {
  const img = await loadImage(imageSrc);

  let { width, height } = pixelCrop;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable");

  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    width,
    height,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
  );
  if (!blob) throw new Error("Canvas toBlob failed");

  return new File([blob], fileName.replace(/\.[^.]+$/, ".webp"), {
    type: "image/webp",
  });
}
