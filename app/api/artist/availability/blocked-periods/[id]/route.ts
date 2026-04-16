import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if ((session.user as { role?: string }).role !== "artist") {
    return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  }

  const { id } = await params;

  const artist = await prisma.tattooArtist.findUnique({
    where: { userId: session.user.id },
  });

  if (!artist) {
    return NextResponse.json({ error: "Profil artiste introuvable" }, { status: 404 });
  }

  const period = await prisma.blockedPeriod.findUnique({ where: { id } });

  if (!period || period.artistId !== artist.id) {
    return NextResponse.json({ error: "Période introuvable" }, { status: 404 });
  }

  await prisma.blockedPeriod.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
