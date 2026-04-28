import { requireArtist } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
  artistName: z.string().trim().min(1, "Le nom artistique est requis"),
  bio: z.string().trim().optional(),
  city: z.string().trim().min(1, "La ville est requise"),
  location: z.string().trim().optional(),
  siret: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres"),
  priceMin: z.number().int().min(0).optional().nullable(),
  priceMax: z.number().int().min(0).optional().nullable(),
  instagramUrl: z.string().trim().url("URL Instagram invalide").optional().nullable().or(z.literal("")),
  styleIds: z.array(z.string()).min(1, "Sélectionnez au moins un style"),
});

export async function PATCH(req: NextRequest) {
  const guard = await requireArtist();
  if (!guard.ok) return guard.response;
  const { session, artist } = guard;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête JSON invalide" },
      { status: 400 },
    );
  }

  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  const { styleIds, instagramUrl, ...artistData } = parsed.data;
  const uniqueStyleIds = [...new Set(styleIds)];

  await prisma.$transaction(async (tx) => {
    await tx.tattooArtist.update({
      where: { userId: session.user.id },
      data: {
        ...artistData,
        instagramUrl: instagramUrl || null,
      },
    });

    await tx.artistStyle.deleteMany({ where: { artistId: artist.id } });
    await tx.artistStyle.createMany({
      data: uniqueStyleIds.map((styleId) => ({ artistId: artist.id, styleId })),
      skipDuplicates: true,
    });
  });

  return NextResponse.json({ success: true });
}
