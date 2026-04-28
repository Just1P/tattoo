import { requireArtist } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const ALLOWED_IMAGE_HOSTS = ["utfs.io", "ufs.sh"];

function isAllowedImageUrl(imageUrl: string) {
  try {
    const url = new URL(imageUrl);
    const hostname = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      ALLOWED_IMAGE_HOSTS.some(
        (host) => hostname === host || hostname.endsWith(`.${host}`),
      )
    );
  } catch {
    return false;
  }
}

const tattooSchema = z.object({
  imageUrl: z
    .string()
    .url("URL image invalide")
    .check((ctx) => {
      if (!isAllowedImageUrl(ctx.value)) {
        ctx.issues.push({
          code: "custom",
          message: "L'image doit provenir d'un domaine de stockage autorisé",
          input: ctx.value,
        });
      }
    }),
  styleId: z.string().min(1, "Le style est requis"),
  title: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const guard = await requireArtist();
  if (!guard.ok) return guard.response;
  const { artist } = guard;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête JSON invalide" },
      { status: 400 },
    );
  }

  const parsed = tattooSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  const { imageUrl, styleId, title, description } = parsed.data;

  const tattoo = await prisma.$transaction(async (tx) => {
    const lastTattoo = await tx.tattoo.findFirst({
      where: { artistId: artist.id },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const nextPosition = (lastTattoo?.position ?? -1) + 1;

    return tx.tattoo.create({
      data: {
        artistId: artist.id,
        imageUrl,
        styleId,
        title: title || null,
        description: description || null,
        position: nextPosition,
      },
    });
  });

  return NextResponse.json({ tattoo }, { status: 201 });
}
