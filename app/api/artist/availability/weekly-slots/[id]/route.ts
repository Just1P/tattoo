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

  const slot = await prisma.weeklySlot.findUnique({ where: { id } });

  if (!slot || slot.artistId !== artist.id) {
    return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
  }

  await prisma.weeklySlot.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
