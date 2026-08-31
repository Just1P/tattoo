import { requireArtistRole } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/lib/validation/onboarding-schema";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const guard = await requireArtistRole();
  if (!guard.ok) return guard.response;
  const { session } = guard;

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
