import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const onboardingSchema = z.object({
  artistName: z.string().min(1, "Le nom artistique est requis"),
  bio: z.string().optional(),
  city: z.string().min(1, "La ville est requise"),
  location: z.string().optional(),
  siret: z
    .string()
    .regex(/^\d{14}$/, "Le SIRET doit contenir exactement 14 chiffres"),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  styleIds: z.array(z.string()).min(1, "Sélectionnez au moins un style"),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if ((session.user as { role?: string }).role !== "artist") {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.issues },
      { status: 422 },
    );
  }

  const { styleIds, ...artistData } = parsed.data;

  const artist = await prisma.tattooArtist.upsert({
    where: { userId: session.user.id },
    update: artistData,
    create: { userId: session.user.id, ...artistData },
  });

  await prisma.artistStyle.deleteMany({ where: { artistId: artist.id } });
  await prisma.artistStyle.createMany({
    data: styleIds.map((styleId) => ({ artistId: artist.id, styleId })),
  });

  return NextResponse.json({ success: true });
}
