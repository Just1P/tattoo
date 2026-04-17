import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const onboardingSchema = z.object({
  artistName: z.string().trim().min(1, "Le nom artistique est requis"),
  bio: z.string().trim().optional(),
  city: z.string().trim().min(1, "La ville est requise"),
  location: z.string().trim().optional(),
  siret: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres"),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  styleIds: z.array(z.string()).min(1, "Sélectionnez au moins un style"),
});

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (session.user.role !== "artist") {
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
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  const { styleIds, ...artistData } = parsed.data;
  const uniqueStyleIds = [...new Set(styleIds)];

  await prisma.$transaction(async (tx) => {
    const artist = await tx.tattooArtist.upsert({
      where: { userId: session.user.id },
      update: artistData,
      create: { userId: session.user.id, ...artistData },
    });

    await tx.artistStyle.deleteMany({ where: { artistId: artist.id } });
    await tx.artistStyle.createMany({
      data: uniqueStyleIds.map((styleId) => ({ artistId: artist.id, styleId })),
      skipDuplicates: true,
    });
  });

  return NextResponse.json({ success: true });
}
