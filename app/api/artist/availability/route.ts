import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (session.user.role !== "artist") {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: session.user.id },
  });

  if (!artist) {
    return NextResponse.json({ error: "Profil artiste introuvable" }, { status: 404 });
  }

  const [weeklySlots, blockedPeriods] = await Promise.all([
    prisma.weeklySlot.findMany({
      where: { artistId: artist.id },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    }),
    prisma.blockedPeriod.findMany({
      where: { artistId: artist.id },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return NextResponse.json({ weeklySlots, blockedPeriods });
}
