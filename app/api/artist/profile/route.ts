import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
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
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if ((session.user as { role?: string }).role !== "artist") {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

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

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: session.user.id },
  });

  if (!artist) {
    return NextResponse.json({ error: "Profil artiste introuvable" }, { status: 404 });
  }

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
