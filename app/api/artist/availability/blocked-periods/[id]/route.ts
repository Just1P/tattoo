import { requireArtist } from "@/lib/api-helpers";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireArtist();
  if (!guard.ok) return guard.response;
  const { artist } = guard;

  const { id } = await params;

  const period = await prisma.blockedPeriod.findUnique({ where: { id } });

  if (!period || period.artistId !== artist.id) {
    return NextResponse.json({ error: "Période introuvable" }, { status: 404 });
  }

  await prisma.blockedPeriod.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
